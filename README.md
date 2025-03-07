# Twitter-Selfbot-Library
### A Typescript library for automating a Twitter/X user account

## Info
**This library uses:**
- `Puppeteer` - To scrape account cookies and token data
- `Axios` - To handle everything else

## Usage
> [!NOTE]
> All code snippets are featured in `./example/example.ts`
### Initialising the client:
**Parameters:**
- `headless` - Boolean (Optional) - Defaults to true.
- `puppeteerSettings` - [PuppeteerLaunchOptions](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.launchoptions.md) (Optional)
```ts
const client = new Client({
  headless: true, // If the puppeteer browser should be visible or not.
  puppeteerSettings: { // Puppeteer launch settings
    // args: ['--no-sandbox', '--disable-setuid-sandbox'], // for some linux environments (see https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#setting-up-chrome-linux-sandbox)
  },
})
```
When initialising the `Client` class for the first time, its creates an `accountData.json` file in the library's root directory.

If there is no data in the file, it will open a browser window with headless set to false, regardless of the client parameters so that you can log in.

Once you are logged into the account on the puppeteer browser, the account data will be written to `accountData.json` and the browser will not be used any further and will be closed.

### Initialising Timelines:
Once the client emits the `ready` event, you can then create new timeline instances.
```ts
client.on('ready', async () => {

  // create home timeline instance
  const home = await client.timelines.fetch({
    type: 'home'
  })

  // create following timeline instance
  const following = await client.timelines.fetch({
    type: 'following'
  })

  // create list timeline instance of list id '1239948255787732993'
  const list = await client.timelines.fetch({
    type: 'list',
    id: '1239948255787732993'
  })

  // create posts timeline without a profile
  const elonPosts = await client.timelines.fetch({
    type: 'posts',
    username: 'elonmusk'
  })

  // create profile for elon musk
  const elon = await client.profiles.fetch({
    username: 'elonmusk'
  })
  
  // create replies timeline through profile
  const elonReplies = await elon.timelines.fetch('replies')
  
  // create media timeline through profile
  const elonMedia = await elon.timelines.fetch('media')

  // create tweet and get replies timeline
  const tweet = await client.tweets.fetch("1825723913051000851")
  const tweetReplies = tweet.replies
  
  // create search timeline
  const searchResults = await client.search({
    exactPhrases: ['test'],
  });
})
```
Each timeline is created via `<Client>.timelines.fetch()` which requires an object with a `type` parameter (see below for all available types).  
Some timelines may require additional properties (also listed below)
> [!NOTE]
> Each profile timeline requires a `username` property unless created via `<Profile>.timelines.fetch()`
### The current available timelines are:
- **Base:**
  - `home` - The main "For You" timeline
  - `following` - The "Following" timeline
  - `list` - The timeline of a Twitter list
    - Requires an `id` property
  - `search` - The timeline for a search query
    - You should use `<Client>.search()` for this
- **Tweet:**
  - `tweetReplies` - The replies timeline of a tweet
- **Profile:**
  - `posts` - The posts timeline of a user
  - `replies` - The replies timeline of a user
  - `media` - The media timeline of a user

## Streaming Timelines:

Timelines come equipped with a `stream()` method which should cover the majority of use cases.
> [!NOTE]
> When streaming tweets, any incoming tweets will be emitted in a `timelineUpdate` event unless a callback function is passed as the second argument

The stream method takes in 2 arguments:
1. **An object containing optional parameters:**
     - `minTimeout` - The minimum timeout before checking for new tweets
       - default: 5 minutes
     - `maxTimeout` - The maximum timeout before checking for new tweets
       - default: 10 minutes
     - `catchUp` - Whether to stream earlier tweets before streaming newer ones
       - default: false
     - `minCatchUpTimeout` - The minimum timeout before fetching earlier tweets 
       - default: 5 minutes
     - `maxCatchUpTimeout` - The maximum timeout before fetching earlier tweets
       - default: 10 minutes
     - `maxCatchUpLoops` - The maximum amount of times the catch up will loop before streaming newer tweets
       - default: 1000
     - `emitCache` - Whether or not to emit the current timeline cache when the stream starts
       - default: false (always true if `catchUp` is true)
     - `isCatchUpComplete` - a callback function to determine if the catch up is complete, useful for comparing tweets to those already stored in a database

2. **An optional callback function to handle incoming tweets**
     - If this is set, the `timelineUpdate` event will not be emmited when new tweets are fetched
```ts
<Timeline>.stream({
    minTimeout: 1*60*1000, // 1 minute
    maxTimeout: 2*60*1000, // 2 minutes
    catchUp: true,
    minCatchUpTimeout: 10*1000, // 10 seconds
    maxCatchUpTimeout: 20*1000, // 20 seconds
    maxCatchUpLoops: 5
  })
```

```ts
import { PostsTimeline } from '../src'
// create profile for elon musk
const elon = await client.profiles.fetch({
  username: 'elonmusk'
})

// get elon musk's posts timeline
const elonPosts = await elon.timelines.fetch('posts') as PostsTimeline

// listen for tweets
elonPosts.on('timelineUpdate', async (tweets: Tweet<RawTweetData>[]) => {
  console.log(tweets.map(t => t.text).join('\n'))
})

// stream tweets
elonPosts.stream()
```
Streams can be stopped with `<Timeline>.endStream()`

If you would like to implement your own streaming functionality you can use the following timeline methods:
- `.fetchLatest()` - fetches the latest tweets
- `.scroll()` - fetches earlier tweets

Each method returns the following structure:
  
  ```ts
  {
    tweets: Tweet<TweetTypes>[], // an array of tweets
    rawData: RawTimelineResponseData // the raw data sent by the twitter user api
  }
  ```

## Extra tools

Once a timeline is initialised via `timelines.fetch()`, it emits a `timelineCreate` event. The same goes for profiles.
```ts
import { Timeline, Profile } from "../src";

client.on('timelineCreate', async (timeline: Timeline) => {
  console.log('Timeline Created:', timeline.type) // 'home' | 'following' | 'list' | 'posts' | 'media' | 'replies' | 'tweetReplies' | 'search'
  console.log(timeline.tweets.cache.length, 'tweets cached')
})

client.on('profileCreate', async (profile: Profile) => {
  console.log('Profile Created:', profile.username)
})
```

## Examples:
An example can be found in the `./example` directory.
