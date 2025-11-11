import { Client } from "../../Client";
import { Profile } from "../../Profile";
import { RawProfileConversationEntryData, RawTweetEntryData, Tweet, TweetEntryTypes } from "../../Tweet";
import {
  BaseTweetBasedTimeline,
  BaseTimelineUrlData,
  BottomCursorData,
  RawTimelineResponseData,
  TimelineAddEntries,
  TimelineClearCache,
  TimelinePinEntry,
  TimelineShowAlert,
  TimelineEntryData,
  TopCursorData,
} from "../BaseTweetBasedTimeline";
import fs from "fs";

export interface RepliesTimelineData {
  username: string;
  count?: number;
}

export class RepliesTimeline extends BaseTweetBasedTimeline<RawTweetEntryData | RawProfileConversationEntryData> {
  profile!: Profile;
  cache: RawRepliesTimelineResponseData[] = [];
  private profileUsername: string;
  variables: RepliesTimelineUrlData["variables"] = {
    userId: undefined as any, // set in this.fetch()
    includePromotedContent: true,
    withCommunity: true,
    withVoice: true,
    ...super._variables,
  }
  constructor(
    client: Client,
    data: RepliesTimelineData
  ) {
    super(client, "replies");
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

  async buildTweets(data: RawRepliesTimelineResponseData) {
    return new Promise<Tweet<RawTweetEntryData>[]>((resolve, reject) => {
      if (this.client.debug)
        fs.writeFileSync(
          `${__dirname}/../../../debug/debug-replies.json`,
          JSON.stringify(data, null, 2)
        );
      let tweets = this.tweets.addTweets(this.getEntriesFromData(data).entries || []);
      let pinnedTweet = (data.data.user.result.timeline.timeline.instructions.find(i => i.type == "TimelinePinEntry") as TimelinePinEntry)?.entry as RawTweetEntryData;
      if(pinnedTweet) tweets = [
        ...this.tweets.addTweets([pinnedTweet]),
        ...tweets
      ];
      resolve(tweets);
    });
  }

  getEntriesFromData(rawTimelineData: RawTimelineResponseData): TimelineAddEntries<RawTweetEntryData | RawProfileConversationEntryData> {
    return (rawTimelineData as RawRepliesTimelineResponseData).data.user.result.timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData | RawProfileConversationEntryData>;
  }
}

export interface RepliesTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    userId: string;
    includePromotedContent: boolean;
    withCommunity: boolean;
    withVoice: boolean;
  };
  features: BaseTimelineUrlData["features"];
}

export interface RawRepliesTimelineResponseData {
  data: {
    user: {
      result: {
        timeline: {
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