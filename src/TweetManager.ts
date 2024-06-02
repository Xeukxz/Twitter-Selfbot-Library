import { RawTweetData, Tweet } from "./Tweet";

export class TweetManager {
  cache: Tweet[] = [];

  constructor() {

  }

  /**
   * Fetch a tweet
   *
   * @param id Tweet ID
   */
  fetch(id: string) {
    let tweet = this.cache.find((tweet) => tweet.id === id);
    if (tweet) return tweet;
    else return null; // TODO: Fetch tweet from API
  }

  addTweets(tweets: RawTweetData[]) {
    this.cache = this.cache.concat(tweets.map((tweet) => {
      if(!tweet.entryId.startsWith('tweet-')){
        console.log(`skipping "${tweet.entryId}"`)
        return null as any;
      } 
      return new Tweet(tweet);
    })).filter((tweet) => tweet !== null).filter((tweet) => !tweet.unavailable);
    return this.cache;
  }

}
