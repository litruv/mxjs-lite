import { cerr, enc } from './constants.js';

/**
 * Mixin adding account data methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const AccountData = (Base) => class extends Base {
  /**
   * Sets account data for the user.
   * @param {string} type - The event type of the account data
   * @param {Object} content - The content to store
   * @returns {Promise<boolean>} `true` on success
   */
  async setAccountData(type, content) {
    try {
      const result = await this.api(
        `/user/${enc(this.userId)}/account_data/${enc(type)}`,
        "PUT",
        content
      );
      return !result.errcode;
    } catch (e) {
      cerr("setAccountData:", e);
      return false;
    }
  }

  /**
   * Gets account data for the user.
   * @param {string} type - The event type of the account data
   * @returns {Promise<Object|null>} The account data content, or null on failure
   */
  async getAccountData(type) {
    try {
      const result = await this.api(
        `/user/${enc(this.userId)}/account_data/${enc(type)}`
      );
      return result.errcode ? null : result;
    } catch (e) {
      cerr("getAccountData:", e);
      return null;
    }
  }

  /**
   * Sets room-specific account data for the user.
   * @param {string} roomId - The room ID
   * @param {string} type - The event type of the account data
   * @param {Object} content - The content to store
   * @returns {Promise<boolean>} `true` on success
   */
  async setRoomAccountData(roomId, type, content) {
    try {
      const result = await this.api(
        `/user/${enc(this.userId)}/rooms/${enc(roomId)}/account_data/${enc(type)}`,
        "PUT",
        content
      );
      return !result.errcode;
    } catch (e) {
      cerr("setRoomAccountData:", e);
      return false;
    }
  }

  /**
   * Gets room-specific account data for the user.
   * @param {string} roomId - The room ID
   * @param {string} type - The event type of the account data
   * @returns {Promise<Object|null>} The account data content, or null on failure
   */
  async getRoomAccountData(roomId, type) {
    try {
      const result = await this.api(
        `/user/${enc(this.userId)}/rooms/${enc(roomId)}/account_data/${enc(type)}`
      );
      return result.errcode ? null : result;
    } catch (e) {
      cerr("getRoomAccountData:", e);
      return null;
    }
  }
};
