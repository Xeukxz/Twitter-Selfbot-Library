import { count } from "node:console";
import { Client } from "../Client";
import { Profile, ProfileTimelineTypes } from "../Profile";
import { BaseTimeline, Timeline, TimelineData, TimelineTypes } from "../Timelines/BaseTimeline";
import { FollowingTimeline } from "../Timelines/FollowingTimeline";
import { HomeTimeline } from "../Timelines/HomeTimeline";
import { ListTimeline, ListTimelineUrlData } from "../Timelines/ListTimeline";
import { PostsTimeline } from "../Timelines/ProfileTimelines/PostsTimeline";
import { MediaTimeline } from "../Timelines/ProfileTimelines/MediaTimeline";
import { RepliesTimeline } from "../Timelines/ProfileTimelines/RepliesTimeline";

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
      let timelineData: TimelineData & Omit<TimelineFetchData, 'type'> = {
        count: 20,
        ...data
      }
      if('type' in timelineData) delete timelineData.type
      existing = new Timelines[data.type](this.client, timelineData as any) // 😭
      let {
        tweets,
        rawData
      } = await existing.fetch()

      existing.setCursors(rawData as any)
      
      
      this.cache.push(existing)
      console.log('created timeline')
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
  replies: RepliesTimeline
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

type TimelineFetchData = TimelineListFetchData | TimelineHomeFetchData | TimelineFollowingFetchData | ProfileTimelineFetchData

