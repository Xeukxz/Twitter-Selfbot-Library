import { Client } from '../Client';
import { NotificationsTimeline } from '../Timelines/NotificationTimeline';

export class NotificationsManager {
  all: NotificationsTimeline
  verified: NotificationsTimeline
  mentions: NotificationsTimeline

  constructor(public client: Client) {
    this.all = new NotificationsTimeline(client, { category: "All" });
    this.verified = new NotificationsTimeline(client, { category: "Verified" });
    this.mentions = new NotificationsTimeline(client, { category: "Mentions" });
  }

  async fetchAll() {
    await this.all.fetch().then(data => this.all.setCursors(data.rawData));
    await this.verified.fetch().then(data => this.verified.setCursors(data.rawData));
    await this.mentions.fetch().then(data => this.mentions.setCursors(data.rawData));
  }
  
  /**
   * Fetch the number of unread notifications and DMs
   */
  async fetchUnreadCounts(): Promise<{ ntab_unread_count: number, dm_unread_count: number, total_unread_count: number, is_from_urt: boolean }> {
    return await this.client.rest.get("https://x.com/i/api/2/badge_count/badge_count.json?supports_ntab_urt=1").then(res => res.data);
  }

  /**
   * Check for unread notifications every x milliseconds  
   * Notifications are emitted with the `unreadNotifications` event
   */
  stream(interval: number) {
    if (interval < 5000) console.warn('\x1b[33m%s\x1b[0m', 'Notification streaming interval is below 5000ms, which may lead to rate limiting.');
    let isFirst = true;
    setInterval(async () => {
      const counts = await this.fetchUnreadCounts();
      // console.log("Unread Counts:", counts);
      if(counts.ntab_unread_count > 0) {
        if(isFirst) this.all.emitLastXNotifications(counts.ntab_unread_count), isFirst = false;
        else this.all.fetchLatest().then((data) => this.client.emit('unreadNotifications', data.notifications));
      }
    }, interval);
  }
}