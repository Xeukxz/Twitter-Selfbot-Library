import { RawTweetData } from "../Tweet";
import { Client } from "../Client";
import { BaseTimeline, BaseTimelineUrlData, Cursor, TimelineEntryData } from "./BaseTimeline";
import fs from 'fs';

export class ListTimeline extends BaseTimeline {
  // variables: ListTimelineUrlData['variables']
  // features: ListTimelineUrlData['features']
  cache: RawListTimelineData[] = []
  id: string
  constructor(client: Client, data: {
    id: string
    count?: number
  }) {
    super(client)
    this.type = 'list'
    this.id = data.id


    this.fetch()

    console.log(this.cache)

    
  }

  get url() {
    return `https://twitter.com/i/api/graphql/F9aW7tjdTWE9m5qHqzEpUA/ListLatestTweetsTimeline?${this.urlDataString}`
  }

  get variables(): ListTimelineUrlData['variables'] {
    return {
      listId: this.id,
      ...super.variables
    }
  }

  get features(): ListTimelineUrlData['features'] {
    return {
      ...super.features
    }
  }

  /**
   * Fetches the latest tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async fetchLatest() {
    let entries = this.cache[this.cache.length - 1].data.list.tweets_timeline.timeline.instructions[0].entries
    this.variables.cursor = this.cursors.top = (entries[entries.length - 2].content as any).value // cursor-top-\d{19} 
    this.variables.count = 40
    await this.fetch()
    this.resetData()
    return this.cache[this.cache.length - 1]
  }

  /**
   * Fetches older tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async scroll() {
    let entries = this.cache[this.cache.length - 1].data.list.tweets_timeline.timeline.instructions[0].entries
    this.variables.cursor = this.cursors.bottom = (entries[entries.length - 1].content as any).value // cursor-bottom-\d{19}
    this.variables.count = 40
    await this.fetch()
    this.resetData()
    return this.cache[this.cache.length - 1]
  }

  resetData() {
    if(this.variables.cursor) delete this.variables.cursor
    this.variables.count = 20
    
  }

  buildTweetsFromCache(data: RawListTimelineData) {
    return new Promise((resolve, reject) => {
      // console.log(data.data.list.tweets_timeline)
      if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-list.json`, JSON.stringify(data, null, 2))
      let t = this.tweets.addTweets(data.data.list.tweets_timeline.timeline.instructions[0].entries as RawTweetData[])
      // console.log(t)
      resolve(t)
    })
  }

  protected patch(data: RawListTimelineData) {
    return new Promise((resolve, reject) => {
      let entries = data.data.list.tweets_timeline.timeline.instructions[0].entries
      this.cursors.top = ((entries[entries.length - 2] as unknown as Cursor).content as any).value // cursor-top-\d{19} 
      this.cursors.bottom = ((entries[entries.length - 1] as unknown as Cursor).content as any).value // cursor-bottom-\d{19}
      resolve(data)
    })
  }

}

export interface ListTimelineUrlData extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    listId: string
  };
  features: BaseTimelineUrlData["features"]
}

export interface RawListTimelineData {
  data: {
    list: {
      tweets_timeline: {
        timeline: {
          id: string
          instructions: [{
            type: string
            entries: TimelineEntryData
          }]
          metadata: {
            scribeConfig: {
              page: string
            }
          }
        }
      }
    }
  }
}
