import { Client } from "../Client";
import { RawTweetEntryData, Tweet } from "../Tweet";
import {
  BaseTimeline,
  BaseTimelineUrlData,
  BottomCursorData,
  TimelineAddEntries,
  TimelineReplaceEntry,
  TopCursorData,
} from "./BaseTimeline";
import fs from "fs";

export interface SearchTimelineData {
  /**
   * The search query
   */
  query: string;
  /**
   * The search target
   */
  product: SearchTimelineUrlData["variables"]["product"];
  /**
   * The referrer of the search query used in analytics
   */
  querySource: SearchTimelineUrlData["variables"]["querySource"];
  count?: number;
}

export class SearchTimeline extends BaseTimeline<RawTweetEntryData> {
  // variables: ProfileTimelineUrlData['variables']
  // features: ProfileTimelineUrlData['features']
  cache: RawSearchTimelineResponseData[] = [];
  variables: SearchTimelineUrlData["variables"] = {
    rawQuery: "",
    querySource: "typed_query",
    product: "Top",
    ...super._variables,
  }
  constructor(
    client: Client,
    data: SearchTimelineData,
  ) {
    super(client, "search");
    this.variables.rawQuery = data.query;
    this.variables.querySource = data.querySource ?? "typed_query";
    this.variables.product = data.product as SearchTimelineUrlData["variables"]["product"] ?? "Latest";
  }

  // get features(): SearchTimelineUrlData['features'] {
  //   return {
  //     ...super.features
  //   }
  // }

  async fetchLatest() {
    this.variables.cursor = this.cursors.top;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawSearchTimelineResponseData).data.search_by_raw_query.search_timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries;
    this.cursors.top = (entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData).content.value;
    this.resetVariables();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  async scroll() {
    this.variables.cursor = this.cursors.bottom;
    this.variables.count = 40;
    let { tweets, rawData } = await this.fetch();
    let entries = ((rawData as RawSearchTimelineResponseData).data.search_by_raw_query.search_timeline.timeline.instructions.filter(i => i.type == "TimelineReplaceEntry") as TimelineReplaceEntry[]);
    this.cursors.bottom = (entries.find(e => e.entry.entryId.startsWith("cursor-bottom"))!.entry as BottomCursorData).content.value;
    this.resetVariables();
    return {
      tweets,
      rawData: this.cache[this.cache.length - 1]
    };
  }

  buildTweetsFromCache(data: RawSearchTimelineResponseData) {
    return new Promise<Tweet<RawTweetEntryData>[]>((resolve, reject) => {
      if(this.client.debug) fs.writeFileSync(`${__dirname}/../../debug/debug-search.json`, JSON.stringify(data, null, 2));
      let tweets = this.tweets.addTweets(
        (data.data.search_by_raw_query.search_timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries as RawTweetEntryData[]
      ) as Tweet<RawTweetEntryData>[];
      resolve(tweets);
    });
  }

  setCursors(rawTimelineData: RawSearchTimelineResponseData): void {
    let instructions = (rawTimelineData.data.search_by_raw_query.search_timeline.timeline.instructions);
    let entries = (instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries;
    let topCursor = entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData;
    let bottomCursor = entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData;

    if (topCursor) this.cursors.top = topCursor?.content.value;
    if (bottomCursor) this.cursors.bottom = bottomCursor?.content.value;
    
    let replaceEntries = instructions.filter(e => e.type == "TimelineReplaceEntry") as TimelineReplaceEntry[];
    replaceEntries.forEach(e => {
      if (e.entry.entryId.startsWith("cursor")) {
        let cursor = e.entry as TopCursorData | BottomCursorData;
        if (cursor) {
          if (cursor.content.cursorType == "Top") {
            this.cursors.top = cursor.content.value;
          } else if (cursor.content.cursorType == "Bottom") {
            this.cursors.bottom = cursor.content.value;
          }
        }
      }
    })
  }
}

export interface SearchTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    rawQuery: string,
    querySource: // Analytics
      | "advanced_search_page"
      | "cashtag_click"
      | "hashtag_click"
      | "promoted_trend_click"
      | "recent_search_click"
      | "saved_search_click"
      | "related_query_click"
      | "spelling_correction_click"
      | "spelling_suggestion_revert_click"
      | "spelling_expansion_click"
      | "spelling_expansion_revert_click"
      | "spelling_suggestion_click"
      | "trend_click"
      | "trend_view"
      | "typeahead_click"
      | "typed_query"
      | "tv_search"
      | "tdqt"
      | "tweet_detail_similar_posts",
    product: "Top" | "Latest" | "People" | "Media" | "Lists",
  };
  features: BaseTimelineUrlData["features"];
}

export interface RawSearchTimelineResponseData {
  data: {
    search_by_raw_query: {
      search_timeline: {
        timeline: {
          instructions: (
            | TimelineAddEntries<RawTweetEntryData>
            | TimelineReplaceEntry
          )[];
          metadata: {
            scribeConfig: {
              page: string;
            };
          };
        };
      };
    };
  };
}