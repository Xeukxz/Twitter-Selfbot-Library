import EventEmitter from 'events'
import { Tweet, TweetEntryTypes } from '../Tweet'
import { Client } from '../Client'
import { BaseTimelineUrlData, BottomCursorData, Cursor, CursorData, CursorItemData, RawTimelineResponseData, TimelineAddEntries, TimelineEntryData, TimelineTweetReturnData, TimelineType, TopCursorData } from './BaseTweetBasedTimeline'
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

  extractCursorEntries(entries: TimelineAddEntries<T> | TimelineEntryData<T>, cursorType: 'bottom'): BottomCursorData | undefined;
  extractCursorEntries(entries: TimelineAddEntries<T> | TimelineEntryData<T>, cursorType: 'top'): TopCursorData | undefined;
  extractCursorEntries(entries: TimelineAddEntries<T> | TimelineEntryData<T>, cursorType: 'bottom' | 'top'): BottomCursorData | TopCursorData | undefined {
    // console.trace(entries);
    if("type" in entries) entries = (entries as TimelineAddEntries<T>).entries;
    // console.trace(entries);
    // console.log(typeof entries);
    return cursorType === 'bottom'
      ? (
          (entries.find((e) => (e as BottomCursorData).entryId?.startsWith("cursor-bottom"))) ||
          (entries.find((e) => (e as BottomCursorData).entryId?.startsWith("cursor-showmorethreads-")))
        ) as BottomCursorData | undefined
      : entries.find((e) => (e as TopCursorData).entryId?.startsWith("cursor-top")) as TopCursorData | undefined
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
  abstract fetchLater(): Promise<U | false>

  abstract getEntriesFromData(rawTimelineData: RawTimelineResponseData): TimelineAddEntries<T>

  setCursors(rawTimelineData: RawTimelineResponseData, specificType?: 'bottom' | 'top') {
    let entries = this.getEntriesFromData(rawTimelineData).entries;
    if(specificType === 'bottom' || !specificType) {
      let bottomCursor = this.extractCursorEntries(entries, 'bottom');
      if(bottomCursor) this.cursors.bottom = this.extractCursorValue(bottomCursor) || this.cursors.bottom;
    }
    if(specificType === 'top' || !specificType) {
      let topCursor = entries.find(e => (e as TopCursorData).entryId?.startsWith("cursor-top")) as TopCursorData;
      if(topCursor) this.cursors.top = this.extractCursorValue(topCursor) || this.cursors.top;
    }
  }

  extractCursorContentData(cursor?: Cursor) {
    return (cursor as CursorData)?.content || (cursor as CursorItemData)?.content?.itemContent;
  }
  extractCursorValue(cursor?: Cursor): string | undefined {
    return this.extractCursorContentData(cursor)?.value;
  }

}