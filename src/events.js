import {
  cerr,
  enc,
  M_MSG,
  M_REACT,
  M_RNAME,
  M_RTOPIC,
  M_RAVATAR,
  M_MEMBER,
  M_REL,
  M_NEWCONT,
  M_REPLACE,
  M_ANNOT,
  M_TEXT,
  M_IMAGE,
  M_HTML,
} from './constants.js';

/**
 * Mixin adding room event methods to a base client class.
 * Covers sending, editing, redacting, reacting, and fetching room events and state.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Events = (Base) => class extends Base {
  /**
   * Sends a room event via a PUT request using a timestamp as transaction ID.
   * @param {string} roomId
   * @param {string} type - Matrix event type (e.g. `m.room.message`).
   * @param {Object} content - Event content.
   * @param {string} [errLabel="send"] - Label used in error logs.
   * @returns {Promise<{eventId: string}|null>}
   */
  async _sendRoomEvent(roomId, type, content, errLabel = "send") {
    try {
      const result = await this.api(
        `/rooms/${roomId}/send/${type}/${Date.now()}`,
        "PUT",
        content,
      );
      return result.errcode ? null : { eventId: result.event_id };
    } catch (e) {
      cerr(`${errLabel}:`, e);
      return null;
    }
  }

  /**
   * Sends a plain text (or optionally HTML-formatted) message to a room.
   * @param {string} roomId
   * @param {string} message - Plain text body.
   * @param {string|null} [formattedBody=null] - Optional HTML-formatted body.
   * @returns {Promise<{eventId: string}|null>}
   */
  async sendMessage(roomId, message, formattedBody = null) {
    const content = { msgtype: M_TEXT, body: message };
    if (formattedBody) {
      content.format = M_HTML;
      content.formatted_body = formattedBody;
    }
    return this._sendRoomEvent(roomId, M_MSG, content);
  }

  /**
   * Sends an image message to a room.
   * @param {string} roomId
   * @param {string} url - An `mxc://` URI for the image.
   * @param {string} [body="Image"] - Alt text / fallback body.
   * @param {Object} [info={}] - Optional image metadata (e.g. `w`, `h`, `mimetype`).
   * @returns {Promise<{eventId: string}|null>}
   */
  async sendImage(roomId, url, body = "Image", info = {}) {
    const content = { msgtype: M_IMAGE, body, url };
    if (Object.keys(info).length) content.info = info;
    return this._sendRoomEvent(roomId, M_MSG, content, "send image");
  }

  /**
   * Edits a previously sent message using the `m.replace` relation.
   * @param {string} roomId
   * @param {string} eventId - The event ID of the original message.
   * @param {string} newMessage - The replacement text body.
   * @returns {Promise<{eventId: string}|null>}
   */
  async editMessage(roomId, eventId, newMessage) {
    return this._sendRoomEvent(
      roomId,
      M_MSG,
      {
        msgtype: M_TEXT,
        body: `* ${newMessage}`,
        [M_NEWCONT]: { msgtype: M_TEXT, body: newMessage },
        [M_REL]: { rel_type: M_REPLACE, event_id: eventId },
      },
      "edit",
    );
  }

  /**
   * Redacts (deletes) a room event.
   * @param {string} roomId
   * @param {string} eventId
   * @param {string} [reason=""] - Optional reason for the redaction.
   * @returns {Promise<{eventId: string}|null>}
   */
  async redactEvent(roomId, eventId, reason = "") {
    try {
      const result = await this.api(
        `/rooms/${roomId}/redact/${eventId}/${Date.now()}`,
        "PUT",
        reason ? { reason } : {},
      );
      return result.errcode ? null : { eventId: result.event_id };
    } catch (e) {
      cerr("redact:", e);
      return null;
    }
  }

  /**
   * Sends a reaction annotation to a message.
   * @param {string} roomId
   * @param {string} eventId - The event to react to.
   * @param {string} reaction - The reaction key (typically an emoji).
   * @returns {Promise<{eventId: string}|null>}
   */
  async reactToMessage(roomId, eventId, reaction) {
    return this._sendRoomEvent(
      roomId,
      M_REACT,
      { [M_REL]: { rel_type: M_ANNOT, event_id: eventId, key: reaction } },
      "react",
    );
  }

  /**
   * Removes a reaction by redacting its event.
   * @param {string} roomId
   * @param {string} reactionEventId - The event ID of the reaction to remove.
   * @returns {Promise<boolean>} `true` on success.
   */
  async removeReaction(roomId, reactionEventId) {
    const result = await this.redactEvent(roomId, reactionEventId);
    return result !== null;
  }

  /**
   * Sends a state event to a room.
   * @param {string} roomId
   * @param {string} type - Matrix state event type.
   * @param {Object} content - Event content.
   * @param {string} [stateKey=""] - Optional state key.
   * @returns {Promise<{eventId: string}|null>}
   */
  async sendStateEvent(roomId, type, content, stateKey = "") {
    try {
      const result = await this.api(
        `/rooms/${roomId}/state/${enc(type)}/${enc(stateKey)}`,
        "PUT",
        content,
      );
      return result.errcode ? null : { eventId: result.event_id };
    } catch (e) {
      cerr("state event:", e);
      return null;
    }
  }

  /**
   * Sets the name of a room.
   * @param {string} roomId
   * @param {string} name
   * @returns {Promise<{eventId: string}|null>}
   */
  async setRoomName(roomId, name) {
    return this.sendStateEvent(roomId, M_RNAME, { name });
  }

  /**
   * Sets the topic of a room.
   * @param {string} roomId
   * @param {string} topic
   * @returns {Promise<{eventId: string}|null>}
   */
  async setRoomTopic(roomId, topic) {
    return this.sendStateEvent(roomId, M_RTOPIC, { topic });
  }

  /**
   * Sets the avatar for a room.
   * @param {string} roomId
   * @param {string} url - An `mxc://` URI.
   * @returns {Promise<{eventId: string}|null>}
   */
  async setRoomAvatar(roomId, url) {
    return this.sendStateEvent(roomId, M_RAVATAR, { url });
  }

  /**
   * Fetches a specific state event from a room.
   * @param {string} roomId
   * @param {string} type - Matrix state event type.
   * @param {string} [stateKey=""]
   * @returns {Promise<Object|null>} The state event content, or `null` on failure.
   */
  async getRoomState(roomId, type, stateKey = "") {
    try {
      const result = await this.api(
        `/rooms/${roomId}/state/${enc(type)}/${enc(stateKey)}`,
      );
      return result.errcode ? null : result;
    } catch (e) {
      cerr("get state:", e);
      return null;
    }
  }

  /**
   * Gets the name of a room.
   * @param {string} roomId
   * @returns {Promise<string|null>}
   */
  async getRoomName(roomId) {
    return (await this.getRoomState(roomId, M_RNAME))?.name ?? null;
  }

  /**
   * Gets the topic of a room.
   * @param {string} roomId
   * @returns {Promise<string|null>}
   */
  async getRoomTopic(roomId) {
    return (await this.getRoomState(roomId, M_RTOPIC))?.topic ?? null;
  }

  /**
   * Fetches a snapshot of common room state (name, topic, avatar, power levels, members).
   * @param {string} roomId
   * @returns {Promise<{name: string|null, topic: string|null, avatarUrl: string|null, canonicalAlias: string|null, powerLevels: Object|null, members: Array<{userId: string, displayName: string|null, membership: string}>}|null>}
   */
  async getRoomAllState(roomId) {
    try {
      const result = await this.api(`/rooms/${roomId}/state`);
      if (!Array.isArray(result)) return null;
      const find = (type, key = "") =>
        result.find((e) => e.type === type && (e.state_key ?? "") === key)
          ?.content ?? null;
      return {
        name: find(M_RNAME)?.name ?? null,
        topic: find(M_RTOPIC)?.topic ?? null,
        avatarUrl: find(M_RAVATAR)?.url ?? null,
        canonicalAlias: find("m.room.canonical_alias")?.alias ?? null,
        powerLevels: find("m.room.power_levels"),
        members: result
          .filter((e) => e.type === M_MEMBER)
          .map((e) => ({
            userId: e.state_key,
            displayName: e.content?.displayname || null,
            membership: e.content?.membership || "leave",
          })),
      };
    } catch (e) {
      cerr("all state:", e);
      return null;
    }
  }

  /**
   * Fetches a page of messages from a room's timeline.
   * @param {string} roomId
   * @param {object} [options]
   * @param {string|null} [options.from=null] - Pagination token to start from.
   * @param {number} [options.limit=50] - Maximum number of events to return.
   * @param {string} [options.dir="b"] - Direction: `"b"` (backwards) or `"f"` (forwards).
   * @returns {Promise<{messages: Object[], start: string, end: string}|null>}
   */
  async getMessages(roomId, { from = null, limit = 50, dir = "b" } = {}) {
    try {
      const endpoint = `/rooms/${roomId}/messages?dir=${dir}&limit=${limit}${from ? "&from=" + enc(from) : ""}`;
      const result = await this.api(endpoint);
      return result.errcode
        ? null
        : {
            messages: result.chunk || [],
            start: result.start,
            end: result.end,
          };
    } catch (e) {
      cerr("messages:", e);
      return null;
    }
  }

  /**
   * Gets a list of threads in a room.
   * @param {string} roomId
   * @param {object} [options]
   * @param {string|null} [options.from=null] - Pagination token to start from.
   * @param {number} [options.limit=50] - Maximum number of thread roots to return.
   * @param {string} [options.include="all"] - Filter threads: "all" or "participated".
   * @returns {Promise<{threads: Object[], nextBatch: string|null}|null>}
   */
  async getThreads(roomId, { from = null, limit = 50, include = "all" } = {}) {
    try {
      const params = new URLSearchParams({ limit: limit.toString(), include });
      if (from) params.set("from", from);
      const endpoint = `/rooms/${roomId}/threads?${params.toString()}`;
      const result = await this.api(endpoint);
      return result.errcode
        ? null
        : {
            threads: result.chunk || [],
            nextBatch: result.next_batch || null,
          };
    } catch (e) {
      cerr("threads:", e);
      return null;
    }
  }
};
