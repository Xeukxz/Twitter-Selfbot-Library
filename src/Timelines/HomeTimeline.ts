import { RawTweetData, Tweet, TweetTypes } from "../Tweet";
import { Client, FeaturesGetData } from "../Client";
import { BaseTimeline, BaseTimelineUrlData, TimelineTweetEntryData, NewTimelineData, NewHomeTimelineData, TimelineAddEntries, TimelineShowAlert, Cursor, TopCursorData, BottomCursorData } from "./BaseTimeline";
import fs from 'fs';
import { Queries } from "../Routes";
import { TweetManager } from "../Managers";

export interface HomeTimelineData {
  count?: number;
}

export class HomeTimeline extends BaseTimeline<RawTweetData> {
  // variables: HomeTimelineUrlData["variables"];
  // features: HomeTimelineUrlData["features"];
  cache: RawHomeTimelineResponseData[] = [];
  variables: HomeTimelineUrlData["variables"] = {
    includePromotedContent: true,
    latestControlAvailable: true,
    withCommunity: false,
    ...super._variables,
  }

  constructor(
    client: Client,
    data?: HomeTimelineData
  ) {
    super(client, "home");

  }

  get url() {
    return `${this.getUrl(this.query)}`;
  }


  // get features(): FeaturesGetData<typeof this.query.metadata.featureSwitches> {
  //   return this.client.features.get(this.query.metadata.featureSwitches);
  // }

  // static async new(client: Client) {
  //   const timeline = new this(client);
  //   await timeline.fetch();
  //   return timeline;
  // }

  /**
   * Fetches the latest tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async fetchLatest() {
    this.variables.cursor = this.cursors.top;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawHomeTimelineResponseData).data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries;
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
    let entries = ((rawData as RawHomeTimelineResponseData).data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
    this.resetData();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  buildTweetsFromCache(data: RawHomeTimelineResponseData) {
    return new Promise<Tweet<RawTweetData>[]>((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-home.json`, JSON.stringify(data, null, 2));
      let t = this.tweets.addTweets(
        (data.data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries as RawTweetData[]
      ) as Tweet<RawTweetData>[];
      // console.log(t)
      resolve(t);
    });
  }
}
export interface HomeTimelineUrlData extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    includePromotedContent: boolean;
    latestControlAvailable: boolean;
    withCommunity: boolean;
  };
  features: BaseTimelineUrlData["features"]
}

export interface RawHomeTimelineResponseData {
  data: {
    home: {
      home_timeline_urt: {
        instructions: (TimelineAddEntries | TimelineShowAlert)[];
        responseObjects: {
          key: string;
          value: {
            feedbackType: string;
            prompt: string;
            confirmation: string;
            feedbackUrl: string;
            hasUndoAction: boolean;
          }
        }[]
        metadata: {
          scribeConfig: {
            page: string;
          };
        };
      };
    };
  };
}
