import { cerr, enc, M_INVITE_PERM_CONFIG } from './constants.js';

/**
 * Account data methods.
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

  /**
   * Returns whether the current user has invite blocking enabled.
   * When `true`, the homeserver will reject all incoming room invites (MSC4380).
   * @returns {Promise<boolean|null>} `true` if blocking is on, `false` if off, `null` on failure.
   */
  async getInviteBlocking() {
    const data = await this.getAccountData(M_INVITE_PERM_CONFIG);
    if (data === null) return null;
    return data.default_action === 'block';
  }

  /**
   * Enables or disables invite blocking for the current user (MSC4380).
   * When enabled, the homeserver will reject all incoming room invites.
   * Sets the `m.invite_permission_config` account data event.
   * @param {boolean} block - `true` to block all invites, `false` to allow invites.
   * @returns {Promise<boolean>} `true` on success.
   */
  async setInviteBlocking(block) {
    return this.setAccountData(M_INVITE_PERM_CONFIG, block ? { default_action: 'block' } : {});
  }
};
