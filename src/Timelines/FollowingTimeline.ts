import { RawTweetEntryData, Tweet } from "../Tweet";
import { Client } from "../Client";
import { BaseTimeline, BaseTimelineUrlData, BottomCursorData, TimelineAddEntries, TimelineShowAlert, TopCursorData } from "./BaseTimeline";
import fs from 'fs';

export interface FollowingTimelineData {
  count?: number;
}

export class FollowingTimeline extends BaseTimeline<RawTweetEntryData> {
  cache: RawFollowingTimelineResponseData[] = [];
  variables: FollowingTimelineUrlData["variables"] = {
    includePromotedContent: true,
    latestControlAvailable: true,
    withCommunity: false,
    ...super._variables,
  }
  constructor(
    client: Client,
    data?: FollowingTimelineData
  ) {
    super(client, "following");
  }

  async fetchLatest() {
    this.variables.cursor = this.cursors.top;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawFollowingTimelineResponseData).data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries;
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
    let entries = ((rawData as RawFollowingTimelineResponseData).data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
    this.resetVariables();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  buildTweetsFromCache(data: RawFollowingTimelineResponseData) {
    return new Promise<Tweet<RawTweetEntryData>[]>((resolve, reject) => {
      if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-following.json`, JSON.stringify(data, null, 2));
      let tweets = this.tweets.addTweets(
        (data.data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries as RawTweetEntryData[]
      );
      resolve(tweets);
    });
  }

  setCursors(rawTimelineData: RawFollowingTimelineResponseData): void {
    let entries = (rawTimelineData.data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
  
  
  }
}

export interface FollowingTimelineUrlData extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    includePromotedContent: boolean;
    latestControlAvailable: boolean;
    withCommunity: boolean;
  };
  features: BaseTimelineUrlData["features"]
}

export interface RawFollowingTimelineResponseData {
  data: {
    home: {
      home_timeline_urt: {
        instructions: [TimelineAddEntries<RawTweetEntryData>, TimelineShowAlert];
        metadata: {
          scribeConfig: {
            page: string;
          };
        };
      };
    };
  };
}