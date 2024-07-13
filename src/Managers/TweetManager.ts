import { RawGridTweetData, RawProfileConversationTweetData, RawTweetData, Tweet, TweetTypes } from "../Tweet";

export class TweetManager<TweetData extends TweetTypes>  {
  cache: Tweet<TweetData>[] = [];
  
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

  addTweets(tweets: TweetData[]) {
    console.log(`${tweets.filter(tweet => !['tweet-', 'profile-grid-', 'profile-conversation-'].some(str => tweet.entryId.startsWith(str))).map(tweet => `Skipping ${tweet.entryId}`).join('\n')}`)
    tweets = tweets.filter(tweet => ['tweet-', 'profile-grid-', 'profile-conversation-'].some(str => tweet.entryId.startsWith(str)));
    let newTweets = tweets.filter(tweet => !this.cache.some(cachedTweet => cachedTweet.id == 
        ((tweet as RawTweetData).content?.itemContent?.tweet_results?.result?.rest_id) ||
        (tweet as RawGridTweetData).item?.itemContent?.tweet_results?.result?.rest_id ||
        (tweet as RawProfileConversationTweetData).content?.items && (tweet as RawProfileConversationTweetData).content?.items[1].item?.itemContent?.tweet_results?.result?.rest_id
      )
    )
    .map(tweet => new Tweet<TweetData>(tweet))
    console.log(`Adding ${newTweets.length} new tweets`)
    this.cache = this.cache.concat(newTweets).filter((tweet) => !tweet.unavailable);
    console.log(`Total tweets: ${this.cache.length}`)
    return newTweets;
  }

}