import { RawTweetData } from "../Tweet";
import { Client } from "../Client";
import { BaseTimeline, Cursor, TimelineEntryData } from "./BaseTimeline";

export class ListTimeline extends BaseTimeline {

  variables: ListTimelineUrlData['variables']
  features: ListTimelineUrlData['features']
  cache: RawListTimelineData[] = []
  constructor(client: Client, data: {
    id: string
    count?: number
  }) {
    super(client)
    this.type = 'list'

    this.variables = {
      listId: data.id,
      count: data.count || 20,
      URIEncoded: function () {
        return encodeURIComponent(JSON.stringify(this))
      }
    }

    this.features = {
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      responsive_web_home_pinned_timelines_enabled: true,
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
      URIEncoded: function () {
        return encodeURIComponent(JSON.stringify(this))
      }
    }
    this.fetch()

    console.log(this.cache)

    
  }

  get url() {
    return `https://twitter.com/i/api/graphql/d1mUZHaqFMxe0xHI3rVc-w/ListLatestTweetsTimeline?variables=${this.variables.URIEncoded()}&features=${this.features.URIEncoded()}`
  }

  /**
   * Fetches the latest tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async fetchLatest() {
    let entries = this.cache[this.cache.length - 1].data.list.tweets_timeline.timeline.instructions[0].entries
    this.variables.cursor = this.cursors.top = (entries[entries.length - 2].content as any).value // cursor-top-\d{19} 
    this.variables.count = 40
    await this.fetch()
    this.resetData()
    return this.cache[this.cache.length - 1]
  }

  /**
   * Fetches older tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async scroll() {
    let entries = this.cache[this.cache.length - 1].data.list.tweets_timeline.timeline.instructions[0].entries
    this.variables.cursor = this.cursors.bottom = (entries[entries.length - 1].content as any).value // cursor-bottom-\d{19}
    this.variables.count = 40
    await this.fetch()
    this.resetData()
    return this.cache[this.cache.length - 1]
  }

  resetData() {
    if(this.variables.cursor) delete this.variables.cursor
    this.variables.count = 20
    
  }

  buildTweetsFromCache(data: RawListTimelineData) {
    return new Promise((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      let t = this.tweets.addTweets(data.data.list.tweets_timeline.timeline.instructions[0].entries as RawTweetData[])
      // console.log(t)
      resolve(t)
    })
  }

  protected patch(data: RawListTimelineData) {
    return new Promise((resolve, reject) => {
      let entries = data.data.list.tweets_timeline.timeline.instructions[0].entries
      this.cursors.top = ((entries[entries.length - 2] as unknown as Cursor).content as any).value // cursor-top-\d{19} 
      this.cursors.bottom = ((entries[entries.length - 1] as unknown as Cursor).content as any).value // cursor-bottom-\d{19}
      resolve(data)
    })
  }

}

export interface ListTimelineUrlData {
  variables: {
    listId: string
    count: number
    cursor?: string
    URIEncoded: () => string
  },
  features: {
    responsive_web_graphql_exclude_directive_enabled: boolean
    verified_phone_label_enabled: boolean
    responsive_web_home_pinned_timelines_enabled: boolean
    creator_subscriptions_tweet_preview_api_enabled: boolean
    responsive_web_graphql_timeline_navigation_enabled: boolean
    responsive_web_graphql_skip_user_profile_image_extensions_enabled: boolean
    c9s_tweet_anatomy_moderator_badge_enabled: boolean
    tweetypie_unmention_optimization_enabled: boolean
    responsive_web_edit_tweet_api_enabled: boolean
    graphql_is_translatable_rweb_tweet_is_translatable_enabled: boolean
    view_counts_everywhere_api_enabled: boolean
    longform_notetweets_consumption_enabled: boolean
    responsive_web_twitter_article_tweet_consumption_enabled: boolean
    tweet_awards_web_tipping_enabled: boolean
    freedom_of_speech_not_reach_fetch_enabled: boolean
    standardized_nudges_misinfo: boolean
    tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: boolean
    longform_notetweets_rich_text_read_enabled: boolean
    longform_notetweets_inline_media_enabled: boolean
    responsive_web_media_download_video_enabled: boolean
    responsive_web_enhance_cards_enabled: boolean
    URIEncoded: () => string
  }
}

export interface RawListTimelineData {
  data: {
    list: {
      tweets_timeline: {
        timeline: {
          id: string
          instructions: [{
            type: string
            entries: TimelineEntryData
          }]
          metadata: {
            scribeConfig: {
              page: string
            }
          }
        }
      }
    }
  }
}
