# Twitter-Selfbot-Library
### A Typescript library for automating a Twitter/X user account

## Info
**This library uses:**
- `Puppeteer` - To scrape account cookies and token data
- `Axios` - To handle everything else

## Usage
### Initialising the client:
**Parameters:**
- `headless` - Boolean (Optional) :: Defaults to true.
- `keepPageOpen` - Boolean (Optional) :: Defaults to false.
```ts
const client = new Client({
  headless: true, // If the puppeteer browser should be visible or not.
  keepPageOpen: true, // If the browser should remain open after gathering the account data.
})
```
When initialising the `Client` class for the first time, its creates an `accountData.json` file in the library's root directory.

If there is no data in the file, it will open a browser window with headless set to false, regardless of the client parameters so that you can log in.

Once you are logged into the account on the puppeteer browser, the account data will be written to `accountData.json` and the browser will not be used any further and will be closed unless the `keepPageOpen` parameter was set to true.

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

})
```
### The current available timelines are:
- **Base:**
  - `home` - The main "For You" timeline
  - `following` - The "Following" timeline
  - `list` - The timeline of a Twitter list
    - Requires an `id` property
- **Profile:**
  - `posts` - The posts timeline of a user
  - `replies` - The replies timeline
  - `media` - The media timeline of a user

  **Note**: Each profile timeline requires a `username` property unless created via `<Profile>.timelines.fetch()`

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
     - `catchUp` - Whether stream earlier tweets before streaming newer ones
       - default: false
     - `minCatchUpTimeout` - The minimum timeout before fetching earlier tweets 
       - default: 5 minutes
     - `maxCatchUpTimeout` - The maximum timeout before fetching earlier tweets
       - default: 10 minutes
     - `maxCatchUpLoops` - The maximum amount of times the catch up will loop before streaming newer tweets
       - default: 1000
     - `isCatchUpComplete` - a callback function to determine if the catch up is complete, useful for comparing tweets to those already stored in a database

2. **An optional callback function to handle incoming tweets**
     - If this is set, the timelineUpdate event will not be emmited when 
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
import { PostsTimeline } from './src'
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

### Extra tools

Once a timeline is initialised via `timelines.fetch()`, it emits a `timelineCreate` event. The same goes for profiles.
```ts
import { Timeline, Profile } from "./src";

client.on('timelineCreate', async (timeline: Timeline) => {
  console.log('Timeline Created:', timeline.type) // 'list' || 'home' || 'following' || 'posts' || 'replies' || 'media'
  console.log(timeline.tweets.cache.length, 'tweets cached')
})

client.on('profileCreate', async (profile: Profile) => {
  console.log('Profile Created:', profile.username)
})
```

### Examples:
An example can be found in the `./example` directory.
