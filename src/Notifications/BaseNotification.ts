import { Client } from '../Client'
import { RawNotificationEntryData } from '../Timelines/NotificationTimeline'
import { LikeNotification } from './LikeNotification'
import { MentionNotification } from './MentionNotification'
import { ReplyNotification } from './ReplyNotification'

type NotificationType = 'Like' | 'Reply' | 'Retweet' | 'Follow' | 'Mention' | 'Quote'

export class BaseNotification {
  type: NotificationType
  raw: RawNotificationEntryData
  sortIndex: number

  constructor(public client: Client, type: NotificationType, data: RawNotificationEntryData) {
    this.type = type
    this.raw = data
    this.sortIndex = Number(data.sortIndex)
  }

  isMention(): this is MentionNotification {
    return this.type === 'Mention'
  }

  isReply(): this is ReplyNotification {
    return this.type === 'Reply'
  }

  isLike(): this is LikeNotification {
    return this.type === 'Like'
  }
}