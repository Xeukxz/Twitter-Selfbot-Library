import { Client } from '../Client';
import { RawNotificationEntryData, RawNotificationUserMentionedYouContent } from '../Timelines/NotificationTimeline';
import { Tweet } from '../Tweet';
import { BaseNotification } from './BaseNotification';

export class MentionNotification extends BaseNotification {
  tweet: Tweet
  constructor(client: Client, data: RawNotificationEntryData<RawNotificationUserMentionedYouContent>) {
    super(client, 'Mention', data);
    this.tweet = new Tweet(client, data);
  }

  getParentTweet() {
    if(!this.tweet.raw.legacy.in_reply_to_status_id_str) return;
    return this.client.tweets.fetch(this.tweet.raw.legacy.in_reply_to_status_id_str!);
  }
}