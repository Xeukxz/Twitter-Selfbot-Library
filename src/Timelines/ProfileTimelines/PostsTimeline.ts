import { Client } from "../../Client";
import { TweetManager } from "../../Managers";
import { Profile } from "../../Profile";
import { Queries } from "../../Routes";
import { RawTweetEntryData, Tweet, TweetEntryTypes } from "../../Tweet";
import {
  BaseTimeline,
  BaseTimelineUrlData,
  BottomCursorData,
  Cursor,
  RawTimelineResponseData,
  TimelineAddEntries,
  TimelineClearCache,
  TimelinePinEntry,
  TimelineShowAlert,
  TimelineTweetEntryData,
  TopCursorData,
} from "../BaseTimeline";
import fs from "fs";

export interface PostsTimelineData {
  username: string;
  count?: number;
}

export class PostsTimeline extends BaseTimeline<RawTweetEntryData> {
  profile!: Profile;
  cache: RawPostsTimelineResponseData[] = [];
  private profileUsername: string;
  variables: PostsTimelineUrlData["variables"] = {
    userId: undefined as any, // set in this.fetch()
    includePromotedContent: true,
    withQuickPromoteEligibilityTweetFields: true,
    withVoice: true,
    withV2Timeline: true,
    ...super._variables,
  }
  constructor(
    client: Client,
    data: PostsTimelineData
  ) {
    super(client, "posts");
    this.profileUsername = data.username;
  }

  /**
   * Fetches the latest tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async fetchLatest() {
    this.variables.cursor = this.cursors.top;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawPostsTimelineResponseData).data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries;
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
    let entries = ((rawData as RawPostsTimelineResponseData).data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries;
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

  async buildTweetsFromCache(data: RawPostsTimelineResponseData) {
    return new Promise<Tweet<RawTweetEntryData>[]>((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      if (this.client.debug)
        fs.writeFileSync(
          `${__dirname}/../../../debug/debug-posts.json`,
          JSON.stringify(data, null, 2)
        );
      let tweets = this.tweets.addTweets(
        ((data.data.user.result.timeline_v2.timeline.instructions.find(
          (i) => i.type == "TimelineAddEntries"
        ) as TimelineAddEntries<RawTweetEntryData>)!.entries as RawTweetEntryData[]) || []
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

  setCursors(rawTimelineData: RawPostsTimelineResponseData): void {
    let entries = (rawTimelineData.data.user.result.timeline_v2.timeline.instructions.find(
      (i) => i.type == "TimelineAddEntries"
    ) as TimelineAddEntries<RawTweetEntryData>)!.entries;
    this.cursors.top = (entries.find((e) => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.cursors.bottom = (entries.find((e) => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
  } 
}

export interface PostsTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    userId: string;
    includePromotedContent: boolean;
    withQuickPromoteEligibilityTweetFields: boolean;
    withVoice: boolean;
    withV2Timeline: boolean;
  };
  features: BaseTimelineUrlData["features"];
}

export interface RawPostsTimelineResponseData {
  data: {
    user: {
      result: {
        timeline_v2: {
          timeline: {
            instructions: (
              | TimelineClearCache
              | TimelinePinEntry
              | TimelineAddEntries<RawTweetEntryData>
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