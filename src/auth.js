import { cerr, M_LPWD, M_IDUSER } from './constants.js';

/**
 * Matrix authentication methods.
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
   * @private
   */
  _clearSession() {
    this.accessToken = null;
    this.userId = null;
    this._knownRoomIds.clear();
    this.emit('disconnect');
  }

  /**
   * Logs out from the current session, invalidating the access token on the server.
   * @returns {Promise<boolean>} `true` on success.
   */
  async logout() {
    try {
      await this.api("/logout", "POST", {});
      this._clearSession();
      return true;
    } catch (e) {
      cerr("logout:", e);
      this._clearSession(); // Clear local session even if server call fails
      return false;
    }
  }

  /**
   * Logs out from all sessions, invalidating all access tokens for this user.
   * @returns {Promise<boolean>} `true` on success.
   */
  async logoutAll() {
    try {
      await this.api("/logout/all", "POST", {});
      this._clearSession();
      return true;
    } catch (e) {
      cerr("logoutAll:", e);
      this._clearSession(); // Clear local session even if server call fails
      return false;
    }
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
      this._clearSession();
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

  /**
   * Refreshes the current access token using a refresh token.
   * Stores the new access token if the server returns one.
   * @param {string} refreshToken - The refresh token obtained from a previous login or refresh.
   * @returns {Promise<{accessToken: string, refreshToken?: string}|null>} New tokens, or `null` on failure.
   */
  async refreshToken(refreshToken) {
    try {
      const data = await this.api("/refresh", "POST", { refresh_token: refreshToken }, null);
      if (data.errcode) throw new Error(data.error || data.errcode);
      this.accessToken = data.access_token;
      return { accessToken: data.access_token, refreshToken: data.refresh_token };
    } catch (e) {
      cerr("refresh:", e);
      return null;
    }
  }

  /**
   * Requests an email token to be used for a password reset flow.
   * @param {string} clientSecret - Unique string generated by the client.
   * @param {string} email - The email address to send the token to.
   * @param {number} sendAttempt - Incremented each time a new email should be sent.
   * @param {Object} [options={}] - Optional extra parameters (next_link, id_server, etc.).
   * @returns {Promise<{sid: string}|null>} Session ID, or `null` on failure.
   */
  async requestPasswordEmailToken(clientSecret, email, sendAttempt, options = {}) {
    try {
      const data = await this.api("/account/password/email/requestToken", "POST", {
        client_secret: clientSecret,
        email,
        send_attempt: sendAttempt,
        ...options,
      }, null);
      if (data.errcode) throw new Error(data.error || data.errcode);
      return { sid: data.sid };
    } catch (e) {
      cerr("requestPasswordEmailToken:", e);
      return null;
    }
  }

  /**
   * Requests a phone token to be used for a password reset flow.
   * @param {string} clientSecret - Unique string generated by the client.
   * @param {string} country - ISO 3166-1 alpha-2 country code.
   * @param {string} phoneNumber - The phone number to send the token to.
   * @param {number} sendAttempt - Incremented each time a new SMS should be sent.
   * @param {Object} [options={}] - Optional extra parameters (next_link, id_server, etc.).
   * @returns {Promise<{sid: string}|null>} Session ID, or `null` on failure.
   */
  async requestPasswordMsisdnToken(clientSecret, country, phoneNumber, sendAttempt, options = {}) {
    try {
      const data = await this.api("/account/password/msisdn/requestToken", "POST", {
        client_secret: clientSecret,
        country,
        phone_number: phoneNumber,
        send_attempt: sendAttempt,
        ...options,
      }, null);
      if (data.errcode) throw new Error(data.error || data.errcode);
      return { sid: data.sid };
    } catch (e) {
      cerr("requestPasswordMsisdnToken:", e);
      return null;
    }
  }

  /**
   * Gets the list of third-party identifiers (email/phone) associated with the current account.
   * @returns {Promise<Array<{medium: string, address: string, validated_at: number, added_at: number}>|null>}
   */
  async getThirdPartyIdentifiers() {
    try {
      const data = await this.api("/account/3pid", "GET");
      if (data.errcode) throw new Error(data.error || data.errcode);
      return data.threepids ?? [];
    } catch (e) {
      cerr("get3pid:", e);
      return null;
    }
  }

  /**
   * Associates a validated third-party identifier with the account (legacy endpoint).
   * @param {{sid: string, client_secret: string, id_server: string, id_access_token: string}} threePidCreds
   * @param {boolean} [bind=false] - Whether to also bind to the identity server.
   * @returns {Promise<boolean>} `true` on success.
   */
  async addThirdPartyIdentifier(threePidCreds, bind = false) {
    try {
      const data = await this.api("/account/3pid", "POST", { three_pid_creds: threePidCreds, bind });
      if (data.errcode) throw new Error(data.error || data.errcode);
      return true;
    } catch (e) {
      cerr("add3pid:", e);
      return false;
    }
  }

  /**
   * Adds a third-party identifier to the account using UIAA authentication.
   * @param {{sid: string, client_secret: string}} threePidCreds
   * @param {Object} auth - UIAA auth object.
   * @returns {Promise<boolean>} `true` on success.
   */
  async addThirdPartyIdentifierNew(threePidCreds, auth) {
    try {
      const data = await this.api("/account/3pid/add", "POST", { three_pid_creds: threePidCreds, auth });
      if (data.errcode) throw new Error(data.error || data.errcode);
      return true;
    } catch (e) {
      cerr("add3pidNew:", e);
      return false;
    }
  }

  /**
   * Binds a validated third-party identifier to the account via an identity server.
   * @param {{sid: string, client_secret: string, id_server: string, id_access_token: string}} threePidCreds
   * @returns {Promise<boolean>} `true` on success.
   */
  async bindThirdPartyIdentifier(threePidCreds) {
    try {
      const data = await this.api("/account/3pid/bind", "POST", { three_pid_creds: threePidCreds });
      if (data.errcode) throw new Error(data.error || data.errcode);
      return true;
    } catch (e) {
      cerr("bind3pid:", e);
      return false;
    }
  }

  /**
   * Removes a third-party identifier from the account.
   * @param {string} medium - The medium of the identifier (`email` or `msisdn`).
   * @param {string} address - The address of the identifier.
   * @param {Object} [options={}] - Optional extra parameters (id_server, etc.).
   * @returns {Promise<{idServerUnbindResult?: string}|null>} Result object, or `null` on failure.
   */
  async deleteThirdPartyIdentifier(medium, address, options = {}) {
    try {
      const data = await this.api("/account/3pid/delete", "POST", { medium, address, ...options });
      if (data.errcode) throw new Error(data.error || data.errcode);
      return { idServerUnbindResult: data.id_server_unbind_result };
    } catch (e) {
      cerr("delete3pid:", e);
      return null;
    }
  }

  /**
   * Unbinds a third-party identifier from the account on the identity server.
   * @param {string} medium - The medium of the identifier (`email` or `msisdn`).
   * @param {string} address - The address of the identifier.
   * @param {Object} [options={}] - Optional extra parameters (id_server, etc.).
   * @returns {Promise<{idServerUnbindResult?: string}|null>} Result object, or `null` on failure.
   */
  async unbindThirdPartyIdentifier(medium, address, options = {}) {
    try {
      const data = await this.api("/account/3pid/unbind", "POST", { medium, address, ...options });
      if (data.errcode) throw new Error(data.error || data.errcode);
      return { idServerUnbindResult: data.id_server_unbind_result };
    } catch (e) {
      cerr("unbind3pid:", e);
      return null;
    }
  }

  /**
   * Requests an email token used to validate an email address for a 3PID association.
   * @param {string} clientSecret - Unique string generated by the client.
   * @param {string} email - The email address to send the token to.
   * @param {number} sendAttempt - Incremented each time a new email should be sent.
   * @param {Object} [options={}] - Optional extra parameters (next_link, id_server, etc.).
   * @returns {Promise<{sid: string}|null>} Session ID, or `null` on failure.
   */
  async requestEmailTokenFor3pid(clientSecret, email, sendAttempt, options = {}) {
    try {
      const data = await this.api("/account/3pid/email/requestToken", "POST", {
        client_secret: clientSecret,
        email,
        send_attempt: sendAttempt,
        ...options,
      }, null);
      if (data.errcode) throw new Error(data.error || data.errcode);
      return { sid: data.sid };
    } catch (e) {
      cerr("requestEmailToken3pid:", e);
      return null;
    }
  }

  /**
   * Requests a phone token used to validate a phone number for a 3PID association.
   * @param {string} clientSecret - Unique string generated by the client.
   * @param {string} country - ISO 3166-1 alpha-2 country code.
   * @param {string} phoneNumber - The phone number to send the token to.
   * @param {number} sendAttempt - Incremented each time a new SMS should be sent.
   * @param {Object} [options={}] - Optional extra parameters (next_link, id_server, etc.).
   * @returns {Promise<{sid: string}|null>} Session ID, or `null` on failure.
   */
  async requestMsisdnTokenFor3pid(clientSecret, country, phoneNumber, sendAttempt, options = {}) {
    try {
      const data = await this.api("/account/3pid/msisdn/requestToken", "POST", {
        client_secret: clientSecret,
        country,
        phone_number: phoneNumber,
        send_attempt: sendAttempt,
        ...options,
      }, null);
      if (data.errcode) throw new Error(data.error || data.errcode);
      return { sid: data.sid };
    } catch (e) {
      cerr("requestMsisdnToken3pid:", e);
      return null;
    }
  }

  /**
   * Fetches the Matrix spec versions supported by the homeserver.
   * @returns {Promise<{versions: string[]}|null>} Object containing versions array, or null on failure.
   */
  async getVersions() {
    try {
      const url = `${this.homeserver}/_matrix/client/versions`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.errcode) throw new Error(data.error || data.errcode);
      return data;
    } catch (e) {
      cerr("versions:", e);
      return null;
    }
  }
};
