import { Client } from "../Client";
import { Tweet, TweetEntryTypes } from "../Tweet";
import { TimelineTweetManager } from "./TimelineTweetManager";

export class GlobalTweetManager {
  client: Client;
  cache: TimelineTweetManager<TweetEntryTypes>[] = [];
  constructor(client: Client) {
    this.client = client;
  }

  async fetch(tweetId: string) {
    let tweet = this.get(tweetId)
    if (tweet) return tweet;

    tweet = new Tweet(this.client);
    tweet.id = tweetId;
    await tweet.fetch();
    return tweet;
  }

  get(tweetId: string) {
    let tweetManager = this.cache.find((manager) => manager.get(tweetId));
    if (tweetManager) return tweetManager.get(tweetId);
  }

  addManager(manager: TimelineTweetManager<TweetEntryTypes>) {
    this.cache.push(manager);
  }
}