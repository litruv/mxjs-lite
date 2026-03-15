import {
  cerr,
  M_MSG,
  M_MEMBER,
  M_RNAME,
  M_RTOPIC,
  M_RAVATAR,
  M_REDACTION,
} from './constants.js';

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
   * Call this with the data returned by {@link sync} after each poll.
   *
   * Emits:
   * - `roomJoin` `{ roomId }` — a room appeared in the sync response for the first time.
   * - `roomLeave` `{ roomId }` — the client has left or been removed from a room.
   * - `invite` `{ roomId }` — the client received a room invitation.
   * - `message` `{ roomId, event }` — a new (non-edit) `m.room.message` event.
   * - `edit` `{ roomId, edits, newBody, event }` — a message was edited; `edits` is the event ID of the original message, `newBody` is the new text.
   * - `memberUpdate` `{ roomId, change, event }` — a membership change; `change` is the object returned by `getMembershipChange`.
   * - `roomNameChange` `{ roomId, name, prevName, event }` — the room name was changed.
   * - `roomTopicChange` `{ roomId, topic, prevTopic, event }` — the room topic was changed.
   * - `roomAvatarChange` `{ roomId, avatarUrl, prevAvatarUrl, event }` — the room avatar was changed.
   * - `redaction` `{ roomId, redacts, event }` — an event was redacted; `redacts` is the original event ID.
   * - `typing` `{ roomId, userIds }` — the current set of typing users changed.
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
          this.emit('message', { roomId, event });
        }
        if (event.type === M_MSG && this.isEditEvent(event)) {
          const rel = this.getEventRelation(event);
          const newBody = this.getEditedBody(event);
          this.emit('edit', { roomId, edits: rel.event_id, newBody, event });
        }
        if (event.type === M_MEMBER) {
          const change = this.getMembershipChange(event);
          if (change) this.emit('memberUpdate', { roomId, change, event });
        }
        if (event.type === M_RNAME) {
          const prevContent = this.getPrevContent(event);
          this.emit('roomNameChange', {
            roomId,
            name: event.content?.name ?? null,
            prevName: prevContent?.name ?? null,
            event,
          });
        }
        if (event.type === M_RTOPIC) {
          const prevContent = this.getPrevContent(event);
          this.emit('roomTopicChange', {
            roomId,
            topic: event.content?.topic ?? null,
            prevTopic: prevContent?.topic ?? null,
            event,
          });
        }
        if (event.type === M_RAVATAR) {
          const prevContent = this.getPrevContent(event);
          this.emit('roomAvatarChange', {
            roomId,
            avatarUrl: event.content?.url ?? null,
            prevAvatarUrl: prevContent?.url ?? null,
            event,
          });
        }
        if (event.type === M_REDACTION) {
          this.emit('redaction', { roomId, redacts: event.redacts, event });
        }
      }

      for (const event of roomData.ephemeral?.events ?? []) {
        if (event.type === 'm.typing') {
          this.emit('typing', { roomId, userIds: event.content?.user_ids ?? [] });
        }
      }
    }

    for (const roomId of Object.keys(data.rooms?.leave ?? {})) {
      this._knownRoomIds.delete(roomId);
      this.emit('roomLeave', { roomId });
    }

    for (const roomId of Object.keys(data.rooms?.invite ?? {})) {
      this.emit('invite', { roomId });
    }
  }
};
