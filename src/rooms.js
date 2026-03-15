import { cerr, enc } from './constants.js';

/**
 * Mixin adding room management methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Rooms = (Base) => class extends Base {
  /**
   * Creates a new room.
   * @param {Object} options - Room creation options passed directly to the Matrix API.
   * @returns {Promise<{roomId: string}|null>} The new room ID, or `null` on failure.
   */
  async createRoom(options) {
    const result = await this.api("/createRoom", "POST", options);
    if (result.errcode) {
      cerr("create:", result.errcode);
      return null;
    }
    return { roomId: result.room_id };
  }

  /**
   * Joins a room by its ID or alias.
   * @param {string} roomIdOrAlias
   * @returns {Promise<{roomId: string}|null>} The joined room ID, or `null` on failure.
   */
  async joinRoom(roomIdOrAlias) {
    try {
      const result = await this.api(`/join/${enc(roomIdOrAlias)}`, "POST", {});
      return result.errcode ? null : { roomId: result.room_id };
    } catch (e) {
      cerr("join:", e);
      return null;
    }
  }

  /**
   * Joins a room by room ID directly.
   * @param {string} roomId
   * @param {Object} [options={}] - Optional join parameters (third_party_signed, reason, etc.).
   * @returns {Promise<{roomId: string}|null>} The joined room ID, or `null` on failure.
   */
  async joinRoomById(roomId, options = {}) {
    try {
      const result = await this.api(`/rooms/${roomId}/join`, "POST", options);
      return result.errcode ? null : { roomId: result.room_id };
    } catch (e) {
      cerr("join by id:", e);
      return null;
    }
  }

  /**
   * Knocks on a room (requests to join).
   * @param {string} roomIdOrAlias
   * @param {Object} [options={}] - Optional knock parameters (reason, server_name, etc.).
   * @returns {Promise<{roomId: string}|null>} The room ID, or `null` on failure.
   */
  async knockRoom(roomIdOrAlias, options = {}) {
    try {
      const result = await this.api(`/knock/${enc(roomIdOrAlias)}`, "POST", options);
      return result.errcode ? null : { roomId: result.room_id };
    } catch (e) {
      cerr("knock:", e);
      return null;
    }
  }

  /**
   * Leaves a room.
   * @param {string} roomId
   * @returns {Promise<boolean>} `true` on success.
   */
  async leaveRoom(roomId) {
    try {
      return !(await this.api(`/rooms/${roomId}/leave`, "POST", {})).errcode;
    } catch (e) {
      cerr("leave:", e);
      return false;
    }
  }

  /**
   * Forgets a room (must be left first).
   * @param {string} roomId
   * @returns {Promise<boolean>} `true` on success.
   */
  async forgetRoom(roomId) {
    try {
      return !(await this.api(`/rooms/${roomId}/forget`, "POST", {})).errcode;
    } catch (e) {
      cerr("forget:", e);
      return false;
    }
  }

  /**
   * Upgrades a room to a new version.
   * @param {string} roomId
   * @param {string} newVersion - The new room version (e.g., "10").
   * @returns {Promise<{replacementRoom: string}|null>} The new room ID, or `null` on failure.
   */
  async upgradeRoom(roomId, newVersion) {
    try {
      const result = await this.api(`/rooms/${roomId}/upgrade`, "POST", {
        new_version: newVersion,
      });
      return result.errcode ? null : { replacementRoom: result.replacement_room };
    } catch (e) {
      cerr("upgrade:", e);
      return null;
    }
  }

  /**
   * Invites a user to a room.
   * @param {string} roomId
   * @param {string} userId
   * @returns {Promise<boolean>} `true` on success.
   */
  async inviteUser(roomId, userId) {
    try {
      return !(
        await this.api(`/rooms/${roomId}/invite`, "POST", { user_id: userId })
      ).errcode;
    } catch (e) {
      cerr("invite:", e);
      return false;
    }
  }

  /**
   * Performs a moderation action on a user in a room.
   * @param {"kick"|"ban"} action - The moderation action to perform.
   * @param {string} roomId
   * @param {string} userId
   * @param {string} [reason=""]
   * @returns {Promise<boolean>} `true` on success.
   */
  async _userModAction(action, roomId, userId, reason = "") {
    try {
      const body = { user_id: userId };
      if (reason) body.reason = reason;
      return !(await this.api(`/rooms/${roomId}/${action}`, "POST", body))
        .errcode;
    } catch (e) {
      cerr(`${action}:`, e);
      return false;
    }
  }

  /**
   * Kicks a user from a room.
   * @param {string} roomId
   * @param {string} userId
   * @param {string} [reason=""]
   * @returns {Promise<boolean>} `true` on success.
   */
  async kickUser(roomId, userId, reason = "") {
    return this._userModAction("kick", roomId, userId, reason);
  }

  /**
   * Bans a user from a room.
   * @param {string} roomId
   * @param {string} userId
   * @param {string} [reason=""]
   * @returns {Promise<boolean>} `true` on success.
   */
  async banUser(roomId, userId, reason = "") {
    return this._userModAction("ban", roomId, userId, reason);
  }

  /**
   * Unbans a user from a room.
   * @param {string} roomId
   * @param {string} userId
   * @returns {Promise<boolean>} `true` on success.
   */
  async unbanUser(roomId, userId) {
    try {
      return !(
        await this.api(`/rooms/${roomId}/unban`, "POST", { user_id: userId })
      ).errcode;
    } catch (e) {
      cerr("unban:", e);
      return false;
    }
  }

  /**
   * Fetches the current joined members of a room.
   * @param {string} roomId
   * @returns {Promise<Array<{userId: string, displayName: string}>|null>}
   */
  async getRoomMembers(roomId) {
    try {
      const result = await this.api(`/rooms/${roomId}/members`);
      if (result.errcode || !result.chunk) return null;
      return result.chunk
        .filter((e) => e.content?.membership === "join")
        .map((e) => ({
          userId: e.state_key,
          displayName:
            e.content.displayname || e.state_key.split(":")[0].substring(1),
        }));
    } catch (e) {
      cerr("members:", e);
      return null;
    }
  }
};
