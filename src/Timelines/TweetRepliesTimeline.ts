import { BaseTweetBasedTimeline, BottomCursorData, RawTimelineResponseData, TimelineAddEntries, TimelineTerminateTimeline } from "./BaseTweetBasedTimeline";
import { RawConversationThreadEntryData, RawTweetEntryData, Tweet, TweetEntryTypes } from '../Tweet';
import { Client } from "../Client";
import fs from 'fs';

export interface tweetRepliesTimelineData {
  tweetId: string;
}

type EntriesItem = RawConversationThreadEntryData | RawTweetEntryData

export class TweetRepliesTimeline extends BaseTweetBasedTimeline<EntriesItem> {
  cache: RawTweetRepliesTimelineResponseData[] = [];
  tweet?: Tweet<RawTweetEntryData>;
  variables = {
    focalTweetId: undefined as any as string,
    cursor: undefined as any as string,
    referrer: undefined as any as string,
    with_rux_injections: false ,
    rankingMode: "Relevance",
    includePromotedContent: true,
    withCommunity: true,
    withQuickPromoteEligibilityTweetFields: true,
    withBirdwatchNotes: true,
    withVoice: true,
    URIEncoded: function() {
      return encodeURIComponent(JSON.stringify(this));
    }
  }
  constructor(client: Client, data: {
    tweet: Tweet<RawTweetEntryData>
  } | {
    tweetId: string
  }) {
    super(client, "tweetReplies");
    if("tweet" in data) {
      this.variables.focalTweetId = data.tweet.id;
      this.tweet = data.tweet
    } else {
      this.variables.focalTweetId = data.tweetId;
    }
  }

  async fetchLatest() {
    return await this.fetchLater();
  }

  async fetchLater() {
    const returnData = await super.fetchLater();
    this.variables.referrer = "tweet"; // should be set after the first fetch
    return returnData;
  }

  buildTweets(data: RawTweetRepliesTimelineResponseData) {
    return new Promise<Tweet<RawConversationThreadEntryData | RawTweetEntryData>[]>((resolve, reject) => {
      if (this.client.debug)
        fs.writeFileSync(
          `${__dirname}/../../debug/debug-tweetReplies.json`,
          JSON.stringify(data, null, 2)
        );
      let instructions = data.data.threaded_conversation_with_injections_v2.instructions;
      let entries = (instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<EntriesItem>)!.entries;
      let tweets = entries.filter(e => e.entryId.startsWith("tweet-")) as RawTweetEntryData[];
      let replies = entries.filter(e => e.entryId.startsWith("conversationthread-")) as RawConversationThreadEntryData[];

      let originalTweetEntry = tweets.find(t => t.entryId == "tweet-" + this.variables.focalTweetId);
      if(originalTweetEntry) {
        if(!this.tweet) this.tweet = new Tweet(this.client);
        this.tweet.buildTweet(Tweet.ParseEntryToData(originalTweetEntry), originalTweetEntry);
      }

      let parsedTweets = this.tweets.addTweets([ ...(originalTweetEntry ? [originalTweetEntry] : []), ...tweets, ...replies])

      resolve(parsedTweets);
    });
  }

  getEntriesFromData(rawTimelineData: RawTimelineResponseData): TimelineAddEntries<EntriesItem> {
    return (rawTimelineData as RawTweetRepliesTimelineResponseData).data.threaded_conversation_with_injections_v2.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<EntriesItem>;
  }
}

export interface RawTweetRepliesTimelineResponseData {
  data: {
    threaded_conversation_with_injections_v2: {
      instructions: [
        TimelineAddEntries<EntriesItem>,
        TimelineTerminateTimeline
      ]
    }
  }
}