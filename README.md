# Twitter-Selfbot-Library
### A Typescript library for automating a Twitter/X user account

## Usage
### Installation:
1. Clone the repository
2. Run `npm install` to install dependencies
3. Add your Twitter auth_token cookie to a `.env` file your project's root directory (`auth_token=...`)
   - To do get your auth_token cookie, log into Twitter, open devtools, and paste `document.cookie.match(/auth_token=\w+/)[0]` into the console, then copy the result into your `.env` file
4. Import `{ Client }` from the root directory

> [!NOTE]
> All code snippets are featured in `./example/example.ts`
### Initialising Timelines:
Once the client emits the `ready` event, you can then create new timeline instances.
```ts
import { Client } from "./Twitter-Selfbot-Library";

const client = new Client()

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
> When streaming tweets, any incoming tweets will be emitted in a `timelineUpdate` event unless a callback function is passed as the second argument (`(tweets: TimelineTweetReturnData) => ...`)

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
import { Tweet } from "./Twitter-Selfbot-Library";

// create profile for elon musk
const elon = await client.profiles.fetch({
  username: 'elonmusk'
})

// get elon musk's posts timeline
const elonPosts = await elon.timelines.fetch('posts')

// listen for tweets
elonPosts.on('timelineUpdate', async (tweets: Tweet[]) => {
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

## Notifications

You can stream notifications using `<Client>.notifications.stream(ms)` and listen for new notifications via the `unreadNotifications` event.

This uses twitter's notifications API to determine which notifications are unread. This means that if you read a notification on twitter it will no longer be considered unread by the library.

If you want to access notifications that have already been read, you can access them via `<Client>.notifications` which has 3 timelines:
- `all` - All notifications
- `mentions` - All mention notifications
- `verified` - All notifications from verified users

Each timeline has a `notifications` array containing the first set of notifications sent by the API. You can use the timeline method `.scroll()` to fetch earlier notifications.

### Example

```ts
client.on('unreadNotifications', async (notifications) => {
  console.log('Unread Notifications:', notifications.length, 'total:', client.notifications.all.notifications.length);
  notifications.forEach(async (notif) => { // log the media in tweets you are mentioned in
    const tweet = notif.tweet
    if(notif.isMention()) console.log(!!tweet.media?.length ? tweet.media : 'no media');
  })
})

// check for new notifications every 10 seconds
client.notifications.stream(10000);
```

## Extra tools

Once a timeline is initialised via `timelines.fetch()`, it emits a `timelineCreate` event. The same goes for profiles.
```ts
import { Timeline, Profile } from "./Twitter-Selfbot-Library";

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
