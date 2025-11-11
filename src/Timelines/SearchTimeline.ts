import { Client } from "../Client";
import { RawTweetEntryData, Tweet } from "../Tweet";
import {
  BaseTweetBasedTimeline,
  BaseTimelineUrlData,
  BottomCursorData,
  TimelineAddEntries,
  TimelineReplaceEntry,
  TopCursorData,
  RawTimelineResponseData,
} from "./BaseTweetBasedTimeline";
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

export class SearchTimeline extends BaseTweetBasedTimeline<RawTweetEntryData> {
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

  setCursors(rawTimelineData: RawSearchTimelineResponseData): void {
    let instructions = (rawTimelineData.data.search_by_raw_query.search_timeline.timeline.instructions);
    let entries = (instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>)!.entries;
    let topCursor = entries.find(e => e.entryId.startsWith("cursor-top")) as TopCursorData;
    let bottomCursor = entries.find(e => e.entryId.startsWith("cursor-bottom")) as BottomCursorData;

    if (topCursor) this.cursors.top = this.extractCursorValue(topCursor)!;
    if (bottomCursor) this.cursors.bottom = this.extractCursorValue(bottomCursor)!;

    let replaceEntries = instructions.filter(e => e.type == "TimelineReplaceEntry") as TimelineReplaceEntry[];
    // this.cursors.top = this.extractCursorValue(this.extractCursorEntries(replaceEntries, 'top') ?? undefined) || this.cursors.top;
    // this.cursors.bottom = this.extractCursorValue(this.extractCursorEntries(replaceEntries, 'bottom') ?? undefined) || this.cursors.bottom;
    replaceEntries.forEach(e => {
      if (e.entry.entryId.startsWith("cursor")) {
        const data = this.extractCursorContentData(e.entry);
        if(data?.cursorType == "Top") this.cursors.top = data?.value;
        else if(data?.cursorType == "Bottom") this.cursors.bottom = data?.value;
        // let cursor = e.entry as TopCursorData | BottomCursorData;
        // if (cursor) {
        //   const content = this.extractCursorContentData(cursor);
        //   if (content?.cursorType == "Top") {
        //     this.cursors.top = content?.value;
        //   } else if (content?.cursorType == "Bottom") {
        //     this.cursors.bottom = content?.value;
        //   }
        // }
      }
    })
  }

  getEntriesFromData(rawTimelineData: RawTimelineResponseData): TimelineAddEntries<RawTweetEntryData> {
    return (rawTimelineData as RawSearchTimelineResponseData).data.search_by_raw_query.search_timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>;
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