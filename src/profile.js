import { cerr, enc } from './constants.js';

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
};
