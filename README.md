# Twitter-Selfbot-Library
### A Typescript library for automating a Twitter/X user account

## Info
**This library uses:**
- `Puppeteer` - To scrape account cookies and token data
- `Axios` - To handle everything else

## Usage
### Initialise the client:
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
client.on('ready', () => {
  // create home timeline instance
  client.timelines.new({
    type: 'home'
  })

  // create following timeline instance
  client.timelines.new({
    type: 'following'
  })

  // create list timeline instance of list id '1234567890'
  client.timelines.new({
    type: 'list',
    id: '1234567890'
  })
})
```
The current available timelines are:
- `home` - The main "For You" timeline
- `following` - The "Following" timeline
- `list` - The timeline of a Twitter list
  - Requires an `id` property

### Managing Timelines:
Once a timeline is initialised via `client.timelines.new()`, it emits a `timelineCreate` event, This is where you 
```ts
import { Timeline } from "./src";

client.on('timelineCreate', async (timeline: Timeline) => {
  console.log('Timeline Created:', timeline.type) // 'list' || 'home' || 'following'
  console.log(timeline.tweets.cache.length, 'tweets cached')

  // Streaming logic here...

})
```
Timelines have 2 key methods for streaming tweets:
- `Timeline.scroll()` - "Scrolls" the timeline to fetch later tweets
- `Timeline.fetchLatest()` - "Refreshes" the timeline to load the latest tweets. (Doesn't clear history)

Think of them as growing the timeline either up or down.

Keep in mind these will be subjected to twitters rate limits.  
I reccomend fetching in random intervals with 20% - 50% variation between times

### Examples:
A *(hopefully)* working example can be found in the `./example` directory.

This example will stream tweets from the home timeline and a [list dedicated to cats](https://x.com/i/lists/1239948255787732993) and store them in a `tweetData.csv` file formatted as  
> `username`, `userId`, `tweetId`, `"Tweet Text"`, `"[mediaURLs]"`
