import EventEmitter from "node:events";
import { TimelineManager } from "./Managers/TimelineManager";
import { RESTApiManager } from "./REST/rest";
import puppeteer, { PuppeteerLaunchOptions } from "puppeteer";
import fs from "fs";
import { Timeline } from "./Timelines";
import { ProfileManager } from "./Managers/ProfileManager";
import { Profile } from "./Profile";
import { GlobalTweetManager } from "./Managers";
import { SearchTimelineUrlData } from "./Timelines/SearchTimeline";

export interface ClientParams {
  headless?: boolean;
  keepPageOpen?: boolean;
  debug?: boolean;
  puppeteerSettings?: PuppeteerLaunchOptions;
}

export interface ClientEvents {
  ready: [ void ];
  timelineCreate: [ Timeline ];
  profileCreate: [ Profile ];
}


export class Client extends EventEmitter<ClientEvents> {
  token!: string
  csrfToken!: string
  cookies!: string
  rest!: RESTApiManager
  timelines: TimelineManager = new TimelineManager(this)
  tweets: GlobalTweetManager = new GlobalTweetManager(this)
  profiles: ProfileManager = new ProfileManager(this)
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
    get: <T extends string[]>(keys: string[]) => FeaturesGetData<T>
  }
  /**
   * Create a new client
   * 
   * Takes an object with the following optional parameters
   * @param headless - Run the browser in headless mode || default: true
   * @param keepPageOpen - Keep the browser open after getting account data || default: false
   * @param puppeteerSettings - Puppeteer launch settings
   */
  constructor({
    headless = true,
    keepPageOpen = false,
    debug = false,
    puppeteerSettings
  }: ClientParams) {
    super();
    this.debug = debug; // ! DEVELOPMENT ONLY
    this.getAccountData({
      headless,
      keepPageOpen,
      puppeteerSettings
    }).then(() => {
      // console.log("Got account data.");
      this.rest = new RESTApiManager(this);
      this.emit("ready");
    })
  }

  async getAccountData({
    headless,
    keepPageOpen,
    puppeteerSettings
  }: ClientParams) {
    return new Promise<void>(async (resolve, reject) => {

      if(this.debug) {
        // ensure debug folder exists
        if (!fs.existsSync(`${__dirname}/../debug`)) {
          fs.mkdirSync(`${__dirname}/../debug`);
          console.log("Debug folder created.");
        }
      }

      // ensure storage file exists
      if (!fs.existsSync(`${__dirname}/../accountData.json`)) {
        fs.writeFileSync(`${__dirname}/../accountData.json`, "{}");
        console.log("Account data file created.");
      }
      let storedData = fs.readFileSync(`${__dirname}/../accountData.json`, "utf-8")
      if(storedData == "") storedData = "{}"
      let parsedStoredData = JSON.parse(storedData);
      
      if(Object.keys(parsedStoredData?.cookies ?? parsedStoredData).length > 0) {
        if(this.debug) console.log("Found stored account data.");
      } else {
        if(this.debug) console.log("No stored account data found.");
        headless = false;
      }
      
      // Launch the browser and open a new blank page
      if(this.debug) console.log(headless ? "Running in headless mode." : "Running in non-headless mode.")
      if(this.debug) console.log(keepPageOpen ? "Keeping browser open after getting account data." : "Closing browser after getting account data.")
      const browser = await puppeteer.launch({
        headless: headless,
        ...puppeteerSettings
      });

      browser.on('disconnected', async () => {
        if(parsedStoredData?.cookies) this.debug ? console.log('Browser has been disconnected, The client will continue running.') : null;
        else {
          await browser.close();
          browser.process()?.kill()
          throw new Error('Account data not found.')
        }
      });
      
      const page = await browser.newPage();
      // if stored data is an empty object
      if (Object.keys(parsedStoredData?.cookies ?? parsedStoredData)?.length > 0)
        await page.setCookie(...parsedStoredData.cookies);
      else {
        await page.setViewport({ width: 1080, height: 1024 });
        console.log("Please login to the account you wish to automate.");
      }


      // Navigate the page to a URL
      await page.goto("https://twitter.com/home");

      const html = await page.content();
      
      let featuresString = `${html.match(/"user":\{"config".+?,"debug"/)![0].replace(`,"debug"`, "").replace(`"user":`, "")}`
      this.features = {
        ...JSON.parse(featuresString),
        get: <T extends string[]>(keys: string[]): FeaturesGetData<T> => { //  jesus fucking christ
          // console.log(keys)
          // console.log(this.features.config)
          // console.log(keys.map(key => [key, this.features.config[key]?.value]))
          return {
            ...Object.fromEntries(keys.map(key => [key, this.features.config[key].value])),
            URIEncoded: function() {
              return encodeURIComponent(JSON.stringify(this))
            }
          } as FeaturesGetData<T>;
        }
      }

      // Set screen size
      if (!headless) await page.setViewport({ width: 1080, height: 1024 });

      let gotData = false;

      page.on("request", async (request) => {
        if (gotData) return;
        // console.log(request.url());
        let headers = request.headers();
        // find the request with the authorization header
        let token = headers[`authorization`];
        let csrftoken = headers[`x-csrf-token`];
        // if(csrftoken) console.log(headers)
        // console.log(token, csrftoken);
        if (token && csrftoken) {
          gotData = true;
          // console.log(token);
          let cookies = await page.cookies();
          let cookiesString = cookies
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join("; ");
          parsedStoredData = {
            Authorisation: token,
            "x-csrf-token": csrftoken,
            cookies: cookies,
            cookiesString: cookiesString,
          };
          fs.writeFileSync(
            `${__dirname}/../accountData.json`,
            JSON.stringify(parsedStoredData, null, 2)
          );
          // fs.writeFileSync('cookies.json', JSON.stringify(cookies))
          // console.log(cookies, cookiesString);
          page.off("request");
          if(this.debug) console.log(
            `Got account data. ${
              keepPageOpen ? "Keeping browser open." : "Closing browser."
            }`
          );
          if (!keepPageOpen) {
            if(this.debug) console.log("Closing browser.");
            if(!page.isClosed()) await page.close()
            await browser.close();
            if(this.debug) console.log("Browser closed.");
          }
          this.token = token;
          this.csrfToken = csrftoken;
          this.cookies = cookiesString;
          resolve();
        }
      });
    });
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