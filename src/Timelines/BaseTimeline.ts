import EventEmitter from 'events'
import { Tweet, TweetEntryTypes } from '../Tweet'
import { Client } from '../Client'
import { BaseTimelineUrlData, RawTimelineResponseData, TimelineTweetReturnData, TimelineType } from './BaseTweetBasedTimeline'
import { Queries } from '../Routes'
import { TimelineNotificationReturnData } from './NotificationTimeline'

export interface TimelineEvents<T extends TweetEntryTypes> {
  timelineUpdate: [ Tweet<T>[] ]
}

export type TimelineReturnData = TimelineTweetReturnData | TimelineNotificationReturnData

export abstract class BaseTimeline<T extends TweetEntryTypes, U extends TimelineReturnData> extends EventEmitter<TimelineEvents<T>> {
  cursors: {
    top: string
    bottom: string
  } = {} as any
  abstract variables: BaseTimelineUrlData['variables'] | any
  protected query: typeof Queries.timelines[typeof this.type]
  
  constructor(public client: Client, public type: TimelineType) {
    super()
    this.query = Queries.timelines[this.type]
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

  resetVariables() {
    this.variables.cursor = undefined;
    this.variables.count = 20;
  }

  abstract fetch(): Promise<any>

  abstract stream(...args: any[]): Promise<void>
  
  /**
   * Fetches the latest tweets from the timeline
   */
  abstract fetchLatest(): Promise<U>

  /**
   * Fetches older tweets from the timeline
   * 
   * Returns `Promise<false>` if no more tweets are available
   */
  abstract scroll(): Promise<U | false>

  abstract setCursors(rawTimelineData: RawTimelineResponseData): void

}