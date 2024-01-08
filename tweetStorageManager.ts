import fs from 'fs'
import { Tweet } from './src/Tweet'

export class TweetStorageManager {
  cache: StorageCache[][] = [[],[]] // [0] = cache, [1] = new tweets
  cacheWritten = false

  constructor({
    storeCache = true // put this here before i knew how i was going to implement it, huilen dus
  }: {
    storeCache: boolean
  }) {
    if (storeCache) {
      this.writeCache(this.readStorage())
      console.log('Cache loaded. Storage Ready.')
    }
  }

  readStorage() {
    return fs.readFileSync('./tweetData.csv', 'utf-8')
  }

  writeStorage(data: StorageCache[]) {
    let csv = ''
    data.forEach((tweet) => {
      csv += `"${tweet.username}","${tweet.userID}","${tweet.tweetID}","${tweet.text}","[${tweet.media.join(', ')}]"\n`
    })
    fs.appendFileSync('./tweetData.csv', csv)
    this.margeCache()
  }

  margeCache() {
    this.cache[0] = this.cache[0].concat(this.cache[1])
    console.log(`Merged cache of ${this.cache[1].length} with ${this.cache[0].length} total entries.`)
    this.cache[1] = []
  }

  writeCache(rawData: string) {
    let tweets = rawData.split('\n')
    tweets.forEach((tweet) => {
      if(tweet === '') return console.log('Empty entry')
      let tweetData = tweet.split('","')
      // console.log(tweetData)
      this.cache[0].push({
        username: tweetData[0].replace(`"`, ''),
        userID: tweetData[1],
        tweetID: tweetData[2],
        text: tweetData[3],
        media: tweetData[4].replace(/\[|]|"/g, '').split(', ')
      })
    })
    this.cacheWritten = true
    fs.writeFileSync('./debug.json', JSON.stringify(this.cache, null, 2))
  }


  async addTweets(tweets: Tweet[]) {
    return new Promise<Tweet[]>((resolve, reject) => {
      if (!this.cacheWritten) throw new Error('Unable to store data. Cache not written.')
      let length1 = tweets.length
      tweets = tweets.filter((tweet) => {
        return !this.cache[0].find((cachedTweet) => {
          // if(Math.floor(Math.random() * 100) > 95) console.log(cachedTweet, cachedTweet.tweetID, tweet.id)
          // if(cachedTweet.tweetID === tweet.id) console.log(`Tweet already stored: ${tweet.id}, ${cachedTweet.tweetID}`)
          return cachedTweet.tweetID === tweet.id
        })
      })
      let length2 = length1 - tweets.length
      this.cache[1] = this.cache[1].concat(tweets.map((tweet) => {
        return {
          username: tweet.user.name,
          userID: tweet.user.id,
          tweetID: tweet.id,
          text: tweet.text ? tweet.text.replace(/\n/g, '\\n') : '',
          media: tweet.media? tweet.media.map((media) => media.url) : []
        }
      }))
      this.writeStorage(this.cache[1])
      console.log(`Stored ${length1 - length2} tweets with ${length2} tweets already stored. Total: ${this.cache[0].length} tweets.`)
      resolve(tweets)
    })
  }

  clearCache() {
    this.cache = []
  }
}

interface StorageCache {
  username: string
  userID: string
  tweetID: string
  text: string
  media: string[]
}