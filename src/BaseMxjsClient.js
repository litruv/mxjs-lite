import { cerr } from './constants.js';

/**
 * Core base class for the Matrix client.
 * Provides the raw API transport, UIAA authentication helper, session storage,
 * and the event emitter (on/off/emit).
 *
 * All other functionality is added via mixins on top of this class.
 */
export class BaseMxjsClient {
  /** @type {Map<string, Set<function>>} */
  _handlers = new Map();

  /** @type {Set<string>} Tracks room IDs seen in sync responses to detect new joins. */
  _knownRoomIds = new Set();

  /**
   * @param {object} [options]
   * @param {string} [options.homeserver="https://matrix.org"] - The Matrix homeserver base URL.
   * @param {string|null} [options.publicReadToken=null] - Access token used for unauthenticated public read operations.
   */
  constructor({
    homeserver = "https://matrix.org",
    publicReadToken = null,
  } = {}) {
    this.homeserver = homeserver;
    this.publicReadToken = publicReadToken;
    this.accessToken = null;
    this.userId = null;
  }

  /**
   * Makes a raw Matrix Client-Server API request.
   * @param {string} endpoint - The endpoint path relative to `/_matrix/client/r0`.
   * @param {string} [method="GET"] - HTTP method.
   * @param {Object|null} [body=null] - Request body, serialized as JSON.
   * @param {string|null} [accessToken=this.accessToken] - Bearer token override.
   * @returns {Promise<Object>} The parsed JSON response.
   */
  async api(
    endpoint,
    method = "GET",
    body = null,
    accessToken = this.accessToken,
  ) {
    const url = `${this.homeserver}/_matrix/client/r0${endpoint}`;
    const headers = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(url, options);
    const data = await response.json();
    if (data.errcode === "M_LIMIT_EXCEEDED") {
      await new Promise((r) => setTimeout(r, data.retry_after_ms ?? 1000));
      return (await fetch(url, options)).json();
    }
    return data;
  }

  /**
   * Performs a UIAA (User-Interactive Authentication) two-step POST request.
   * @param {string} endpoint - API endpoint path.
   * @param {Object} firstBody - Initial request body to retrieve the UIAA session.
   * @param {function(string): Object} buildAuthBody - Callback receiving the session ID and returning the final auth body.
   * @param {string|null} [accessToken=this.accessToken] - Bearer token override.
   * @returns {Promise<Object>} The final response data.
   */
  async _uiaaRequest(
    endpoint,
    firstBody,
    buildAuthBody,
    accessToken = this.accessToken,
  ) {
    const headers = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const url = `${this.homeserver}/_matrix/client/r0${endpoint}`;
    const initRes = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(firstBody),
    });
    const initData = await initRes.json();
    if (initRes.ok) return initData;
    if (!initData.session) throw new Error(initData.error || initData.errcode);
    const authData = await (
      await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(buildAuthBody(initData.session)),
      })
    ).json();
    if (authData.errcode) throw new Error(authData.error || authData.errcode);
    return authData;
  }

  /**
   * Stores session credentials from a login or register response.
   * @param {Object} data - Response containing `access_token` and `user_id`.
   * @returns {{accessToken: string, userId: string}}
   */
  _storeSession(data) {
    this.accessToken = data.access_token;
    this.userId = data.user_id;
    const session = { accessToken: data.access_token, userId: data.user_id };
    this.emit('connect', session);
    return session;
  }

  /**
   * Registers a listener for a named event.
   * @param {string} event - Event name.
   * @param {function} fn - Listener callback.
   * @returns {this}
   */
  on(event, fn) {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event).add(fn);
    return this;
  }

  /**
   * Removes a listener (or all listeners) for a named event.
   * @param {string} event - Event name.
   * @param {function} [fn] - Specific listener to remove. Omit to remove all.
   * @returns {this}
   */
  off(event, fn) {
    if (fn) this._handlers.get(event)?.delete(fn);
    else this._handlers.delete(event);
    return this;
  }

  /**
   * Emits a named event, invoking all registered listeners with the provided arguments.
   * @param {string} event - Event name.
   * @param {...*} args - Arguments forwarded to each listener.
   */
  emit(event, ...args) {
    this._handlers.get(event)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        cerr("emit", event, e);
      }
    });
  }
}
