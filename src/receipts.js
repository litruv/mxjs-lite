import { cerr, enc } from './constants.js';

/**
 * Mixin adding typing notifications and read receipts to a base client class.
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
};
