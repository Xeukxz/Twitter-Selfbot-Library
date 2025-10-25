import { Client } from '../Client';
import { RawNotificationEntryData, RawNotificationUserMentionedYouContent, RawNotificationUserRepliedToTweetContent } from '../Timelines/NotificationTimeline';
import { Tweet } from '../Tweet';
import { BaseNotification } from './BaseNotification';

export class ReplyNotification extends BaseNotification {
  tweet: Tweet
  constructor(client: Client, data: RawNotificationEntryData<RawNotificationUserRepliedToTweetContent>) {
    super(client, 'Reply', data);
    this.tweet = new Tweet(client, data);
  }
}