import { TimelineTweetManager } from "../Managers/TimelineTweetManager"
import { Client, FeaturesGetData } from "../Client"
import { ListTimeline, ListTimelineData, RawListTimelineResponseData } from "./ListTimeline"
import { RawTweetEntryData, Tweet, TweetEntryTypes } from "../Tweet"
import { HomeTimeline, RawHomeTimelineResponseData, HomeTimelineData } from './HomeTimeline';
import { FollowingTimeline, FollowingTimelineData, RawFollowingTimelineResponseData } from "./FollowingTimeline"
import { PostsTimeline, PostsTimelineData, RawPostsTimelineResponseData } from "./ProfileTimelines/PostsTimeline"
import { Queries } from "../Routes"
import { MediaTimeline, MediaTimelineData, RawMediaAddToModuleTimelineResponseData, RawMediaModuleTimelineResponseData } from "./ProfileTimelines/MediaTimeline"
import { RawRepliesTimelineResponseData, RepliesTimeline, RepliesTimelineData } from "./ProfileTimelines/RepliesTimeline"
import { EventEmitter } from "events"
import { RawTweetRepliesTimelineResponseData, TweetRepliesTimeline } from "./TweetRepliesTimeline"
import { RawSearchTimelineResponseData, SearchTimeline, SearchTimelineData } from "./SearchTimeline";
import { NotificationsTimeline, RawNotificationsTimelineResponseData } from './NotificationTimeline';
import { BaseTimeline } from './BaseTimeline';

export type TimelineData = HomeTimelineData | FollowingTimelineData | ListTimelineData | PostsTimelineData | MediaTimelineData | RepliesTimelineData | SearchTimelineData

export abstract class BaseTweetBasedTimeline<T extends TweetEntryTypes> extends BaseTimeline<T, TimelineTweetReturnData> {
  tweets: TimelineTweetManager<T>
  abstract cache: RawTimelineResponseData[]
  private firstStreamLoop: boolean = true
  private currentStreamTimeout?: NodeJS.Timeout


  constructor(client: Client, type: TimelineType) {
    super(client, type)
    this.tweets = new TimelineTweetManager<T>(client)
  }

  /**
   * Effectively creates a new timeline
   */
  async refresh() {
    this.tweets = new TimelineTweetManager(this.client)
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
        let fetchedTweets = await this.buildTweets(res.data).catch(err => {
          console.error(`Error building tweets from ${this.type} timeline`)
          console.error(this.client.rest._trace.summary())
          if(err.response?.data) console.error(err.response.data)
          reject(err)
        }) as Tweet[]
        resolve({
          tweets: fetchedTweets,
          rawData: res.data
        })
      }).catch((err) => {
        console.error(`Error fetching ${this.type} timeline`)
        console.error(this.client.rest._trace.summary())
        if(err.response?.data) console.error(err.response.data)
        reject(err)
      })
    })
  }

  abstract buildTweets(data: any): Promise<Tweet<T>[]>

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
    emitCache = false,
    isCatchUpComplete = () => false,
  } : {
    /**
     * The minimum timeout interval in milliseconds before fetching the timeline again (default 5m)
     */
    minTimeout?: number,

    /**
     * The maximum timeout interval in milliseconds before fetching the timeline again (default 10m)
     */
    maxTimeout?: number,

    /**
     * Whether or not to catch up on the timeline before streaming
     * 
     * This will continue to scroll the timeline until `maxCatchUpLoops` is reached or `isCatchUpComplete` returns true  
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
     * Whether or not to emit the current cache when the stream starts.  
     * Defaults to false  
     * Always true if `catchUp` is true
     */
    emitCache?: boolean
    
    /**
     * A function to determine if the catch up is complete
     */
    isCatchUpComplete?: (tweets: Tweet<T>[]) => boolean

  } = {
    minTimeout: 5 * 60 * 1000,
    maxTimeout: 10 * 60 * 1000,
    catchUp: false,
    minCatchUpTimeout: 5 * 60 * 1000,
    maxCatchUpTimeout: 10 * 60 * 1000,
    maxCatchUpLoops: 1000,
    emitCache: false,
    isCatchUpComplete: () => false,
  }, handleTweets: (tweets: TimelineTweetReturnData) => void = (tweets: TimelineTweetReturnData) => {
    this.emit('timelineUpdate', tweets.tweets)
  }) {
    emitCache = catchUp || emitCache
    if (minTimeout > maxTimeout) maxTimeout = minTimeout
    let randomTime = minTimeout + Math.floor(Math.random() * (maxTimeout - minTimeout))
    if(this.firstStreamLoop) {
      this.firstStreamLoop = false

      if(emitCache) handleTweets({
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
      await this.fetchLatest().then(handleTweets).catch(err => console.error(`Failed to stream timeline`, err))
      if (this.client.debug) console.log(`Streaming ${this.type} timeline in ${randomTime / 1000} seconds`)
      this.currentStreamTimeout = setTimeout(async () => {
        this.stream({minTimeout, maxTimeout}, handleTweets)
      }, randomTime)
    }

  }

  /**
   * Catches up on the timeline by scrolling until a condition is met or a maximum number of loops is reached
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
    await this.scroll().then(newTweets => {
      if(!newTweets) {
        console.log(`No more tweets to fetch, stopping catch up // ${this.type}`)
        return onCatchUpComplete()
      }
      handleTweets(newTweets)
  
      if(isComplete(newTweets.tweets as Tweet<T>[])) {
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
    }).catch(err => {
      console.log(err)
      console.error(`Failed to catch up timeline:\n`, err, `\nTrying again in 10 seconds`)
      setTimeout(() => {
        this.catchUp({minCatchUpTimeout, maxCatchUpTimeout, maxLoops, isComplete, _current: _current}, handleTweets, onCatchUpComplete)
      }, 10000);
    })
    
  }

  /**
   * Stops the timeline stream
   */
  endStream() {
    clearTimeout(this.currentStreamTimeout)
  }
  
}

export interface TimelineTweetReturnData {
  tweets: Tweet<TweetEntryTypes>[],
  rawData: RawTimelineResponseData
}

/**
 * 
 */
export interface BaseTimelineUrlData {
  variables: {
    count: number;
    cursor?: string;
    URIEncoded: () => string;
  };
  features: FeaturesGetData<Queries['metadata']['featureSwitches']>
}

export type TimelineType = 'home' | 'following' | 'list' | 'posts' | 'media' | 'replies' | 'tweetReplies' | 'search' | 'notifications' // | 'likes' | 'highlights'

export type TweetBasedTimeline = ListTimeline | HomeTimeline | FollowingTimeline | PostsTimeline | MediaTimeline | RepliesTimeline | TweetRepliesTimeline | SearchTimeline
export type NotificationBasedTimeline = NotificationsTimeline
export type Timeline = TweetBasedTimeline | NotificationBasedTimeline

export type TimelineEntryData<T> = [...T[], Cursor, Cursor]

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

export type RawTimelineResponseData = RawListTimelineResponseData | RawHomeTimelineResponseData | RawFollowingTimelineResponseData | RawPostsTimelineResponseData | RawMediaAddToModuleTimelineResponseData | RawMediaModuleTimelineResponseData | RawRepliesTimelineResponseData | RawTweetRepliesTimelineResponseData | RawSearchTimelineResponseData | RawNotificationsTimelineResponseData

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

export interface TimelineAddEntries<T> {
  type: "TimelineAddEntries";
  entries: TimelineEntryData<T>;
}

export interface TimelineClearCache {
  type: "TimelineClearCache";
}

export interface TimelinePinEntry {
  type: "TimelinePinEntry";
  entry: RawTweetEntryData;
}

export interface TimelineTerminateTimeline {
  type: "TimelineTerminateTimeline";
  direction: string;
}

export interface TimelineReplaceEntry {
  type: "TimelineReplaceEntry";
  entry_id_to_replace: string;
  entry: Cursor;
}

export interface TimelineClearEntriesUnreadState {
  type: "TimelineClearEntriesUnreadState";
  entry_ids: string[];
}

export interface TimelineMarkEntriesUnreadGreaterThanSortIndex {
  type: "TimelineMarkEntriesUnreadGreaterThanSortIndex";
  sortIndex: number;
}