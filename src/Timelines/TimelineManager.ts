import { Client } from "../Client";
import { BaseTimeline, Timeline, TimelineData } from "./BaseTimeline";
import { HomeTimeline } from "./HomeTimeline";
import { ListTimeline } from "./ListTimeline";

// Timeline rules:
// - There cant be any duplicate timelines, 1 home, 1 following, multiple lists but only one of each id
export class TimelineManager {
  client: Client
  timelines: Timeline[] = [];
  constructor(client: Client) {
    this.client = client
  }

  /**
   * Initialize a new timeline
   * 
   */
  new(data: NewTimelineData) {
    let timeline: Timeline | undefined;
    switch (data.type) {
      case 'home':
        timeline = new HomeTimeline(this.client)
        break;
      case 'following':
        break;
      case 'list':
        timeline = new ListTimeline(this.client, {
          id: data.id
        })
        
        break;
    }
    if(!timeline) /* return console.log('no timeline') */ throw new Error(`Timeline was not defined. ${data.type}`)
    this.timelines.push(timeline)
  }

  fetch(data: TimelineFetchData) {
    switch (data.type) {
      case 'home':
        break;
      case 'following':
        break;
      case 'list':
        this.timelines.find(timeline => timeline.listdata?.variables.id === data.id)
        break;
    }
  }
}

interface NewListTimelineData {
  type: 'list'
  id: string
}

interface NewHomeTimelineData {
  type: 'home'
}

interface NewFollowingTimelineData {
  type: 'following'
}

type NewTimelineData = NewListTimelineData | NewHomeTimelineData | NewFollowingTimelineData

interface TimelineBaseFetchData {
  type: 'list' | 'home' | 'following'
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

type TimelineFetchData = TimelineListFetchData | TimelineHomeFetchData | TimelineFollowingFetchData