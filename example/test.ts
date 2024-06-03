import { Client, Timeline } from "../src";
import { TweetStorageManager } from "./tweetStorageManager";
import fs from 'fs'

const client = new Client({
  headless: true,
  keepPageOpen: false
})
const database = new TweetStorageManager({
  client,
  storeCache: true
})



client.on('ready', () => {

  // create home timeline instance
  client.timelines.new({
    type: 'home'
  })

  // create following timeline instance
  client.timelines.new({
    type: 'following'
  })
  
  // create list timeline instance of list id 1646820147812790273
  client.timelines.new({
    type: 'list',
    id: '1239948255787732993'
  })

})

client.on('timelineCreate', async (timeline: Timeline) => {
  console.log('Timeline Created:', timeline.type)
  // console.log(timeline.tweets)
  console.log(timeline.tweets.cache.length, 'tweets cached')
  database.addTweets(timeline.tweets.cache)
  manageTimeline(timeline)
  // console.log(timeline)
})

async function manageTimeline(timeline: Timeline) {
  console.log('Initiating timeline:', timeline.type)
  // process.stdout.write(`\r`)
  
  let catchUpTimeline = await catchUp(timeline, {immediate: true})

  console.log('Catching up complete.')

  let streamTimeline = await streamTweets(timeline)


}

async function catchUp(timeline: Timeline, extra?:{immediate: boolean}): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    console.log('Catching up...', timeline.type)
    let randomTime = extra?.immediate ? 0 : 1*10*1000 + Math.floor(Math.random() * 1000 * 10 * 1)
    if(!extra?.immediate) console.log('Next scroll in', randomTime / 1000, 'seconds //', timeline.type)
    await setTimeout(async () => {
      console.log('Scrolling timeline to collect later tweets...')
      await timeline.scroll().then(async (data) => {

        console.log(timeline.tweets.cache.length, 'tweets cached')
        
        let storedTweets = await database.addTweets(timeline.tweets.cache)
        
        // console.log(storedTweets.length)
        if(storedTweets.length == 0) {
          console.log('Caught up.', timeline.type)
          return resolve(true)
        }

        if(client.debug) fs.writeFileSync(`${__dirname}/../debug/debug.json`, JSON.stringify(timeline.tweets.cache.filter((v,i) => i > timeline.tweets.cache.length - storedTweets.length), null, 2))
        // console.log(data)
        resolve(await catchUp(timeline))
      })
    }, randomTime)
  })
}

async function streamTweets(timeline: Timeline) {
  console.log('Streaming...', timeline.type)
  let randomTime = 5*60*1000 + Math.floor(Math.random() * 1000 * 60 * 1)
  console.log('Next refresh in', randomTime / 1000, 'seconds //', timeline.type)
  
  setTimeout(async () => {
    console.log('Fetching latest...', timeline.type)
    await timeline.fetchLatest().then(async (data) => {
      console.log(timeline.tweets.cache.length, 'tweets cached')
      
      let storedTweets = await database.addTweets(timeline.tweets.cache)
      if(client.debug) fs.writeFileSync(`${__dirname}/../debug/debug.json`, JSON.stringify(timeline.tweets.cache.filter((v,i) => i > timeline.tweets.cache.length - storedTweets.length), null, 2))
      // console.log(data)
      streamTweets(timeline)
    })
  }, randomTime);
}