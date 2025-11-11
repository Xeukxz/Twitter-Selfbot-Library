import { Client } from "../Client";
import { TimelineEntryData } from '../Timelines';
import { Tweet, TweetEntryTypes, TweetCardData } from '../Tweet';

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

  addTweets(tweets: TimelineEntryData<TweetData> | TweetData[]) {
    const validEntryNames = ['tweet-', 'profile-grid-', 'profile-conversation-', 'conversationthread-'];
    this.client.log(`${tweets.filter(tweet => !validEntryNames.some(str => tweet.entryId.startsWith(str))).map(tweet => `Skipping ${tweet.entryId}`).join('\n')}`)
    const tweetData = tweets.filter(tweet => validEntryNames.some(str => tweet.entryId.startsWith(str))) as TweetData[];
    let newTweets = tweetData.filter(tweet => !this.cache.some(cachedTweet => {
      return cachedTweet.id == Tweet.ParseEntryToData(tweet)?.rest_id
    })).map(tweet => new Tweet<TweetData>(this.client, tweet))
    this.cache = this.cache.concat(newTweets).filter((tweet) => !tweet.unavailable);
    return newTweets;
  }

}