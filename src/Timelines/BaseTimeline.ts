import Axios, { AxiosResponse } from "axios"
import { TweetManager } from "../TweetManager"
import { Client } from "../Client"
import { ListTimeline, RawListTimelineData } from "./ListTimeline"
import { RawTweetData } from "../Tweet"
import { HomeTimeline, RawHomeTimelineData } from "./HomeTimeline"
import { FollowingTimeline, RawFollowingTimelineData } from "./FollowingTimeline"

export class BaseTimeline {
  client: Client
  tweets: TweetManager = new TweetManager()
  // variables: BaseTimelineUrlData["variables"];
  // features: BaseTimelineUrlData["features"];
  type!: 'home' | 'following' | 'list'
  cache: RawTimelineData[] = []
  cursors: {
    top: string
    bottom: string
  } = {} as any
  get url () {
    return 'illegal'
  }

  constructor(client: Client) {
    this.client = client
  }

  get urlDataString() {
    return `variables=${this.variables.URIEncoded()}&features=${this.features.URIEncoded()}`
  }

  get variables(): BaseTimelineUrlData['variables'] {
    return {
      count: 20,
      URIEncoded: function () {
        return encodeURIComponent(JSON.stringify(this))
      }
    }
  }

  get features(): BaseTimelineUrlData['features'] {
    return {
      creator_subscriptions_quote_tweet_preview_enabled: true,
      rweb_tipjar_consumption_enabled: true,
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
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_media_enabled: true,
      responsive_web_media_download_video_enabled: false,
      responsive_web_enhance_cards_enabled: false,
      rweb_video_timestamps_enabled: true,
      communities_web_enable_tweet_community_results_fetch: true,
      articles_preview_enabled: true,
      URIEncoded: function () {
        return encodeURIComponent(JSON.stringify(this))
      }
    }
  }

  /**
   * effectively creates a new timeline
   */
  async refresh() {
    this.tweets = new TweetManager()
    this.cache = []
    await this.fetch()
    return []
  }

  /**
   * Fetch the timeline
   */
  protected async fetch() {
    return new Promise((resolve, reject) => {
      if(this.url == 'illegal') throw new Error(`Illegal call to BaseTimeline.fetch(). ${this.type}`)
      this.client.rest.get(
        this.url
        ).then(async (res) => {
          this.cache.push(res.data)
          await this.buildTweetsFromCache(res.data)
          if (this.cache.length == 1) {
            this.patch(res.data)
            this.client.emit('timelineCreate', this)

          } 
          resolve(res.data)
      }).catch((err) => {
        console.log(err.response.data)
        reject(err)
      })
    })

  }

  buildTweetsFromCache(data: any) {
    throw new Error("Illegal call to BaseTimeline.buildTweetsFromCache().")
  }

  
  protected patch(data: any) {
    throw new Error("Illegal call to BaseTimeline.patch().")
  }
}

export interface BaseTimelineUrlData {
  variables: {
    count: number;
    cursor?: string;
    // withCommunity: boolean; // not in list
    // includePromotedContent: boolean; // not in list
    // latestControlAvailable: boolean; // not in list
    // listId: string; // list only
    URIEncoded: () => string;
  };
  features: {
    creator_subscriptions_quote_tweet_preview_enabled: boolean;
    rweb_tipjar_consumption_enabled: boolean;
    responsive_web_graphql_exclude_directive_enabled: boolean;
    verified_phone_label_enabled: boolean;
    creator_subscriptions_tweet_preview_api_enabled: boolean;
    responsive_web_graphql_timeline_navigation_enabled: boolean;
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: boolean;
    c9s_tweet_anatomy_moderator_badge_enabled: boolean;
    tweetypie_unmention_optimization_enabled: boolean;
    responsive_web_edit_tweet_api_enabled: boolean;
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: boolean;
    view_counts_everywhere_api_enabled: boolean;
    longform_notetweets_consumption_enabled: boolean;
    responsive_web_twitter_article_tweet_consumption_enabled: boolean;
    tweet_awards_web_tipping_enabled: boolean;
    freedom_of_speech_not_reach_fetch_enabled: boolean;
    standardized_nudges_misinfo: boolean;
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: boolean;
    longform_notetweets_rich_text_read_enabled: boolean;
    longform_notetweets_inline_media_enabled: boolean;
    responsive_web_media_download_video_enabled: boolean;
    responsive_web_enhance_cards_enabled: boolean;
    rweb_video_timestamps_enabled: boolean;
    communities_web_enable_tweet_community_results_fetch: boolean;
    articles_preview_enabled: boolean; 
    // rweb_video_timestamps_enabled: boolean; // not in list
    // responsive_web_home_pinned_timelines_enabled: boolean, // list only
    URIEncoded: () => string;
  };
}

export type Timeline = ListTimeline | HomeTimeline | FollowingTimeline

export type TimelineEntryData = [...RawTweetData[], Cursor, Cursor]

export interface CursorData {
  entryId: string,
  sortIndex: string,
  content: {
    entryType: string,
    __typename: string,
    value: string,
    cursorType: string
  }
}

export interface TopCursorData extends CursorData {
  content: {
    entryType: string,
    __typename: string,
    value: string,
    cursorType: "Top"
  }
}

export interface BottomCursorData extends CursorData {
  content: {
    entryType: string,
    __typename: string,
    value: string,
    cursorType: "Bottom"
  }
}

export type Cursor = TopCursorData | BottomCursorData

export type RawTimelineData = RawListTimelineData | RawHomeTimelineData | RawFollowingTimelineData
