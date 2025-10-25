import { Client } from '../Client';
import { Profile } from '../Profile';
import { RawNotificationEntryData, RawNotificationUsersLikedTweetContent } from '../Timelines/NotificationTimeline';
import { Tweet } from '../Tweet';
import { BaseNotification } from './BaseNotification';

export class LikeNotification extends BaseNotification {
  tweet: Tweet

  constructor(client: Client, data: RawNotificationEntryData<RawNotificationUsersLikedTweetContent>) {
    super(client, 'Like', data);
    this.tweet = new Tweet(client, data);
  }
}