import { Client } from "../../Client";
import { TweetManager } from "../../Managers";
import { Profile } from "../../Profile";
import { Queries } from "../../Routes";
import { RawTweetData, Tweet, TweetTypes } from "../../Tweet";
import {
  BaseTimeline,
  BaseTimelineUrlData,
  BottomCursorData,
  Cursor,
  RawTimelineResponseData,
  TimelineTweetEntryData,
  TopCursorData,
} from "../BaseTimeline";
import fs from "fs";

export interface PostsTimelineData {
  username: string;
  count?: number;
}

export class PostsTimeline extends BaseTimeline<RawTweetData> {
  // variables: ProfileTimelineUrlData['variables']
  // features: ProfileTimelineUrlData['features']
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

  get url() {
    return `https://twitter.com/i/api/graphql/V7H0Ap3_Hh2FyS75OCDO3Q/UserTweets?${this.urlDataString}`;
  }

  get urlDataString() {
    return `variables=${this.variables.URIEncoded()}&features=${this.features.URIEncoded()}`;
  }


  // get features(): PostsTimelineUrlData['features'] {
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
    let entries = ((rawData as RawPostsTimelineResponseData).data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as TopCursorData).content.value;
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
    let entries = ((rawData as RawPostsTimelineResponseData).data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)!.entries;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
    this.resetData();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  fetch() {
    return new Promise<{
      tweets: Tweet<TweetTypes>[];
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
    return new Promise<Tweet<RawTweetData>[]>((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      if (this.client.debug)
        fs.writeFileSync(
          `${__dirname}/../../../debug/debug-home.json`,
          JSON.stringify(data, null, 2)
        );
      let t = this.tweets.addTweets(
        ((data.data.user.result.timeline_v2.timeline.instructions.find(
          (i) => i.type == "TimelineAddEntries"
        ) as TimelineAddEntries)!.entries as RawTweetData[]) || []
      );
      // console.log(t)
      resolve(t);
    });
  }

  setCursors(rawTimelineData: RawPostsTimelineResponseData): void {
    let entries = (rawTimelineData.data.user.result.timeline_v2.timeline.instructions.find(
      (i) => i.type == "TimelineAddEntries"
    ) as TimelineAddEntries)!.entries;
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
              | TimelineAddEntries
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

interface TimelineClearCache {
  type: "TimelineClearCache";
}

interface TimelinePinEntry {
  type: "TimelinePinEntry";
  entry: TimelineTweetEntryData;
}

interface TimelineAddEntries {
  type: "TimelineAddEntries";
  entries: TimelineTweetEntryData;
}

interface TimelineShowAlert {
  type: "TimelineShowAlert";
  alertType: "NewTweets";
  triggerDelayMs: number;
  displayDurationMs: number;
  userResults: {
    // Marked as optional
    result: {
      _typename: "User";
      id: string;
      rest_id: string;
      affiliates_highlighted_label: any;
      has_graduated_access: boolean;
      is_blue_verified: boolean;
      profile_image_shape: string;
      legacy: any;
      professional: any;
    };
  }[];
}
