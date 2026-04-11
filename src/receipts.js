import { cerr, enc } from './constants.js';

/**
 * Typing notifications and read receipts.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Receipts = (Base) => class extends Base {
  /**
   * Sends a typing notification to a room.
   * @param {string} roomId
   * @param {boolean} typing - `true` to indicate typing, `false` to stop.
   * @param {number} [timeout=30000] - How long (ms) the typing indicator should remain active.
   * @returns {Promise<boolean>} `true` on success.
   */
  async sendTyping(roomId, typing, timeout = 30000) {
    try {
      return !(
        await this.api(
          `/rooms/${roomId}/typing/${this.userId}`,
          "PUT",
          typing ? { typing: true, timeout } : { typing: false },
        )
      ).errcode;
    } catch (e) {
      cerr("typing:", e);
      return false;
    }
  }

  /**
   * Marks an event as read by sending a read receipt.
   * @param {string} roomId
   * @param {string} eventId
   * @returns {Promise<boolean>} `true` on success.
   */
  async sendReadReceipt(roomId, eventId) {
    try {
      return !(
        await this.api(
          `/rooms/${roomId}/receipt/m.read/${enc(eventId)}`,
          "POST",
          {},
        )
      ).errcode;
    } catch (e) {
      cerr("receipt:", e);
      return false;
    }
  }

  /**
   * Sets read markers for a room (fully read marker and optional read receipt).
   * @param {string} roomId - The room ID
   * @param {string} fullyReadEventId - The event ID to mark as fully read
   * @param {string} [readReceiptEventId] - Optional event ID to send a read receipt for
   * @returns {Promise<boolean>} `true` on success.
   */
  async setReadMarkers(roomId, fullyReadEventId, readReceiptEventId) {
    try {
      const body = { 'm.fully_read': fullyReadEventId };
      if (readReceiptEventId) {
        body['m.read'] = readReceiptEventId;
      }
      return !(
        await this.api(
          `/rooms/${roomId}/read_markers`,
          "POST",
          body,
        )
      ).errcode;
    } catch (e) {
      cerr("read_markers:", e);
      return false;
    }
  }
};
