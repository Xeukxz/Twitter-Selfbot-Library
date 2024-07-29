import { Client } from "../Client";
import { ProfileTimelineTypes } from "../Profile";
import { Timeline, TimelineTypes } from "../Timelines/BaseTimeline";
import { FollowingTimeline } from "../Timelines/FollowingTimeline";
import { HomeTimeline } from "../Timelines/HomeTimeline";
import { ListTimeline } from "../Timelines/ListTimeline";
import { PostsTimeline } from "../Timelines/ProfileTimelines/PostsTimeline";
import { MediaTimeline } from "../Timelines/ProfileTimelines/MediaTimeline";
import { RepliesTimeline } from "../Timelines/ProfileTimelines/RepliesTimeline";
import { TweetRepliesTimeline } from "../Timelines/TweetRepliesTimeline";
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
  async fetch(data: TimelineFetchData) {
    console.log('Fetching Timeline:', data.type)
    let existing = this.cache.find(timeline => 
      (Object.keys(data) as Array<keyof TimelineFetchData>)
        .every((key) => timeline[key] === data[key])
      )

    if(!existing) {
      let { type, ...timelineData } = data // Omit type
      existing = new Timelines[data.type](this.client, timelineData as any)
      let {
        tweets,
        rawData
      } = await existing.fetch()

      existing.setCursors(rawData as any)
      
      this.cache.push(existing)
      console.log('Created Timeline')
      this.client.emit('timelineCreate', existing)
    }

    return existing
  }
}

export const Timelines = {
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

interface TweetRepliesTimelineFetchData extends TimelineBaseFetchData {
  type: 'tweetReplies'
  tweetId: string
}

type TimelineFetchData = TimelineListFetchData | TimelineHomeFetchData | TimelineFollowingFetchData | ProfileTimelineFetchData | TweetRepliesTimelineFetchData

