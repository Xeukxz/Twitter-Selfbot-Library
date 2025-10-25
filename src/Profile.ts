import { Client, FeaturesGetData } from "./Client"
import { RepliesTimeline, TweetBasedTimeline } from "./Timelines"
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
    replies?: TweetBasedTimeline
    highlights?: TweetBasedTimeline
    media?: TweetBasedTimeline
    likes?: TweetBasedTimeline
    lists: {
      [listId: string]: TweetBasedTimeline
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
      fetch: async<T extends ProfileTimelineTypes> (type: T): Promise<FetchedInstance<T>> => {
        return this._timelines[type] as FetchedInstance<T> ?? new Promise<FetchedInstance<T>>(async (resolve, reject) => {
          if(['posts', 'media', 'replies'].includes(type)) {
            resolve(await this.client.timelines.fetch({
              type,
              username: this.username
            }) as FetchedInstance<T>)
          } else {
            reject(new Error(`${type} is not a valid profile timeline type`))
          }
        })
      }
    }
  }
  
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
export type ProfileTimelines = PostsTimeline | MediaTimeline | RepliesTimeline
const MappedProfileTimelines = {
  posts: PostsTimeline,
  media: MediaTimeline,
  replies: RepliesTimeline,
}

// maps the specific timeline to the given type
type FetchedInstance<T extends keyof typeof MappedProfileTimelines> = InstanceType<typeof MappedProfileTimelines[T]>

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