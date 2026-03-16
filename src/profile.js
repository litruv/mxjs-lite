import { cerr, enc, M_TZ } from './constants.js';

/**
 * Mixin adding user profile and presence methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Profile = (Base) => class extends Base {
  /**
   * Fetches the display name and avatar URL for a user.
   * @param {string} [userId=this.userId] - The user ID to look up.
   * @returns {Promise<{displayName: string|null, avatarUrl: string|null}|null>}
   */
  async getProfile(userId = this.userId) {
    try {
      const data = await this.api(`/profile/${enc(userId)}`);
      return data.errcode
        ? null
        : {
            displayName: data.displayname || null,
            avatarUrl: data.avatar_url || null,
          };
    } catch (e) {
      cerr("profile:", e);
      return null;
    }
  }

  /**
   * Sets the display name for the current user.
   * @param {string} displayName
   * @returns {Promise<boolean>} `true` on success.
   */
  async setDisplayName(displayName) {
    const result = await this.api(
      `/profile/${this.userId}/displayname`,
      "PUT",
      { displayname: displayName },
    );
    return !result.errcode;
  }

  /**
   * Sets the avatar URL for the current user.
   * @param {string} avatarUrl - An `mxc://` URI.
   * @returns {Promise<boolean>} `true` on success.
   */
  async setAvatarUrl(avatarUrl) {
    const result = await this.api(`/profile/${this.userId}/avatar_url`, "PUT", {
      avatar_url: avatarUrl,
    });
    return !result.errcode;
  }

  /**
   * Gets the display name for a specific user.
   * @param {string} [userId=this.userId] - The user ID to look up.
   * @returns {Promise<string|null>} The display name, or null if not set or on error.
   */
  async getDisplayName(userId = this.userId) {
    try {
      const data = await this.api(`/profile/${enc(userId)}/displayname`);
      return data.errcode ? null : (data.displayname || null);
    } catch (e) {
      cerr("getDisplayName:", e);
      return null;
    }
  }

  /**
   * Gets the avatar URL for a specific user.
   * @param {string} [userId=this.userId] - The user ID to look up.
   * @returns {Promise<string|null>} The avatar URL (mxc://), or null if not set or on error.
   */
  async getAvatarUrl(userId = this.userId) {
    try {
      const data = await this.api(`/profile/${enc(userId)}/avatar_url`);
      return data.errcode ? null : (data.avatar_url || null);
    } catch (e) {
      cerr("getAvatarUrl:", e);
      return null;
    }
  }

  /**
   * Deletes the display name for the current user (sets it to empty).
   * @returns {Promise<boolean>} `true` on success.
   */
  async deleteDisplayName() {
    try {
      const result = await this.api(
        `/profile/${this.userId}/displayname`,
        "DELETE"
      );
      return !result.errcode;
    } catch (e) {
      cerr("deleteDisplayName:", e);
      return false;
    }
  }

  /**
   * Deletes the avatar URL for the current user (sets it to empty).
   * @returns {Promise<boolean>} `true` on success.
   */
  async deleteAvatarUrl() {
    try {
      const result = await this.api(
        `/profile/${this.userId}/avatar_url`,
        "DELETE"
      );
      return !result.errcode;
    } catch (e) {
      cerr("deleteAvatarUrl:", e);
      return false;
    }
  }

  /**
   * Fetches the presence status of a user using the public read token.
   * @param {string} userId
   * @returns {Promise<{presence: string, lastActive: number}|null>}
   */
  async fetchPublicPresence(userId) {
    if (!this.publicReadToken) {
      console.warn("No public read token");
      return null;
    }
    try {
      const data = await this.api(
        `/presence/${enc(userId)}/status`,
        "GET",
        null,
        this.publicReadToken,
      );
      return data.errcode
        ? null
        : { presence: data.presence, lastActive: data.last_active_ago || 0 };
    } catch (e) {
      cerr("presence:", e);
      return null;
    }
  }

  /**
   * Gets the presence status of a user.
   * @param {string} userId - The user ID to check.
   * @returns {Promise<{presence: string, lastActive: number, currentlyActive: boolean, statusMsg: string|null}|null>}
   */
  async getPresence(userId) {
    try {
      const data = await this.api(`/presence/${enc(userId)}/status`);
      return data.errcode
        ? null
        : {
            presence: data.presence,
            lastActive: data.last_active_ago || 0,
            currentlyActive: data.currently_active || false,
            statusMsg: data.status_msg || null,
          };
    } catch (e) {
      cerr("get presence:", e);
      return null;
    }
  }

  /**
   * Sets the presence status for the current user.
   * @param {string} presence - The presence state: "online", "offline", or "unavailable".
   * @param {string|null} [statusMsg=null] - Optional status message.
   * @returns {Promise<boolean>} `true` on success.
   */
  async setPresence(presence, statusMsg = null) {
    try {
      const body = { presence };
      if (statusMsg) body.status_msg = statusMsg;
      const result = await this.api(
        `/presence/${enc(this.userId)}/status`,
        "PUT",
        body,
      );
      return !result.errcode;
    } catch (e) {
      cerr("set presence:", e);
      return false;
    }
  }

  /**
   * Reports a user to the homeserver moderators.
   * @param {string} userId
   * @param {string} [reason=''] - Human-readable reason for the report.
   * @param {number} [score=0] - Severity score between -100 (most offensive) and 0 (inoffensive).
   * @returns {Promise<boolean>} `true` on success.
   */
  async reportUser(userId, reason = '', score = 0) {
    try {
      const result = await this.api(`/users/${enc(userId)}/report`, 'POST', { reason, score });
      return !result.errcode;
    } catch (e) {
      cerr('reportUser:', e);
      return false;
    }
  }

  /**
   * Gets information about a specific user from the server administrator perspective.
   * Requires server admin privileges.
   * @param {string} userId
   * @returns {Promise<Object|null>} User info object, or `null` on failure.
   */
  async adminWhois(userId) {
    try {
      const result = await this.api(`/admin/whois/${enc(userId)}`);
      if (result.errcode) throw new Error(result.error || result.errcode);
      return result;
    } catch (e) {
      cerr('adminWhois:', e);
      return null;
    }
  }

  /**
   * Gets the IANA time zone for a user (MSC4175).
   * Returns the value of the `m.tz` profile field, e.g. `"Europe/Paris"`.
   * Returns `null` if the field is not set or on failure.
   * @param {string} [userId=this.userId]
   * @returns {Promise<string|null>}
   */
  async getTimeZone(userId = this.userId) {
    try {
      const data = await this.api(`/profile/${enc(userId)}/${M_TZ}`);
      return data.errcode ? null : (data[M_TZ] ?? null);
    } catch (e) {
      cerr('getTimeZone:', e);
      return null;
    }
  }

  /**
   * Sets the IANA time zone for the current user (MSC4175).
   * The value must be a valid IANA Time Zone Database name (e.g. `"America/New_York"`).
   * Pass `null` to clear the field.
   * @param {string|null} tz - IANA time zone name, or `null` to remove the field.
   * @returns {Promise<boolean>} `true` on success.
   */
  async setTimeZone(tz) {
    try {
      const result = await this.api(
        `/profile/${enc(this.userId)}/${M_TZ}`,
        tz !== null ? 'PUT' : 'DELETE',
        tz !== null ? { [M_TZ]: tz } : null,
      );
      return !result.errcode;
    } catch (e) {
      cerr('setTimeZone:', e);
      return false;
    }
  }
};
