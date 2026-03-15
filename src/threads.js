import { cerr, enc, M_REL, M_TEXT, M_HTML, M_MSG, M_THREAD } from './constants.js';

/**
 * Mixin adding Matrix Threads support (MSC3440 / Matrix v1.3) to a base client class.
 * Threads are conversations branched off a root message using the `m.thread` relation type.
 *
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Threads = (Base) => class extends Base {
  /**
   * Sends a reply into a thread. Includes a fallback `m.in_reply_to` for
   * clients that do not support threads (per MSC3440 backwards-compatibility).
   * @param {string} roomId
   * @param {string} threadRootId - Event ID of the thread root message.
   * @param {string} message - Plain text body.
   * @param {string|null} [formattedBody=null] - Optional HTML-formatted body.
   * @returns {Promise<{eventId: string}|null>}
   */
  async sendThreadReply(roomId, threadRootId, message, formattedBody = null) {
    const content = {
      msgtype: M_TEXT,
      body: message,
      [M_REL]: {
        rel_type: M_THREAD,
        event_id: threadRootId,
        is_falling_back: true,
        'm.in_reply_to': { event_id: threadRootId },
      },
    };
    if (formattedBody) {
      content.format = M_HTML;
      content.formatted_body = formattedBody;
    }
    return this._sendRoomEvent(roomId, M_MSG, content, 'thread reply');
  }

  /**
   * Sends a rich reply within a thread, targeting a specific event rather than the root.
   * Sets `is_falling_back: false` so clients treat this as a genuine reply.
   * @param {string} roomId
   * @param {string} threadRootId - Event ID of the thread root.
   * @param {string} replyToEventId - Event ID within the thread being directly replied to.
   * @param {string} message - Plain text body.
   * @param {string|null} [formattedBody=null] - Optional HTML-formatted body.
   * @returns {Promise<{eventId: string}|null>}
   */
  async sendThreadReplyTo(roomId, threadRootId, replyToEventId, message, formattedBody = null) {
    const content = {
      msgtype: M_TEXT,
      body: message,
      [M_REL]: {
        rel_type: M_THREAD,
        event_id: threadRootId,
        is_falling_back: false,
        'm.in_reply_to': { event_id: replyToEventId },
      },
    };
    if (formattedBody) {
      content.format = M_HTML;
      content.formatted_body = formattedBody;
    }
    return this._sendRoomEvent(roomId, M_MSG, content, 'thread reply to');
  }

  /**
   * Fetches the events belonging to a thread via the `/relations` API.
   * @param {string} roomId
   * @param {string} threadRootId - Event ID of the thread root message.
   * @param {Object} [options={}]
   * @param {string} [options.from] - Pagination token.
   * @param {number} [options.limit=50] - Maximum number of events to return.
   * @param {string} [options.dir="b"] - Direction: `"b"` (backwards) or `"f"` (forwards).
   * @returns {Promise<{events: Object[], nextBatch: string|null}|null>}
   */
  async getThreadEvents(roomId, threadRootId, options = {}) {
    try {
      const qs = new URLSearchParams();
      if (options.from) qs.set('from', options.from);
      if (options.limit) qs.set('limit', options.limit);
      if (options.dir) qs.set('dir', options.dir);
      const query = qs.toString();
      const path = `/rooms/${enc(roomId)}/relations/${enc(threadRootId)}/${enc(M_THREAD)}${query ? '?' + query : ''}`;
      const result = await this.api(path);
      if (result.errcode) return null;
      return { events: result.chunk ?? [], nextBatch: result.next_batch ?? null };
    } catch (e) {
      cerr('getThreadEvents:', e);
      return null;
    }
  }

  /**
   * Returns `true` if the event is a thread reply (`rel_type` of `m.thread`).
   * @param {Object} event - A Matrix room event.
   * @returns {boolean}
   */
  isThreadEvent(event) {
    return event?.content?.[M_REL]?.rel_type === M_THREAD;
  }

  /**
   * Returns the event ID of the thread root this event belongs to, or `null`.
   * @param {Object} event - A Matrix room event.
   * @returns {string|null}
   */
  getThreadRoot(event) {
    return event?.content?.[M_REL]?.rel_type === M_THREAD
      ? (event.content[M_REL].event_id ?? null)
      : null;
  }

  /**
   * Returns `true` if the `m.in_reply_to` on a thread event is a fallback
   * for non-thread clients (i.e. `is_falling_back` is `true`).
   * @param {Object} event - A Matrix room event.
   * @returns {boolean}
   */
  isThreadFallback(event) {
    return event?.content?.[M_REL]?.is_falling_back === true;
  }

  /**
   * Fetches all thread root events in a room using the dedicated threads list
   * endpoint (`GET /_matrix/client/v1/rooms/{roomId}/threads`, MSC3856 / Matrix v1.4).
   * @param {string} roomId
   * @param {Object} [options={}]
   * @param {'all'|'participated'} [options.include='all'] - `'all'` returns every thread; `'participated'` returns only threads the current user contributed to.
   * @param {string} [options.from] - Pagination token from a previous call's `nextBatch`.
   * @param {number} [options.limit] - Maximum number of thread roots to return.
   * @returns {Promise<{threads: Object[], nextBatch: string|null}|null>}
   */
  async getRoomThreads(roomId, options = {}) {
    const params = {};
    if (options.include) params.include = options.include;
    if (options.from) params.from = options.from;
    if (options.limit !== undefined) params.limit = options.limit;

    const query = Object.keys(params).length ? '?' + enc(params) : '';
    const res = await this.api(`/rooms/${roomId}/threads${query}`, 'GET', null, this.accessToken, 'v1').catch(cerr);
    if (!res) return null;
    return { threads: res.chunk ?? [], nextBatch: res.next_batch ?? null };
  }
};
