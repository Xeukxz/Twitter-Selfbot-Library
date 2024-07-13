export class Tweet<T extends TweetTypes> {
  id: string;
  user: {
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
  unavailable: boolean = false;
  raw: T;

  constructor(data: T) {
    try {
      if ("content" in data) { // tweet or profile-conversation
        if("itemContent" in data.content) { // tweet
          let tweetResults =
            data.content.itemContent.tweet_results.result?.tweet ||
            data.content.itemContent.tweet_results.result;
          if (!tweetResults) {
            this.unavailable = true;
            this.raw = data;
            this.id = data.entryId;
            this.user = {
              id: "",
              name: "",
              username: "",
              profilePictureUrl: "",
            };
            return;
          }

          let userData = tweetResults.core.user_results;
          this.raw = data;
          this.id = tweetResults.rest_id;
          this.user = {
            id: userData.result.rest_id,
            name: userData.result.legacy.name,
            username: userData.result.legacy.screen_name,
            profilePictureUrl: userData.result.legacy.profile_image_url_https,
          };
          if (tweetResults.legacy.entities.media) {
            this.media = tweetResults.legacy.entities.media.map((media) => {
              return {
                type: media.type,
                url: media.media_url_https,
              };
            });
          }
          this.text = tweetResults.legacy.full_text;
        } else { // profile-conversation
          let tweetResults = data.content.items[1].item.itemContent.tweet_results.result.tweet ?? data.content.items[0].item.itemContent.tweet_results.result;
          if (!tweetResults) {
            this.unavailable = true;
            this.raw = data;
            this.id = data.entryId;
            this.user = {
              id: "",
              name: "",
              username: "",
              profilePictureUrl: "",
            };
            return;
          }

          let userData = tweetResults.core.user_results;
          this.raw = data;
          this.id = tweetResults.rest_id;
          this.user = {
            id: userData.result.rest_id,
            name: userData.result.legacy.name,
            username: userData.result.legacy.screen_name,
            profilePictureUrl: userData.result.legacy.profile_image_url_https,
          };
          if (tweetResults.legacy.entities.media) {
            this.media = tweetResults.legacy.entities.media.map((media) => {
              return {
                type: media.type,
                url: media.media_url_https,
              };
            });
          }
          this.text = tweetResults.legacy.full_text;
        }

      } else {
        let tweetResults = data.item.itemContent.tweet_results.result.tweet ?? data.item.itemContent.tweet_results.result;
        if (!tweetResults) {
          this.unavailable = true;
          this.raw = data;
          this.id = data.entryId;
          this.user = {
            id: "",
            name: "",
            username: "",
            profilePictureUrl: "",
          };
          return;
        }

        let userData = tweetResults.core.user_results;
        this.raw = data;
        this.id = tweetResults.rest_id;
        this.user = {
          id: userData.result.rest_id,
          name: userData.result.legacy.name,
          username: userData.result.legacy.screen_name,
          profilePictureUrl: userData.result.legacy.profile_image_url_https,
        };
        
        if (tweetResults.legacy?.entities?.media) {
          this.media = (tweetResults.legacy?.entities?.media || (tweetResults as any).tweet.legacy.entities.media).map((media) => {
            return {
              type: media.type,
              url: media.media_url_https,
            };
          });
        }
        this.text = tweetResults.legacy.full_text;
      }
    } catch (e) {
      // console.log(JSON.stringify(data, null, 2));
      throw new Error(`${e}`);
    }
  }
}

export type TweetTypes = RawTweetData | RawGridTweetData | RawProfileConversationTweetData;

export interface RawTweetData {
  entryId: `tweet-${string}`;
  sortIndex: string;
  content: {
    entryType: string;
    __typename: string;
    itemContent: {
      itemType: string;
      __typename: string;
      tweet_results: {
        result: {
          __typename: string;
          tweet?: {
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
                    url: string;
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
          };
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
                profile_image_shape: string;
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
                  url: string;
                  verified: boolean;
                  want_retweets: boolean;
                  withheld_in_countries: unknown[];
                };
                tipjar_settings: {};
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
        };
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

export interface RawGridTweetData {
  entryId: `profile-grid-${number}-tweet-${string}`;
  item: {
    itemContent: {
      itemType: string;
      __typename: string;
      tweet_results: {
        result: {
          tweet?: {
            __typename: string;
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
                  profile_image_shape: string;
                  legacy: {
                    following: boolean;
                    can_dm: boolean;
                    can_media_tag: boolean;
                    created_at: string;
                    default_profile: boolean;
                    default_profile_image: boolean;
                    description: string;
                    entities: {
                      description: { urls: [] };
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
                    verified: boolean;
                    want_retweets: boolean;
                    withheld_in_countries: string[];
                  };
                  tipjar_settings: {};
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
              display_text_range: [number, number];
              entities: {
                hashtags: [];
                media: {
                  display_url: string;
                  expanded_url: string;
                  id_str: string;
                  indices: [number, number];
                  media_key: string;
                  media_url_https: string;
                  type: string;
                  url: string;
                  additional_media_info?: {
                    title: string;
                    description: string;
                    embeddable: boolean;
                    monetizable: boolean;
                  };
                  ext_media_availability: {
                    status: string;
                  };
                  features?: {
                    large: {
                      faces: unknown[];
                    };
                    medium: {
                      faces: unknown[];
                    };
                    small: {
                      faces: unknown[];
                    };
                    orig: {
                      faces: unknown[];
                    };
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
                    }[];
                  };
                  allow_download_status: {
                    allow_download?: boolean;
                  };
                  video_info?: {
                    aspect_ratio: [number, number];
                    duration_millis: number;
                    variants: {
                      content_type: string;
                      url: string;
                      bitrate?: number;
                    }[];
                  };
                  media_results: {
                    result: {
                      media_key: string;
                    };
                  };
                }[];
                symbols: [];
                timestamps: [];
                urls: [];
                user_mentions: [];
              };
              extended_entities: {
                media: {
                  display_url: string;
                  expanded_url: string;
                  id_str: string;
                  indices: [number, number];
                  media_key: string;
                  media_url_https: string;
                  type: string;
                  url: string;
                  additional_media_info?: {
                    title: string;
                    description: string;
                    embeddable: boolean;
                    monetizable: boolean;
                  };
                  ext_media_availability: {
                    status: string;
                  };
                  features?: {
                    large: {
                      faces: unknown[];
                    };
                    medium: {
                      faces: unknown[];
                    };
                    small: {
                      faces: unknown[];
                    };
                    orig: {
                      faces: unknown[];
                    };
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
                    }[];
                  };
                  allow_download_status: {
                    allow_download?: boolean;
                  };
                  video_info?: {
                    aspect_ratio: [number, number];
                    duration_millis: number;
                    variants: {
                      content_type: string;
                      url: string;
                      bitrate?: number;
                    }[];
                  };
                  media_results: {
                    result: {
                      media_key: string;
                    };
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
          };
          __typename: string;
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
                profile_image_shape: string;
                legacy: {
                  following: boolean;
                  can_dm: boolean;
                  can_media_tag: boolean;
                  created_at: string;
                  default_profile: boolean;
                  default_profile_image: boolean;
                  description: string;
                  entities: {
                    description: { urls: [] };
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
                  verified: boolean;
                  want_retweets: boolean;
                  withheld_in_countries: string[];
                };
                tipjar_settings: {};
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
            display_text_range: [number, number];
            entities: {
              hashtags: [];
              media: {
                display_url: string;
                expanded_url: string;
                id_str: string;
                indices: [number, number];
                media_key: string;
                media_url_https: string;
                type: string;
                url: string;
                additional_media_info?: {
                  title: string;
                  description: string;
                  embeddable: boolean;
                  monetizable: boolean;
                };
                ext_media_availability: {
                  status: string;
                };
                features?: {
                  large: {
                    faces: unknown[];
                  };
                  medium: {
                    faces: unknown[];
                  };
                  small: {
                    faces: unknown[];
                  };
                  orig: {
                    faces: unknown[];
                  };
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
                  }[];
                };
                allow_download_status: {
                  allow_download?: boolean;
                };
                video_info?: {
                  aspect_ratio: [number, number];
                  duration_millis: number;
                  variants: {
                    content_type: string;
                    url: string;
                    bitrate?: number;
                  }[];
                };
                media_results: {
                  result: {
                    media_key: string;
                  };
                };
              }[];
              symbols: [];
              timestamps: [];
              urls: [];
              user_mentions: [];
            };
            extended_entities: {
              media: {
                display_url: string;
                expanded_url: string;
                id_str: string;
                indices: [number, number];
                media_key: string;
                media_url_https: string;
                type: string;
                url: string;
                additional_media_info?: {
                  title: string;
                  description: string;
                  embeddable: boolean;
                  monetizable: boolean;
                };
                ext_media_availability: {
                  status: string;
                };
                features?: {
                  large: {
                    faces: unknown[];
                  };
                  medium: {
                    faces: unknown[];
                  };
                  small: {
                    faces: unknown[];
                  };
                  orig: {
                    faces: unknown[];
                  };
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
                  }[];
                };
                allow_download_status: {
                  allow_download?: boolean;
                };
                video_info?: {
                  aspect_ratio: [number, number];
                  duration_millis: number;
                  variants: {
                    content_type: string;
                    url: string;
                    bitrate?: number;
                  }[];
                };
                media_results: {
                  result: {
                    media_key: string;
                  };
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
        };
      };
      tweetDisplayType: string;
    };
  };
}

export interface RawProfileConversationTweetData {
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
            result: {
              __typename: string;
              tweet?: {
                __typename: string;
                rest_id: string;
                core: {
                  user_results: {
                    result: {
                      __typename: string;
                      id: string;
                      rest_id: string;
                      affiliates_highlighted_label: any;
                      has_graduated_access: boolean;
                      is_blue_verified: boolean;
                      profile_image_shape: string;
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
                              display_url: string;
                              expanded_url: string;
                              url: string;
                              indices: number[];
                            }[];
                          };
                          url?: {
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
                        profile_banner_url?: string;
                        profile_image_url_https: string;
                        profile_interstitial_type: string;
                        screen_name: string;
                        statuses_count: number;
                        translator_type: string;
                        url?: string;
                        verified: boolean;
                        verified_type?: string;
                        want_retweets: boolean;
                        withheld_in_countries: any[];
                      };
                      professional?: {
                        rest_id: string;
                        professional_type: string;
                        category: any[];
                      };
                      tipjar_settings: any;
                      super_follow_eligible?: boolean;
                    };
                  };
                };
                unmention_data: any;
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
                  result: {
                    __typename: string;
                    rest_id: string;
                    core: {
                      user_results: {
                        result: {
                          __typename: string;
                          id: string;
                          rest_id: string;
                          affiliates_highlighted_label: any;
                          has_graduated_access: boolean;
                          is_blue_verified: boolean;
                          profile_image_shape: string;
                          legacy: {
                            can_dm: boolean;
                            can_media_tag: boolean;
                            created_at: string;
                            default_profile: boolean;
                            default_profile_image: boolean;
                            description: string;
                            entities: {
                              description: {
                                urls: any[];
                              };
                              url?: {
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
                            profile_banner_url?: string;
                            profile_image_url_https: string;
                            profile_interstitial_type: string;
                            screen_name: string;
                            statuses_count: number;
                            translator_type: string;
                            url?: string;
                            verified: boolean;
                            want_retweets: boolean;
                            withheld_in_countries: any[];
                          };
                          tipjar_settings: {
                            is_enabled?: boolean;
                          };
                          super_follow_eligible?: boolean;
                        };
                      };
                    };
                    unmention_data: any;
                    edit_control: {
                      initial_tweet_id: string;
                      edit_control_initial: {
                        edit_tweet_ids: string[];
                        editable_until_msecs: string;
                        is_edit_eligible: boolean;
                        edits_remaining: string;
                      };
                    } | {
                      edit_tweet_ids: string[];
                      editable_until_msecs: string;
                      is_edit_eligible: boolean;
                      edits_remaining: string;
                    };
                    previous_counts?: {
                      bookmark_count: number;
                      favorite_count: number;
                      quote_count: number;
                      reply_count: number;
                      retweet_count: number;
                    };
                    is_translatable: boolean;
                    views: {
                      count: string;
                      state: string;
                    };
                    source: string;
                    note_tweet?: {
                      is_expandable: boolean;
                      note_tweet_results: {
                        result: {
                          id: string;
                          text: string;
                          entity_set: {
                            hashtags: any[];
                            symbols: any[];
                            urls: any[];
                            user_mentions: any[];
                          };
                          richtext: {
                            richtext_tags: any[];
                          };
                          media: {
                            inline_media: any[];
                          };
                        };
                      };
                    };
                    legacy: {
                      bookmark_count: number;
                      bookmarked: boolean;
                      created_at: string;
                      conversation_id_str: string;
                      display_text_range: number[];
                      entities: {
                        hashtags: any[];
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
                          features: {
                            large: {
                              faces: {
                                x: number;
                                y: number;
                                h: number;
                                w: number;
                              }[];
                            };
                            medium: {
                              faces: {
                                x: number;
                                y: number;
                                h: number;
                                w: number;
                              }[];
                            };
                            small: {
                              faces: {
                                x: number;
                                y: number;
                                h: number;
                                w: number;
                              }[];
                            };
                            orig: {
                              faces: {
                                x: number;
                                y: number;
                                h: number;
                                w: number;
                              }[];
                            };
                          };
                          sizes: {
                            large: {
                              w: number;
                              h: number;
                              resize: string;
                            };
                            medium: {
                              w: number;
                              h: number;
                              resize: string;
                            };
                            small: {
                              w: number;
                              h: number;
                              resize: string;
                            };
                            thumb: {
                              w: number;
                              h: number;
                              resize: string;
                            };
                          };
                          original_info: {
                            width: number;
                            height: number;
                            focus_rects: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                          allow_download_status: {
                            allow_download: boolean;
                          };
                          media_results: {
                            result: {
                              media_key: string;
                            };
                          };
                        }[];
                        symbols: any[];
                        timestamps: any[];
                        urls: any[];
                        user_mentions: {
                          id_str: string;
                          name: string;
                          screen_name: string;
                          indices: number[];
                        }[];
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
                          features: {
                            large: {
                              faces: {
                                x: number;
                                y: number;
                                h: number;
                                w: number;
                              }[];
                            };
                            medium: {
                              faces: {
                                x: number;
                                y: number;
                                h: number;
                                w: number;
                              }[];
                            };
                            small: {
                              faces: {
                                x: number;
                                y: number;
                                h: number;
                                w: number;
                              }[];
                            };
                            orig: {
                              faces: {
                                x: number;
                                y: number;
                                h: number;
                                w: number;
                              }[];
                            };
                          };
                          sizes: {
                            large: {
                              w: number;
                              h: number;
                              resize: string;
                            };
                            medium: {
                              w: number;
                              h: number;
                              resize: string;
                            };
                            small: {
                              w: number;
                              h: number;
                              resize: string;
                            };
                            thumb?: {
                              w: number;
                              h: number;
                              resize: string;
                            }
                            orig?: {
                              w: number;
                              h: number;
                              resize: string;
                            };
                          };
                          original_info: {
                            width: number;
                            height: number;
                            focus_rects: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                          allow_download_status: {
                            allow_download: boolean;
                          };
                          media_results: {
                            result: {
                              media_key: string;
                            };
                          };
                        }[];
                      };
                      favorite_count: number;
                      favorited: boolean;
                      full_text: string;
                      in_reply_to_screen_name?: string;
                      in_reply_to_status_id_str?: string;
                      in_reply_to_user_id_str?: string;
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
                  };
                };
                legacy: {
                  bookmark_count: number;
                  bookmarked: boolean;
                  created_at: string;
                  conversation_id_str: string;
                  display_text_range: number[];
                  entities: {
                    hashtags: any[];
                    media?: {
                      display_url: string;
                      expanded_url: string;
                      id_str: string;
                      indices: number[];
                      media_key: string;
                      media_url_https: string;
                      source_status_id_str?: string;
                      source_user_id_str?: string;
                      type: string;
                      url: string;
                      additional_media_info?: {
                        monetizable: boolean;
                        source_user?: {
                          user_results: {
                            result: {
                              __typename: string;
                              id: string;
                              rest_id: string;
                              affiliates_highlighted_label: any;
                              has_graduated_access: boolean;
                              is_blue_verified: boolean;
                              profile_image_shape: string;
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
                                      display_url: string;
                                      expanded_url: string;
                                      url: string;
                                      indices: number[];
                                    }[];
                                  };
                                  url?: {
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
                                profile_banner_url?: string;
                                profile_image_url_https: string;
                                profile_interstitial_type: string;
                                screen_name: string;
                                statuses_count: number;
                                translator_type: string;
                                url?: string;
                                verified: boolean;
                                verified_type?: string;
                                want_retweets: boolean;
                                withheld_in_countries: any[];
                              };
                              professional?: {
                                rest_id: string;
                                professional_type: string;
                                category: any[];
                              };
                              tipjar_settings: any;
                              super_follow_eligible?: boolean;
                            };
                          };
                        };
                      };
                      ext_media_availability: {
                        status: string;
                      };
                      features?: {
                        large: {
                          faces: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                        medium: {
                          faces: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                        small: {
                          faces: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                        orig: {
                          faces: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                      };
                      sizes: {
                        large: {
                          w: number;
                          h: number;
                          resize: string;
                        };
                        medium: {
                          w: number;
                          h: number;
                          resize: string;
                        };
                        small: {
                          w: number;
                          h: number;
                          resize: string;
                        };
                        thumb: {
                          w: number;
                          h: number;
                          resize: string;
                        };
                      };
                      original_info: {
                        width: number;
                        height: number;
                        focus_rects: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                      allow_download_status?: {
                        allow_download: boolean;
                      };
                      video_info?: {
                        aspect_ratio: number[];
                        duration_millis: number;
                        variants: {
                          bitrate?: number;
                          content_type: string;
                          url: string;
                        }[];
                      };
                      media_results: {
                        result: {
                          media_key: string;
                        };
                      };
                    }[];
                    symbols: any[];
                    timestamps: any[];
                    urls: any[];
                    user_mentions: {
                      id_str: string;
                      name: string;
                      screen_name: string;
                      indices: number[];
                    }[];
                  };
                  extended_entities?: {
                    media: {
                      display_url: string;
                      expanded_url: string;
                      id_str: string;
                      indices: number[];
                      media_key: string;
                      media_url_https: string;
                      source_status_id_str?: string;
                      source_user_id_str?: string;
                      type: string;
                      url: string;
                      additional_media_info?: {
                        monetizable: boolean;
                        source_user?: {
                          user_results: {
                            result: {
                              __typename: string;
                              id: string;
                              rest_id: string;
                              affiliates_highlighted_label: any;
                              has_graduated_access: boolean;
                              is_blue_verified: boolean;
                              profile_image_shape: string;
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
                                      display_url: string;
                                      expanded_url: string;
                                      url: string;
                                      indices: number[];
                                    }[];
                                  };
                                  url?: {
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
                                profile_banner_url?: string;
                                profile_image_url_https: string;
                                profile_interstitial_type: string;
                                screen_name: string;
                                statuses_count: number;
                                translator_type: string;
                                url?: string;
                                verified: boolean;
                                verified_type?: string;
                                want_retweets: boolean;
                                withheld_in_countries: any[];
                              };
                              professional?: {
                                rest_id: string;
                                professional_type: string;
                                category: any[];
                              };
                              tipjar_settings: any;
                              super_follow_eligible?: boolean;
                            };
                          };
                        };
                      };
                      ext_media_availability: {
                        status: string;
                      };
                      features?: {
                        large: {
                          faces: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                        medium: {
                          faces: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                        small: {
                          faces: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                        orig: {
                          faces: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                      };
                      sizes: {
                        large: {
                          w: number;
                          h: number;
                          resize: string;
                        };
                        medium: {
                          w: number;
                          h: number;
                          resize: string;
                        };
                        small: {
                          w: number;
                          h: number;
                          resize: string;
                        };
                        thumb?: {
                          w: number;
                          h: number;
                          resize: string;
                        }
                        orig?: {
                          w: number;
                          h: number;
                          resize: string;
                        };
                      };
                      original_info: {
                        width: number;
                        height: number;
                        focus_rects: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                      allow_download_status?: {
                        allow_download: boolean;
                      };
                      video_info?: {
                        aspect_ratio: number[];
                        duration_millis: number;
                        variants: {
                          bitrate?: number;
                          content_type: string;
                          url: string;
                        }[];
                      };
                      media_results: {
                        result: {
                          media_key: string;
                        };
                      };
                    }[];
                  };
                  favorite_count: number;
                  favorited: boolean;
                  full_text: string;
                  in_reply_to_screen_name?: string;
                  in_reply_to_status_id_str?: string;
                  in_reply_to_user_id_str?: string;
                  is_quote_status: boolean;
                  lang: string;
                  possibly_sensitive?: boolean;
                  possibly_sensitive_editable?: boolean;
                  quote_count: number;
                  quoted_status_id_str?: string;
                  quoted_status_permalink?: {
                    display: string;
                    expanded: string;
                    url: string;  
                  };
                  reply_count: number;
                  retweet_count: number;
                  retweeted: boolean;
                  user_id_str: string;
                  id_str: string;
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
              rest_id: string;
              core: {
                user_results: {
                  result: {
                    __typename: string;
                    id: string;
                    rest_id: string;
                    affiliates_highlighted_label: any;
                    has_graduated_access: boolean;
                    is_blue_verified: boolean;
                    profile_image_shape: string;
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
                            display_url: string;
                            expanded_url: string;
                            url: string;
                            indices: number[];
                          }[];
                        };
                        url?: {
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
                      profile_banner_url?: string;
                      profile_image_url_https: string;
                      profile_interstitial_type: string;
                      screen_name: string;
                      statuses_count: number;
                      translator_type: string;
                      url?: string;
                      verified: boolean;
                      verified_type?: string;
                      want_retweets: boolean;
                      withheld_in_countries: any[];
                    };
                    professional?: {
                      rest_id: string;
                      professional_type: string;
                      category: any[];
                    };
                    tipjar_settings: any;
                    super_follow_eligible?: boolean;
                  };
                };
              };
              unmention_data: any;
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
                result: {
                  __typename: string;
                  rest_id: string;
                  core: {
                    user_results: {
                      result: {
                        __typename: string;
                        id: string;
                        rest_id: string;
                        affiliates_highlighted_label: any;
                        has_graduated_access: boolean;
                        is_blue_verified: boolean;
                        profile_image_shape: string;
                        legacy: {
                          can_dm: boolean;
                          can_media_tag: boolean;
                          created_at: string;
                          default_profile: boolean;
                          default_profile_image: boolean;
                          description: string;
                          entities: {
                            description: {
                              urls: any[];
                            };
                            url?: {
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
                          profile_banner_url?: string;
                          profile_image_url_https: string;
                          profile_interstitial_type: string;
                          screen_name: string;
                          statuses_count: number;
                          translator_type: string;
                          url?: string;
                          verified: boolean;
                          want_retweets: boolean;
                          withheld_in_countries: any[];
                        };
                        tipjar_settings: {
                          is_enabled?: boolean;
                        };
                        super_follow_eligible?: boolean;
                      };
                    };
                  };
                  unmention_data: any;
                  edit_control: {
                    initial_tweet_id: string;
                    edit_control_initial: {
                      edit_tweet_ids: string[];
                      editable_until_msecs: string;
                      is_edit_eligible: boolean;
                      edits_remaining: string;
                    };
                  } | {
                    edit_tweet_ids: string[];
                    editable_until_msecs: string;
                    is_edit_eligible: boolean;
                    edits_remaining: string;
                  };
                  previous_counts?: {
                    bookmark_count: number;
                    favorite_count: number;
                    quote_count: number;
                    reply_count: number;
                    retweet_count: number;
                  };
                  is_translatable: boolean;
                  views: {
                    count: string;
                    state: string;
                  };
                  source: string;
                  note_tweet?: {
                    is_expandable: boolean;
                    note_tweet_results: {
                      result: {
                        id: string;
                        text: string;
                        entity_set: {
                          hashtags: any[];
                          symbols: any[];
                          urls: any[];
                          user_mentions: any[];
                        };
                        richtext: {
                          richtext_tags: any[];
                        };
                        media: {
                          inline_media: any[];
                        };
                      };
                    };
                  };
                  legacy: {
                    bookmark_count: number;
                    bookmarked: boolean;
                    created_at: string;
                    conversation_id_str: string;
                    display_text_range: number[];
                    entities: {
                      hashtags: any[];
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
                        features: {
                          large: {
                            faces: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                          medium: {
                            faces: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                          small: {
                            faces: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                          orig: {
                            faces: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                        };
                        sizes: {
                          large: {
                            w: number;
                            h: number;
                            resize: string;
                          };
                          medium: {
                            w: number;
                            h: number;
                            resize: string;
                          };
                          small: {
                            w: number;
                            h: number;
                            resize: string;
                          };
                          thumb: {
                            w: number;
                            h: number;
                            resize: string;
                          };
                        };
                        original_info: {
                          width: number;
                          height: number;
                          focus_rects: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                        allow_download_status: {
                          allow_download: boolean;
                        };
                        media_results: {
                          result: {
                            media_key: string;
                          };
                        };
                      }[];
                      symbols: any[];
                      timestamps: any[];
                      urls: any[];
                      user_mentions: {
                        id_str: string;
                        name: string;
                        screen_name: string;
                        indices: number[];
                      }[];
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
                        features: {
                          large: {
                            faces: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                          medium: {
                            faces: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                          small: {
                            faces: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                          orig: {
                            faces: {
                              x: number;
                              y: number;
                              h: number;
                              w: number;
                            }[];
                          };
                        };
                        sizes: {
                          large: {
                            w: number;
                            h: number;
                            resize: string;
                          };
                          medium: {
                            w: number;
                            h: number;
                            resize: string;
                          };
                          small: {
                            w: number;
                            h: number;
                            resize: string;
                          };
                          thumb?: {
                            w: number;
                            h: number;
                            resize: string;
                          }
                          orig?: {
                            w: number;
                            h: number;
                            resize: string;
                          };
                        };
                        original_info: {
                          width: number;
                          height: number;
                          focus_rects: {
                            x: number;
                            y: number;
                            h: number;
                            w: number;
                          }[];
                        };
                        allow_download_status: {
                          allow_download: boolean;
                        };
                        media_results: {
                          result: {
                            media_key: string;
                          };
                        };
                      }[];
                    };
                    favorite_count: number;
                    favorited: boolean;
                    full_text: string;
                    in_reply_to_screen_name?: string;
                    in_reply_to_status_id_str?: string;
                    in_reply_to_user_id_str?: string;
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
                };
              };
              legacy: {
                bookmark_count: number;
                bookmarked: boolean;
                created_at: string;
                conversation_id_str: string;
                display_text_range: number[];
                entities: {
                  hashtags: any[];
                  media?: {
                    display_url: string;
                    expanded_url: string;
                    id_str: string;
                    indices: number[];
                    media_key: string;
                    media_url_https: string;
                    source_status_id_str?: string;
                    source_user_id_str?: string;
                    type: string;
                    url: string;
                    additional_media_info?: {
                      monetizable: boolean;
                      source_user?: {
                        user_results: {
                          result: {
                            __typename: string;
                            id: string;
                            rest_id: string;
                            affiliates_highlighted_label: any;
                            has_graduated_access: boolean;
                            is_blue_verified: boolean;
                            profile_image_shape: string;
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
                                    display_url: string;
                                    expanded_url: string;
                                    url: string;
                                    indices: number[];
                                  }[];
                                };
                                url?: {
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
                              profile_banner_url?: string;
                              profile_image_url_https: string;
                              profile_interstitial_type: string;
                              screen_name: string;
                              statuses_count: number;
                              translator_type: string;
                              url?: string;
                              verified: boolean;
                              verified_type?: string;
                              want_retweets: boolean;
                              withheld_in_countries: any[];
                            };
                            professional?: {
                              rest_id: string;
                              professional_type: string;
                              category: any[];
                            };
                            tipjar_settings: any;
                            super_follow_eligible?: boolean;
                          };
                        };
                      };
                    };
                    ext_media_availability: {
                      status: string;
                    };
                    features?: {
                      large: {
                        faces: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                      medium: {
                        faces: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                      small: {
                        faces: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                      orig: {
                        faces: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                    };
                    sizes: {
                      large: {
                        w: number;
                        h: number;
                        resize: string;
                      };
                      medium: {
                        w: number;
                        h: number;
                        resize: string;
                      };
                      small: {
                        w: number;
                        h: number;
                        resize: string;
                      };
                      thumb: {
                        w: number;
                        h: number;
                        resize: string;
                      };
                    };
                    original_info: {
                      width: number;
                      height: number;
                      focus_rects: {
                        x: number;
                        y: number;
                        h: number;
                        w: number;
                      }[];
                    };
                    allow_download_status?: {
                      allow_download: boolean;
                    };
                    video_info?: {
                      aspect_ratio: number[];
                      duration_millis: number;
                      variants: {
                        bitrate?: number;
                        content_type: string;
                        url: string;
                      }[];
                    };
                    media_results: {
                      result: {
                        media_key: string;
                      };
                    };
                  }[];
                  symbols: any[];
                  timestamps: any[];
                  urls: any[];
                  user_mentions: {
                    id_str: string;
                    name: string;
                    screen_name: string;
                    indices: number[];
                  }[];
                };
                extended_entities?: {
                  media: {
                    display_url: string;
                    expanded_url: string;
                    id_str: string;
                    indices: number[];
                    media_key: string;
                    media_url_https: string;
                    source_status_id_str?: string;
                    source_user_id_str?: string;
                    type: string;
                    url: string;
                    additional_media_info?: {
                      monetizable: boolean;
                      source_user?: {
                        user_results: {
                          result: {
                            __typename: string;
                            id: string;
                            rest_id: string;
                            affiliates_highlighted_label: any;
                            has_graduated_access: boolean;
                            is_blue_verified: boolean;
                            profile_image_shape: string;
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
                                    display_url: string;
                                    expanded_url: string;
                                    url: string;
                                    indices: number[];
                                  }[];
                                };
                                url?: {
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
                              profile_banner_url?: string;
                              profile_image_url_https: string;
                              profile_interstitial_type: string;
                              screen_name: string;
                              statuses_count: number;
                              translator_type: string;
                              url?: string;
                              verified: boolean;
                              verified_type?: string;
                              want_retweets: boolean;
                              withheld_in_countries: any[];
                            };
                            professional?: {
                              rest_id: string;
                              professional_type: string;
                              category: any[];
                            };
                            tipjar_settings: any;
                            super_follow_eligible?: boolean;
                          };
                        };
                      };
                    };
                    ext_media_availability: {
                      status: string;
                    };
                    features?: {
                      large: {
                        faces: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                      medium: {
                        faces: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                      small: {
                        faces: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                      orig: {
                        faces: {
                          x: number;
                          y: number;
                          h: number;
                          w: number;
                        }[];
                      };
                    };
                    sizes: {
                      large: {
                        w: number;
                        h: number;
                        resize: string;
                      };
                      medium: {
                        w: number;
                        h: number;
                        resize: string;
                      };
                      small: {
                        w: number;
                        h: number;
                        resize: string;
                      };
                      thumb?: {
                        w: number;
                        h: number;
                        resize: string;
                      }
                      orig?: {
                        w: number;
                        h: number;
                        resize: string;
                      };
                    };
                    original_info: {
                      width: number;
                      height: number;
                      focus_rects: {
                        x: number;
                        y: number;
                        h: number;
                        w: number;
                      }[];
                    };
                    allow_download_status?: {
                      allow_download: boolean;
                    };
                    video_info?: {
                      aspect_ratio: number[];
                      duration_millis: number;
                      variants: {
                        bitrate?: number;
                        content_type: string;
                        url: string;
                      }[];
                    };
                    media_results: {
                      result: {
                        media_key: string;
                      };
                    };
                  }[];
                };
                favorite_count: number;
                favorited: boolean;
                full_text: string;
                in_reply_to_screen_name?: string;
                in_reply_to_status_id_str?: string;
                in_reply_to_user_id_str?: string;
                is_quote_status: boolean;
                lang: string;
                possibly_sensitive?: boolean;
                possibly_sensitive_editable?: boolean;
                quote_count: number;
                quoted_status_id_str?: string;
                quoted_status_permalink?: {
                  display: string;
                  expanded: string;
                  url: string;  
                };
                reply_count: number;
                retweet_count: number;
                retweeted: boolean;
                user_id_str: string;
                id_str: string;
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

// let one: RawTweetData = {
//   "entryId": "profile-grid-0",
//   "sortIndex": "1808454798052163584",
//   "content": {
//     "entryType": "TimelineTimelineModule",
//     "__typename": "TimelineTimelineModule",
//     "items": [
//       {
//         "entryId": "profile-grid-0-tweet-1808168603721650364",
//         "item": {
//           "itemContent": {
//             "itemType": "TimelineTweet",
//             "__typename": "TimelineTweet",
//             "tweet_results": {
//               "result": {
//                 "__typename": "Tweet",
//                 "rest_id": "1808168603721650364",
//                 "core": {
//                   "user_results": {
//                     "result": {
//                       "__typename": "User",
//                       "id": "VXNlcjo0NDE5NjM5Nw==",
//                       "rest_id": "44196397",
//                       "affiliates_highlighted_label": {
//                         "label": {
//                           "url": {
//                             "url": "https://twitter.com/X",
//                             "urlType": "DeepLink"
//                           },
//                           "badge": {
//                             "url": "https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_bigger.jpg"
//                           },
//                           "description": "X",
//                           "userLabelType": "BusinessLabel",
//                           "userLabelDisplayType": "Badge"
//                         }
//                       },
//                       "has_graduated_access": true,
//                       "is_blue_verified": true,
//                       "profile_image_shape": "Circle",
//                       "legacy": {
//                         "can_dm": false,
//                         "can_media_tag": false,
//                         "created_at": "Tue Jun 02 20:12:29 +0000 2009",
//                         "default_profile": false,
//                         "default_profile_image": false,
//                         "description": "",
//                         "entities": {
//                           "description": {
//                             "urls": []
//                           }
//                         },
//                         "fast_followers_count": 0,
//                         "favourites_count": 58629,
//                         "followers_count": 188594413,
//                         "friends_count": 650,
//                         "has_custom_timelines": true,
//                         "is_translator": false,
//                         "listed_count": 151616,
//                         "location": "",
//                         "media_count": 2277,
//                         "name": "Elon Musk",
//                         "normal_followers_count": 188594413,
//                         "pinned_tweet_ids_str": [
//                           "1808168603721650364"
//                         ],
//                         "possibly_sensitive": false,
//                         "profile_banner_url": "https://pbs.twimg.com/profile_banners/44196397/1690621312",
//                         "profile_image_url_https": "https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_normal.jpg",
//                         "profile_interstitial_type": "",
//                         "screen_name": "elonmusk",
//                         "statuses_count": 46513,
//                         "translator_type": "none",
//                         "verified": false,
//                         "want_retweets": false,
//                         "withheld_in_countries": []
//                       },
//                       "professional": {
//                         "rest_id": "1679729435447275522",
//                         "professional_type": "Creator",
//                         "category": []
//                       },
//                       "tipjar_settings": {},
//                       "super_follow_eligible": true
//                     }
//                   }
//                 },
//                 "unmention_data": {},
//                 "edit_control": {
//                   "edit_tweet_ids": [
//                     "1808168603721650364"
//                   ],
//                   "editable_until_msecs": "1719939563000",
//                   "is_edit_eligible": true,
//                   "edits_remaining": "5"
//                 },
//                 "is_translatable": false,
//                 "views": {
//                   "count": "32393301",
//                   "state": "EnabledWithCount"
//                 },
//                 "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
//                 "legacy": {
//                   "bookmark_count": 5099,
//                   "bookmarked": false,
//                   "created_at": "Tue Jul 02 15:59:23 +0000 2024",
//                   "conversation_id_str": "1808168603721650364",
//                   "display_text_range": [
//                     0,
//                     57
//                   ],
//                   "entities": {
//                     "hashtags": [],
//                     "media": [
//                       {
//                         "display_url": "pic.x.com/tria13twdy",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1808168603721650364/photo/1",
//                         "id_str": "1808168600894689280",
//                         "indices": [
//                           58,
//                           81
//                         ],
//                         "media_key": "3_1808168600894689280",
//                         "media_url_https": "https://pbs.twimg.com/media/GRfnwy5X0AAwIK2.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/TRIa13TWdY",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 355,
//                             "w": 712,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 355,
//                             "w": 712,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 339,
//                             "w": 680,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 355,
//                           "width": 712,
//                           "focus_rects": [
//                             {
//                               "x": 20,
//                               "y": 0,
//                               "w": 634,
//                               "h": 355
//                             },
//                             {
//                               "x": 160,
//                               "y": 0,
//                               "w": 355,
//                               "h": 355
//                             },
//                             {
//                               "x": 182,
//                               "y": 0,
//                               "w": 311,
//                               "h": 355
//                             },
//                             {
//                               "x": 248,
//                               "y": 0,
//                               "w": 178,
//                               "h": 355
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 712,
//                               "h": 355
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1808168600894689280"
//                           }
//                         }
//                       }
//                     ],
//                     "symbols": [],
//                     "timestamps": [],
//                     "urls": [],
//                     "user_mentions": []
//                   },
//                   "extended_entities": {
//                     "media": [
//                       {
//                         "display_url": "pic.twitter.com/TRIa13TWdY",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1808168603721650364/photo/1",
//                         "id_str": "1808168600894689280",
//                         "indices": [
//                           58,
//                           81
//                         ],
//                         "media_key": "3_1808168600894689280",
//                         "media_url_https": "https://pbs.twimg.com/media/GRfnwy5X0AAwIK2.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/TRIa13TWdY",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 355,
//                             "w": 712,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 355,
//                             "w": 712,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 339,
//                             "w": 680,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 355,
//                           "width": 712,
//                           "focus_rects": [
//                             {
//                               "x": 20,
//                               "y": 0,
//                               "w": 634,
//                               "h": 355
//                             },
//                             {
//                               "x": 160,
//                               "y": 0,
//                               "w": 355,
//                               "h": 355
//                             },
//                             {
//                               "x": 182,
//                               "y": 0,
//                               "w": 311,
//                               "h": 355
//                             },
//                             {
//                               "x": 248,
//                               "y": 0,
//                               "w": 178,
//                               "h": 355
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 712,
//                               "h": 355
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1808168600894689280"
//                           }
//                         }
//                       }
//                     ]
//                   },
//                   "favorite_count": 223390,
//                   "favorited": false,
//                   "full_text": "The New York Times is attacking *your* freedom of speech! https://t.co/TRIa13TWdY",
//                   "is_quote_status": false,
//                   "lang": "en",
//                   "possibly_sensitive": false,
//                   "possibly_sensitive_editable": true,
//                   "quote_count": 2658,
//                   "reply_count": 20558,
//                   "retweet_count": 45852,
//                   "retweeted": false,
//                   "user_id_str": "44196397",
//                   "id_str": "1808168603721650364"
//                 }
//               }
//             },
//             "tweetDisplayType": "MediaGrid"
//           }
//         }
//       },
//       {
//         "entryId": "profile-grid-0-tweet-1807761917274214899",
//         "item": {
//           "itemContent": {
//             "itemType": "TimelineTweet",
//             "__typename": "TimelineTweet",
//             "tweet_results": {
//               "result": {
//                 "__typename": "Tweet",
//                 "rest_id": "1807761917274214899",
//                 "core": {
//                   "user_results": {
//                     "result": {
//                       "__typename": "User",
//                       "id": "VXNlcjo0NDE5NjM5Nw==",
//                       "rest_id": "44196397",
//                       "affiliates_highlighted_label": {
//                         "label": {
//                           "url": {
//                             "url": "https://twitter.com/X",
//                             "urlType": "DeepLink"
//                           },
//                           "badge": {
//                             "url": "https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_bigger.jpg"
//                           },
//                           "description": "X",
//                           "userLabelType": "BusinessLabel",
//                           "userLabelDisplayType": "Badge"
//                         }
//                       },
//                       "has_graduated_access": true,
//                       "is_blue_verified": true,
//                       "profile_image_shape": "Circle",
//                       "legacy": {
//                         "can_dm": false,
//                         "can_media_tag": false,
//                         "created_at": "Tue Jun 02 20:12:29 +0000 2009",
//                         "default_profile": false,
//                         "default_profile_image": false,
//                         "description": "",
//                         "entities": {
//                           "description": {
//                             "urls": []
//                           }
//                         },
//                         "fast_followers_count": 0,
//                         "favourites_count": 58629,
//                         "followers_count": 188594413,
//                         "friends_count": 650,
//                         "has_custom_timelines": true,
//                         "is_translator": false,
//                         "listed_count": 151616,
//                         "location": "",
//                         "media_count": 2277,
//                         "name": "Elon Musk",
//                         "normal_followers_count": 188594413,
//                         "pinned_tweet_ids_str": [
//                           "1808168603721650364"
//                         ],
//                         "possibly_sensitive": false,
//                         "profile_banner_url": "https://pbs.twimg.com/profile_banners/44196397/1690621312",
//                         "profile_image_url_https": "https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_normal.jpg",
//                         "profile_interstitial_type": "",
//                         "screen_name": "elonmusk",
//                         "statuses_count": 46513,
//                         "translator_type": "none",
//                         "verified": false,
//                         "want_retweets": false,
//                         "withheld_in_countries": []
//                       },
//                       "professional": {
//                         "rest_id": "1679729435447275522",
//                         "professional_type": "Creator",
//                         "category": []
//                       },
//                       "tipjar_settings": {},
//                       "super_follow_eligible": true
//                     }
//                   }
//                 },
//                 "unmention_data": {},
//                 "edit_control": {
//                   "edit_tweet_ids": [
//                     "1807761917274214899"
//                   ],
//                   "editable_until_msecs": "1719842602000",
//                   "is_edit_eligible": true,
//                   "edits_remaining": "5"
//                 },
//                 "is_translatable": false,
//                 "views": {
//                   "count": "60186431",
//                   "state": "EnabledWithCount"
//                 },
//                 "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
//                 "legacy": {
//                   "bookmark_count": 13688,
//                   "bookmarked": false,
//                   "created_at": "Mon Jul 01 13:03:22 +0000 2024",
//                   "conversation_id_str": "1807761917274214899",
//                   "display_text_range": [
//                     0,
//                     125
//                   ],
//                   "entities": {
//                     "hashtags": [],
//                     "media": [
//                       {
//                         "display_url": "pic.x.com/wp7h4ajfwg",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1807761917274214899/photo/1",
//                         "id_str": "1807761913390194688",
//                         "indices": [
//                           126,
//                           149
//                         ],
//                         "media_key": "3_1807761913390194688",
//                         "media_url_https": "https://pbs.twimg.com/media/GRZ14d4aYAAAzHT.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/wP7H4AJFwG",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 1050,
//                             "w": 1220,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 1033,
//                             "w": 1200,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 585,
//                             "w": 680,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 1050,
//                           "width": 1220,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1220,
//                               "h": 683
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1050,
//                               "h": 1050
//                             },
//                             {
//                               "x": 58,
//                               "y": 0,
//                               "w": 921,
//                               "h": 1050
//                             },
//                             {
//                               "x": 256,
//                               "y": 0,
//                               "w": 525,
//                               "h": 1050
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1220,
//                               "h": 1050
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1807761913390194688"
//                           }
//                         }
//                       }
//                     ],
//                     "symbols": [],
//                     "timestamps": [],
//                     "urls": [],
//                     "user_mentions": []
//                   },
//                   "extended_entities": {
//                     "media": [
//                       {
//                         "display_url": "pic.twitter.com/wP7H4AJFwG",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1807761917274214899/photo/1",
//                         "id_str": "1807761913390194688",
//                         "indices": [
//                           126,
//                           149
//                         ],
//                         "media_key": "3_1807761913390194688",
//                         "media_url_https": "https://pbs.twimg.com/media/GRZ14d4aYAAAzHT.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/wP7H4AJFwG",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 1050,
//                             "w": 1220,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 1033,
//                             "w": 1200,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 585,
//                             "w": 680,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 1050,
//                           "width": 1220,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1220,
//                               "h": 683
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1050,
//                               "h": 1050
//                             },
//                             {
//                               "x": 58,
//                               "y": 0,
//                               "w": 921,
//                               "h": 1050
//                             },
//                             {
//                               "x": 256,
//                               "y": 0,
//                               "w": 525,
//                               "h": 1050
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1220,
//                               "h": 1050
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1807761913390194688"
//                           }
//                         }
//                       }
//                     ]
//                   },
//                   "favorite_count": 620386,
//                   "favorited": false,
//                   "full_text": "When will politicians, or at least the intern who runs their account, learn that lying on this platform doesn’t work anymore? https://t.co/wP7H4AJFwG",
//                   "is_quote_status": false,
//                   "lang": "en",
//                   "possibly_sensitive": false,
//                   "possibly_sensitive_editable": true,
//                   "quote_count": 6826,
//                   "reply_count": 35428,
//                   "retweet_count": 101855,
//                   "retweeted": false,
//                   "user_id_str": "44196397",
//                   "id_str": "1807761917274214899"
//                 }
//               }
//             },
//             "tweetDisplayType": "MediaGrid"
//           }
//         }
//       },
//       {
//         "entryId": "profile-grid-0-tweet-1807592957798912112",
//         "item": {
//           "itemContent": {
//             "itemType": "TimelineTweet",
//             "__typename": "TimelineTweet",
//             "tweet_results": {
//               "result": {
//                 "__typename": "Tweet",
//                 "rest_id": "1807592957798912112",
//                 "core": {
//                   "user_results": {
//                     "result": {
//                       "__typename": "User",
//                       "id": "VXNlcjo0NDE5NjM5Nw==",
//                       "rest_id": "44196397",
//                       "affiliates_highlighted_label": {
//                         "label": {
//                           "url": {
//                             "url": "https://twitter.com/X",
//                             "urlType": "DeepLink"
//                           },
//                           "badge": {
//                             "url": "https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_bigger.jpg"
//                           },
//                           "description": "X",
//                           "userLabelType": "BusinessLabel",
//                           "userLabelDisplayType": "Badge"
//                         }
//                       },
//                       "has_graduated_access": true,
//                       "is_blue_verified": true,
//                       "profile_image_shape": "Circle",
//                       "legacy": {
//                         "can_dm": false,
//                         "can_media_tag": false,
//                         "created_at": "Tue Jun 02 20:12:29 +0000 2009",
//                         "default_profile": false,
//                         "default_profile_image": false,
//                         "description": "",
//                         "entities": {
//                           "description": {
//                             "urls": []
//                           }
//                         },
//                         "fast_followers_count": 0,
//                         "favourites_count": 58629,
//                         "followers_count": 188594413,
//                         "friends_count": 650,
//                         "has_custom_timelines": true,
//                         "is_translator": false,
//                         "listed_count": 151616,
//                         "location": "",
//                         "media_count": 2277,
//                         "name": "Elon Musk",
//                         "normal_followers_count": 188594413,
//                         "pinned_tweet_ids_str": [
//                           "1808168603721650364"
//                         ],
//                         "possibly_sensitive": false,
//                         "profile_banner_url": "https://pbs.twimg.com/profile_banners/44196397/1690621312",
//                         "profile_image_url_https": "https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_normal.jpg",
//                         "profile_interstitial_type": "",
//                         "screen_name": "elonmusk",
//                         "statuses_count": 46513,
//                         "translator_type": "none",
//                         "verified": false,
//                         "want_retweets": false,
//                         "withheld_in_countries": []
//                       },
//                       "professional": {
//                         "rest_id": "1679729435447275522",
//                         "professional_type": "Creator",
//                         "category": []
//                       },
//                       "tipjar_settings": {},
//                       "super_follow_eligible": true
//                     }
//                   }
//                 },
//                 "unmention_data": {},
//                 "edit_control": {
//                   "edit_tweet_ids": [
//                     "1807592957798912112"
//                   ],
//                   "editable_until_msecs": "1719802319000",
//                   "is_edit_eligible": false,
//                   "edits_remaining": "5"
//                 },
//                 "is_translatable": false,
//                 "views": {
//                   "count": "81386",
//                   "state": "EnabledWithCount"
//                 },
//                 "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
//                 "legacy": {
//                   "bookmark_count": 49,
//                   "bookmarked": false,
//                   "created_at": "Mon Jul 01 01:51:59 +0000 2024",
//                   "conversation_id_str": "1807576544199770226",
//                   "display_text_range": [
//                     16,
//                     16
//                   ],
//                   "entities": {
//                     "hashtags": [],
//                     "media": [
//                       {
//                         "display_url": "pic.x.com/gus2d5o7ib",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1807592957798912112/photo/1",
//                         "id_str": "1807592955039064065",
//                         "indices": [
//                           17,
//                           40
//                         ],
//                         "media_key": "3_1807592955039064065",
//                         "media_url_https": "https://pbs.twimg.com/media/GRXcNy-aIAEngmT.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/gus2D5o7Ib",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 169,
//                             "w": 298,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 169,
//                             "w": 298,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 169,
//                             "w": 298,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 169,
//                           "width": 298,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 298,
//                               "h": 167
//                             },
//                             {
//                               "x": 117,
//                               "y": 0,
//                               "w": 169,
//                               "h": 169
//                             },
//                             {
//                               "x": 127,
//                               "y": 0,
//                               "w": 148,
//                               "h": 169
//                             },
//                             {
//                               "x": 159,
//                               "y": 0,
//                               "w": 85,
//                               "h": 169
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 298,
//                               "h": 169
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1807592955039064065"
//                           }
//                         }
//                       }
//                     ],
//                     "symbols": [],
//                     "timestamps": [],
//                     "urls": [],
//                     "user_mentions": [
//                       {
//                         "id_str": "1355945100216573952",
//                         "name": "Sir Doge of the Coin ⚔️",
//                         "screen_name": "dogeofficialceo",
//                         "indices": [
//                           0,
//                           16
//                         ]
//                       }
//                     ]
//                   },
//                   "extended_entities": {
//                     "media": [
//                       {
//                         "display_url": "pic.twitter.com/gus2D5o7Ib",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1807592957798912112/photo/1",
//                         "id_str": "1807592955039064065",
//                         "indices": [
//                           17,
//                           40
//                         ],
//                         "media_key": "3_1807592955039064065",
//                         "media_url_https": "https://pbs.twimg.com/media/GRXcNy-aIAEngmT.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/gus2D5o7Ib",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 169,
//                             "w": 298,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 169,
//                             "w": 298,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 169,
//                             "w": 298,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 169,
//                           "width": 298,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 298,
//                               "h": 167
//                             },
//                             {
//                               "x": 117,
//                               "y": 0,
//                               "w": 169,
//                               "h": 169
//                             },
//                             {
//                               "x": 127,
//                               "y": 0,
//                               "w": 148,
//                               "h": 169
//                             },
//                             {
//                               "x": 159,
//                               "y": 0,
//                               "w": 85,
//                               "h": 169
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 298,
//                               "h": 169
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1807592955039064065"
//                           }
//                         }
//                       }
//                     ]
//                   },
//                   "favorite_count": 1704,
//                   "favorited": false,
//                   "full_text": "@dogeofficialceo https://t.co/gus2D5o7Ib",
//                   "in_reply_to_screen_name": "dogeofficialceo",
//                   "in_reply_to_status_id_str": "1807576544199770226",
//                   "in_reply_to_user_id_str": "1355945100216573952",
//                   "is_quote_status": false,
//                   "lang": "qme",
//                   "possibly_sensitive": false,
//                   "possibly_sensitive_editable": true,
//                   "quote_count": 19,
//                   "reply_count": 262,
//                   "retweet_count": 156,
//                   "retweeted": false,
//                   "user_id_str": "44196397",
//                   "id_str": "1807592957798912112"
//                 },
//                 "superFollowsReplyUserResult": {
//                   "result": {
//                     "__typename": "User",
//                     "legacy": {
//                       "screen_name": "dogeofficialceo"
//                     }
//                   }
//                 }
//               }
//             },
//             "tweetDisplayType": "MediaGrid"
//           }
//         }
//       },
//       {
//         "entryId": "profile-grid-0-tweet-1806915216460111975",
//         "item": {
//           "itemContent": {
//             "itemType": "TimelineTweet",
//             "__typename": "TimelineTweet",
//             "tweet_results": {
//               "result": {
//                 "__typename": "Tweet",
//                 "rest_id": "1806915216460111975",
//                 "core": {
//                   "user_results": {
//                     "result": {
//                       "__typename": "User",
//                       "id": "VXNlcjo0NDE5NjM5Nw==",
//                       "rest_id": "44196397",
//                       "affiliates_highlighted_label": {
//                         "label": {
//                           "url": {
//                             "url": "https://twitter.com/X",
//                             "urlType": "DeepLink"
//                           },
//                           "badge": {
//                             "url": "https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_bigger.jpg"
//                           },
//                           "description": "X",
//                           "userLabelType": "BusinessLabel",
//                           "userLabelDisplayType": "Badge"
//                         }
//                       },
//                       "has_graduated_access": true,
//                       "is_blue_verified": true,
//                       "profile_image_shape": "Circle",
//                       "legacy": {
//                         "can_dm": false,
//                         "can_media_tag": false,
//                         "created_at": "Tue Jun 02 20:12:29 +0000 2009",
//                         "default_profile": false,
//                         "default_profile_image": false,
//                         "description": "",
//                         "entities": {
//                           "description": {
//                             "urls": []
//                           }
//                         },
//                         "fast_followers_count": 0,
//                         "favourites_count": 58629,
//                         "followers_count": 188594413,
//                         "friends_count": 650,
//                         "has_custom_timelines": true,
//                         "is_translator": false,
//                         "listed_count": 151616,
//                         "location": "",
//                         "media_count": 2277,
//                         "name": "Elon Musk",
//                         "normal_followers_count": 188594413,
//                         "pinned_tweet_ids_str": [
//                           "1808168603721650364"
//                         ],
//                         "possibly_sensitive": false,
//                         "profile_banner_url": "https://pbs.twimg.com/profile_banners/44196397/1690621312",
//                         "profile_image_url_https": "https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_normal.jpg",
//                         "profile_interstitial_type": "",
//                         "screen_name": "elonmusk",
//                         "statuses_count": 46513,
//                         "translator_type": "none",
//                         "verified": false,
//                         "want_retweets": false,
//                         "withheld_in_countries": []
//                       },
//                       "professional": {
//                         "rest_id": "1679729435447275522",
//                         "professional_type": "Creator",
//                         "category": []
//                       },
//                       "tipjar_settings": {},
//                       "super_follow_eligible": true
//                     }
//                   }
//                 },
//                 "unmention_data": {},
//                 "edit_control": {
//                   "edit_tweet_ids": [
//                     "1806915216460111975"
//                   ],
//                   "editable_until_msecs": "1719640733000",
//                   "is_edit_eligible": true,
//                   "edits_remaining": "5"
//                 },
//                 "is_translatable": false,
//                 "views": {
//                   "count": "56111976",
//                   "state": "EnabledWithCount"
//                 },
//                 "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
//                 "legacy": {
//                   "bookmark_count": 5623,
//                   "bookmarked": false,
//                   "created_at": "Sat Jun 29 04:58:53 +0000 2024",
//                   "conversation_id_str": "1806915216460111975",
//                   "display_text_range": [
//                     0,
//                     39
//                   ],
//                   "entities": {
//                     "hashtags": [],
//                     "media": [
//                       {
//                         "display_url": "pic.x.com/n9lhyleigb",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1806915216460111975/photo/1",
//                         "id_str": "1806915212840460288",
//                         "indices": [
//                           40,
//                           63
//                         ],
//                         "media_key": "3_1806915212840460288",
//                         "media_url_https": "https://pbs.twimg.com/media/GRNz0Aia4AA_dg3.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/n9LHYLEiGb",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 1010,
//                             "w": 1861,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 651,
//                             "w": 1200,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 369,
//                             "w": 680,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 1010,
//                           "width": 1861,
//                           "focus_rects": [
//                             {
//                               "x": 28,
//                               "y": 0,
//                               "w": 1804,
//                               "h": 1010
//                             },
//                             {
//                               "x": 425,
//                               "y": 0,
//                               "w": 1010,
//                               "h": 1010
//                             },
//                             {
//                               "x": 487,
//                               "y": 0,
//                               "w": 886,
//                               "h": 1010
//                             },
//                             {
//                               "x": 678,
//                               "y": 0,
//                               "w": 505,
//                               "h": 1010
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1861,
//                               "h": 1010
//                             }
//                           ]
//                         },
//                         "allow_download_status": {
//                           "allow_download": true
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1806915212840460288"
//                           }
//                         }
//                       }
//                     ],
//                     "symbols": [],
//                     "timestamps": [],
//                     "urls": [],
//                     "user_mentions": []
//                   },
//                   "extended_entities": {
//                     "media": [
//                       {
//                         "display_url": "pic.twitter.com/n9LHYLEiGb",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1806915216460111975/photo/1",
//                         "id_str": "1806915212840460288",
//                         "indices": [
//                           40,
//                           63
//                         ],
//                         "media_key": "3_1806915212840460288",
//                         "media_url_https": "https://pbs.twimg.com/media/GRNz0Aia4AA_dg3.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/n9LHYLEiGb",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 1010,
//                             "w": 1861,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 651,
//                             "w": 1200,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 369,
//                             "w": 680,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 1010,
//                           "width": 1861,
//                           "focus_rects": [
//                             {
//                               "x": 28,
//                               "y": 0,
//                               "w": 1804,
//                               "h": 1010
//                             },
//                             {
//                               "x": 425,
//                               "y": 0,
//                               "w": 1010,
//                               "h": 1010
//                             },
//                             {
//                               "x": 487,
//                               "y": 0,
//                               "w": 886,
//                               "h": 1010
//                             },
//                             {
//                               "x": 678,
//                               "y": 0,
//                               "w": 505,
//                               "h": 1010
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1861,
//                               "h": 1010
//                             }
//                           ]
//                         },
//                         "allow_download_status": {
//                           "allow_download": true
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1806915212840460288"
//                           }
//                         }
//                       }
//                     ]
//                   },
//                   "favorite_count": 337955,
//                   "favorited": false,
//                   "full_text": "Unmodified picture of the Falcon launch https://t.co/n9LHYLEiGb",
//                   "is_quote_status": false,
//                   "lang": "en",
//                   "possibly_sensitive": false,
//                   "possibly_sensitive_editable": true,
//                   "quote_count": 1126,
//                   "reply_count": 8035,
//                   "retweet_count": 21254,
//                   "retweeted": false,
//                   "user_id_str": "44196397",
//                   "id_str": "1806915216460111975"
//                 }
//               }
//             },
//             "tweetDisplayType": "MediaGrid"
//           }
//         }
//       },
//       {
//         "entryId": "profile-grid-0-tweet-1806557484120740284",
//         "item": {
//           "itemContent": {
//             "itemType": "TimelineTweet",
//             "__typename": "TimelineTweet",
//             "tweet_results": {
//               "result": {
//                 "__typename": "Tweet",
//                 "rest_id": "1806557484120740284",
//                 "core": {
//                   "user_results": {
//                     "result": {
//                       "__typename": "User",
//                       "id": "VXNlcjo0NDE5NjM5Nw==",
//                       "rest_id": "44196397",
//                       "affiliates_highlighted_label": {
//                         "label": {
//                           "url": {
//                             "url": "https://twitter.com/X",
//                             "urlType": "DeepLink"
//                           },
//                           "badge": {
//                             "url": "https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_bigger.jpg"
//                           },
//                           "description": "X",
//                           "userLabelType": "BusinessLabel",
//                           "userLabelDisplayType": "Badge"
//                         }
//                       },
//                       "has_graduated_access": true,
//                       "is_blue_verified": true,
//                       "profile_image_shape": "Circle",
//                       "legacy": {
//                         "can_dm": false,
//                         "can_media_tag": false,
//                         "created_at": "Tue Jun 02 20:12:29 +0000 2009",
//                         "default_profile": false,
//                         "default_profile_image": false,
//                         "description": "",
//                         "entities": {
//                           "description": {
//                             "urls": []
//                           }
//                         },
//                         "fast_followers_count": 0,
//                         "favourites_count": 58629,
//                         "followers_count": 188594413,
//                         "friends_count": 650,
//                         "has_custom_timelines": true,
//                         "is_translator": false,
//                         "listed_count": 151616,
//                         "location": "",
//                         "media_count": 2277,
//                         "name": "Elon Musk",
//                         "normal_followers_count": 188594413,
//                         "pinned_tweet_ids_str": [
//                           "1808168603721650364"
//                         ],
//                         "possibly_sensitive": false,
//                         "profile_banner_url": "https://pbs.twimg.com/profile_banners/44196397/1690621312",
//                         "profile_image_url_https": "https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_normal.jpg",
//                         "profile_interstitial_type": "",
//                         "screen_name": "elonmusk",
//                         "statuses_count": 46513,
//                         "translator_type": "none",
//                         "verified": false,
//                         "want_retweets": false,
//                         "withheld_in_countries": []
//                       },
//                       "professional": {
//                         "rest_id": "1679729435447275522",
//                         "professional_type": "Creator",
//                         "category": []
//                       },
//                       "tipjar_settings": {},
//                       "super_follow_eligible": true
//                     }
//                   }
//                 },
//                 "unmention_data": {},
//                 "edit_control": {
//                   "edit_tweet_ids": [
//                     "1806557484120740284"
//                   ],
//                   "editable_until_msecs": "1719555443000",
//                   "is_edit_eligible": true,
//                   "edits_remaining": "5"
//                 },
//                 "is_translatable": false,
//                 "views": {
//                   "count": "115091551",
//                   "state": "EnabledWithCount"
//                 },
//                 "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
//                 "legacy": {
//                   "bookmark_count": 19694,
//                   "bookmarked": false,
//                   "created_at": "Fri Jun 28 05:17:23 +0000 2024",
//                   "conversation_id_str": "1806557484120740284",
//                   "display_text_range": [
//                     0,
//                     12
//                   ],
//                   "entities": {
//                     "hashtags": [],
//                     "media": [
//                       {
//                         "display_url": "pic.x.com/y8mdrqyy32",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1806557484120740284/photo/1",
//                         "id_str": "1806557480681451520",
//                         "indices": [
//                           13,
//                           36
//                         ],
//                         "media_key": "3_1806557480681451520",
//                         "media_url_https": "https://pbs.twimg.com/media/GRIudQZXsAAesX7.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/y8MDRQYY32",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": [
//                               {
//                                 "x": 748,
//                                 "y": 319,
//                                 "h": 212,
//                                 "w": 212
//                               }
//                             ]
//                           },
//                           "medium": {
//                             "faces": [
//                               {
//                                 "x": 748,
//                                 "y": 319,
//                                 "h": 212,
//                                 "w": 212
//                               }
//                             ]
//                           },
//                           "small": {
//                             "faces": [
//                               {
//                                 "x": 423,
//                                 "y": 180,
//                                 "h": 120,
//                                 "w": 120
//                               }
//                             ]
//                           },
//                           "orig": {
//                             "faces": [
//                               {
//                                 "x": 748,
//                                 "y": 319,
//                                 "h": 212,
//                                 "w": 212
//                               }
//                             ]
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 816,
//                             "w": 1200,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 816,
//                             "w": 1200,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 462,
//                             "w": 680,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 816,
//                           "width": 1200,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 113,
//                               "w": 1200,
//                               "h": 672
//                             },
//                             {
//                               "x": 384,
//                               "y": 0,
//                               "w": 816,
//                               "h": 816
//                             },
//                             {
//                               "x": 484,
//                               "y": 0,
//                               "w": 716,
//                               "h": 816
//                             },
//                             {
//                               "x": 664,
//                               "y": 0,
//                               "w": 408,
//                               "h": 816
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1200,
//                               "h": 816
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1806557480681451520"
//                           }
//                         }
//                       }
//                     ],
//                     "symbols": [],
//                     "timestamps": [],
//                     "urls": [],
//                     "user_mentions": []
//                   },
//                   "extended_entities": {
//                     "media": [
//                       {
//                         "display_url": "pic.twitter.com/y8MDRQYY32",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1806557484120740284/photo/1",
//                         "id_str": "1806557480681451520",
//                         "indices": [
//                           13,
//                           36
//                         ],
//                         "media_key": "3_1806557480681451520",
//                         "media_url_https": "https://pbs.twimg.com/media/GRIudQZXsAAesX7.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/y8MDRQYY32",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": [
//                               {
//                                 "x": 748,
//                                 "y": 319,
//                                 "h": 212,
//                                 "w": 212
//                               }
//                             ]
//                           },
//                           "medium": {
//                             "faces": [
//                               {
//                                 "x": 748,
//                                 "y": 319,
//                                 "h": 212,
//                                 "w": 212
//                               }
//                             ]
//                           },
//                           "small": {
//                             "faces": [
//                               {
//                                 "x": 423,
//                                 "y": 180,
//                                 "h": 120,
//                                 "w": 120
//                               }
//                             ]
//                           },
//                           "orig": {
//                             "faces": [
//                               {
//                                 "x": 748,
//                                 "y": 319,
//                                 "h": 212,
//                                 "w": 212
//                               }
//                             ]
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 816,
//                             "w": 1200,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 816,
//                             "w": 1200,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 462,
//                             "w": 680,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 816,
//                           "width": 1200,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 113,
//                               "w": 1200,
//                               "h": 672
//                             },
//                             {
//                               "x": 384,
//                               "y": 0,
//                               "w": 816,
//                               "h": 816
//                             },
//                             {
//                               "x": 484,
//                               "y": 0,
//                               "w": 716,
//                               "h": 816
//                             },
//                             {
//                               "x": 664,
//                               "y": 0,
//                               "w": 408,
//                               "h": 816
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 1200,
//                               "h": 816
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1806557480681451520"
//                           }
//                         }
//                       }
//                     ]
//                   },
//                   "favorite_count": 1069647,
//                   "favorited": false,
//                   "full_text": "30 years ago https://t.co/y8MDRQYY32",
//                   "is_quote_status": false,
//                   "lang": "en",
//                   "possibly_sensitive": false,
//                   "possibly_sensitive_editable": true,
//                   "quote_count": 24352,
//                   "reply_count": 37744,
//                   "retweet_count": 47053,
//                   "retweeted": false,
//                   "user_id_str": "44196397",
//                   "id_str": "1806557484120740284"
//                 }
//               }
//             },
//             "tweetDisplayType": "MediaGrid"
//           }
//         }
//       },
//       {
//         "entryId": "profile-grid-0-tweet-1806200919911985233",
//         "item": {
//           "itemContent": {
//             "itemType": "TimelineTweet",
//             "__typename": "TimelineTweet",
//             "tweet_results": {
//               "result": {
//                 "__typename": "Tweet",
//                 "rest_id": "1806200919911985233",
//                 "core": {
//                   "user_results": {
//                     "result": {
//                       "__typename": "User",
//                       "id": "VXNlcjo0NDE5NjM5Nw==",
//                       "rest_id": "44196397",
//                       "affiliates_highlighted_label": {
//                         "label": {
//                           "url": {
//                             "url": "https://twitter.com/X",
//                             "urlType": "DeepLink"
//                           },
//                           "badge": {
//                             "url": "https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_bigger.jpg"
//                           },
//                           "description": "X",
//                           "userLabelType": "BusinessLabel",
//                           "userLabelDisplayType": "Badge"
//                         }
//                       },
//                       "has_graduated_access": true,
//                       "is_blue_verified": true,
//                       "profile_image_shape": "Circle",
//                       "legacy": {
//                         "can_dm": false,
//                         "can_media_tag": false,
//                         "created_at": "Tue Jun 02 20:12:29 +0000 2009",
//                         "default_profile": false,
//                         "default_profile_image": false,
//                         "description": "",
//                         "entities": {
//                           "description": {
//                             "urls": []
//                           }
//                         },
//                         "fast_followers_count": 0,
//                         "favourites_count": 58629,
//                         "followers_count": 188594413,
//                         "friends_count": 650,
//                         "has_custom_timelines": true,
//                         "is_translator": false,
//                         "listed_count": 151616,
//                         "location": "",
//                         "media_count": 2277,
//                         "name": "Elon Musk",
//                         "normal_followers_count": 188594413,
//                         "pinned_tweet_ids_str": [
//                           "1808168603721650364"
//                         ],
//                         "possibly_sensitive": false,
//                         "profile_banner_url": "https://pbs.twimg.com/profile_banners/44196397/1690621312",
//                         "profile_image_url_https": "https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_normal.jpg",
//                         "profile_interstitial_type": "",
//                         "screen_name": "elonmusk",
//                         "statuses_count": 46513,
//                         "translator_type": "none",
//                         "verified": false,
//                         "want_retweets": false,
//                         "withheld_in_countries": []
//                       },
//                       "professional": {
//                         "rest_id": "1679729435447275522",
//                         "professional_type": "Creator",
//                         "category": []
//                       },
//                       "tipjar_settings": {},
//                       "super_follow_eligible": true
//                     }
//                   }
//                 },
//                 "unmention_data": {},
//                 "edit_control": {
//                   "edit_tweet_ids": [
//                     "1806200919911985233"
//                   ],
//                   "editable_until_msecs": "1719470431000",
//                   "is_edit_eligible": false,
//                   "edits_remaining": "5"
//                 },
//                 "is_translatable": false,
//                 "views": {
//                   "count": "2162225",
//                   "state": "EnabledWithCount"
//                 },
//                 "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
//                 "legacy": {
//                   "bookmark_count": 614,
//                   "bookmarked": false,
//                   "created_at": "Thu Jun 27 05:40:31 +0000 2024",
//                   "conversation_id_str": "1806186887498870838",
//                   "display_text_range": [
//                     0,
//                     0
//                   ],
//                   "entities": {
//                     "hashtags": [],
//                     "media": [
//                       {
//                         "display_url": "pic.x.com/yngagaogzb",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1806200919911985233/photo/1",
//                         "id_str": "1806200917449912320",
//                         "indices": [
//                           0,
//                           23
//                         ],
//                         "media_key": "3_1806200917449912320",
//                         "media_url_https": "https://pbs.twimg.com/media/GRDqKi2WMAAUfBO.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/YngAGaOGzb",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": [
//                               {
//                                 "x": 212,
//                                 "y": 305,
//                                 "h": 123,
//                                 "w": 123
//                               }
//                             ]
//                           },
//                           "medium": {
//                             "faces": [
//                               {
//                                 "x": 212,
//                                 "y": 305,
//                                 "h": 123,
//                                 "w": 123
//                               }
//                             ]
//                           },
//                           "small": {
//                             "faces": [
//                               {
//                                 "x": 150,
//                                 "y": 215,
//                                 "h": 87,
//                                 "w": 87
//                               }
//                             ]
//                           },
//                           "orig": {
//                             "faces": [
//                               {
//                                 "x": 212,
//                                 "y": 305,
//                                 "h": 123,
//                                 "w": 123
//                               }
//                             ]
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 959,
//                             "w": 459,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 959,
//                             "w": 459,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 680,
//                             "w": 325,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 959,
//                           "width": 459,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 279,
//                               "w": 459,
//                               "h": 257
//                             },
//                             {
//                               "x": 0,
//                               "y": 178,
//                               "w": 459,
//                               "h": 459
//                             },
//                             {
//                               "x": 0,
//                               "y": 146,
//                               "w": 459,
//                               "h": 523
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 459,
//                               "h": 918
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 459,
//                               "h": 959
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1806200917449912320"
//                           }
//                         }
//                       }
//                     ],
//                     "symbols": [],
//                     "timestamps": [],
//                     "urls": [],
//                     "user_mentions": []
//                   },
//                   "extended_entities": {
//                     "media": [
//                       {
//                         "display_url": "pic.twitter.com/YngAGaOGzb",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1806200919911985233/photo/1",
//                         "id_str": "1806200917449912320",
//                         "indices": [
//                           0,
//                           23
//                         ],
//                         "media_key": "3_1806200917449912320",
//                         "media_url_https": "https://pbs.twimg.com/media/GRDqKi2WMAAUfBO.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/YngAGaOGzb",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": [
//                               {
//                                 "x": 212,
//                                 "y": 305,
//                                 "h": 123,
//                                 "w": 123
//                               }
//                             ]
//                           },
//                           "medium": {
//                             "faces": [
//                               {
//                                 "x": 212,
//                                 "y": 305,
//                                 "h": 123,
//                                 "w": 123
//                               }
//                             ]
//                           },
//                           "small": {
//                             "faces": [
//                               {
//                                 "x": 150,
//                                 "y": 215,
//                                 "h": 87,
//                                 "w": 87
//                               }
//                             ]
//                           },
//                           "orig": {
//                             "faces": [
//                               {
//                                 "x": 212,
//                                 "y": 305,
//                                 "h": 123,
//                                 "w": 123
//                               }
//                             ]
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 959,
//                             "w": 459,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 959,
//                             "w": 459,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 680,
//                             "w": 325,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 959,
//                           "width": 459,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 279,
//                               "w": 459,
//                               "h": 257
//                             },
//                             {
//                               "x": 0,
//                               "y": 178,
//                               "w": 459,
//                               "h": 459
//                             },
//                             {
//                               "x": 0,
//                               "y": 146,
//                               "w": 459,
//                               "h": 523
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 459,
//                               "h": 918
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 459,
//                               "h": 959
//                             }
//                           ]
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1806200917449912320"
//                           }
//                         }
//                       }
//                     ]
//                   },
//                   "favorite_count": 15399,
//                   "favorited": false,
//                   "full_text": "https://t.co/YngAGaOGzb",
//                   "in_reply_to_screen_name": "elonmusk",
//                   "in_reply_to_status_id_str": "1806186887498870838",
//                   "in_reply_to_user_id_str": "44196397",
//                   "is_quote_status": false,
//                   "lang": "zxx",
//                   "possibly_sensitive": false,
//                   "possibly_sensitive_editable": true,
//                   "quote_count": 214,
//                   "reply_count": 1035,
//                   "retweet_count": 1415,
//                   "retweeted": false,
//                   "user_id_str": "44196397",
//                   "id_str": "1806200919911985233"
//                 }
//               }
//             },
//             "tweetDisplayType": "MediaGrid"
//           }
//         }
//       },
//       {
//         "entryId": "profile-grid-0-tweet-1806011322238206432",
//         "item": {
//           "itemContent": {
//             "itemType": "TimelineTweet",
//             "__typename": "TimelineTweet",
//             "tweet_results": {
//               "result": {
//                 "__typename": "Tweet",
//                 "rest_id": "1806011322238206432",
//                 "core": {
//                   "user_results": {
//                     "result": {
//                       "__typename": "User",
//                       "id": "VXNlcjo0NDE5NjM5Nw==",
//                       "rest_id": "44196397",
//                       "affiliates_highlighted_label": {
//                         "label": {
//                           "url": {
//                             "url": "https://twitter.com/X",
//                             "urlType": "DeepLink"
//                           },
//                           "badge": {
//                             "url": "https://pbs.twimg.com/profile_images/1683899100922511378/5lY42eHs_bigger.jpg"
//                           },
//                           "description": "X",
//                           "userLabelType": "BusinessLabel",
//                           "userLabelDisplayType": "Badge"
//                         }
//                       },
//                       "has_graduated_access": true,
//                       "is_blue_verified": true,
//                       "profile_image_shape": "Circle",
//                       "legacy": {
//                         "can_dm": false,
//                         "can_media_tag": false,
//                         "created_at": "Tue Jun 02 20:12:29 +0000 2009",
//                         "default_profile": false,
//                         "default_profile_image": false,
//                         "description": "",
//                         "entities": {
//                           "description": {
//                             "urls": []
//                           }
//                         },
//                         "fast_followers_count": 0,
//                         "favourites_count": 58629,
//                         "followers_count": 188594413,
//                         "friends_count": 650,
//                         "has_custom_timelines": true,
//                         "is_translator": false,
//                         "listed_count": 151616,
//                         "location": "",
//                         "media_count": 2277,
//                         "name": "Elon Musk",
//                         "normal_followers_count": 188594413,
//                         "pinned_tweet_ids_str": [
//                           "1808168603721650364"
//                         ],
//                         "possibly_sensitive": false,
//                         "profile_banner_url": "https://pbs.twimg.com/profile_banners/44196397/1690621312",
//                         "profile_image_url_https": "https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_normal.jpg",
//                         "profile_interstitial_type": "",
//                         "screen_name": "elonmusk",
//                         "statuses_count": 46513,
//                         "translator_type": "none",
//                         "verified": false,
//                         "want_retweets": false,
//                         "withheld_in_countries": []
//                       },
//                       "professional": {
//                         "rest_id": "1679729435447275522",
//                         "professional_type": "Creator",
//                         "category": []
//                       },
//                       "tipjar_settings": {},
//                       "super_follow_eligible": true
//                     }
//                   }
//                 },
//                 "unmention_data": {},
//                 "edit_control": {
//                   "edit_tweet_ids": [
//                     "1806011322238206432"
//                   ],
//                   "editable_until_msecs": "1719425227000",
//                   "is_edit_eligible": true,
//                   "edits_remaining": "5"
//                 },
//                 "is_translatable": false,
//                 "views": {
//                   "count": "74643300",
//                   "state": "EnabledWithCount"
//                 },
//                 "source": "<a href=\"http://twitter.com/download/iphone\" rel=\"nofollow\">Twitter for iPhone</a>",
//                 "legacy": {
//                   "bookmark_count": 8439,
//                   "bookmarked": false,
//                   "created_at": "Wed Jun 26 17:07:07 +0000 2024",
//                   "conversation_id_str": "1806011322238206432",
//                   "display_text_range": [
//                     0,
//                     6
//                   ],
//                   "entities": {
//                     "hashtags": [],
//                     "media": [
//                       {
//                         "display_url": "pic.x.com/obql1nkpcd",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1806011322238206432/photo/1",
//                         "id_str": "1806011319121776640",
//                         "indices": [
//                           7,
//                           30
//                         ],
//                         "media_key": "3_1806011319121776640",
//                         "media_url_https": "https://pbs.twimg.com/media/GRA9ueCWkAAhXam.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/obql1nkpcd",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 1024,
//                             "w": 882,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 1024,
//                             "w": 882,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 680,
//                             "w": 586,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 1024,
//                           "width": 882,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 882,
//                               "h": 494
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 882,
//                               "h": 882
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 882,
//                               "h": 1005
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 512,
//                               "h": 1024
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 882,
//                               "h": 1024
//                             }
//                           ]
//                         },
//                         "allow_download_status": {
//                           "allow_download": true
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1806011319121776640"
//                           }
//                         }
//                       }
//                     ],
//                     "symbols": [],
//                     "timestamps": [],
//                     "urls": [],
//                     "user_mentions": []
//                   },
//                   "extended_entities": {
//                     "media": [
//                       {
//                         "display_url": "pic.twitter.com/obql1nkpcd",
//                         "expanded_url": "https://twitter.com/elonmusk/status/1806011322238206432/photo/1",
//                         "id_str": "1806011319121776640",
//                         "indices": [
//                           7,
//                           30
//                         ],
//                         "media_key": "3_1806011319121776640",
//                         "media_url_https": "https://pbs.twimg.com/media/GRA9ueCWkAAhXam.jpg",
//                         "type": "photo",
//                         "url": "https://t.co/obql1nkpcd",
//                         "ext_media_availability": {
//                           "status": "Available"
//                         },
//                         "features": {
//                           "large": {
//                             "faces": []
//                           },
//                           "medium": {
//                             "faces": []
//                           },
//                           "small": {
//                             "faces": []
//                           },
//                           "orig": {
//                             "faces": []
//                           }
//                         },
//                         "sizes": {
//                           "large": {
//                             "h": 1024,
//                             "w": 882,
//                             "resize": "fit"
//                           },
//                           "medium": {
//                             "h": 1024,
//                             "w": 882,
//                             "resize": "fit"
//                           },
//                           "small": {
//                             "h": 680,
//                             "w": 586,
//                             "resize": "fit"
//                           },
//                           "thumb": {
//                             "h": 150,
//                             "w": 150,
//                             "resize": "crop"
//                           }
//                         },
//                         "original_info": {
//                           "height": 1024,
//                           "width": 882,
//                           "focus_rects": [
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 882,
//                               "h": 494
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 882,
//                               "h": 882
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 882,
//                               "h": 1005
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 512,
//                               "h": 1024
//                             },
//                             {
//                               "x": 0,
//                               "y": 0,
//                               "w": 882,
//                               "h": 1024
//                             }
//                           ]
//                         },
//                         "allow_download_status": {
//                           "allow_download": true
//                         },
//                         "media_results": {
//                           "result": {
//                             "media_key": "3_1806011319121776640"
//                           }
//                         }
//                       }
//                     ]
//                   },
//                   "favorite_count": 580429,
//                   "favorited": false,
//                   "full_text": "Hawk … https://t.co/obql1nkpcd",
//                   "is_quote_status": false,
//                   "lang": "en",
//                   "possibly_sensitive": false,
//                   "possibly_sensitive_editable": true,
//                   "quote_count": 5472,
//                   "reply_count": 36198,
//                   "retweet_count": 34677,
//                   "retweeted": false,
//                   "user_id_str": "44196397",
//                   "id_str": "1806011322238206432"
//                 }
//               }
//             },
//             "tweetDisplayType": "MediaGrid"
//           }
//         }
//       }
//     ],
//     "displayType": "VerticalGrid",
//     // "clientEventInfo": {
//     //   "component": "profile-media"
//     // }
//   }
// }