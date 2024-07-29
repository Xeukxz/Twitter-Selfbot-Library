import { Client } from "../../Client";
import { Profile } from "../../Profile";
import { RawProfileConversationEntryData, RawTweetEntryData, Tweet, TweetEntryTypes } from "../../Tweet";
import {
  BaseTimeline,
  BaseTimelineUrlData,
  BottomCursorData,
  RawTimelineResponseData,
  TimelineAddEntries,
  TimelineClearCache,
  TimelinePinEntry,
  TimelineShowAlert,
  TimelineTweetEntryData,
  TopCursorData,
} from "../BaseTimeline";
import fs from "fs";

export interface RepliesTimelineData {
  username: string;
  count?: number;
}

export class RepliesTimeline extends BaseTimeline<RawTweetEntryData | RawProfileConversationEntryData> {
  // variables: ProfileTimelineUrlData['variables']
  // features: ProfileTimelineUrlData['features']
  profile!: Profile;
  cache: RawRepliesTimelineResponseData[] = [];
  private profileUsername: string;
  variables: RepliesTimelineUrlData["variables"] = {
    userId: undefined as any, // set in this.fetch()
    includePromotedContent: true,
    withCommunity: true,
    withVoice: true,
    withV2Timeline: true,
    ...super._variables,
  }
  constructor(
    client: Client,
    data: RepliesTimelineData
  ) {
    super(client, "replies");
    this.profileUsername = data.username;
  }

  // get features(): RepliesTimelineUrlData['features'] {
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
    let entries = ((rawData as RawRepliesTimelineResponseData).data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData | RawProfileConversationEntryData>)!.entries;
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
    let entries = ((rawData as RawRepliesTimelineResponseData).data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData | RawProfileConversationEntryData>)!.entries;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
    this.resetData();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  fetch() {
    return new Promise<{
      tweets: Tweet<TweetEntryTypes>[];
      rawData: RawTimelineResponseData;
    }>(async (resolve, reject) => {
      this.profile = await this.client.profiles.fetch({
        username: this.profileUsername,
      });
      this.variables.userId = this.profile.userId;

      super.fetch().then(resolve).catch(reject);
    });
  }

  async buildTweetsFromCache(data: RawRepliesTimelineResponseData) {
    return new Promise<Tweet<RawTweetEntryData>[]>((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      if (this.client.debug)
        fs.writeFileSync(
          `${__dirname}/../../../debug/debug-replies.json`,
          JSON.stringify(data, null, 2)
        );
      let tweets = this.tweets.addTweets(
        ((data.data.user.result.timeline_v2.timeline.instructions.find(
          (i) => i.type == "TimelineAddEntries"
        ) as TimelineAddEntries<RawTweetEntryData | RawProfileConversationEntryData>)!.entries as (RawTweetEntryData | RawProfileConversationEntryData)[]) || []
      );
      let pinnedTweet = (data.data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelinePinEntry") as TimelinePinEntry)?.entry as RawTweetEntryData;
      if(pinnedTweet) tweets = [
        ...this.tweets.addTweets([pinnedTweet]),
        ...tweets
      ];
      // console.log(t)
      resolve(tweets);
    });
  }

  setCursors(rawTimelineData: RawRepliesTimelineResponseData): void {
    let entries = (rawTimelineData.data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData | RawProfileConversationEntryData>)!.entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
  }
}

export interface RepliesTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    userId: string;
    includePromotedContent: boolean;
    withCommunity: boolean;
    withVoice: boolean;
    withV2Timeline: boolean;
  };
  features: BaseTimelineUrlData["features"];
}

export interface RawRepliesTimelineResponseData {
  data: {
    user: {
      result: {
        timeline_v2: {
          timeline: {
            instructions: (
              | TimelineClearCache
              | TimelinePinEntry
              | TimelineAddEntries<RawTweetEntryData | RawProfileConversationEntryData>
              | TimelineShowAlert
            )[];
            metadata: {
              scribeConfig: {
                page: string;
              };
            };
          };
        };
      };
    };
  };
}