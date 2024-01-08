export class Tweet {
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
  raw: RawTweetData;

  constructor(data: RawTweetData) {
    try {
      let tweetResults = data.content.itemContent.tweet_results.result.tweet || data.content.itemContent.tweet_results.result;
      let userData = (tweetResults as any).tweet?.core.user_results || tweetResults.core.user_results;
      this.raw = data;
      this.id = tweetResults.rest_id;
      this.user = {
        id: userData.result.rest_id,
        name: userData.result.legacy.name,
        username: userData.result.legacy.screen_name,
        profilePictureUrl: userData.result.legacy.profile_image_url_https
      };
      if (tweetResults.legacy.entities.media) {
        this.media = tweetResults.legacy.entities.media.map(media => {
          return {
            type: media.type,
            url: media.media_url_https
          };
        });
      }
      this.text = tweetResults.legacy.full_text;
    } catch (e) {
      console.log(JSON.stringify(data, null, 2))
      throw new Error(`${e}`)
    }
  }
}

export interface RawTweetData {
  entryId: string;
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
          }
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
      };
      tweetDisplayType: string;
    };
    clientEventInfo: {
      component: string;
      details: {
        timelinesDetails: {
          injectionType: string;
        };
      };
    };
  };
}

/* 
{
          "entryId": "tweet-1729536377308742105",
          "sortIndex": "1729563549753147392",
          "content": {
            "entryType": "TimelineTimelineItem",
            "__typename": "TimelineTimelineItem",
            "itemContent": {
              "itemType": "TimelineTweet",
              "__typename": "TimelineTweet",
              "tweet_results": {
                "result": {
                  "__typename": "Tweet",
                  "rest_id": "1729536377308742105",
                  "core": {
                    "user_results": {
                      "result": {
                        "__typename": "User",
                        "id": "VXNlcjoyMjc2ODA5OTk5",
                        "rest_id": "2276809999",
                        "affiliates_highlighted_label": {},
                        "has_graduated_access": true,
                        "is_blue_verified": true,
                        "profile_image_shape": "Circle",
                        "legacy": {
                          "can_dm": true,
                          "can_media_tag": false,
                          "created_at": "Sat Jan 04 23:52:44 +0000 2014",
                          "default_profile": true,
                          "default_profile_image": false,
                          "description": "The twinkle in your eyes when you look at me reminds me of butterflies and fireflies.",
                          "entities": {
                            "description": {
                              "urls": []
                            },
                            "url": {
                              "urls": [
                                {
                                  "display_url": "twitter.com/lastvibes",
                                  "expanded_url": "https://twitter.com/lastvibes",
                                  "url": "https://t.co/pGnSpCR793",
                                  "indices": [
                                    0,
                                    23
                                  ]
                                }
                              ]
                            }
                          },
                          "fast_followers_count": 0,
                          "favourites_count": 2,
                          "followers_count": 169920,
                          "friends_count": 0,
                          "has_custom_timelines": false,
                          "is_translator": false,
                          "listed_count": 181,
                          "location": "Everywhere",
                          "media_count": 2974,
                          "name": "GIFS",
                          "normal_followers_count": 169920,
                          "pinned_tweet_ids_str": [
                            "1729225579520733684"
                          ],
                          "possibly_sensitive": false,
                          "profile_banner_url": "https://pbs.twimg.com/profile_banners/2276809999/1488788931",
                          "profile_image_url_https": "https://pbs.twimg.com/profile_images/844023156344082432/-wg-NyQ5_normal.jpg",
                          "profile_interstitial_type": "",
                          "screen_name": "GIF__",
                          "statuses_count": 3006,
                          "translator_type": "none",
                          "url": "https://t.co/pGnSpCR793",
                          "verified": false,
                          "want_retweets": false,
                          "withheld_in_countries": []
                        }
                      }
                    }
                  },
                  "unmention_data": {},
                  "edit_control": {
                    "edit_tweet_ids": [
                      "1729536377308742105"
                    ],
                    "editable_until_msecs": "1701192180000",
                    "is_edit_eligible": true,
                    "edits_remaining": "5"
                  },
                  "is_translatable": false,
                  "views": {
                    "count": "17477",
                    "state": "EnabledWithCount"
                  },
                  "source": "<a href=\"https://twitter.com\" rel=\"nofollow\">TweetDeck Web App</a>",
                  "legacy": {
                    "bookmark_count": 68,
                    "bookmarked": false,
                    "created_at": "Tue Nov 28 16:23:00 +0000 2023",
                    "conversation_id_str": "1729536377308742105",
                    "display_text_range": [
                      0,
                      0
                    ],
                    "entities": {
                      "media": [
                        {
                          "display_url": "pic.twitter.com/mQjlFHLPFW",
                          "expanded_url": "https://twitter.com/GIF__/status/1729536377308742105/photo/1",
                          "id_str": "1728947684499738624",
                          "indices": [
                            0,
                            23
                          ],
                          "media_key": "16_1728947684499738624",
                          "media_url_https": "https://pbs.twimg.com/tweet_video_thumb/F_50wjnXUAAwUn1.jpg",
                          "type": "animated_gif",
                          "url": "https://t.co/mQjlFHLPFW",
                          "ext_media_availability": {
                            "status": "Available"
                          },
                          "sizes": {
                            "large": {
                              "h": 734,
                              "w": 600,
                              "resize": "fit"
                            },
                            "medium": {
                              "h": 734,
                              "w": 600,
                              "resize": "fit"
                            },
                            "small": {
                              "h": 680,
                              "w": 556,
                              "resize": "fit"
                            },
                            "thumb": {
                              "h": 150,
                              "w": 150,
                              "resize": "crop"
                            }
                          },
                          "original_info": {
                            "height": 734,
                            "width": 600,
                            "focus_rects": []
                          },
                          "video_info": {
                            "aspect_ratio": [
                              300,
                              367
                            ],
                            "variants": [
                              {
                                "bitrate": 0,
                                "content_type": "video/mp4",
                                "url": "https://video.twimg.com/tweet_video/F_50wjnXUAAwUn1.mp4"
                              }
                            ]
                          }
                        }
                      ],
                      "user_mentions": [],
                      "urls": [],
                      "hashtags": [],
                      "symbols": []
                    },
                    "extended_entities": {
                      "media": [
                        {
                          "display_url": "pic.twitter.com/mQjlFHLPFW",
                          "expanded_url": "https://twitter.com/GIF__/status/1729536377308742105/photo/1",
                          "id_str": "1728947684499738624",
                          "indices": [
                            0,
                            23
                          ],
                          "media_key": "16_1728947684499738624",
                          "media_url_https": "https://pbs.twimg.com/tweet_video_thumb/F_50wjnXUAAwUn1.jpg",
                          "type": "animated_gif",
                          "url": "https://t.co/mQjlFHLPFW",
                          "ext_media_availability": {
                            "status": "Available"
                          },
                          "sizes": {
                            "large": {
                              "h": 734,
                              "w": 600,
                              "resize": "fit"
                            },
                            "medium": {
                              "h": 734,
                              "w": 600,
                              "resize": "fit"
                            },
                            "small": {
                              "h": 680,
                              "w": 556,
                              "resize": "fit"
                            },
                            "thumb": {
                              "h": 150,
                              "w": 150,
                              "resize": "crop"
                            }
                          },
                          "original_info": {
                            "height": 734,
                            "width": 600,
                            "focus_rects": []
                          },
                          "video_info": {
                            "aspect_ratio": [
                              300,
                              367
                            ],
                            "variants": [
                              {
                                "bitrate": 0,
                                "content_type": "video/mp4",
                                "url": "https://video.twimg.com/tweet_video/F_50wjnXUAAwUn1.mp4"
                              }
                            ]
                          }
                        }
                      ]
                    },
                    "favorite_count": 410,
                    "favorited": false,
                    "full_text": "https://t.co/mQjlFHLPFW",
                    "is_quote_status": false,
                    "lang": "zxx",
                    "possibly_sensitive": false,
                    "possibly_sensitive_editable": true,
                    "quote_count": 11,
                    "reply_count": 3,
                    "retweet_count": 59,
                    "retweeted": false,
                    "user_id_str": "2276809999",
                    "id_str": "1729536377308742105"
                  }
                }
              },
              "tweetDisplayType": "Tweet"
            },
            "clientEventInfo": {
              "component": "suggest_organic_list_tweet",
              "element": "tweet",
              "details": {
                "timelinesDetails": {
                  "injectionType": "OrganicListTweet"
                }
              }
            }
          }
        },
*/
