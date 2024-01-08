import { Client } from "./src";
import { Timeline } from "./src/Timelines/BaseTimeline";
import { TweetStorageManager } from "./tweetStorageManager";
import fs from 'fs'

let client = new Client({
  headless: "new",
  keepPageOpen: false
})
const database = new TweetStorageManager({
  storeCache: true
})



client.on('ready', () => {

  // create home timeline instance
  client.timelines.new({
    type: 'home'
  })
  
  // create list timeline instance of list id 1646820147812790273
  client.timelines.new({
    type: 'list',
    id: '1646820147812790273'
  })

})

client.on('timelineCreate', async (timeline: Timeline) => {
  console.log('Timeline Created:', timeline.type)
  // console.log(timeline.tweets)
  console.log(timeline.tweets.tweets.length, 'tweets cached')
  database.addTweets(timeline.tweets.tweets)
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

        console.log(timeline.tweets.tweets.length, 'tweets cached')
        
        let storedTweets = await database.addTweets(timeline.tweets.tweets)
        
        // console.log(storedTweets.length)
        if(storedTweets.length == 0) {
          console.log('Caught up.', timeline.type)
          return resolve(true)
        }

        fs.writeFileSync('./debug.json', JSON.stringify(timeline.tweets.tweets.filter((v,i) => i > timeline.tweets.tweets.length - storedTweets.length), null, 2))
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
      console.log(timeline.tweets.tweets.length, 'tweets cached')
      
      let storedTweets = await database.addTweets(timeline.tweets.tweets)
      fs.writeFileSync('./debug.json', JSON.stringify(timeline.tweets.tweets.filter((v,i) => i > timeline.tweets.tweets.length - storedTweets.length), null, 2))
      // console.log(data)
      streamTweets(timeline)
    })
  }, randomTime);
}