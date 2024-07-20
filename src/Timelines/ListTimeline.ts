import { RawTweetData, Tweet } from "../Tweet";
import { Client } from "../Client";
import { BaseTimeline, BaseTimelineUrlData, BottomCursorData, Cursor, TimelineTweetEntryData, TopCursorData } from "./BaseTimeline";
import fs from 'fs';
import { Queries } from "../Routes";
import { TweetManager } from "../Managers";

export interface ListTimelineData {
  id: string
  count?: number
}


export class ListTimeline extends BaseTimeline<RawTweetData> {
  // variables: ListTimelineUrlData['variables']
  // features: ListTimelineUrlData['features']
  cache: RawListTimelineResponseData[] = []
  // listData: {
  //   id: string
  //   name: string
  //   description: string
  // }
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

  get url() {
    return `https://twitter.com/i/api/graphql/F9aW7tjdTWE9m5qHqzEpUA/ListLatestTweetsTimeline?${this.urlDataString}`
  }

  // get features(): ListTimelineUrlData['features'] {
  //   return {
  //     ...super.features
  //   }
  // }

  /**
   * Fetches the latest tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async fetchLatest() {
    this.variables.cursor = this.cursors.top;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawListTimelineResponseData).data.list.tweets_timeline.timeline.instructions[0].entries as TimelineTweetEntryData);
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.resetData();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  /**
   * Fetches older tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async scroll() {
    this.variables.cursor = this.cursors.bottom;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawListTimelineResponseData).data.list.tweets_timeline.timeline.instructions[0].entries as TimelineTweetEntryData);
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
    this.resetData();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  buildTweetsFromCache(data: RawListTimelineResponseData) {
    return new Promise<Tweet<RawTweetData>[]>((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-list.json`, JSON.stringify(data, null, 2))
      let t = this.tweets.addTweets(data.data.list.tweets_timeline.timeline.instructions[0].entries as RawTweetData[])
      // console.log(t)
      resolve(t)
    })
  }

  setCursors(rawTimelineData: RawListTimelineResponseData): void {
    let entries = (rawTimelineData.data.list.tweets_timeline.timeline.instructions[0].entries as TimelineTweetEntryData);
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
          instructions: [{
            type: "TimelineAddEntries";
            entries: TimelineTweetEntryData;
          }]
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
