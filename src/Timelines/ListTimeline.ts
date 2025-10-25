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

  async fetchLatest() {
    this.variables.cursor = this.cursors.top;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawListTimelineResponseData).data.list.tweets_timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>).entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.resetVariables();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  async scroll() {
    this.variables.cursor = this.cursors.bottom;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawListTimelineResponseData).data.list.tweets_timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>).entries;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
    this.resetVariables();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  buildTweets(data: RawListTimelineResponseData) {
    return new Promise<Tweet<RawTweetEntryData>[]>((resolve, reject) => {
      if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-list.json`, JSON.stringify(data, null, 2))
      let tweets = this.tweets.addTweets(data.data.list.tweets_timeline.timeline.instructions[0].entries as RawTweetEntryData[])
      resolve(tweets)
    })
  }

  setCursors(rawTimelineData: RawListTimelineResponseData): void {
    let entries = (rawTimelineData.data.list.tweets_timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>).entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
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
