import { RawTweetResult, Tweet, RawUserResults } from '../Tweet';
import { Client } from '../Client';
import {
  BaseTimelineUrlData,
  BottomCursorData,
  TimelineAddEntries,
  TopCursorData,
  TimelineClearEntriesUnreadState,
  TimelineMarkEntriesUnreadGreaterThanSortIndex,
  RawTimelineResponseData,
} from './BaseTweetBasedTimeline';
import fs from 'fs';
import { BaseTimeline } from './BaseTimeline';
import { LikeNotification } from '../Notifications/LikeNotification';
import { MentionNotification } from '../Notifications/MentionNotification';
import { ReplyNotification } from '../Notifications/ReplyNotification';

export interface NotificationsTimelineData {
  category: 'All' | 'Verified' | 'Mentions';
  count?: number;
}

export type Notification = LikeNotification | MentionNotification;

export class NotificationsTimeline extends BaseTimeline<RawNotificationEntryData, TimelineNotificationReturnData> {
  cache: RawNotificationsTimelineResponseData[] = [];
  category: 'All' | 'Verified' | 'Mentions';
  notifications: Notification[] = [];
  lastSortIndex: number = 0;

  variables: NotificationsTimelineUrlData['variables'] = {
    timeline_type: 'All',
    ...super._variables,
  };
  constructor(client: Client, data: NotificationsTimelineData) {
    super(client, 'notifications');
    this.category = data.category;
  }

  /**
   * Fetch the timeline
   */
  async fetch() {
    return new Promise<TimelineNotificationReturnData>((resolve, reject) => {
      this.client.rest.graphQL({
        query: this.query,
        variables: this.variables
      }).then(async (res) => {
        this.cache.push(res.data)
        let fetchedNotifications = await this.buildNotifications(res.data).catch(err => {
          console.error(`Error building tweets from ${this.type} timeline`)
          console.error(this.client.rest._trace.summary())
          if(err.response?.data) console.error(err.response.data)
          reject(err)
        }) as Notification[]
        this.notifications = this.notifications.concat(fetchedNotifications).sort((a, b) => b.sortIndex - a.sortIndex);
        resolve({
          notifications: fetchedNotifications,
          rawData: res.data
        })
      }).catch((err) => {
        console.error(`Error fetching ${this.type} timeline`)
        console.error(this.client.rest._trace.summary())
        if(err.response?.data) console.error(err.response.data)
        reject(err)
      })
    })

  }

  async fetchLatest() {
    this.variables.cursor = this.cursors.top;
    this.variables.count = 40;
    let { notifications, rawData } = await this.fetch();
    this.setCursors(rawData);
    this.resetVariables();
    if(notifications.length > 0) this.client.rest.post(`https://x.com/i/api/2/notifications/${this.category.toLowerCase()}/last_seen_cursor.json`, {
      cursor: this.cursors.top
    }, {
      "Content-Type": "application/x-www-form-urlencoded"
    })
    return {
      notifications,
      rawData: this.cache[this.cache.length - 1],
    };
  }

  async fetchLater() {
    this.variables.cursor = this.cursors.bottom;
    this.variables.count = 40;
    let { notifications, rawData } = await this.fetch();
    let entries = this.getEntriesFromData(rawData).entries;
    const cursor = this.extractCursorEntries(entries, 'bottom');
    if (!cursor) return false;
    const newCursor = this.extractCursorValue(cursor);
    if (!newCursor) return false;
    this.cursors.bottom = newCursor;
    this.resetVariables();
    return {
      notifications,
      rawData: this.cache[this.cache.length - 1],
    };
  }

  buildNotifications(data: RawNotificationsTimelineResponseData) {
    return new Promise<Notification[]>((resolve, reject) => {
      if (this.client.debug)
        fs.writeFileSync(
          `${__dirname}/../../debug/debug-notifications.json`,
          JSON.stringify(data, null, 2)
        );
      let notifications: Notification[] = [];

      let addNotificationEntries = data.data.viewer_v2.user_results.result.notification_timeline.timeline.instructions.find(
        (i) => i.type == 'TimelineAddEntries'
      ) as TimelineAddEntries<RawNotificationEntryData>;
      if (!addNotificationEntries) return resolve([]);
      (addNotificationEntries.entries.filter((entry) => entry.entryId.startsWith('notification-')) as RawNotificationEntryData[]).forEach((entry) => {
        switch(entry.content.clientEventInfo.element) {
          case 'users_liked_your_tweet':
            notifications.push(new LikeNotification(this.client, entry as RawNotificationEntryData<RawNotificationUsersLikedTweetContent>));
            break;
          case 'user_replied_to_your_tweet':
            notifications.push(new ReplyNotification(this.client, entry as RawNotificationEntryData<RawNotificationUserRepliedToTweetContent>));
            break;
          case 'user_mentioned_you':
            notifications.push(new MentionNotification(this.client, entry as RawNotificationEntryData<RawNotificationUserMentionedYouContent>));
            break;
          default:
        }
      });

      this.lastSortIndex = Math.max(this.lastSortIndex, ...notifications.map(n => n.sortIndex));

      // this.notifications.addTweets(
      //   (
      //     data.data.viewer_v2.user_results.result.notification_timeline.timeline.instructions.find(
      //       (i) => i.type == 'TimelineAddEntries'
      //     ) as TimelineAddEntries<RawNotificationEntryData>
      //   ).entries as RawNotificationEntryData[]
      // );
      resolve(notifications);
    });
  }

  getEntriesFromData(rawTimelineData: RawTimelineResponseData): TimelineAddEntries<RawNotificationEntryData<RawNotificationEntryDataType>> {
    return (rawTimelineData as RawNotificationsTimelineResponseData).data.viewer_v2.user_results.result.notification_timeline.timeline.instructions.find(i => i.type == "TimelineAddEntries") as TimelineAddEntries<RawNotificationEntryData>;
  }

  /**
   * Stream for new notifications  
   * It is reccommended to use `client.notifications.stream()` instead
   */
  async stream(timeout: number, {
    lastSortIndex = 0,
    onlyStreamPastNow,
    emitLastXNotifications = 0
  }: {
    lastSortIndex?: number
    onlyStreamPastNow?: boolean
    emitLastXNotifications?: number
  } = {
    lastSortIndex: 0,
    onlyStreamPastNow: false,
    emitLastXNotifications: 0
  }): Promise<void> {

    if(emitLastXNotifications && emitLastXNotifications > 0) {
      await this.emitLastXNotifications(emitLastXNotifications);
      return this.stream(timeout, { lastSortIndex: this.lastSortIndex, onlyStreamPastNow: true });  
    }

    onlyStreamPastNow = onlyStreamPastNow ?? lastSortIndex > 0; // default to true if lastSortIndex is set
    let foundLastHandledNotif = false;
    const newNotifications: Notification[] = [];
    for(let notif of this.notifications) {
      if(notif.sortIndex > lastSortIndex) {
        newNotifications.push(notif);
      } else {
        foundLastHandledNotif = true;
        break;
      }
    }

    while(!foundLastHandledNotif) {
      await new Promise(res => setTimeout(res, 1000)); // wait 1 second between requests
      let laterNotifications = await this.fetchLater();
      if(!laterNotifications || laterNotifications.notifications.length === 0) break; // no more notifications
      for(let notif of laterNotifications.notifications) {
        if(notif.sortIndex > lastSortIndex) newNotifications.push(notif);
        else {
          foundLastHandledNotif = true;
          break;
        }
      }
    }

    if(newNotifications.length > 0) {
      newNotifications.sort((a, b) => b.sortIndex - a.sortIndex);
      this.client.emit('unreadNotifications', newNotifications);
    }

    setTimeout(() => {
      this.stream(timeout, { lastSortIndex: this.lastSortIndex, onlyStreamPastNow: true });
    }, timeout);
  }

  async emitLastXNotifications(x: number) {
    let n = x;
    const newNotifications: Notification[] = [];
    for(let notif of this.notifications) {
      if(n > 0) newNotifications.push(notif), n--;
      else break;
    }

    while(n > 0) {
      await new Promise(res => setTimeout(res, 1000)); // wait 1 second between requests
      const laterNotifications = await this.fetchLater();
      if(!laterNotifications || laterNotifications.notifications.length === 0) break; // no more notifications
      for(let notif of laterNotifications.notifications) 
        if(n > 0) newNotifications.push(notif), n--;
        else break;
    }

    if(newNotifications.length > 0) 
      newNotifications.sort((a, b) => b.sortIndex - a.sortIndex),
      this.client.emit('unreadNotifications', newNotifications);
    return newNotifications
  }
}

export interface TimelineNotificationReturnData {
  notifications: Notification[];
  rawData: RawNotificationsTimelineResponseData
}

export interface NotificationsTimelineUrlData extends BaseTimelineUrlData {
  variables: BaseTimelineUrlData['variables'] & {
    timeline_type: 'All' | 'Verified' | 'Mentions';
  };
  features: BaseTimelineUrlData['features'];
}

export interface RawNotificationsTimelineResponseData {
  data: {
    viewer_v2: {
      user_results: {
        result: {
          __typename: 'User';
          rest_id: string;
          notification_timeline: {
            timeline: {
              id: string;
              instructions: [
                TimelineAddEntries<RawNotificationEntryData>,
                TimelineClearEntriesUnreadState,
                TimelineMarkEntriesUnreadGreaterThanSortIndex
              ];
            };
          };
        };
      };
    };
  };
}

type RawNotificationEntryDataType =
  | RawNotificationUsersLikedTweetContent
  | RawNotificationUserRepliedToTweetContent
  | RawNotificationUserMentionedYouContent;

export interface RawNotificationEntryData<T extends RawNotificationEntryDataType = RawNotificationEntryDataType> {
  entryId: `notification-${string}`;
  sortIndex: number;
  content: {
    entryType: 'TimelineTimelineItem';
    __typename: 'TimelineTimelineItem';
    itemContent: T;
    clientEventInfo: {
      component: string;
      element: 'users_liked_your_tweet' | 'user_replied_to_your_tweet' | 'user_mentioned_you';
      details: {
        notificationDetails: {
          impressionId: string;
          metadata: string;
        };
      };
    };
  };
}

export interface RawNotificationUsersLikedTweetContent {
  itemType: 'TimelineNotification';
  __typename: 'TimelineNotification';
  id: string;
  notification_icon:
    | 'heart_icon'
    | 'retweet_icon'
    | 'person_icon'
    | 'bird_icon'
    | 'birdwatch_icon'
    | 'reccomendation_icon';
  rich_message: {
    rtl: boolean;
    text: string;
    entities: {
      fromIndex: number;
      toIndex: number;
      ref: {
        type: 'TimelineRichTextUser';
        user_results: RawUserResults;
      };
    }[];
  };
  notification_url:
    | {
        url: string;
        urlType: 'ExternalUrl';
      }
    | {
        url: string;
        urlType: 'UrtEndpoint';
        urtEndpointOptions: {
          cacheId: string;
          subtitle: string;
          title: string;
        };
      };
  template: {
    __typename: 'TimelineNotificationAggregateUserActions';
    targetObjects: {
      __typename: 'TimelineNotificationTweetRef';
      tweet_results: RawTweetResult;
    }[];
    from_users: {
      __typename: 'TimelineNotificationUserRef';
      user_results: RawUserResults;
    }[];
  };
  timestamp: string;
}

export interface BaseRawNotificationDisplaysAsTweet {
  itemType: 'TimelineTweet';
  __typename: 'TimelineTweet';
  tweet_results: RawTweetResult;
  tweetDisplayType: 'Tweet';
}

export interface RawNotificationUserRepliedToTweetContent extends BaseRawNotificationDisplaysAsTweet {}

export interface RawNotificationUserMentionedYouContent extends BaseRawNotificationDisplaysAsTweet {}