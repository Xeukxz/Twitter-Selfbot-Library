import { BaseTimeline, RawTimelineResponseData, TimelineTerminateTimeline } from "./BaseTimeline";
import { RawConversationThreadEntryData, RawTweetEntryData, Tweet, TweetEntryTypes } from '../Tweet';
import { Client } from "../Client";

export interface tweetRepliesTimelineData {
  tweetId: string;
}

export class TweetRepliesTimeline extends BaseTimeline<RawConversationThreadEntryData | RawTweetEntryData> {
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
      console.log(data.tweet)
      this.variables.focalTweetId = data.tweet.id;
      this.tweet = data.tweet
    } else {
      this.variables.focalTweetId = data.tweetId;
    }
  }

  async fetchLatest() {
    return await this.scroll();
  }

  async scroll() {
    this.variables.cursor = this.cursors.bottom;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawTweetRepliesTimelineResponseData).data.threaded_conversation_with_injections_v2.instructions.find(i => i.type == "TimelineAddEntries") as RawTweetRepliesTimelineAddEntries)!.entries;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as TweetRepliesBottomCursorData).content.itemContent.value;
    this.variables.referrer = "tweet"; // should be set after the first fetch
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  buildTweetsFromCache(data: RawTweetRepliesTimelineResponseData) {
    return new Promise<Tweet<RawConversationThreadEntryData | RawTweetEntryData>[]>((resolve, reject) => {
      let instructions = data.data.threaded_conversation_with_injections_v2.instructions;
      let entries = (instructions.find(i => i.type == "TimelineAddEntries") as RawTweetRepliesTimelineAddEntries)!.entries;
      let tweets = entries.filter(e => e.entryId.startsWith("tweet-")) as RawTweetEntryData[];
      let replies = entries.filter(e => e.entryId.startsWith("conversationthread-")) as RawConversationThreadEntryData[];

      let originalTweetEntry = tweets.find(t => t.entryId == "tweet-" + this.variables.focalTweetId);
      if(originalTweetEntry) {
        console.log('Original Tweet Entry:', originalTweetEntry)
        if(!this.tweet) this.tweet = new Tweet(this.client);
        this.tweet.buildTweet(Tweet.ParseEntryToData(originalTweetEntry), originalTweetEntry);
      }

      let parsedTweets = this.tweets.addTweets([ ...(originalTweetEntry ? [originalTweetEntry] : []), ...tweets, ...replies])

      resolve(parsedTweets);
    });
  }

  setCursors(rawTimelineData: RawTimelineResponseData): void {
    let instructions = (rawTimelineData as RawTweetRepliesTimelineResponseData).data.threaded_conversation_with_injections_v2.instructions;
    let entries = (instructions.find(i => i.type == "TimelineAddEntries") as RawTweetRepliesTimelineAddEntries)!.entries;
    this.cursors.bottom = (entries.find(e => (e as TweetRepliesBottomCursorData).entryId?.startsWith("cursor-bottom")) as TweetRepliesBottomCursorData).content.itemContent.value;
  }
}

export interface RawTweetRepliesTimelineResponseData {
  data: {
    threaded_conversation_with_injections_v2: {
      instructions: [
        RawTweetRepliesTimelineAddEntries,
        TimelineTerminateTimeline
      ]
    }
  }
}

export interface RawTweetRepliesTimelineAddEntries {
  type: "TimelineAddEntries",
  entries: [
    ...([RawTweetEntryData] | [RawTweetEntryData, RawTweetEntryData]) | [],
    ...RawConversationThreadEntryData[],
    TweetRepliesBottomCursorData
  ]
}

export interface TweetRepliesBottomCursorData {
  entryId: string,
  sortIndex: string,
  content: {
    entryType: string,
    __typename: string,
    itemContent: {
      itemType: "TimelineTimelineCursor",
      __typename: "TimelineTimelineCursor",
      value: string,
      cursorType: "Bottom",
    }
  }
}