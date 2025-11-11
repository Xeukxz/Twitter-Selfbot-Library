import EventEmitter from "node:events";
import { TimelineManager } from "./Managers/TimelineManager";
import { RESTApiManager } from "./REST/rest";
import fs from "fs";
import { TweetBasedTimeline } from "./Timelines";
import { ProfileManager } from "./Managers/ProfileManager";
import { Profile } from "./Profile";
import { GlobalTweetManager } from "./Managers";
import { SearchTimelineUrlData } from "./Timelines/SearchTimeline";
import { NotificationsManager } from './Managers/NotificationsManager';
import { Notification } from './Timelines/NotificationTimeline';
import { ClientTransaction, handleXMigration } from 'x-client-transaction-id';
import { config } from 'dotenv';
import Axios from 'axios';

config();

export interface ClientParams {
  debug?: boolean;
}

export interface ClientEvents {
  ready: [ void ];
  timelineCreate: [ TweetBasedTimeline ];
  profileCreate: [ Profile ];
  unreadNotifications: [ Notification[] ];
}


export class Client extends EventEmitter<ClientEvents> {
  token!: string
  csrfToken!: string
  cookies: {
    [key: string]: string
  } = {};
  rest!: RESTApiManager
  timelines: TimelineManager = new TimelineManager(this)
  tweets: GlobalTweetManager = new GlobalTweetManager(this)
  profiles: ProfileManager = new ProfileManager(this)
  notifications: NotificationsManager = new NotificationsManager(this)
  debug: boolean // writes multiple debug files, not recommended for production
  features!: {
    config: {
      [key: string]: {
        value: boolean | string | number | any[]
      }
    },
    impression_pointers: {},
    impressions: {},
    keysRead: {},
    settingsVersion: string,
    get: <T extends string[]>(keys: T) => FeaturesGetData<T>
  }
  pageHtml: string = "";
  /**
   * Create a new client
   * 
   * Takes an object with the following optional parameters
   * @param headless - Run the browser in headless mode || default: true
   * @param keepPageOpen - Keep the browser open after getting account data || default: false
   * @param puppeteerSettings - Puppeteer launch settings
   */
  constructor({
    debug = false,
  }: ClientParams = {}) {
    super();
    this.debug = debug; // ! DEVELOPMENT ONLY
    this.getAccountData().then(async () => {
      this.rest = new RESTApiManager(this);
      const dom = await handleXMigration();
      const transactionGenerator = await ClientTransaction.create(dom);
      this.rest.transactionGenerator = transactionGenerator;
      await this.notifications.fetchAll();
      this.emit("ready");
    })
  }

  log(...args: any[]) {
    if(this.debug) console.log(...args);
  }

  async getAccountData() {
    if(this.debug) {
      // ensure debug folder exists
      if (!fs.existsSync(`${__dirname}/../debug`)) {
        fs.mkdirSync(`${__dirname}/../debug`);
        this.log("Debug folder created.");
      }
    }
    
    this.log("fetching auth token from env variable...");
    const envToken = process.env.authToken;
    if(envToken) this.cookies.auth_token = envToken;
    else throw new Error('No stored account data found. Please add an `authToken` entry to your .env file');

    this.pageHtml = await Axios({
      method: 'get',
      url: 'https://x.com/home',
      headers: {
        'cookie': Object.entries(this.cookies).map(([key, value]) => `${key}=${value}`).join('; '),
      }
    }).then(res => {
      let headers = res.headers;
      if(headers['set-cookie']) {
        let setCookies = headers['set-cookie'];
        if(typeof setCookies == 'string') setCookies = [setCookies];
        setCookies.forEach((cookieStr) => {
          let parts = cookieStr.split(';')[0].split('=');
          let key = parts.shift()!.trim();
          let value = parts.join('=').trim();
          this.cookies[key] = value;
        });
      }
      return res.data
    });
    this.csrfToken = this.cookies['ct0'];
    const mainJs = await Axios({
      method: 'get',
      url: this.pageHtml.match(/https:\/\/[^="]+?main.+?\.js/)?.[0] || ((() => { throw new Error('Failed to find main js url') })()),
    }).then(res => res.data);
    this.token = mainJs.match(/Bearer \w.+?(?=")/)?.[0] || '';
    if(!this.token) throw new Error('Failed to fetch Bearer token')
    
    const InitialStateObjectString = this.pageHtml.match(/window\.__INITIAL_STATE__=({.*?});/)?.[1] || '';
    const __INITIAL_STATE__ = JSON.parse(InitialStateObjectString)
    let featureSwitches = __INITIAL_STATE__?.["featureSwitch"]?.["user"] || {}

    if(Object.keys(featureSwitches as Object).length === 0) console.warn("\n\x1b[33mWARNING: Failed to parse feature switches from DOM. All values will default to true.\x1b[0m");
    this.features = {
      ...featureSwitches,
      get: <T extends string[]>(keys: T): FeaturesGetData<T> => {
        const entries = keys.map(key => [
          key,
          this.features.config?.[key]?.value ?? (this.debug && console.warn(`\x1b[33mWARNING: Feature Switch ${key} is missing. Defaulting to true.\x1b[0m`), true)
        ]);
        return {
          ...Object.fromEntries(entries),
          URIEncoded: function() {
            return encodeURIComponent(JSON.stringify(this))
          }
        } as FeaturesGetData<T>;
      }
    };
  }
  /**
   * Search for tweets
   * @param query - A string or an object with advanced search parameters
   * @param searchType - The type of search to perform
   */
  async search(query: string | AdvancedSearchQuery, searchType: SearchTimelineUrlData["variables"]["product"] = "Latest") {
    // allWords1 allWords2 "exact phrase 1" "exactPhrase2" (anyWord1 OR anyWord2) (#hashtag1 OR #hashtag2) (from:from1 OR from:from2) (to:to1 OR to:to2) (@mention1 OR @mention2) filter:replies filter:links min_replies:2 min_faves:3 min_retweets:4 until:2025-12-22 since:2006-01-01
    let isAdvanced = !(typeof query == "string");
    
    let rawQuery = isAdvanced ? "" : query as string;

    if (isAdvanced) {
      let q = query as AdvancedSearchQuery;
      if (q.allWords) rawQuery += q.allWords.join(" ");
      if (q.exactPhrases) rawQuery += ` "(${q.exactPhrases.join(" ")})"`;
      if (q.anyWords) rawQuery += ` (${q.anyWords.join(" OR ")})`;
      if (q.noneWords) rawQuery += ` ${q.noneWords.map(w => '-'+w).join(" ")})`;
      if (q.hashtags) rawQuery += ` (${q.hashtags.map(h => '#'+h.replace(/^#/, "")).join(" ")})`;
      if (q.lang) rawQuery += ` lang:${q.lang.join(" OR lang:")}`;
      if (q.from) rawQuery += ` from:${q.from.map(u => u.replace(/^@/, "")).join(" OR from:")}`;
      if (q.to) rawQuery += ` to:${q.to.map(u => u.replace(/^@/, "")).join(" OR to:")}`;
      if (q.mentions) rawQuery += ` @${q.mentions.map(u => u.replace(/^@/, "")).join(" OR @")}`;
      if (q.repliesOnly) rawQuery += ` filter:replies`;
      if (q.linksOnly) rawQuery += ` filter:links`;
      if (q.minReplies) rawQuery += ` min_replies:${q.minReplies}`;
      if (q.minFavorites) rawQuery += ` min_faves:${q.minFavorites}`;
      if (q.minRetweets) rawQuery += ` min_retweets:${q.minRetweets}`;
      if (q.since) rawQuery += ` since:${q.since}`;
      if (q.until) rawQuery += ` until:${q.until}`;
    }

    const timeline = await this.timelines.fetch({
      type: "search",
      query: rawQuery,
      product: searchType,
      querySource: isAdvanced ? "advanced_search_page" : "typed_query",
    })

    return timeline;
  }
}

export interface AdvancedSearchQuery {
  /**
   * Match all of these words (fuzzy search)
   */
  allWords?: string[]
  /**
   * Match these exact phrases
   */
  exactPhrases?: string[]
  /**
   * Match any of these words
   */
  anyWords?: string[]
  /**
   * Don't match any of these words
   */
  noneWords?: string[]
  /**
   * Match these hashtags
   */
  hashtags?: string[]
  /**
   * Match these languages
   * 
   * - "ar" - Arabic  
   * - "ar-x-fm" - Arabic (Feminine)  
   * - "bn" - Bangla  
   * - "eu" - Basque  
   * - "bg" - Bulgarian  
   * - "ca" - Catalan  
   * - "hr" - Croatian  
   * - "cs" - Czech  
   * - "da" - Danish  
   * - "nl" - Dutch  
   * - "en" - English  
   * - "fi" - Finnish  
   * - "fr" - French  
   * - "de" - German  
   * - "el" - Greek  
   * - "gu" - Gujarati  
   * - "he" - Hebrew  
   * - "hi" - Hindi  
   * - "hu" - Hungarian  
   * - "id" - Indonesian  
   * - "it" - Italian  
   * - "ja" - Japanese  
   * - "kn" - Kannada  
   * - "ko" - Korean  
   * - "mr" - Marathi  
   * - "no" - Norwegian  
   * - "fa" - Persian  
   * - "pl" - Polish  
   * - "pt" - Portuguese  
   * - "ro" - Romanian  
   * - "ru" - Russian  
   * - "sr" - Serbian  
   * - "zh-cn" - Simplified Chinese  
   * - "sk" - Slovak  
   * - "es" - Spanish  
   * - "sv" - Swedish  
   * - "ta" - Tamil  
   * - "th" - Thai  
   * - "zh-tw" - Traditional Chinese  
   * - "tr" - Turkish  
   * - "uk" - Ukrainian  
   * - "ur" - Urdu  
   * - "vi" - Vietnamese  
   */
  lang?: ("ar" | "ar-x-fm" | "bn" | "eu" | "bg" | "ca" | "hr" | "cs" | "da" | "nl" | "en" | "fi" | "fr" | "de" | "el" | "gu" | "he" | "hi" | "hu" | "id" | "it" | "ja" | "kn" | "ko" | "mr" | "no" | "fa" | "pl" | "pt" | "ro" | "ru" | "sr" | "zh-cn" | "sk" | "es" | "sv" | "ta" | "th" | "zh-tw" | "tr" | "uk" | "ur" | "vi")[]
  /**
   * Match posts from these usernames
   */
  from?: string[]
  /**
   * Match posts to these usernames (replies)
   */
  to?: string[]
  /**
   * Match posts mentioning these usernames
   */
  mentions?: string[]
  /**
   * Only return replies
   */
  repliesOnly?: boolean
  /**
   * Only return tweets with links
   */
  linksOnly?: boolean
  /**
   * Minimum number of replies
   */
  minReplies?: number
  /**
   * Minimum number of favorites
   */
  minFavorites?: number
  /**
   * Minimum number of retweets
   */
  minRetweets?: number
  /**
   * Earlies date to search from (YYYY-MM-DD)
   */
  since?: string
  /**
   * Latest date to search until (YYYY-MM-DD)
   */
  until?: string
  
}

export type FeaturesGetData<T extends string[]> = Record<T[number], boolean | string | number | any[]> & {
  URIEncoded: () => string;
};