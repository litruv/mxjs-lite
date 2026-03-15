import { cerr, M_LPWD, M_IDUSER } from './constants.js';

/**
 * Mixin adding Matrix authentication methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T & typeof AuthClass}
 */
export const Auth = (Base) => class extends Base {
  /**
   * Registers a new account on the homeserver.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{accessToken: string, userId: string}|null>} Session info, or `null` on failure.
   */
  async register(username, password) {
    try {
      return this._storeSession(
        await this._uiaaRequest(
          "/register",
          { username, password },
          (s) => ({
            username,
            password,
            auth: { type: "m.login.dummy", session: s },
          }),
          null,
        ),
      );
    } catch (e) {
      cerr("register:", e);
      return null;
    }
  }

  /**
   * Registers an anonymous guest account on the homeserver.
   * @returns {Promise<{accessToken: string, userId: string}|null>} Session info, or `null` on failure.
   */
  async registerGuest() {
    try {
      const data = await this.api("/register?kind=guest", "POST", {}, null);
      if (data.errcode) throw new Error(data.error || data.errcode);
      return this._storeSession(data);
    } catch (e) {
      cerr("guest:", e);
      return null;
    }
  }

  /**
   * Logs in with a username and password.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{accessToken: string, userId: string}|null>} Session info, or `null` on failure.
   */
  async login(username, password) {
    try {
      const data = await this.api(
        "/login",
        "POST",
        {
          type: M_LPWD,
          identifier: { type: M_IDUSER, user: username },
          password,
        },
        null,
      );
      if (data.errcode) throw new Error(data.error || data.errcode);
      return this._storeSession(data);
    } catch (e) {
      cerr("login:", e);
      return null;
    }
  }

  /**
   * Clears the locally stored access token and user ID.
   */
  logout() {
    this.accessToken = null;
    this.userId = null;
    this._knownRoomIds.clear();
    this.emit('disconnect');
  }

  /**
   * Permanently deactivates the current user's account.
   * @param {string} password - Current account password for UIAA confirmation.
   * @returns {Promise<boolean>} `true` on success.
   */
  async deactivateAccount(password) {
    try {
      await this._uiaaRequest("/account/deactivate", {}, (s) => ({
        auth: {
          type: M_LPWD,
          session: s,
          identifier: { type: M_IDUSER, user: this.userId },
          password,
        },
      }));
      this.logout();
      return true;
    } catch (e) {
      cerr("deactivate:", e);
      return false;
    }
  }

  /**
   * Changes the current user's password.
   * @param {string} oldPassword
   * @param {string} newPassword
   * @returns {Promise<boolean>} `true` on success.
   */
  async changePassword(oldPassword, newPassword) {
    try {
      await this._uiaaRequest(
        "/account/password",
        { new_password: newPassword },
        (s) => ({
          new_password: newPassword,
          auth: {
            type: M_LPWD,
            session: s,
            identifier: { type: M_IDUSER, user: this.userId },
            password: oldPassword,
          },
        }),
      );
      return true;
    } catch (e) {
      cerr("password:", e);
      return false;
    }
  }
};
