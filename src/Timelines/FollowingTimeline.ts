import { RawTweetData, Tweet } from "../Tweet";
import { Client } from "../Client";
import { BaseTimeline, BaseTimelineUrlData, BottomCursorData, Cursor, RawTimelineResponseData, TimelineAddEntries, TimelineShowAlert, TimelineTweetEntryData, TopCursorData } from "./BaseTimeline";
import fs from 'fs';
import { Queries } from "../Routes";
import { TweetManager } from "../Managers";

export interface FollowingTimelineData {
  count?: number;
}

export class FollowingTimeline extends BaseTimeline<RawTweetData> {
  // variables: FollowingTimelineUrlData["variables"];
  // features: FollowingTimelineUrlData["features"];
  cache: RawFollowingTimelineResponseData[] = [];
  variables: FollowingTimelineUrlData["variables"] = {
    includePromotedContent: true,
    latestControlAvailable: true,
    withCommunity: false,
    ...super._variables,
  }
  constructor(
    client: Client,
    data?: FollowingTimelineData
  ) {
    super(client, "following");
  }

  get url() {
    return `https://twitter.com/i/api/graphql/9EwYy8pLBOSFlEoSP2STiQ/HomeLatestTimeline?${this.urlDataString}`;
  }

  

  // get features(): FollowingTimelineUrlData["features"] {
  //   return {
  //     ...super.features,
  //   };
  // }

  /**
   * Fetches the latest tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async fetchLatest() {
    this.variables.cursor = this.cursors.top;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawFollowingTimelineResponseData).data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.resetData();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  /**
   * Fetches older tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async scroll() {
    this.variables.cursor = this.cursors.bottom;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawFollowingTimelineResponseData).data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
    this.resetData();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  buildTweetsFromCache(data: RawFollowingTimelineResponseData) {
    return new Promise<Tweet<RawTweetData>[]>((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-following.json`, JSON.stringify(data, null, 2));
      let t = this.tweets.addTweets(
        (data.data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries as RawTweetData[]
      );
      // console.log(t)
      resolve(t);
    });
  }

  setCursors(rawTimelineData: RawFollowingTimelineResponseData): void {
    let entries = (rawTimelineData.data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
  
  
  }
}

/* 
this.features = {
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false
}
*/

export interface FollowingTimelineUrlData extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    includePromotedContent: boolean;
    latestControlAvailable: boolean;
    withCommunity: boolean;
  };
  features: BaseTimelineUrlData["features"]
}

export interface RawFollowingTimelineResponseData {
  data: {
    home: {
      home_timeline_urt: {
        instructions: [TimelineAddEntries, TimelineShowAlert];
        metadata: {
          scribeConfig: {
            page: string;
          };
        };
      };
    };
  };
}