import { RawTweetData, Tweet } from "./Tweet";

export class TweetManager {
  tweets: Tweet[] = [];

  constructor() {

  }

  /**
   * Fetch a tweet
   *
   * @param id Tweet ID
   */
  fetch(id: string) {
    let tweet = this.tweets.find((tweet) => tweet.id === id);
    if (tweet) return tweet;
    else return null; // TODO: Fetch tweet from API
  }

  addTweets(tweets: RawTweetData[]) {
    this.tweets = this.tweets.concat(tweets.map((tweet) => {
      if(tweet.entryId.startsWith('cursor-') || tweet.entryId.startsWith('sq-cursor-') || tweet.entryId.startsWith('list-conversation') || tweet.entryId.startsWith('home-conversation')) return null as any;
      return new Tweet(tweet);
    })).filter((tweet) => tweet !== null);
    return this.tweets;
  }

}
