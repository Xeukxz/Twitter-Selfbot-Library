import { Client, FeaturesGetData } from './Client';
import { Queries } from "./Routes";
import { TimelineTerminateTimeline } from './Timelines';
import { TimelineAddEntries } from './Timelines/BaseTimeline';
import { TweetRepliesTimeline } from './Timelines/TweetRepliesTimeline';

export class Tweet<T extends TweetEntryTypes = TweetEntryTypes> {
  client: Client;
  id!: string;
  user!: {
    id: string;
    name: string;
    username: string;
    profilePictureUrl: string;
  };
  media?: ({
    type: "video";
    variants: {
      bitrate: number;
      url: string;
    }[]
  } | {
    type: "image";
    url: string;
  })[];
  text?: string;
  likesCount?: number;
  retweetsCount?: number;
  repliesCount?: number;
  views!: number;
  bookmarksCount?: number;
  createdAt!: Date;
  isRetweet: boolean = false;
  retweetedTweet?: Tweet;
  quotedTweet?: Tweet;
  unavailable: boolean = false;
  raw!: RawTweetData | RawProfileConversationTweetData;

  variables = {
    focalTweetId: this.id,
    with_rux_injections: false ,
    rankingMode: "Relevance",
    includePromotedContent: true,
    withCommunity: true,
    withQuickPromoteEligibilityTweetFields: true,
    withBirdwatchNotes: true,
    withVoice: true,
    URIEncoded: function() {
      return encodeURIComponent(JSON.stringify(this));
    }
  }

  constructor(client: Client, RawEntryOrTweetData?: T | TweetTypes) {
    this.client = client;
    if(!RawEntryOrTweetData) return;
    try {
      this.buildTweet(Tweet.ParseEntryToData(RawEntryOrTweetData), RawEntryOrTweetData);
    } catch (e) {
      if(client.debug) console.log(JSON.stringify(RawEntryOrTweetData, null, 2));
      console.log(`Bad tweet: ${(RawEntryOrTweetData as T).entryId || (RawEntryOrTweetData as TweetTypes).rest_id}`);
      throw new Error(`${e}`);
    }
  }

  // get method because TweetRepliesTimeline extends BaseTimeline which causes a circular dependency when using Tweet inside BaseTimeline
  get replies(): Promise<TweetRepliesTimeline> {
    return this.client.timelines.fetch({
      type: "tweetReplies",
      tweet: this
    }) as Promise<TweetRepliesTimeline>;
  }

  static getTweetFromResult(tweetResult: RawTweetResult): TweetTypes | undefined {
    return Object.keys(tweetResult).length == 0 ? undefined : ("tweet" in tweetResult.result ? tweetResult.result.tweet : tweetResult.result);
  }

  static ParseEntryToData(entry: TweetEntryTypes | TweetTypes): TweetTypes {
    let tweetResult = 
      (entry as RawTweetEntryData).content?.itemContent?.tweet_results ||
      (entry as RawGridEntryData).item?.itemContent?.tweet_results ||
      (entry as RawProfileConversationEntryData).content?.items[1]?.item?.itemContent?.tweet_results ||
      (entry as RawConversationThreadEntryData).content.items[0].item.itemContent.tweet_results;
      
    let tweetData = tweetResult ? Tweet.getTweetFromResult(tweetResult) : entry as TweetTypes;
    return tweetData as TweetTypes;
  }

  async fetch() {
    return (await this.replies)?.fetch();
  }

  buildTweet(tweetData: TweetTypes | undefined, rawData: T | TweetTypes) {
    this.raw = tweetData as RawTweetData;
    if(!tweetData) {
      this.unavailable = true;
      this.id = (rawData as T).entryId?.split("-")[1] || "";
      this.user = {
        id: "",
        name: "",
        username: "",
        profilePictureUrl: "",
      };
      return;
    }

    let retweetResult = (tweetData.legacy.retweeted_status_result);
    if(retweetResult) {
      this.isRetweet = true;
      this.retweetedTweet = new Tweet(this.client)
      this.retweetedTweet.buildTweet(Tweet.getTweetFromResult(retweetResult), rawData);
    }

    let quotedResult = tweetData.quoted_status_result;
    if(quotedResult) {
      this.quotedTweet = new Tweet(this.client);
      this.quotedTweet.buildTweet(Tweet.getTweetFromResult(quotedResult), rawData);
    }


    let userData = tweetData.core.user_results;
    this.id = tweetData.rest_id;
    this.user = {
      id: userData.result.rest_id,
      name: userData.result.legacy.name,
      username: userData.result.legacy.screen_name,
      profilePictureUrl: userData.result.legacy.profile_image_url_https,
    };
    this.createdAt = new Date(tweetData.legacy.created_at);

    this.likesCount = tweetData.legacy.favorite_count;
    this.retweetsCount = tweetData.legacy.retweet_count;
    this.repliesCount = tweetData.legacy.reply_count;
    this.bookmarksCount = tweetData.legacy.bookmark_count;
    this.views = parseInt(tweetData.views.count);

    let otherMediaSource = (this.quotedTweet || this.retweetedTweet)?.media;

    if(otherMediaSource) {
      this.media = otherMediaSource;
    } else if(tweetData.legacy.entities.media) {
      
      this.media = tweetData.legacy.entities.media.map(m => m.type == "video" ? {
        type: m.type,
        variants: m.video_info.variants.filter(m => !m.url.includes("m3u8")).map((media) => {
          return {
            bitrate: media.bitrate,
            url: media.url,
          };
        }) 
      } : {
        type: "image",
        url: m.media_url_https
      });  
    }

    this.text = (tweetData as RawProfileConversationTweetData).note_tweet?.note_tweet_results?.result.text ?? tweetData.legacy.full_text;
  }
}
export type TweetTypes = RawTweetData | RawProfileConversationTweetData
export type TweetEntryTypes = RawTweetEntryData | RawGridEntryData | RawProfileConversationEntryData | RawConversationThreadEntryData;
export interface RawTweetResult {
  result: ({
    __typename: string;
  } & RawTweetData) | {
    __typename: string;
    tweet: RawTweetData;
  }
}

export interface RawProfileConversationTweetResult {
  result: ({
    __typename: string;
  } & RawProfileConversationTweetData) | {
    __typename: string;
    tweet: RawProfileConversationTweetData;
  }
  tweetDisplayType?: string;
}
export interface RawTweetData {
  rest_id: string;
  core: {
    user_results: {
      result: {
        __typename: string;
        id: string;
        rest_id: string;
        affiliates_highlighted_label: {};
        has_graduated_access: boolean;
        is_blue_verified: boolean;
        legacy: {
          can_dm: boolean;
          can_media_tag: boolean;
          created_at: string;
          default_profile: boolean;
          default_profile_image: boolean;
          description: string;
          entities: {
            description: {
              urls: {
                display_url: string,
                expanded_url: string,
                url: string,
                indices: [ number, number ]
              }[];
            };
            url: {
              urls: {
                display_url: string;
                expanded_url: string;
                url: string;
                indices: [number, number];
              }[];
            };
          };
          fast_followers_count: number;
          favourites_count: number;
          followers_count: number;
          friends_count: number;
          has_custom_timelines: boolean;
          is_translator: boolean;
          listed_count: number;
          location: string;
          media_count: number;
          name: string;
          normal_followers_count: number;
          pinned_tweet_ids_str: string[];
          possibly_sensitive: boolean;
          profile_banner_url: string;
          profile_image_url_https: string;
          profile_interstitial_type: string;
          screen_name: string;
          statuses_count: number;
          translator_type: string;
          url?: string;
          verified: boolean;
          want_retweets: boolean;
          withheld_in_countries: unknown[];
        };
      };
    };
  };
  unmention_data: {};
  edit_control: {
    edit_tweet_ids: string[];
    editable_until_msecs: string;
    is_edit_eligible: boolean;
    edits_remaining: string;
  };
  is_translatable: boolean;
  views: {
    count: string;
    state: string;
  };
  source: string;
  quoted_status_result?: RawTweetResult
  legacy: {
    bookmark_count: number;
    bookmarked: boolean;
    created_at: string;
    conversation_id_str: string;
    display_text_range: number[];
    entities: {
      media?: {
        display_url: string;
        expanded_url: string;
        id_str: string;
        indices: number[];
        media_key: string;
        media_url_https: string;
        type: "video" | "photo";
        url: string;
        ext_media_availability: {
          status: string;
        };
        sizes: {
          large: {
            h: number;
            w: number;
            resize: string;
          };
          medium: {
            h: number;
            w: number;
            resize: string;
          };
          small: {
            h: number;
            w: number;
            resize: string;
          };
          thumb: {
            h: number;
            w: number;
            resize: string;
          };
        };
        original_info: {
          height: number;
          width: number;
          focus_rects: {
            x: number;
            y: number;
            w: number;
            h: number;
          }[]
        };
        video_info: {
          aspect_ratio: number[];
          variants: {
            bitrate: number;
            content_type: string;
            url: string;
          }[];
        };
      }[];
      user_mentions: {
        id_str: string;
        name: string;
        screen_name: string;
        indices: [number, number];
      };
      urls: {
        display_url: string,
        expanded_url: string,
        url: string,
        indices: [ number, number ]
      }[];
      hashtags: {
        indices: [ number, number ];
        text: string;    
      };
      symbols: unknown[];
    };
    extended_entities: {
      media: {
        display_url: string;
        expanded_url: string;
        id_str: string;
        indices: number[];
        media_key: string;
        media_url_https: string;
        type: "video" | "photo";
        url: string;
        ext_media_availability: {
          status: string;
        };
        sizes: {
          large: {
            h: number;
            w: number;
            resize: string;
          };
          medium: {
            h: number;
            w: number;
            resize: string;
          };
          small: {
            h: number;
            w: number;
            resize: string;
          };
          thumb: {
            h: number;
            w: number;
            resize: string;
          };
        };
        original_info: {
          height: number;
          width: number;
          focus_rects: {
            x: number;
            y: number;
            w: number;
            h: number;
          }[]
        };
        video_info: {
          aspect_ratio: number[];
          variants: {
            bitrate: number;
            content_type: string;
            url: string;
          }[];
        };
      }[];
    };
    favorite_count: number;
    favorited: boolean;
    full_text: string;
    is_quote_status: boolean;
    lang: string;
    possibly_sensitive: boolean;
    possibly_sensitive_editable: boolean;
    quote_count: number;
    reply_count: number;
    retweet_count: number;
    retweeted: boolean;
    user_id_str: string;
    id_str: string;
    retweeted_status_result?: RawTweetResult;
  }
  card?: {
    rest_id: string;
    legacy: {
      binding_values: {
        key: string;
        value: {
          string_value: string;
          type: string;
        };
      }[];
      card_platform: {
        platform: {
          audience: {
            name: string;
          };
          device: {
            name: string;
            version: string;
          };
        };
      };
      name: string;
      url: string;
      user_refs_results: any[];
    };
  };
}

export type RawProfileConversationTweetData = RawTweetData & {
  note_tweet?: {
    is_expandable: boolean;
    note_tweet_results: {
      result: {
        id: string;
        text: string;
        entity_set: {
          hashtags: {
            indices: [ number, number ];
            text: string;
          };
          symbols: any[];
          timestamps: any[];
          urls: {
            display_url: string,
            expanded_url: string,
            url: string,
            indices: [ number, number ]
          }[];
          user_mentions: {
            id_str: string;
            name: string;
            screen_name: string;
            indices: [number, number];
          };
        };
      };
    };
  };
  quoted_status_result?: {
    result: ({
      __typename: string;
    } & Omit<RawProfileConversationTweetData, "quoted_status_result">) | {
      __typename: string;
      tweet: Omit<RawProfileConversationTweetData, "quoted_status_result">;
    }
  };
  superFollowsReplyUserResult?: {
    result: {
      __typename: string;
      legacy: {
        screen_name: string;
      };
    };
  };
};

export interface RawTweetEntryData {
  entryId: `tweet-${string}`;
  sortIndex: string;
  content: {
    entryType: string;
    __typename: string;
    itemContent: {
      itemType: string;
      __typename: string;
      tweet_results: RawTweetResult;
      tweetDisplayType: string;
      socialContext: {
        type: string;
        contextType: string;
        text: string;
      };
    };
    feedbackInfo: {
      feedbackKeys: string[];
    };
    clientEventInfo: {
      component: string;
      element: string;
      details: {
        timelinesDetails: {
          injectionType: string;
          controllerData: string;
        };
      };
    };
  };
}

export interface RawGridEntryData {
  entryId: `profile-grid-${number}-tweet-${string}`;
  item: {
    itemContent: {
      itemType: string;
      __typename: string;
      tweet_results: RawTweetResult;
      tweetDisplayType: string;
    };
  };
}

export interface RawProfileConversationEntryData {
  entryId: `profile-conversation-${string}`;
  sortIndex: string;
  content: {
    entryType: string;
    __typename: string;
    items: {
      entryId: string;
      item: {
        itemContent: {
          itemType: string;
          __typename: string;
          tweet_results: RawProfileConversationTweetResult;
          clientEventInfo?: {
            component: string;
            element: string;
            details: {
              timelinesDetails: {
                injectionType: string;
                controllerData: string;
              };
            };
          };
          tweetDisplayType?: string;
        };
        clientEventInfo?: {
          component: string;
          element: string;
          details: {
            timelinesDetails: {
              injectionType: string;
              controllerData: string;
            };
          };
        };
      };
    }[];
    metadata: {
      conversationMetadata: {
        allTweetIds: string[];
        enableDeduplication: boolean;
      };
    };
    displayType: string;
    clientEventInfo: {
      component: string;
      details: {
        timelinesDetails: {
          injectionType: string;
          controllerData: string;
        };
      };
    };
  };
}

export interface RawTweetDetailData {
  data: {
    threaded_conversation_with_injections_v2: {
      instructions: [TimelineAddEntries<RawTweetEntryData | RawConversationThreadEntryData>, TimelineTerminateTimeline?];
    }
  }
}

export interface RawConversationThreadEntryData {
  entryId: `conversationthread-${number}`;
  sortIndex: string;
  content: {
    entryType: "TimelineTimelineModule";
    __typename: "TimelineTimelineModule";
    items: [RawConversationThreadItemData] | [RawConversationThreadItemData, RawConversationThreadItemData];
    displayType: string;
    clientEventInfo: {
      details: {
        conversationDetails: {
          conversationSection: string;
        };
      };
    };
  };
}

export interface RawConversationThreadItemData {
  entryId: `conversationthread-${number}-tweet-${string}`;
  item: {
    itemContent: {
      itemType: string;
      __typename: string;
      tweet_results: RawTweetResult;
      tweetDisplayType: string;
    };
    clientEventInfo: {
      details: {
        conversationDetails: {
          conversationSection: string;
        };
        timelinesDetails: {
          controllerData: string;
        };
      };
    }
  };
}