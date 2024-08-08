import { Client } from "../Client";
import { RawTweetRepliesTimelineAddEntries, RawTweetRepliesTimelineResponseData } from "../Timelines/TweetRepliesTimeline";
import { RawTweetEntryData, Tweet, TweetEntryTypes } from "../Tweet";

export class TimelineTweetManager<TweetData extends TweetEntryTypes>  {
  client: Client
  cache: Tweet<TweetData>[] = [];
  
  constructor(client: Client) {
    this.client = client;
    this.client.tweets.addManager(this);
  }

  /**
   * Fetch a tweet
   *
   * @param id Tweet ID
   */
  fetch(id: string) {
    let tweet = this.get(id) ?? new Promise<Tweet>(async (resolve, reject) => {
      resolve(await this.client.tweets.fetch(id));
    });
    if (tweet) return tweet;
  }

  get(id: string) {
    return this.cache.find((tweet) => tweet.id === id);
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