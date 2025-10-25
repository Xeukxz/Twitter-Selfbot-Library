import { Client } from "../Client";
import { ProfileTimelineTypes } from "../Profile";
import { TweetBasedTimeline, TimelineType } from "../Timelines/BaseTweetBasedTimeline";
import { FollowingTimeline } from "../Timelines/FollowingTimeline";
import { HomeTimeline } from "../Timelines/HomeTimeline";
import { ListTimeline } from "../Timelines/ListTimeline";
import { PostsTimeline } from '../Timelines/ProfileTimelines/PostsTimeline';
import { MediaTimeline } from "../Timelines/ProfileTimelines/MediaTimeline";
import { RepliesTimeline } from '../Timelines/ProfileTimelines/RepliesTimeline';
import { TweetRepliesTimeline } from "../Timelines/TweetRepliesTimeline";
import { Tweet } from "../Tweet";
import { SearchTimeline, SearchTimelineUrlData } from "../Timelines/SearchTimeline";

export class TimelineManager {
  client: Client
  cache: TweetBasedTimeline[] = [];
  constructor(client: Client) {
    this.client = client
  }

  /**
   * Creates or retrieves a timeline
   * 
   */
  async fetch<T extends TimelineFetchData>(data: T): Promise<FetchedInstance<T>> {
    console.log('Fetching Timeline:', data.type)
    let existing = this.cache.find((timeline: TweetBasedTimeline) => 
      (Object.keys(data) as Array<keyof T>)
        .every((key) => (timeline as FetchedInstance<T>)[key] === data[key])
      )

    if(!existing) {
      console.log('Creating Timeline')
      let { type, ...timelineData } = data as TimelineFetchData // Omit type
      existing = new MappedTimelines[type](this.client, timelineData as typeof MappedTimelines[typeof type] extends new (client: Client, data: infer D) => any ? D : never);
      let {
        tweets,
        rawData
      } = await existing.fetch()

      existing.setCursors(rawData as any)
      
      this.cache.push(existing)
      console.log('Created Timeline')
      this.client.emit('timelineCreate', existing)
    }

    return existing as FetchedInstance<T>
  }
}

// maps the specific timeline to the given type
type FetchedInstance<T extends TimelineFetchData> = T extends { type: infer U } ? U extends keyof typeof MappedTimelines ? InstanceType<typeof MappedTimelines[U]> : never : never; // I hate typescript

export const MappedTimelines = {
  home: HomeTimeline,
  following: FollowingTimeline,
  list: ListTimeline,
  posts: PostsTimeline,
  media: MediaTimeline,
  replies: RepliesTimeline,
  tweetReplies: TweetRepliesTimeline,
  search: SearchTimeline
}

interface TimelineBaseFetchData {
  type: TimelineType
  count?: number
}

interface TimelineListFetchData extends TimelineBaseFetchData {
  type: 'list'
  id: string
}

interface TimelineHomeFetchData extends TimelineBaseFetchData {
  type: 'home'
}

interface TimelineFollowingFetchData extends TimelineBaseFetchData {
  type: 'following'
}

interface ProfileTimelineFetchData extends TimelineBaseFetchData {
  type: ProfileTimelineTypes
  username: string
}

interface TweetRepliesTimelineFetchDataWithTweet extends TimelineBaseFetchData {
  type: 'tweetReplies'
  tweet: Tweet
}

interface TweetRepliesTimelineFetchDataWithTweetId extends TimelineBaseFetchData {
  type: 'tweetReplies'
  tweetId: string
}

interface SearchTimelineFetchData extends TimelineBaseFetchData {
  type: 'search'
  /**
   * The search query
   */
  query: string;
  /**
   * The search target
   */
  product: SearchTimelineUrlData["variables"]["product"];
  /**
   * The referrer of the search query used in analytics
   */
  querySource: SearchTimelineUrlData["variables"]["querySource"];
}

type TweetRepliesTimelineFetchData = TweetRepliesTimelineFetchDataWithTweet | TweetRepliesTimelineFetchDataWithTweetId

type TimelineFetchData = TimelineListFetchData | TimelineHomeFetchData | TimelineFollowingFetchData | ProfileTimelineFetchData | TweetRepliesTimelineFetchData | SearchTimelineFetchData

