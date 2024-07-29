import { Client } from "../Client";
import { Tweet, TweetEntryTypes } from "../Tweet";

export class TweetManager<TweetData extends TweetEntryTypes>  {
  client: Client
  cache: Tweet<TweetData>[] = [];
  
  constructor(client: Client) {
    this.client = client;

  }

  /**
   * Fetch a tweet
   *
   * @param id Tweet ID
   */
  async fetch(id: string) {
    let tweet = this.cache.find((tweet) => tweet.id === id);
    if (tweet) return tweet;

    // let newTweet: Tweet<RawTweetEntryData> | undefined = new Tweet<RawTweetEntryData>(this.client);
    // newTweet.id = id;
    // let data = await newTweet.fetch()
    // if (data) {
    //   let entry = data.tweets.find(tweet => tweet.id == id);
    // } else {
    //   newTweet = undefined;
    // }
    // return newTweet;
  }

  addTweets(tweets: TweetData[]) {
    console.log(`${tweets.filter(tweet => !['tweet-', 'profile-grid-', 'profile-conversation-', 'conversationthread-'].some(str => tweet.entryId.startsWith(str))).map(tweet => `Skipping ${tweet.entryId}`).join('\n')}`)
    tweets = tweets.filter(tweet => ['tweet-', 'profile-grid-', 'profile-conversation-', 'conversationthread-'].some(str => tweet.entryId.startsWith(str)));
    let newTweets = tweets.filter(tweet => !this.cache.some(cachedTweet => {
      return cachedTweet.id == Tweet.ParseEntryToData(tweet).rest_id
    })
      
    )
    .map(tweet => new Tweet<TweetData>(this.client, tweet))
    console.log(`Adding ${newTweets.length} new tweets`)
    this.cache = this.cache.concat(newTweets).filter((tweet) => !tweet.unavailable);
    console.log(`Total tweets: ${this.cache.length}`)
    return newTweets;
  }

}