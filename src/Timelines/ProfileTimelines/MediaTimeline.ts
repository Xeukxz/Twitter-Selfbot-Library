import { Client } from "../../Client";
import { Profile } from "../../Profile";
import {
  RawGridEntryData,
  TweetTypes,
} from "../../Tweet";
import fs from "fs";
import {
  BaseTimeline,
  BaseTimelineUrlData,
  BottomCursorData,
  Cursor,
  RawTimelineResponseData,
  TimelineAddEntries,
  TimelineClearCache,
  TimelineTerminateTimeline,
  TimelineTweetEntryData,
  TopCursorData,
} from "../BaseTimeline";
import { TweetManager } from "../../Managers";
import { Tweet } from '../../Tweet';

export interface MediaTimelineData {
  username: string;
  count?: number;
}

export class MediaTimeline extends BaseTimeline<RawGridEntryData> {
  cache: RawMediaAddToModuleTimelineResponseData[] = [];
  profile!: Profile;
  private profileUsername: string;
  private firstFetch: boolean = true;
  variables: MediaTimelineUrlData["variables"] = {
    userId: undefined as any, // set in this.fetch()
    includePromotedContent: false,
    withBirdwatchNotes: false,
    withClientEventToken: false,
    withVoice: true,
    withV2Timeline: true,
    ...super._variables,
  }
  constructor(client: Client, data: MediaTimelineData) {
    super(client, "media");
    this.profileUsername = data.username;
  }

  /**
   * Fetches the latest tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async fetchLatest() {
    this.variables.cursor = this.cursors.top
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch()
    let instructions = (rawData as RawMediaAddToModuleTimelineResponseData).data.user.result.timeline_v2.timeline.instructions;
    let entries = (instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawGridEntryData>)!.entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.resetData()
    return {
      tweets,
      rawData
    };
  }

  /**
   * Fetches older tweets from the timeline
   * @returns RawListTimelineData[]
   */
  async scroll() {
    this.variables.cursor = this.cursors.bottom
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch()
    let instructions = (rawData as RawMediaAddToModuleTimelineResponseData).data.user.result.timeline_v2.timeline.instructions;
    let entries = (instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawGridEntryData>)!.entries;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
    this.resetData()
    return {
      tweets,
      rawData
    };
  }

  fetch() {
    return new Promise<{
      tweets: Tweet<TweetTypes>[];
      rawData: RawTimelineResponseData;
    }>(async (resolve, reject) => {
      this.profile = await this.client.profiles.fetch({
        username: this.profileUsername,
      });
      this.variables.userId = this.profile.userId;

      let fetchData: {
        tweets: Tweet<RawGridEntryData>[];
        rawData: RawMediaAddToModuleTimelineResponseData;
      } = {
        tweets: [],
        rawData: undefined as any,
      }

      if (this.firstFetch) {
        this.firstFetch = false;
        const firstFetch: RawMediaModuleTimelineResponseData | void =
          await this.client.rest
            .graphQL({
              query: this.query,
              variables: this.variables,
            })
            .then(async (res) => {
              let data: RawMediaModuleTimelineResponseData = res.data;
              this.cache.push(res.data);
              let firstTweets = await this.buildTweetsFromCache(
                res.data as RawMediaModuleTimelineResponseData
              );
              fetchData.tweets.push(...firstTweets);
              fetchData.rawData = res.data;
              return res.data as RawMediaModuleTimelineResponseData;
            })
            .catch((err) => {
              console.log(err.response?.data);
              return reject(err);
            });

        if (!firstFetch) return reject("Failed to fetch initial timeline");

        const cursorEntries =
          (firstFetch.data.user.result.timeline_v2.timeline.instructions.find(
            (i) => i.type == "TimelineAddEntries"
          ) as MediaModuleTimelineAddEntries)!.entries.filter(
            (e) => e.content.entryType == "TimelineTimelineCursor"
          ) as Cursor[];
        this.cursors.top = cursorEntries.find(
          (e) => e.content.cursorType == "Top"
        )!.content.value;
        this.cursors.bottom = cursorEntries.find(
          (e) => e.content.cursorType == "Bottom"
        )!.content.value;
        this.variables.cursor = this.cursors.bottom;
      }

      super.fetch().then(nextFetchResults => {
        fetchData.tweets.push(...(nextFetchResults.tweets as Tweet<RawGridEntryData>[]));
        // if(this.client.debug) fs.writeFileSync(`${__dirname}/../../../debug/debug-media-1.json`, JSON.stringify(fetchData.rawData, null, 2))
        // if(this.client.debug) fs.writeFileSync(`${__dirname}/../../../debug/debug-media-2.json`, JSON.stringify(nextFetchResults.rawData, null, 2))

        // not merging raw data rn since they are in diferent forms and is too headache
        
        // let firstRawFetchEntries = (fetchData.rawData.data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries)
        // console.log(firstRawFetchEntries)
        // let secondRawFetchEntries = ((nextFetchResults.rawData as RawMediaAddToModuleTimelineResponseData).data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddToModule") as TimelineAddToModule);
        // console.log(secondRawFetchEntries)
        // firstRawFetchEntries!.entries.push(...secondRawFetchEntries!.moduleItems)

        resolve({ tweets: fetchData.tweets, rawData: nextFetchResults.rawData });
      }).catch(reject);
    });
  }

  async buildTweetsFromCache(data: RawMediaAddToModuleTimelineResponseData | RawMediaModuleTimelineResponseData ) {
    return new Promise<Tweet<RawGridEntryData>[]>((resolve, reject) => {
      if (this.client.debug)
        fs.writeFileSync(
          `${__dirname}/../../../debug/debug-media.json`,
          JSON.stringify(data, null, 2)
        );
      if (data.data.user.result.timeline_v2.timeline.instructions.length == 3) {
        const module: ModuleTimelineEntry = (data.data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as MediaModuleTimelineAddEntries)!.entries[0]
        let t = this.tweets.addTweets(module.content.items);
        resolve(t);
      } else {
        let t = this.tweets.addTweets(
          ((
            data.data.user.result.timeline_v2.timeline.instructions.find(
              (i) => i.type == "TimelineAddToModule"
            ) as TimelineAddToModule
          )!.moduleItems as RawGridEntryData[]) || []
        );
        resolve(t);
      }
    });
  }

  setCursors(rawTimelineData: RawMediaAddToModuleTimelineResponseData | RawMediaModuleTimelineResponseData): void {
    let entries = (rawTimelineData.data.user.result.timeline_v2.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawGridEntryData>)!.entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.cursors.bottom = (entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData).content.value;
  }
}

export interface MediaTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    userId: string;
    includePromotedContent: boolean;
    withClientEventToken: boolean;
    withBirdwatchNotes: boolean;
    withVoice: boolean;
    withV2Timeline: boolean;
  };
  features: BaseTimelineUrlData["features"];
}

export interface RawMediaModuleTimelineResponseData {
  data: {
    user: {
      result: {
        __typename: string;
        timeline_v2: {
          timeline: {
            instructions: [
              TimelineClearCache,
              TimelineTerminateTimeline,
              MediaModuleTimelineAddEntries
            ];
            metadata: {
              scribeConfig: {
                page: string;
              };
            };
          };
        };
      };
    };
  };
}
interface MediaModuleTimelineAddEntries {
  type: "TimelineAddEntries";
  entries: [ModuleTimelineEntry, any, any];
}

interface ModuleTimelineEntry {
  entryId: "profile-grid-0";
  sortIndex: string;
  content: {
    entryType: string;
    items: RawGridEntryData[];
    displayType: string;
    clientEventInfo: {
      component: string;
    };
  };
}

// Initial Fetch:

export interface RawMediaAddToModuleTimelineResponseData {
  data: {
    user: {
      result: {
        __typename: "User";
        timeline_v2: {
          timeline: {
            instructions: [TimelineAddToModule, MediaAddToModuleTimelineAddEntries]
            metadata: {
              scribeConfig: {
                page: string;
              };
            };
          };
        };
      };
    };
  };
}

interface TimelineAddToModule {
  type: "TimelineAddToModule";
  moduleItems: RawGridEntryData[];
  moduleEntryId: string;
}

interface MediaAddToModuleTimelineAddEntries {
  type: "TimelineAddEntries";
  entries: [any, any];
}
