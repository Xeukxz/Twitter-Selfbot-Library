import { Client } from "../../Client";
import { Profile } from "../../Profile";
import { RawTweetEntryData, Tweet, TweetEntryTypes } from "../../Tweet";
import {
  BaseTweetBasedTimeline,
  BaseTimelineUrlData,
  BottomCursorData,
  RawTimelineResponseData,
  TimelineAddEntries,
  TimelineClearCache,
  TimelinePinEntry,
  TimelineShowAlert,
  TopCursorData,
} from "../BaseTweetBasedTimeline";
import fs from "fs";

export interface PostsTimelineData {
  username: string;
  count?: number;
}

export class PostsTimeline extends BaseTweetBasedTimeline<RawTweetEntryData> {
  profile!: Profile;
  cache: RawPostsTimelineResponseData[] = [];
  private profileUsername: string;
  variables: PostsTimelineUrlData["variables"] = {
    userId: undefined as any, // set in this.fetch()
    includePromotedContent: true,
    withQuickPromoteEligibilityTweetFields: true,
    withVoice: true,
    ...super._variables,
  }
  constructor(
    client: Client,
    data: PostsTimelineData
  ) {
    super(client, "posts");
    this.profileUsername = data.username;
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

  async buildTweets(data: RawPostsTimelineResponseData) {
    return new Promise<Tweet<RawTweetEntryData>[]>((resolve, reject) => {
      if (this.client.debug)
        fs.writeFileSync(
          `${__dirname}/../../../debug/debug-posts.json`,
          JSON.stringify(data, null, 2)
        );
      let tweets = this.tweets.addTweets(
        this.getEntriesFromData(data).entries || []
      );
      let pinnedTweet = (data.data.user.result.timeline.timeline.instructions.find(i => i.type == "TimelinePinEntry") as TimelinePinEntry)?.entry as RawTweetEntryData;
      if(pinnedTweet) tweets = [
        ...this.tweets.addTweets([pinnedTweet]),
        ...tweets
      ];
      resolve(tweets);
    });
  }

  getEntriesFromData(rawTimelineData: RawPostsTimelineResponseData): TimelineAddEntries<RawTweetEntryData> {
    return rawTimelineData.data.user.result.timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>;
  }
}

export interface PostsTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    userId: string;
    includePromotedContent: boolean;
    withQuickPromoteEligibilityTweetFields: boolean;
    withVoice: boolean;
  };
  features: BaseTimelineUrlData["features"];
}
  
export interface RawPostsTimelineResponseData {
  data: {
    user: {
      result: {
        timeline: {
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