import { RawTweetEntryData, Tweet } from "../Tweet";
import { Client } from "../Client";
import { BaseTweetBasedTimeline, BaseTimelineUrlData, BottomCursorData, TimelineAddEntries, TimelineShowAlert, TopCursorData, RawTimelineResponseData } from "./BaseTweetBasedTimeline";
import fs from 'fs';

export interface FollowingTimelineData {
  count?: number;
}

export class FollowingTimeline extends BaseTweetBasedTimeline<RawTweetEntryData> {
  cache: RawFollowingTimelineResponseData[] = [];
  variables: FollowingTimelineUrlData["variables"] = {
    includePromotedContent: true,
    latestControlAvailable: true,
    withCommunity: false,
    ...super._variables,
  }
  constructor(
    client: Client,
    data?: FollowingTimelineData
  ) {
    super(client, "following");
  }

  getEntriesFromData(rawTimelineData: RawFollowingTimelineResponseData): TimelineAddEntries<RawTweetEntryData> {
    return rawTimelineData.data.home.home_timeline_urt.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawTweetEntryData>;
  }
}

export interface FollowingTimelineUrlData extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData["variables"] & {
    includePromotedContent: boolean;
    latestControlAvailable: boolean;
    withCommunity: boolean;
  };
  features: BaseTimelineUrlData["features"]
}

export interface RawFollowingTimelineResponseData {
  data: {
    home: {
      home_timeline_urt: {
        instructions: [TimelineAddEntries<RawTweetEntryData>, TimelineShowAlert];
        metadata: {
          scribeConfig: {
            page: string;
          };
        };
      };
    };
  };
}