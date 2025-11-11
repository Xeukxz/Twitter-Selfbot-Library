import { RawTweetEntryData, Tweet, TweetEntryTypes } from "../Tweet";
import { Client, FeaturesGetData } from "../Client";
import { BaseTweetBasedTimeline, BaseTimelineUrlData, TimelineEntryData, NewTimelineData, NewHomeTimelineData, TimelineAddEntries, TimelineShowAlert, Cursor, TopCursorData, BottomCursorData, RawTimelineResponseData } from "./BaseTweetBasedTimeline";
import fs from 'fs';

export interface HomeTimelineData {
  count?: number;
}

export class HomeTimeline extends BaseTweetBasedTimeline<RawTweetEntryData> {
  cache: RawHomeTimelineResponseData[] = [];
  variables: HomeTimelineUrlData["variables"] = {
    includePromotedContent: true,
    latestControlAvailable: true,
    withCommunity: false,
    ...super._variables,
  }

  constructor(
    client: Client,
    data?: HomeTimelineData
  ) {
    super(client, "home");
  }

  getEntriesFromData(rawTimelineData: RawHomeTimelineResponseData): TimelineAddEntries<RawTweetEntryData> {
    return rawTimelineData.data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>;
  }
}
export interface HomeTimelineUrlData extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    includePromotedContent: boolean;
    latestControlAvailable: boolean;
    withCommunity: boolean;
  };
  features: BaseTimelineUrlData["features"]
}

export interface RawHomeTimelineResponseData {
  data: {
    home: {
      home_timeline_urt: {
        instructions: (TimelineAddEntries<RawTweetEntryData> | TimelineShowAlert)[];
        responseObjects: {
          key: string;
          value: {
            feedbackType: string;
            prompt: string;
            confirmation: string;
            feedbackUrl: string;
            hasUndoAction: boolean;
          }
        }[]
        metadata: {
          scribeConfig: {
            page: string;
          };
        };
      };
    };
  };
}
