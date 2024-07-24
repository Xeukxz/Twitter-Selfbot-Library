import Axios, { AxiosResponse } from "axios"
import { TweetManager } from "../Managers/TweetManager"
import { Client, FeaturesGetData } from "../Client"
import { ListTimeline, ListTimelineData, RawListTimelineResponseData } from "./ListTimeline"
import { RawGridTweetData, RawTweetData, Tweet, TweetTypes } from "../Tweet"
import { HomeTimeline, RawHomeTimelineResponseData, HomeTimelineData } from './HomeTimeline';
import { FollowingTimeline, FollowingTimelineData, RawFollowingTimelineResponseData } from "./FollowingTimeline"
import { PostsTimeline, PostsTimelineData, RawPostsTimelineResponseData } from "./ProfileTimelines/PostsTimeline"
import { Queries } from "../Routes"
import { MediaTimeline, MediaTimelineData, RawMediaAddToModuleTimelineResponseData, RawMediaModuleTimelineResponseData } from "./ProfileTimelines/MediaTimeline"
import { RepliesTimeline } from "./ProfileTimelines/RepliesTimeline"
import { EventEmitter } from "events"

export type TimelineData = HomeTimelineData | FollowingTimelineData | ListTimelineData | PostsTimelineData | MediaTimelineData


export interface TimelineEvents<T extends TweetTypes> {
  timelineUpdate: Tweet<T>[];
}

export abstract class BaseTimeline<T extends TweetTypes> extends EventEmitter<Record<keyof TimelineEvents<T>, any>> {
  client: Client
  // abstract tweets: TweetManager<T>
  tweets: TweetManager<T> = new TweetManager<T>()
  type!: TimelineTypes
  abstract cache: RawTimelineResponseData[]
  cursors: {
    top: string
    bottom: string
  } = {} as any
  private firstStreamLoop: boolean = true
  private currentStreamTimeout?: NodeJS.Timeout
  abstract variables: BaseTimelineUrlData['variables']
  protected query: typeof Queries.timelines[TimelineTypes]
  getUrl = (query: typeof Queries.timelines[TimelineTypes]) => {
    return `https://twitter.com/i/api/graphql/${query.queryId}/${query.operationName}?${this.urlDataString}`
  }
  
  
  get url() {
    return `${this.getUrl(this.query)}`;
  }

  constructor(client: Client, type: TimelineTypes) {
    super()
    this.client = client
    this.type = type
    this.query = Queries.timelines[this.type]
  }

  get urlDataString() {
    return `variables=${this.variables.URIEncoded()}&features=${this.features.URIEncoded()}`
  }

  get _variables(): BaseTimelineUrlData['variables'] {
    return {
      count: 20,
      cursor: undefined,
      URIEncoded: function () {
        return encodeURIComponent(JSON.stringify(this))
      }
    }
  }

  get features(): FeaturesGetData<typeof this.query.metadata.featureSwitches> {
    return this.client.features.get(this.query.metadata.featureSwitches)
  }

  abstract fetchLatest(): Promise<TimelineTweetReturnData>

  abstract scroll(): Promise<TimelineTweetReturnData>

  resetData() {
    this.variables.cursor = undefined;
    this.variables.count = 20;
  }

  /**
   * effectively creates a new timeline
   */
  async refresh() {
    this.tweets = new TweetManager()
    this.cache = []
    let {
      tweets,
      rawData
    } = await this.fetch()
    this.setCursors(rawData)
    return []
  }

  /**
   * Fetch the timeline
   */
  async fetch() {
    return new Promise<TimelineTweetReturnData>((resolve, reject) => {
      this.client.rest.graphQL({
        query: this.query,
        variables: this.variables
      }).then(async (res) => {
        this.cache.push(res.data)
        let fetchedTweets = await this.buildTweetsFromCache(res.data)
        resolve({
          tweets: fetchedTweets,
          rawData: res.data
        })
      }).catch((err) => {
        console.log(err.response?.data)
        reject(err)
      })
    })
  }

  
  abstract buildTweetsFromCache(data: any): Promise<Tweet<T>[]>
  /**
   * Streams the timeline data with variable intervals.
   */
  async stream({
    minTimeout = 5 * 60 * 1000,
    maxTimeout = 10 * 60 * 1000,
    catchUp = false,
    minCatchUpTimeout = 5 * 60 * 1000,
    maxCatchUpTimeout = 10 * 60 * 1000,
    maxCatchUpLoops = 1000,
    isCatchUpComplete = () => false
  } : {
    /**
     * The minimum timeout interval in milliseconds before fetching the timeline again (default 5s)
     */
    minTimeout?: number,

    /**
     * The maximum timeout interval in milliseconds before fetching the timeline again (default 10s)
     */
    maxTimeout?: number,

    /**
     * Whether or not to catch up on the timeline before streaming
     * 
     * This will continue to scroll the timeline until all tweets received are already cached
     * 
     * argument properties { minCatchUpTimeout, maxCatchUpTimeout } can be used to set the timeout intervals for catching up
     */
    catchUp?: boolean

    /**
     * The minimum timeout interval in milliseconds before fetching the timeline again (default 5s)
     */
    minCatchUpTimeout?: number,

    /**
     * The maximum timeout interval in milliseconds before fetching the timeline again (default 10s)
     */
    maxCatchUpTimeout?: number

    /**
     * The maximum number of loops to catch up before stopping
     */
    maxCatchUpLoops?: number
    
    /**
     * A function to determine if the catch up is complete
     */
    isCatchUpComplete?: (tweets: Tweet<T>[]) => boolean

  }, handleTweets: (tweets: TimelineTweetReturnData) => void = (tweets: TimelineTweetReturnData) => {
    this.emit('timelineUpdate', tweets.tweets)
  }) {
    if (minTimeout > maxTimeout) maxTimeout = minTimeout
    let randomTime = minTimeout + Math.floor(Math.random() * (maxTimeout - minTimeout))
    if(this.firstStreamLoop) {
      this.firstStreamLoop = false

      handleTweets({
        tweets: this.tweets.cache,
        rawData: this.cache[this.cache.length - 1]
      })
    }
    if(catchUp) {
      this.catchUp({minCatchUpTimeout, maxCatchUpTimeout, maxLoops: maxCatchUpLoops, isComplete: isCatchUpComplete}, handleTweets, () => {
        this.stream({minTimeout, maxTimeout}, handleTweets)
      })
    }
    else {
      let newTweets = await this.fetchLatest()
      handleTweets(newTweets)
      if (this.client.debug) console.log(`Streaming ${this.type} timeline in ${randomTime / 1000} seconds`)
      this.currentStreamTimeout = setTimeout(async () => {
        this.stream({minTimeout, maxTimeout}, handleTweets)
      }, randomTime)
    }

  }

  /**
   * Catches up on the timeline by scrolling until a condition is met
   * 
   * It is recommended to use `timeline.stream({ catchUp: true })` instead of this method unless you need the extra control
   * 
   * ```typescript
   * timeline.catchUp({
   *   minCatchUpTimeout: 5000,
   *   maxCatchUpTimeout: 10000,
   *   maxLoops: 50
   * }, () => {
   *   // This will run when the catch up is complete
   *   timeline.stream(...) // start streaming the latest tweets
   * })
   * ```
   * 
   */
  async catchUp({
    minCatchUpTimeout = 5 * 60 * 1000,
    maxCatchUpTimeout = 10 * 60 * 1000,
    maxLoops = 1000,
    _current = 0,
    isComplete,
  } : {
    /**
     * The minimum timeout interval in milliseconds before fetching the timeline again (default 5s)
     */
    minCatchUpTimeout?: number,

    /**
     * The maximum timeout interval in milliseconds before fetching the timeline again (default 10s)
     */
    maxCatchUpTimeout?: number,

    /**
     * The maximum number of loops to catch up before stopping
     */
    maxLoops?: number

    /**
     * A function to determine when the catch up is complete
     */
    isComplete: (tweets: Tweet<T>[]) => boolean

    /**
     * The current loop number, this will be set automatically
     */
    _current?: number
  }, handleTweets: (tweets: TimelineTweetReturnData) => void, onCatchUpComplete: () => void) {
    if (minCatchUpTimeout > maxCatchUpTimeout) maxCatchUpTimeout = minCatchUpTimeout
    let randomTime = minCatchUpTimeout + Math.floor(Math.random() * (maxCatchUpTimeout - minCatchUpTimeout))
    let newRawTweetsData = await this.scroll()

    handleTweets(newRawTweetsData)


    if(isComplete(newRawTweetsData.tweets as Tweet<T>[])) {
      console.log(`Catch up complete // ${this.type}`)
      return onCatchUpComplete()
    }
    if(_current >= maxLoops) {
      console.log(`Max loops reached, stopping catch up // ${this.type}`)
      return onCatchUpComplete()
    }
    if (this.client.debug) console.log(`Catching up ${this.type} timeline in ${randomTime / 1000} seconds`)
      this.currentStreamTimeout = setTimeout(() => {
      this.catchUp({minCatchUpTimeout, maxCatchUpTimeout, maxLoops, isComplete, _current: _current + 1}, handleTweets, onCatchUpComplete)
    }, randomTime);
  }

  /**
   * Stops the timeline stream
   */
  endStream() {
    clearTimeout(this.currentStreamTimeout)
  }
  
  abstract setCursors(rawTimelineData: RawTimelineResponseData): void
}

export interface TimelineTweetReturnData {
  tweets: Tweet<TweetTypes>[],
  rawData: RawTimelineResponseData
}

export interface BaseTimelineUrlData {
  variables: {
    count: number;
    cursor?: string;
    URIEncoded: () => string;
  };
  features: FeaturesGetData<Queries['metadata']['featureSwitches']>
  //   // responsive_web_home_pinned_timelines_enabled: boolean, // list only ?? legit not even
  //   URIEncoded: () => string;
  // };
}

export type TimelineTypes = 'home' | 'following' | 'list' | 'posts' | 'media' | 'replies' // | 'likes' | 'highlights'

export type Timeline = ListTimeline | HomeTimeline | FollowingTimeline | PostsTimeline | MediaTimeline | RepliesTimeline

export type TimelineTweetEntryData = [...RawTweetData[], Cursor, Cursor]

export interface CursorData {
  entryId: `cursor-${"top" | "bottom"}-${number}`,
  sortIndex: string,
  content: {
    entryType: string,
    __typename: string,
    value: string,
    cursorType: "Top" | "Bottom"
  }
}

export interface TopCursorData extends CursorData {
  entryId: `cursor-top-${number}`,
  content: CursorData["content"] & {
    cursorType: "Top"
  }
}

export interface BottomCursorData extends CursorData {
  entryId: `cursor-bottom-${number}`,
  content: CursorData["content"] & {
    cursorType: "Bottom"
  }
}

export type Cursor = TopCursorData | BottomCursorData

export type RawTimelineResponseData = RawListTimelineResponseData | RawHomeTimelineResponseData | RawFollowingTimelineResponseData | RawPostsTimelineResponseData | RawMediaAddToModuleTimelineResponseData | RawMediaModuleTimelineResponseData


export interface NewListTimelineData {
  type: 'list'
  id: string
}

export interface NewHomeTimelineData {
  type: 'home'
}

export interface NewFollowingTimelineData {
  type: 'following'
}

export interface NewPostsTimelineData {
  type: 'posts'
  // profile: Profile
  username: string
}

export type NewTimelineData = NewListTimelineData | NewHomeTimelineData | NewFollowingTimelineData | NewPostsTimelineData

export interface TimelineShowAlert {
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

export interface TimelineAddEntries {
  type: "TimelineAddEntries";
  entries: TimelineTweetEntryData;
}

export interface TimelineClearCache {
  type: "TimelineClearCache";
}