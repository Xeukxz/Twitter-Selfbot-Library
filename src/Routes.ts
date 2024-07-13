import { Client } from "./Client"
import { BaseTimeline, HomeTimeline, HomeTimelineUrlData } from "./Timelines"
import { BaseTimelineUrlData } from "./Timelines/BaseTimeline"

function urlDataString(features: any, variables: any) {
  return `variables=${variables.URIEncoded()}&features=${features.URIEncoded()}`
}

// export const Routes = {
//   timelines: {
//     home(variables: HomeTimelineUrlData["variables"]) {
//       return `https://twitter.com/i/api/graphql/1u0Wlkw6Ru1NwBUD-pDiww/HomeTimeline?${urlDataString(HomeTimeline.features, variables)}`
//     },
//   }
// }

export const Queries = {
  timelines: {
    home: {
      queryId: '1u0Wlkw6Ru1NwBUD-pDiww',
      operationName: 'HomeTimeline',
      operationType: 'query',
      metadata: {
        featureSwitches: [
          'rweb_tipjar_consumption_enabled',
          'responsive_web_graphql_exclude_directive_enabled',
          'verified_phone_label_enabled',
          'creator_subscriptions_tweet_preview_api_enabled',
          'responsive_web_graphql_timeline_navigation_enabled',
          'responsive_web_graphql_skip_user_profile_image_extensions_enabled',
          'communities_web_enable_tweet_community_results_fetch',
          'c9s_tweet_anatomy_moderator_badge_enabled',
          'articles_preview_enabled',
          'tweetypie_unmention_optimization_enabled',
          'responsive_web_edit_tweet_api_enabled',
          'graphql_is_translatable_rweb_tweet_is_translatable_enabled',
          'view_counts_everywhere_api_enabled',
          'longform_notetweets_consumption_enabled',
          'responsive_web_twitter_article_tweet_consumption_enabled',
          'tweet_awards_web_tipping_enabled',
          'creator_subscriptions_quote_tweet_preview_enabled',
          'freedom_of_speech_not_reach_fetch_enabled',
          'standardized_nudges_misinfo',
          'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled',
          'rweb_video_timestamps_enabled',
          'longform_notetweets_rich_text_read_enabled',
          'longform_notetweets_inline_media_enabled',
          'responsive_web_enhance_cards_enabled'
        ],
        fieldToggles: [
          'withAuxiliaryUserLabels',
          'withArticleRichContentState',
          'withArticlePlainText',
          'withGrokAnalyze'
        ]
      }
    },
    following: {
      queryId: '9EwYy8pLBOSFlEoSP2STiQ',
      operationName: 'HomeLatestTimeline',
      operationType: 'query',
      metadata: {
        featureSwitches: [
          'rweb_tipjar_consumption_enabled',
          'responsive_web_graphql_exclude_directive_enabled',
          'verified_phone_label_enabled',
          'creator_subscriptions_tweet_preview_api_enabled',
          'responsive_web_graphql_timeline_navigation_enabled',
          'responsive_web_graphql_skip_user_profile_image_extensions_enabled',
          'communities_web_enable_tweet_community_results_fetch',
          'c9s_tweet_anatomy_moderator_badge_enabled',
          'articles_preview_enabled',
          'tweetypie_unmention_optimization_enabled',
          'responsive_web_edit_tweet_api_enabled',
          'graphql_is_translatable_rweb_tweet_is_translatable_enabled',
          'view_counts_everywhere_api_enabled',
          'longform_notetweets_consumption_enabled',
          'responsive_web_twitter_article_tweet_consumption_enabled',
          'tweet_awards_web_tipping_enabled',
          'creator_subscriptions_quote_tweet_preview_enabled',
          'freedom_of_speech_not_reach_fetch_enabled',
          'standardized_nudges_misinfo',
          'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled',
          'rweb_video_timestamps_enabled',
          'longform_notetweets_rich_text_read_enabled',
          'longform_notetweets_inline_media_enabled',
          'responsive_web_enhance_cards_enabled'
        ],
        fieldToggles: [
          'withAuxiliaryUserLabels',
          'withArticleRichContentState',
          'withArticlePlainText',
          'withGrokAnalyze'
        ]
      }
    },
    list: {
      queryId: 'F9aW7tjdTWE9m5qHqzEpUA',
      operationName: 'ListLatestTweetsTimeline',
      operationType: 'query',
      metadata: {
        featureSwitches: [
          'rweb_tipjar_consumption_enabled',
          'responsive_web_graphql_exclude_directive_enabled',
          'verified_phone_label_enabled',
          'creator_subscriptions_tweet_preview_api_enabled',
          'responsive_web_graphql_timeline_navigation_enabled',
          'responsive_web_graphql_skip_user_profile_image_extensions_enabled',
          'communities_web_enable_tweet_community_results_fetch',
          'c9s_tweet_anatomy_moderator_badge_enabled',
          'articles_preview_enabled',
          'tweetypie_unmention_optimization_enabled',
          'responsive_web_edit_tweet_api_enabled',
          'graphql_is_translatable_rweb_tweet_is_translatable_enabled',
          'view_counts_everywhere_api_enabled',
          'longform_notetweets_consumption_enabled',
          'responsive_web_twitter_article_tweet_consumption_enabled',
          'tweet_awards_web_tipping_enabled',
          'creator_subscriptions_quote_tweet_preview_enabled',
          'freedom_of_speech_not_reach_fetch_enabled',
          'standardized_nudges_misinfo',
          'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled',
          'rweb_video_timestamps_enabled',
          'longform_notetweets_rich_text_read_enabled',
          'longform_notetweets_inline_media_enabled',
          'responsive_web_enhance_cards_enabled'
        ],
        fieldToggles: [
          'withAuxiliaryUserLabels',
          'withArticleRichContentState',
          'withArticlePlainText',
          'withGrokAnalyze'
        ]
      }
    },
    posts: {
      queryId: 'V7H0Ap3_Hh2FyS75OCDO3Q',
      operationName: 'UserTweets',
      operationType: 'query',
      metadata: {
        featureSwitches: [
          'rweb_tipjar_consumption_enabled',
          'responsive_web_graphql_exclude_directive_enabled',
          'verified_phone_label_enabled',
          'creator_subscriptions_tweet_preview_api_enabled',
          'responsive_web_graphql_timeline_navigation_enabled',
          'responsive_web_graphql_skip_user_profile_image_extensions_enabled',
          'communities_web_enable_tweet_community_results_fetch',
          'c9s_tweet_anatomy_moderator_badge_enabled',
          'articles_preview_enabled',
          'tweetypie_unmention_optimization_enabled',
          'responsive_web_edit_tweet_api_enabled',
          'graphql_is_translatable_rweb_tweet_is_translatable_enabled',
          'view_counts_everywhere_api_enabled',
          'longform_notetweets_consumption_enabled',
          'responsive_web_twitter_article_tweet_consumption_enabled',
          'tweet_awards_web_tipping_enabled',
          'creator_subscriptions_quote_tweet_preview_enabled',
          'freedom_of_speech_not_reach_fetch_enabled',
          'standardized_nudges_misinfo',
          'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled',
          'rweb_video_timestamps_enabled',
          'longform_notetweets_rich_text_read_enabled',
          'longform_notetweets_inline_media_enabled',
          'responsive_web_enhance_cards_enabled'
        ],
        fieldToggles: [
          'withAuxiliaryUserLabels',
          'withArticleRichContentState',
          'withArticlePlainText',
          'withGrokAnalyze'
        ]
      }
    },
    media: {
      queryId: 'MOLbHrtk8Ovu7DUNOLcXiA',
      operationName: 'UserMedia',
      operationType: 'query',
      metadata: {
        featureSwitches: [
          'rweb_tipjar_consumption_enabled',
          'responsive_web_graphql_exclude_directive_enabled',
          'verified_phone_label_enabled',
          'creator_subscriptions_tweet_preview_api_enabled',
          'responsive_web_graphql_timeline_navigation_enabled',
          'responsive_web_graphql_skip_user_profile_image_extensions_enabled',
          'communities_web_enable_tweet_community_results_fetch',
          'c9s_tweet_anatomy_moderator_badge_enabled',
          'articles_preview_enabled',
          'tweetypie_unmention_optimization_enabled',
          'responsive_web_edit_tweet_api_enabled',
          'graphql_is_translatable_rweb_tweet_is_translatable_enabled',
          'view_counts_everywhere_api_enabled',
          'longform_notetweets_consumption_enabled',
          'responsive_web_twitter_article_tweet_consumption_enabled',
          'tweet_awards_web_tipping_enabled',
          'creator_subscriptions_quote_tweet_preview_enabled',
          'freedom_of_speech_not_reach_fetch_enabled',
          'standardized_nudges_misinfo',
          'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled',
          'rweb_video_timestamps_enabled',
          'longform_notetweets_rich_text_read_enabled',
          'longform_notetweets_inline_media_enabled',
          'responsive_web_enhance_cards_enabled'
        ],
        fieldToggles: [
          'withAuxiliaryUserLabels',
          'withArticleRichContentState',
          'withArticlePlainText',
          'withGrokAnalyze'
        ]
      }
    },
    replies: {
      queryId: 'E4wA5vo2sjVyvpliUffSCw',
      operationName: 'UserTweetsAndReplies',
      operationType: 'query',
      metadata: {
        featureSwitches: [
          'rweb_tipjar_consumption_enabled',
          'responsive_web_graphql_exclude_directive_enabled',
          'verified_phone_label_enabled',
          'creator_subscriptions_tweet_preview_api_enabled',
          'responsive_web_graphql_timeline_navigation_enabled',
          'responsive_web_graphql_skip_user_profile_image_extensions_enabled',
          'communities_web_enable_tweet_community_results_fetch',
          'c9s_tweet_anatomy_moderator_badge_enabled',
          'articles_preview_enabled',
          'tweetypie_unmention_optimization_enabled',
          'responsive_web_edit_tweet_api_enabled',
          'graphql_is_translatable_rweb_tweet_is_translatable_enabled',
          'view_counts_everywhere_api_enabled',
          'longform_notetweets_consumption_enabled',
          'responsive_web_twitter_article_tweet_consumption_enabled',
          'tweet_awards_web_tipping_enabled',
          'creator_subscriptions_quote_tweet_preview_enabled',
          'freedom_of_speech_not_reach_fetch_enabled',
          'standardized_nudges_misinfo',
          'tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled',
          'rweb_video_timestamps_enabled',
          'longform_notetweets_rich_text_read_enabled',
          'longform_notetweets_inline_media_enabled',
          'responsive_web_enhance_cards_enabled'
        ],
        fieldToggles: [
          'withAuxiliaryUserLabels',
          'withArticleRichContentState',
          'withArticlePlainText',
          'withGrokAnalyze'
        ]
      }
    },
  },
  profiles: {
    byScreenName: {
      queryId: 'xmU6X_CKVnQ5lSrCbAmJsg',
      operationName: 'UserByScreenName',
      operationType: 'query',
      metadata: {
        featureSwitches: [
          'hidden_profile_subscriptions_enabled',
          'rweb_tipjar_consumption_enabled',
          'responsive_web_graphql_exclude_directive_enabled',
          'verified_phone_label_enabled',
          'subscriptions_verification_info_is_identity_verified_enabled',
          'subscriptions_verification_info_verified_since_enabled',
          'highlights_tweets_tab_ui_enabled',
          'responsive_web_twitter_article_notes_tab_enabled',
          'subscriptions_feature_can_gift_premium',
          'creator_subscriptions_tweet_preview_api_enabled',
          'responsive_web_graphql_skip_user_profile_image_extensions_enabled',
          'responsive_web_graphql_timeline_navigation_enabled'
        ],
        fieldToggles: [
          'withAuxiliaryUserLabels'
        ]
      }
    },
    byRestId: {
      queryId: 'xf3jd90KKBCUxdlI_tNHZw',
      operationName: 'UserByRestId',
      operationType: 'query',
      metadata: {
        featureSwitches: [
          'hidden_profile_subscriptions_enabled',
          'rweb_tipjar_consumption_enabled',
          'responsive_web_graphql_exclude_directive_enabled',
          'verified_phone_label_enabled',
          'highlights_tweets_tab_ui_enabled',
          'responsive_web_twitter_article_notes_tab_enabled',
          'subscriptions_feature_can_gift_premium',
          'creator_subscriptions_tweet_preview_api_enabled',
          'responsive_web_graphql_skip_user_profile_image_extensions_enabled',
          'responsive_web_graphql_timeline_navigation_enabled'
        ],
        fieldToggles: [
          'withAuxiliaryUserLabels'
        ]
      },
    }
  }
}

export type Queries = typeof Queries.profiles[keyof typeof Queries.profiles] | typeof Queries.timelines[keyof typeof Queries.timelines]
