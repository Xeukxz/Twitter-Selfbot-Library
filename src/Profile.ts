import { Client, FeaturesGetData } from "./Client"
import { Timeline } from "./Timelines"
import { PostsTimeline } from "./Timelines/ProfileTimelines/PostsTimeline"
import { Queries } from './Routes';
import { ProfileFetchData } from "./Managers";
import { MediaTimeline } from "./Timelines/ProfileTimelines/MediaTimeline";

export class Profile {
  client: Client
  userId: string = ''
  username: string = ''
  name: string = ''
  location: string = ''
  description: string = ''
  private Queries = Queries.profiles

  protected _timelines: { // so that the timelines are only created when needed. idk if there's a better way to do this
    posts?: PostsTimeline
    replies?: Timeline
    highlights?: Timeline
    media?: Timeline
    likes?: Timeline
    lists: {
      [listId: string]: Timeline
    }
  } = {
    posts: undefined,
    replies: undefined,
    highlights: undefined,
    media: undefined,
    likes: undefined,
    lists: {}
  }

  constructor(client: Client, data: ProfileFetchData) {
    this.client = client
    if(data.userId) this.userId = data.userId
    else this.username = data.username!
    // this.fetch()
  }
  getUrl = (query: typeof Queries.profiles[keyof typeof Queries.profiles]) => {
    return `https://twitter.com/i/api/graphql/${query.queryId}/${query.operationName}?${this.urlDataString}`
  }

  // https://x.com/i/api/graphql/qW5u-DAuXpMEG0zA1F7UGQ/UserByScreenName?variables=%7B%22screen_name%22%3A%22mofoman360%22%2C%22withSafetyModeUserFields%22%3Atrue%7D&features=%7B%22hidden_profile_likes_enabled%22%3Atrue%2C%22hidden_profile_subscriptions_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22responsive_web_graphql_exclude_directive_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22subscriptions_verification_info_is_identity_verified_enabled%22%3Atrue%2C%22subscriptions_verification_info_verified_since_enabled%22%3Atrue%2C%22highlights_tweets_tab_ui_enabled%22%3Atrue%2C%22responsive_web_twitter_article_notes_tab_enabled%22%3Atrue%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%7D&fieldToggles=%7B%22withAuxiliaryUserLabels%22%3Afalse%7D
  // https://x.com/i/api/graphql/qW5u-DAuXpMEG0zA1F7UGQ/UserByScreenName?variables={"screen_name":"mofoman360","withSafetyModeUserFields":true}&features={"hidden_profile_likes_enabled":true,"hidden_profile_subscriptions_enabled":true,"rweb_tipjar_consumption_enabled":true,"responsive_web_graphql_exclude_directive_enabled":true,"verified_phone_label_enabled":false,"subscriptions_verification_info_is_identity_verified_enabled":true,"subscriptions_verification_info_verified_since_enabled":true,"highlights_tweets_tab_ui_enabled":true,"responsive_web_twitter_article_notes_tab_enabled":true,"creator_subscriptions_tweet_preview_api_enabled":true,"responsive_web_graphql_skip_user_profile_image_extensions_enabled":false,"responsive_web_graphql_timeline_navigation_enabled":true}&fieldToggles={"withAuxiliaryUserLabels":false}
  get url() {
    return this.getUrl(this.revelantQuery)
  }

  get urlDataString() {
    return `variables=${(this.variables[this.userId ? 'byRestId' : 'byScreenName']).URIEncoded()}&features=${this.features.URIEncoded()}`
  }
  
  get revelantQuery() {
    return this.userId ? this.Queries.byRestId : this.Queries.byScreenName
  }

  get variables() {
    return {
      byScreenName: {
        screen_name: this.username,
        withSafetyModeUserFields: true,
        URIEncoded: function () {
          return encodeURIComponent(JSON.stringify(this))
        }
      },
      byRestId: {
        userId: this.userId,
        withSafetyModeUserFields: true,
        URIEncoded: function () {
          return encodeURIComponent(JSON.stringify(this))
        }
      }
    }
  }

  get features(): FeaturesGetData<typeof this.revelantQuery.metadata.featureSwitches> {
    return this.client.features.get(this.revelantQuery.metadata.featureSwitches)
  }

  get timelines() {
    return {
      ...Object.fromEntries(Object.entries(this._timelines).filter(([key, value]) => value)),
      fetch: async (type: ProfileTimelineTypes): Promise<Timeline> => {
        return this._timelines[type] ?? new Promise<Timeline>(async (resolve, reject) => {
          if(type == 'posts' && !this._timelines.posts) 
            resolve(await this.client.timelines.fetch({
              type,
              username: this.username
            }) as PostsTimeline)

          if(type == 'media' && !this._timelines.media)
            resolve(await this.client.timelines.fetch({
              type,
              username: this.username
            }) as MediaTimeline)
          
          if(type == 'replies' && !this._timelines.replies)
            resolve(await this.client.timelines.fetch({
              type,
              username: this.username
            }))
        })
      }
    }
  }

  // static async new(client: Client, username: string) {
  //   const profile = new Profile(client, username)
  //   await profile.fetch()
  //   return profile
  // }

  
  /**
   * Fetch the profile data
   */
  async fetch() {
    return new Promise((resolve, reject) => {
      this.client.rest.get(this.url)
        .then(async (res) => {
          this.patch(res.data)
          resolve(res.data)
        })
        .catch((err) => {
          console.log(err.response.data)
          reject(err)
        })
    })
  }

  protected patch(data: RawUserData) {
    if(Object.keys(data.data).length === 0) throw new Error(`API returned no data for user ${this.username}\n${data}`)
    this.userId = data.data.user.result.rest_id
    this.name = data.data.user.result.legacy.name
    this.location = data.data.user.result.legacy.location
    this.description = data.data.user.result.legacy.description

  
  }
}

export type ProfileTimelineTypes = 'posts' | 'media' | 'replies' //| 'highlights' | 'likes' | 'lists'
export type ProfileTimelines = PostsTimeline | Timeline

/* https://x.com/i/api/1.1/friends/following/list.json?include_profile_interstitial_type=1&include_blocking=1&include_blocked_by=1&include_followed_by=1&include_want_retweets=1&include_mute_edge=1&include_can_dm=1&include_can_media_tag=1&include_ext_is_blue_verified=1&include_ext_verified_type=1&include_ext_profile_image_shape=1&skip_status=1&cursor=-1&user_id=1310275768191193088&count=3&with_total_count=true
{
  "data": {
    "user": {
      "result": {
        "__typename": "User",
        "id": "VXNlcjoyMDgyMDQ0NQ==",
        "rest_id": "20820445",
        "affiliates_highlighted_label": {},
        "has_graduated_access": true,
        "is_blue_verified": true,
        "profile_image_shape": "Circle",
        "legacy": {
          "can_dm": false,
          "can_media_tag": true,
          "created_at": "Sat Feb 14 00:19:02 +0000 2009",
          "default_profile": true,
          "default_profile_image": false,
          "description": "I’m Lee i like F1 Football Music and im a lover of The BRF and The Princess of Wales and Earth is Beautiful \uD83C\uDF0E I tweet nice photos of nature and celebs NO DM’s",
          "entities": {
            "description": {
              "urls": []
            }
          },
          "fast_followers_count": 0,
          "favourites_count": 3458,
          "followers_count": 13113,
          "friends_count": 8992,
          "has_custom_timelines": true,
          "is_translator": false,
          "listed_count": 57,
          "location": "",
          "media_count": 10040,
          "name": "Lee Hood",
          "normal_followers_count": 13113,
          "pinned_tweet_ids_str": [
            "1730965138436427882"
          ],
          "possibly_sensitive": false,
          "profile_banner_url": "https://pbs.twimg.com/profile_banners/20820445/1371304530",
          "profile_image_url_https": "https://pbs.twimg.com/profile_images/1784936798784745472/9gPFlcPS_normal.jpg",
          "profile_interstitial_type": "",
          "screen_name": "Mofoman360",
          "statuses_count": 21998,
          "translator_type": "none",
          "verified": false,
          "want_retweets": false,
          "withheld_in_countries": []
        },
        "professional": {
          "rest_id": "1498505343596437509",
          "professional_type": "Creator",
          "category": [
            {
              "id": 15,
              "name": "Entertainment & Recreation",
              "icon_name": "IconBriefcaseStroke"
            }
          ]
        },
        "tipjar_settings": {},
        "smart_blocked_by": false,
        "smart_blocking": false,
        "legacy_extended_profile": {},
        "is_profile_translatable": false,
        "has_hidden_likes_on_profile": false,
        "has_hidden_subscriptions_on_profile": false,
        "verification_info": {
          "is_identity_verified": false,
          "reason": {
            "description": {
              "text": "This account is verified. Learn more",
              "entities": [
                {
                  "from_index": 26,
                  "to_index": 36,
                  "ref": {
                    "url": "https://help.twitter.com/managing-your-account/about-twitter-verified-accounts",
                    "url_type": "ExternalUrl"
                  }
                }
              ]
            },
            "verified_since_msec": "1702180664405"
          }
        },
        "highlights_info": {
          "can_highlight_tweets": true,
          "highlighted_tweets": "0"
        },
        "user_seed_tweet_count": 0,
        "business_account": {},
        "creator_subscriptions_count": 0
      }
    }
  }
}
*/

export interface RawUserData extends RawUserdataByRestId{
  data: {
    user: {
      result: RawUserdataByRestId['data']['user']['result'] & {
        legacy_extended_profile: any, // byscreenname only for some reason
        is_profile_translatable: boolean, // byscreenname only for some reason
        verification_info: { // byscreenname only for some reason
          is_identity_verified: boolean,
          reason: {
            description: {
              text: string,
              entities: {
                from_index: number,
                to_index: number,
                ref: {
                  url: string,
                  url_type: string
                }
              }[]
            },
            verified_since_msec: string
          }
        },
      }
    }
  }
}

export interface RawUserdataByRestId {
  data: {
    user: {
      result: {
        __typename: "User",
        id: string,
        rest_id: string,
        affiliates_highlighted_label: any,
        has_graduated_access: boolean,
        is_blue_verified: boolean,
        profile_image_shape: string,
        legacy: {
          following: boolean,
          can_dm: boolean,
          can_media_tag: boolean,
          created_at: string,
          default_profile: boolean,
          default_profile_image: boolean,
          description: string,
          entities: {
            description: {
              urls: any[]
            }
          },
          fast_followers_count: number,
          favourites_count: number,
          followers_count: number,
          friends_count: number,
          has_custom_timelines: boolean,
          is_translator: boolean,
          listed_count: number,
          location: string,
          media_count: number,
          name: string,
          normal_followers_count: number,
          pinned_tweet_ids_str: string[],
          possibly_sensitive: boolean,
          profile_banner_url: string,
          profile_image_url_https: string,
          profile_interstitial_type: string,
          screen_name: string,
          statuses_count: number,
          translator_type: string,
          verified: boolean,
          want_retweets: boolean,
          withheld_in_countries: string[]
        },
        professional?: {
          rest_id: string,
          professional_type: string,
          category: {
            id: number,
            name: string,
            icon_name: string
          }[]
        },
        tipjar_settings: any,
        smart_blocked_by: boolean,
        smart_blocking: boolean,
        has_hidden_likes_on_profile?: boolean,
        has_hidden_subscriptions_on_profile: boolean,
        highlights_info: {
          can_highlight_tweets: boolean,
          highlighted_tweets: string
        },
        user_seed_tweet_count: number,
        business_account: any,
        creator_subscriptions_count: number
      }
    }
  }
}