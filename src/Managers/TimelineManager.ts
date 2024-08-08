import { Client } from "../Client";
import { ProfileTimelineTypes } from "../Profile";
import { Timeline, TimelineTypes } from "../Timelines/BaseTimeline";
import { FollowingTimeline, FollowingTimelineData } from "../Timelines/FollowingTimeline";
import { HomeTimeline, HomeTimelineData } from "../Timelines/HomeTimeline";
import { ListTimeline, ListTimelineData } from "../Timelines/ListTimeline";
import { PostsTimeline, PostsTimelineData } from '../Timelines/ProfileTimelines/PostsTimeline';
import { MediaTimeline, MediaTimelineData } from "../Timelines/ProfileTimelines/MediaTimeline";
import { RepliesTimeline, RepliesTimelineData } from '../Timelines/ProfileTimelines/RepliesTimeline';
import { TweetRepliesTimeline, tweetRepliesTimelineData } from "../Timelines/TweetRepliesTimeline";
import { Tweet, TweetEntryTypes, TweetTypes } from "../Tweet";
export class TimelineManager {
  client: Client
  cache: Timeline[] = [];
  constructor(client: Client) {
    this.client = client
  }

  /**
   * Creates or retrieves a timeline
   * 
   */
  async fetch<T extends TimelineFetchData>(data: T): Promise<FetchedInstance<T>> {
    console.log('Fetching Timeline:', data.type)
    let existing = this.cache.find(timeline => 
      (Object.keys(data) as Array<keyof TimelineFetchData>)
        .every((key) => timeline[key] === data[key])
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
  tweetReplies: TweetRepliesTimeline
}

interface TimelineBaseFetchData {
  type: TimelineTypes
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

type TweetRepliesTimelineFetchData = TweetRepliesTimelineFetchDataWithTweet | TweetRepliesTimelineFetchDataWithTweetId

type TimelineFetchData = TimelineListFetchData | TimelineHomeFetchData | TimelineFollowingFetchData | ProfileTimelineFetchData | TweetRepliesTimelineFetchData

