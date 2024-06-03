import { RawTweetData } from "../Tweet";
import { Client } from "../Client";
import { BaseTimeline, BaseTimelineUrlData, TimelineEntryData } from "./BaseTimeline";
import fs from 'fs';

export class HomeTimeline extends BaseTimeline {
  // variables: HomeTimelineUrlData["variables"];
  // features: HomeTimelineUrlData["features"];
  cache: RawHomeTimelineData[] = [];
  constructor(
    client: Client,
    data?: {
      count?: number;
    }
  ) {
    super(client);
    this.type = "home";

    // this.variables = {
    //   count: data?.count || 20,
    //   includePromotedContent: true,
    //   latestControlAvailable: true,
    //   withCommunity: false,
    //   URIEncoded: function () {
    //     return encodeURIComponent(JSON.stringify(this));
    //   },
    // };

    // this.features = {
    //   rweb_tipjar_consumption_enabled: true,
    //   responsive_web_graphql_exclude_directive_enabled: true,
    //   verified_phone_label_enabled: false,
    //   creator_subscriptions_tweet_preview_api_enabled: true,
    //   responsive_web_graphql_timeline_navigation_enabled: true,
    //   responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
    //   c9s_tweet_anatomy_moderator_badge_enabled: true,
    //   tweetypie_unmention_optimization_enabled: true,
    //   responsive_web_edit_tweet_api_enabled: true,
    //   graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
    //   view_counts_everywhere_api_enabled: true,
    //   longform_notetweets_consumption_enabled: true,
    //   responsive_web_twitter_article_tweet_consumption_enabled: false,
    //   tweet_awards_web_tipping_enabled: false,
    //   freedom_of_speech_not_reach_fetch_enabled: true,
    //   standardized_nudges_misinfo: true,
    //   tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
    //     true,
    //   rweb_video_timestamps_enabled: true,
    //   longform_notetweets_rich_text_read_enabled: true,
    //   longform_notetweets_inline_media_enabled: true,
    //   responsive_web_media_download_video_enabled: false,
    //   responsive_web_enhance_cards_enabled: false,
    //   URIEncoded: function () {
    //     return encodeURIComponent(JSON.stringify(this))
    //   }
    // };
    this.fetch();
    console.log(this.cache);
  }

  get url() {
    return `https://twitter.com/i/api/graphql/1u0Wlkw6Ru1NwBUD-pDiww/HomeTimeline?${this.urlDataString}`;
  }

  get variables(): HomeTimelineUrlData["variables"] {
    return {
      includePromotedContent: true,
      latestControlAvailable: true,
      withCommunity: false,
      ...super.variables,
    };
  }

  get features(): HomeTimelineUrlData["features"] {
    return {
      ...super.features,
    };
  }

  /**
   * Fetches the latest tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async fetchLatest() {
    let entries =
      this.cache[this.cache.length - 1].data.home.home_timeline_urt
        .instructions[0].entries;
    this.variables.cursor = (entries[entries.length - 2].content as any).value; // cursor-top-\d{19}
    this.variables.count = 40;
    await this.fetch();
    this.resetData();
    return this.cache[this.cache.length - 1];
  }

  /**
   * Fetches older tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async scroll() {
    let entries =
      this.cache[this.cache.length - 1].data.home.home_timeline_urt
        .instructions[0].entries;
    this.variables.cursor = (entries[entries.length - 1].content as any).value; // cursor-bottom-\d{19}
    this.variables.count = 40;
    await this.fetch();
    // this.resetData()
    return this.cache[this.cache.length - 1];
  }

  resetData() {
    if (this.variables.cursor) delete this.variables.cursor;
    this.variables.count = 20;
  }

  buildTweetsFromCache(data: RawHomeTimelineData) {
    return new Promise((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-home.json`, JSON.stringify(data, null, 2));
      let t = this.tweets.addTweets(
        data.data.home.home_timeline_urt.instructions[0]
          .entries as RawTweetData[]
      );
      // console.log(t)
      resolve(t);
    });
  }

  protected patch(
    data: RawHomeTimelineData,
    extra?: {
      cursor?: {
        top?: string;
        bottom?: string;
      };
    }
  ) {}
}

/* 
this.features = {
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      c9s_tweet_anatomy_moderator_badge_enabled: true,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: false,
      tweet_awards_web_tipping_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
        true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_media_download_video_enabled: false,
      responsive_web_enhance_cards_enabled: false,
    };

    {
      "rweb_tipjar_consumption_enabled": true,
      "responsive_web_graphql_exclude_directive_enabled": true,
      "verified_phone_label_enabled": false,
      "creator_subscriptions_tweet_preview_api_enabled": true,
      "responsive_web_graphql_timeline_navigation_enabled": true,
      "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
      "communities_web_enable_tweet_community_results_fetch": true, //
      "c9s_tweet_anatomy_moderator_badge_enabled": true,
      "articles_preview_enabled": true,
      "tweetypie_unmention_optimization_enabled": true,
      "responsive_web_edit_tweet_api_enabled": true,
      "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
      "view_counts_everywhere_api_enabled": true,
      "longform_notetweets_consumption_enabled": true,
      "responsive_web_twitter_article_tweet_consumption_enabled": true,
      "tweet_awards_web_tipping_enabled": false,
      "creator_subscriptions_quote_tweet_preview_enabled": false,
      "freedom_of_speech_not_reach_fetch_enabled": true,
      "standardized_nudges_misinfo": true,
      "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
      "rweb_video_timestamps_enabled": true,
      "longform_notetweets_rich_text_read_enabled": true,
      "longform_notetweets_inline_media_enabled": true,
      "responsive_web_enhance_cards_enabled": false
    }

*/

export interface HomeTimelineUrlData  extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    includePromotedContent: boolean;
    latestControlAvailable: boolean;
    withCommunity: boolean;
  };
  features: BaseTimelineUrlData["features"]
}

export interface RawHomeTimelineData {
  data: {
    home: {
      home_timeline_urt: {
        instructions: [
          {
            type: "TimelineAddEntries";
            entries: TimelineEntryData;
          },
          {
            type: "TimelineShowAlert";
            alertType: "NewTweets";
            triggerDelayMs: number;
            displayDurationMs: number;
            userResults: {
              result: {
                _typename: "User";
                id: string;
                rest_id: string;
                affiliates_highlighted_label: any;
                has_graduated_access: boolean;
                is_blue_verified: boolean;
                profile_image_shape: string;
                legacy: any;
                professional: any;
              };
            }[];
          }
        ];
        metadata: {
          scribeConfig: {
            page: string;
          };
        };
      };
    };
  };
}
