import { RawTweetEntryData, Tweet } from "../Tweet";
import { Client } from "../Client";
import { BaseTweetBasedTimeline, BaseTimelineUrlData, BottomCursorData, Cursor, TimelineAddEntries, TimelineEntryData, TopCursorData } from "./BaseTweetBasedTimeline";
import fs from 'fs';
import { Queries } from "../Routes";
import { TimelineTweetManager } from "../Managers";

export interface ListTimelineData {
  id: string
  count?: number
}


export class ListTimeline extends BaseTweetBasedTimeline<RawTweetEntryData> {
  cache: RawListTimelineResponseData[] = []
  id: string

  variables: ListTimelineUrlData['variables'] = {
    listId: undefined as any,
    ...super._variables
  }
  constructor(client: Client, data: ListTimelineData) {
    super(client, "list")
    this.id = data.id
    this.variables.listId = data.id
  }

  getEntriesFromData(rawTimelineData: RawListTimelineResponseData): TimelineAddEntries<RawTweetEntryData> {
    return rawTimelineData.data.list.tweets_timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>;
  }
}

export interface ListTimelineUrlData extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    listId: string
  };
  features: BaseTimelineUrlData["features"]
}

export interface RawListTimelineResponseData {
  data: {
    list: {
      tweets_timeline: {
        timeline: {
          id: string
          instructions: [TimelineAddEntries<RawTweetEntryData>]
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
