import { Client, FeaturesGetData } from './Client';
import { Queries } from "./Routes";
import { TimelineTerminateTimeline } from './Timelines';
import { TimelineAddEntries } from './Timelines/BaseTimeline';

export class Tweet<T extends TweetTypes = TweetTypes> {
  client: Client;
  id!: string;
  user!: {
    id: string;
    name: string;
    username: string;
    profilePictureUrl: string;
  };
  media?: {
    type: string;
    url: string;
  }[];
  text?: string;
  likesCount?: number;
  retweetsCount?: number;
  repliesCount?: number;
  views!: number;
  bookmarksCount?: number;
  createdAt!: Date;
  unavailable: boolean = false;
  raw!: RawTweetData | RawProfileConversationTweetData;
  protected query = Queries.tweet;

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

  constructor(client: Client, data?: T) {
    this.client = client;
    if(!data) return;
    try {
      this.buildTweet(Tweet.ParseEntryToData(data), data);
    } catch (e) {
      if(client.debug) console.log(JSON.stringify(data, null, 2));
      console.log(`Bad tweet: ${data.entryId}`);
      throw new Error(`${e}`);
    }
  }

  static ParseEntryToData(entry: TweetTypes) {
    let tweetResult = 
      (entry as RawTweetEntryData).content?.itemContent?.tweet_results?.result ||
      (entry as RawGridEntryData).item?.itemContent?.tweet_results?.result ||
      (entry as RawProfileConversationEntryData).content?.items[1]?.item?.itemContent?.tweet_results?.result;      
      
    let tweetData = "tweet" in tweetResult ? tweetResult.tweet : tweetResult;
    return tweetData;
  }
  
  get features(): FeaturesGetData<typeof this.query.metadata.featureSwitches> {
    return this.client.features.get(this.query.metadata.featureSwitches)
  }

  fetch() {
    return new Promise<RawTweetDetailData>((resolve, reject) => {
      this.client.rest.graphQL({
        query: this.query,
        variables: this.variables
      }).then(async (res) => {
        resolve(res)
      }).catch((err) => {
        console.log(err.response?.data)
        reject(err)
      })
    })
  }

  buildTweet(tweetData: RawTweetData, rawData: T) {
    this.raw = tweetData;
    if(!tweetData) {
      this.unavailable = true;
      this.id = rawData.entryId.split("-")[1];
      this.user = {
        id: "",
        name: "",
        username: "",
        profilePictureUrl: "",
      };
      return;
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

    if(tweetData.legacy.entities.media) {
      this.media = tweetData.legacy.entities.media.map((media) => {
        return {
          type: media.type,
          url: media.media_url_https,
        };
      });
    }
    this.text = tweetData.legacy.full_text;

  }
}

export type TweetTypes = RawTweetEntryData | RawGridEntryData | RawProfileConversationEntryData;

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
              urls: unknown[];
            };
            url: {
              urls: {
                display_url: string;
                expanded_url: string;
                url: string;
                indices: number[];
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
        type: string;
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
          focus_rects: unknown[];
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
      user_mentions: unknown[];
      urls: unknown[];
      hashtags: unknown[];
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
        type: string;
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
          focus_rects: unknown[];
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
          hashtags: any[];
          symbols: any[];
          timestamps: any[];
          urls: any[];
          user_mentions: any[];
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
      tweet_results: {
        result: ({
          __typename: string;
        } & RawTweetData) | {
          __typename: string;
          tweet: RawTweetData;
        }
      };
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
      tweet_results: {
        result: ({
          __typename: string;
        } & RawTweetData) | {
          __typename: string;
          tweet: RawTweetData;
        }
      };
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
          tweet_results: {
            result: ({
              __typename: string;
            } & RawProfileConversationTweetData) | {
              __typename: string;
              tweet: RawProfileConversationTweetData;
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

export interface RawConversationThreadEntryData { // TODO: Define this fully
  entryId: string;
  sortIndex: string;
  content: {
    entryType: string;
    __typename: string;
    items: any[];
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