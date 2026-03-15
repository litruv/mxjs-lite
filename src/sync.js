import {
  cerr,
  M_MSG,
  M_MEMBER,
  M_REACT,
  M_RNAME,
  M_RTOPIC,
  M_RAVATAR,
  M_REDACTION,
  M_REL,
} from './constants.js';

const M_PLEVEL = 'm.room.power_levels';
const M_ALIAS  = 'm.room.canonical_alias';

/**
 * Mixin adding Matrix /sync polling and sync data processing to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Sync = (Base) => class extends Base {
  /**
   * Performs a single `/sync` poll to retrieve new events from the homeserver.
   * Pass the returned data to {@link processSyncData} to receive named events.
   * @param {string|null} [since=null] - The sync token from a previous sync response.
   * @param {number} [timeout=0] - Long-poll timeout in milliseconds.
   * @returns {Promise<Object|null>} The raw sync response, or `null` on failure.
   */
  async sync(since = null, timeout = 0) {
    try {
      const result = await this.api(
        `/sync?timeout=${timeout}${since ? "&since=" + since : ""}`,
      );
      return result.errcode ? null : result;
    } catch (e) {
      cerr("sync:", e);
      return null;
    }
  }

  /**
   * Processes a sync response and emits structured events for new activity.
   * Call this with the data returned by {@link sync} after each poll, or use
   * {@link startSync} to have the library handle the loop automatically.
   *
   * Emits (use {@link ClientEvents} constants as event names):
   * - `roomJoin` `{ roomId }` — a room appeared in sync for the first time.
   * - `roomLeave` `{ roomId }` — the client left or was removed from a room.
   * - `inviteReceive` `{ roomId }` — a room invitation was received.
   * - `messageCreate` `{ roomId, event }` — a new (non-edit) `m.room.message` event.
   * - `messageUpdate` `{ roomId, edits, newBody, event }` — a message was edited.
   * - `messageDelete` `{ roomId, redacts, event }` — an event was redacted.
   * - `reactionAdd` `{ roomId, reacts, key, event }` — an `m.reaction` was added.
   * - `memberUpdate` `{ roomId, change, event }` — a membership state change.
   * - `roomNameUpdate` `{ roomId, name, prevName, event }` — room name changed.
   * - `roomTopicUpdate` `{ roomId, topic, prevTopic, event }` — room topic changed.
   * - `roomAvatarUpdate` `{ roomId, avatarUrl, prevAvatarUrl, event }` — room avatar changed.
   * - `typingStart` `{ roomId, userIds }` — typing user set changed.
   * - `receiptUpdate` `{ roomId, receipts }` — read receipts arrived.
   * - `roomAccountDataUpdate` `{ roomId, type, content }` — room account data changed.
   * - `presenceUpdate` `{ userId, presence, lastActiveAgo, statusMsg, currentlyActive }` — user presence changed.
   * - `accountDataUpdate` `{ type, content }` — global account data changed.
   *
   * @param {Object} data - The sync response as returned by {@link sync}.
   */
  processSyncData(data) {
    if (!data) return;

    for (const [roomId, roomData] of Object.entries(data.rooms?.join ?? {})) {
      if (!this._knownRoomIds.has(roomId)) {
        this._knownRoomIds.add(roomId);
        this.emit('roomJoin', { roomId });
      }

      for (const event of roomData.timeline?.events ?? []) {
        if (event.type === M_MSG && !this.isEditEvent(event)) {
          this.emit('messageCreate', { roomId, event });
        }
        if (event.type === M_MSG && this.isEditEvent(event)) {
          const rel = this.getEventRelation(event);
          const newBody = this.getEditedBody(event);
          this.emit('messageUpdate', { roomId, edits: rel.event_id, newBody, event });
        }
        if (event.type === M_REACT) {
          const rel = event.content?.[M_REL];
          if (rel) this.emit('reactionAdd', { roomId, reacts: rel.event_id, key: rel.key, event });
        }
        if (event.type === M_MEMBER) {
          const change = this.getMembershipChange(event);
          if (change) this.emit('memberUpdate', { roomId, change, event });
        }
        if (event.type === M_RNAME) {
          const prevContent = this.getPrevContent(event);
          this.emit('roomNameUpdate', {
            roomId,
            name: event.content?.name ?? null,
            prevName: prevContent?.name ?? null,
            event,
          });
        }
        if (event.type === M_RTOPIC) {
          const prevContent = this.getPrevContent(event);
          this.emit('roomTopicUpdate', {
            roomId,
            topic: event.content?.topic ?? null,
            prevTopic: prevContent?.topic ?? null,
            event,
          });
        }
        if (event.type === M_RAVATAR) {
          const prevContent = this.getPrevContent(event);
          this.emit('roomAvatarUpdate', {
            roomId,
            avatarUrl: event.content?.url ?? null,
            prevAvatarUrl: prevContent?.url ?? null,
            event,
          });
        }
        if (event.type === M_REDACTION) {
          this.emit('messageDelete', { roomId, redacts: event.redacts, event });
        }
        if (event.type === M_PLEVEL) {
          this.emit('powerLevelUpdate', { roomId, content: event.content, event });
        }
        if (event.type === M_ALIAS) {
          this.emit('canonicalAliasUpdate', { roomId, alias: event.content?.alias ?? null, event });
        }
      }

      for (const event of roomData.ephemeral?.events ?? []) {
        if (event.type === 'm.typing') {
          this.emit('typingStart', { roomId, userIds: event.content?.user_ids ?? [] });
        }
        if (event.type === 'm.receipt') {
          const receipts = Object.entries(event.content ?? {}).map(([eventId, readers]) => ({
            eventId,
            read: Object.keys(readers?.['m.read'] ?? {}),
          }));
          if (receipts.length) this.emit('receiptUpdate', { roomId, receipts });
        }
      }

      for (const event of roomData.account_data?.events ?? []) {
        this.emit('roomAccountDataUpdate', { roomId, type: event.type, content: event.content });
      }
    }

    for (const roomId of Object.keys(data.rooms?.leave ?? {})) {
      this._knownRoomIds.delete(roomId);
      this.emit('roomLeave', { roomId });
    }

    for (const roomId of Object.keys(data.rooms?.invite ?? {})) {
      this.emit('inviteReceive', { roomId });
    }

    for (const event of data.presence?.events ?? []) {
      this.emit('presenceUpdate', {
        userId: event.sender,
        presence: event.content?.presence ?? null,
        lastActiveAgo: event.content?.last_active_ago ?? null,
        statusMsg: event.content?.status_msg ?? null,
        currentlyActive: event.content?.currently_active ?? null,
      });
    }

    for (const event of data.account_data?.events ?? []) {
      this.emit('accountDataUpdate', { type: event.type, content: event.content });
    }
  }
};
