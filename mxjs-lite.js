const SANITIZE_ALLOWED_TAGS = new Set([
  "a",
  "b",
  "strong",
  "i",
  "em",
  "code",
  "del",
  "s",
  "strike",
  "u",
  "span",
  "br",
]);

const enc = encodeURIComponent;
const cerr = console.error.bind(console);
const M_MSG = "m.room.message";
const M_MEMBER = "m.room.member";
const M_REACT = "m.reaction";
const M_RNAME = "m.room.name";
const M_RTOPIC = "m.room.topic";
const M_RAVATAR = "m.room.avatar";
const M_REL = "m.relates_to";
const M_NEWCONT = "m.new_content";
const M_REPLACE = "m.replace";
const M_ANNOT = "m.annotation";
const M_LPWD = "m.login.password";
const M_IDUSER = "m.id.user";
const M_TEXT = "m.text";
const M_IMAGE = "m.image";
const M_HTML = "org.matrix.custom.html";
const MATRIX_TO = "https://matrix.to/#/";

/**
 * A lightweight Matrix client for interacting with the Matrix homeserver API.
 */
export class MxjsClient {
  /** @type {Map<string, Set<function>>} */
  #handlers = new Map();

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
  async #uiaaRequest(
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
  #storeSession(data) {
    this.accessToken = data.access_token;
    this.userId = data.user_id;
    return { accessToken: data.access_token, userId: data.user_id };
  }

  /**
   * Registers a new account on the homeserver.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{accessToken: string, userId: string}|null>} Session info, or `null` on failure.
   */
  async register(username, password) {
    try {
      return this.#storeSession(
        await this.#uiaaRequest(
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
      return this.#storeSession(data);
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
      return this.#storeSession(data);
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
  }

  /**
   * Permanently deactivates the current user's account.
   * @param {string} password - Current account password for UIAA confirmation.
   * @returns {Promise<boolean>} `true` on success.
   */
  async deactivateAccount(password) {
    try {
      await this.#uiaaRequest("/account/deactivate", {}, (s) => ({
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
      await this.#uiaaRequest(
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
   * Converts an `mxc://` URI to an HTTP download URL for the current homeserver.
   * @param {string} mxcUrl - An `mxc://` URI.
   * @returns {string|null} The HTTP URL, or `null` if the input is invalid.
   */
  mxcToHttp(mxcUrl) {
    if (!mxcUrl?.startsWith("mxc://")) return null;
    return `${this.homeserver}/_matrix/media/r0/download/${mxcUrl.slice(6)}`;
  }

  /**
   * Resolves a room alias (e.g. `#room:server`) to a room ID.
   * @param {string} roomAlias
   * @returns {Promise<string|null>} The room ID, or `null` on failure.
   */
  async resolveRoomAlias(roomAlias) {
    try {
      return (
        (await this.api(`/directory/room/${enc(roomAlias)}`)).room_id || null
      );
    } catch (e) {
      cerr("alias:", e);
      return null;
    }
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
   * @param {string} action - `"kick"` or `"ban"`.
   * @param {string} roomId
   * @param {string} userId
   * @param {string} [reason=""]
   * @returns {Promise<boolean>} `true` on success.
   */
  async #userModAction(action, roomId, userId, reason = "") {
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
    return this.#userModAction("kick", roomId, userId, reason);
  }

  /**
   * Bans a user from a room.
   * @param {string} roomId
   * @param {string} userId
   * @param {string} [reason=""]
   * @returns {Promise<boolean>} `true` on success.
   */
  async banUser(roomId, userId, reason = "") {
    return this.#userModAction("ban", roomId, userId, reason);
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

  /**
   * Sends a room event via a PUT request using a timestamp as transaction ID.
   * @param {string} roomId
   * @param {string} type - Matrix event type (e.g. `m.room.message`).
   * @param {Object} content - Event content.
   * @param {string} [errLabel="send"] - Label used in error logs.
   * @returns {Promise<{eventId: string}|null>}
   */
  async #sendRoomEvent(roomId, type, content, errLabel = "send") {
    try {
      const result = await this.api(
        `/rooms/${roomId}/send/${type}/${Date.now()}`,
        "PUT",
        content,
      );
      return result.errcode ? null : { eventId: result.event_id };
    } catch (e) {
      cerr(`${errLabel}:`, e);
      return null;
    }
  }

  /**
   * Sends a plain text (or optionally HTML-formatted) message to a room.
   * @param {string} roomId
   * @param {string} message - Plain text body.
   * @param {string|null} [formattedBody=null] - Optional HTML-formatted body.
   * @returns {Promise<{eventId: string}|null>}
   */
  async sendMessage(roomId, message, formattedBody = null) {
    const content = { msgtype: M_TEXT, body: message };
    if (formattedBody) {
      content.format = M_HTML;
      content.formatted_body = formattedBody;
    }
    return this.#sendRoomEvent(roomId, M_MSG, content);
  }

  /**
   * Sends an image message to a room.
   * @param {string} roomId
   * @param {string} url - An `mxc://` URI for the image.
   * @param {string} [body="Image"] - Alt text / fallback body.
   * @param {Object} [info={}] - Optional image metadata (e.g. `w`, `h`, `mimetype`).
   * @returns {Promise<{eventId: string}|null>}
   */
  async sendImage(roomId, url, body = "Image", info = {}) {
    const content = { msgtype: M_IMAGE, body, url };
    if (Object.keys(info).length) content.info = info;
    return this.#sendRoomEvent(roomId, M_MSG, content, "send image");
  }

  /**
   * Edits a previously sent message using the `m.replace` relation.
   * @param {string} roomId
   * @param {string} eventId - The event ID of the original message.
   * @param {string} newMessage - The replacement text body.
   * @returns {Promise<{eventId: string}|null>}
   */
  async editMessage(roomId, eventId, newMessage) {
    return this.#sendRoomEvent(
      roomId,
      M_MSG,
      {
        msgtype: M_TEXT,
        body: `* ${newMessage}`,
        [M_NEWCONT]: { msgtype: M_TEXT, body: newMessage },
        [M_REL]: { rel_type: M_REPLACE, event_id: eventId },
      },
      "edit",
    );
  }

  /**
   * Redacts (deletes) a room event.
   * @param {string} roomId
   * @param {string} eventId
   * @param {string} [reason=""] - Optional reason for the redaction.
   * @returns {Promise<{eventId: string}|null>}
   */
  async redactEvent(roomId, eventId, reason = "") {
    try {
      const result = await this.api(
        `/rooms/${roomId}/redact/${eventId}/${Date.now()}`,
        "PUT",
        reason ? { reason } : {},
      );
      return result.errcode ? null : { eventId: result.event_id };
    } catch (e) {
      cerr("redact:", e);
      return null;
    }
  }

  /**
   * Sends a reaction annotation to a message.
   * @param {string} roomId
   * @param {string} eventId - The event to react to.
   * @param {string} reaction - The reaction key (typically an emoji).
   * @returns {Promise<{eventId: string}|null>}
   */
  async reactToMessage(roomId, eventId, reaction) {
    return this.#sendRoomEvent(
      roomId,
      M_REACT,
      { [M_REL]: { rel_type: M_ANNOT, event_id: eventId, key: reaction } },
      "react",
    );
  }

  /**
   * Sends a state event to a room.
   * @param {string} roomId
   * @param {string} type - Matrix state event type.
   * @param {Object} content - Event content.
   * @param {string} [stateKey=""] - Optional state key.
   * @returns {Promise<{eventId: string}|null>}
   */
  async sendStateEvent(roomId, type, content, stateKey = "") {
    try {
      const result = await this.api(
        `/rooms/${roomId}/state/${enc(type)}/${enc(stateKey)}`,
        "PUT",
        content,
      );
      return result.errcode ? null : { eventId: result.event_id };
    } catch (e) {
      cerr("state event:", e);
      return null;
    }
  }

  async setRoomName(roomId, name) {
    return this.sendStateEvent(roomId, M_RNAME, { name });
  }

  async setRoomTopic(roomId, topic) {
    return this.sendStateEvent(roomId, M_RTOPIC, { topic });
  }

  async setRoomAvatar(roomId, url) {
    return this.sendStateEvent(roomId, M_RAVATAR, { url });
  }

  async getRoomState(roomId, type, stateKey = "") {
    try {
      const result = await this.api(
        `/rooms/${roomId}/state/${enc(type)}/${enc(stateKey)}`,
      );
      return result.errcode ? null : result;
    } catch (e) {
      cerr("get state:", e);
      return null;
    }
  }
  /**
   * Fetches the current joined members of a room.
   * @param {string} roomId
   * @returns {Promise<Array<{userId: string, displayName: string}>|null>}
   */  async getRoomName(roomId) {
    return (await this.getRoomState(roomId, M_RNAME))?.name ?? null;
  }

  async getRoomTopic(roomId) {
    return (await this.getRoomState(roomId, M_RTOPIC))?.topic ?? null;
  }

  async getRoomAllState(roomId) {
    try {
      const result = await this.api(`/rooms/${roomId}/state`);
      if (!Array.isArray(result)) return null;
      const find = (type, key = "") =>
        result.find((e) => e.type === type && (e.state_key ?? "") === key)
          ?.content ?? null;
      return {
        name: find(M_RNAME)?.name ?? null,
        topic: find(M_RTOPIC)?.topic ?? null,
        avatarUrl: find(M_RAVATAR)?.url ?? null,
        canonicalAlias: find("m.room.canonical_alias")?.alias ?? null,
        powerLevels: find("m.room.power_levels"),
        members: result
          .filter((e) => e.type === M_MEMBER)
          .map((e) => ({
            userId: e.state_key,
            displayName: e.content?.displayname || null,
            membership: e.content?.membership || "leave",
          })),
      };
    } catch (e) {
      cerr("all state:", e);
      return null;
    }
  }

  async removeReaction(roomId, reactionEventId) {
    const result = await this.redactEvent(roomId, reactionEventId);
    return result !== null;
  }

  async getMessages(roomId, { from = null, limit = 50, dir = "b" } = {}) {
    try {
      const endpoint = `/rooms/${roomId}/messages?dir=${dir}&limit=${limit}${from ? "&from=" + enc(from) : ""}`;
      const result = await this.api(endpoint);
      return result.errcode
        ? null
        : {
            messages: result.chunk || [],
            start: result.start,
            end: result.end,
          };
    } catch (e) {
      cerr("messages:", e);
      return null;
    }
  }

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

  async uploadMedia(data, contentType, filename = "") {
    try {
      const qs = filename ? `?filename=${enc(filename)}` : "";
      const headers = { "Content-Type": contentType };
      if (this.accessToken)
        headers.Authorization = `Bearer ${this.accessToken}`;
      for (const v of ["v3", "r0"]) {
        const response = await fetch(
          `${this.homeserver}/_matrix/media/${v}/upload${qs}`,
          { method: "POST", headers, body: data },
        );
        if (response.status === 404) continue;
        const result = await response.json();
        return result.errcode ? null : { contentUri: result.content_uri };
      }
      return null;
    } catch (e) {
      cerr("upload:", e);
      return null;
    }
  }

  async sync(since = null, timeout = 0) {
    try {
      const result = await this.api(
        `/sync?timeout=${timeout}${since ? "&since=" + since : ""}`,
      );
      return result.errcode ? null : result;
    } catch (e) {
      cerr("sync:", e);
      return null;
    }
  }

  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event).add(fn);
    return this;
  }

  off(event, fn) {
    if (fn) this.#handlers.get(event)?.delete(fn);
    else this.#handlers.delete(event);
    return this;
  }

  emit(event, ...args) {
    this.#handlers.get(event)?.forEach((fn) => {
      try {
        fn(...args);
      } catch (e) {
        cerr("emit", event, e);
      }
    });
  }

  isMention(event, userId) {
    if (!event?.content || !userId) return false;
    if (event.type !== M_MSG) return false;
    if (event.sender === userId) return false;
    const body = event.content.body || "";
    const formattedBody = event.content.formatted_body || "";
    return body.includes(userId) || formattedBody.includes(userId);
  }

  getEventRelation(event) {
    return event?.content?.[M_REL] ?? null;
  }

  isEditEvent(event) {
    if (event?.type !== M_MSG) return false;
    const rel = this.getEventRelation(event);
    return rel?.rel_type === M_REPLACE && !!rel.event_id;
  }

  isReactionEvent(event) {
    return (
      event?.type === M_REACT &&
      this.getEventRelation(event)?.rel_type === M_ANNOT
    );
  }

  getEditedBody(event) {
    if (!event?.content) return null;
    return event.content[M_NEWCONT]?.body || event.content.body || null;
  }

  getPrevContent(event) {
    return event?.unsigned?.prev_content ?? null;
  }

  getMembershipChange(event) {
    if (event?.type !== M_MEMBER) return null;
    const userId = event.state_key;
    const prevContent = this.getPrevContent(event);
    const current = event.content?.membership;
    const prev = prevContent?.membership;
    const displayName = event.content?.displayname ?? null;
    const prevDisplayName = prevContent?.displayname ?? null;
    const kicker = event.sender !== userId ? event.sender : null;

    if (current === "join" && prev !== "join") {
      return {
        type: "join",
        userId,
        displayName,
        prevDisplayName: null,
        kicker: null,
      };
    } else if (current === "join" && prev === "join") {
      if (prevDisplayName && displayName !== prevDisplayName) {
        return {
          type: "rename",
          userId,
          displayName,
          prevDisplayName,
          kicker: null,
        };
      }
      return null;
    } else if (current === "leave" && prev === "join") {
      return {
        type: kicker ? "kick" : "leave",
        userId,
        displayName,
        prevDisplayName,
        kicker,
      };
    } else if (current === "ban") {
      return { type: "ban", userId, displayName, prevDisplayName, kicker };
    }
    return {
      type: "unknown",
      userId,
      displayName,
      prevDisplayName,
      kicker: null,
    };
  }

  isImageMessage(event) {
    return event?.type === M_MSG && event.content?.msgtype === M_IMAGE;
  }

  hasFormattedBody(event) {
    return event?.content?.format === M_HTML && !!event.content.formatted_body;
  }

  extractLocalpart(userId) {
    return userId?.match(/^@([^:]+):/)?.[1] ?? userId ?? "?";
  }

  #escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  buildMentionHtml(text, getDisplayName) {
    const result = text.replace(/@(\S+:\S+)/g, (match, id) => {
      const userId = `@${id}`;
      const displayName = getDisplayName(userId);
      return `<a href="${MATRIX_TO}${enc(userId)}">@${this.#escapeHtml(displayName)}</a>`;
    });
    return result === text ? null : result;
  }

  sanitizeHtml(html) {
    if (typeof DOMParser === "undefined") return html;

    const doc = new DOMParser().parseFromString(html, "text/html");
    const parts = [];

    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
          parts.push(this.#escapeHtml(child.textContent || ""));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName.toLowerCase();
          const href = tag === "a" ? (child.getAttribute("href") ?? "") : "";

          if (tag === "a" && href.startsWith(MATRIX_TO + "@")) {
            const userId = decodeURIComponent(href.slice(MATRIX_TO.length));
            parts.push(
              '<span class="mention" title="' +
                userId.replace(/"/g, "&quot;") +
                '">' +
                this.#escapeHtml(child.textContent || userId) +
                "</span>",
            );
            continue;
          }

          if (SANITIZE_ALLOWED_TAGS.has(tag)) {
            const tagName = tag === "strike" ? "s" : tag;
            if (tag === "span" && child.getAttribute("class") === "mention") {
              const title = child.getAttribute("title");
              parts.push(
                '<span class="mention"' +
                  (title
                    ? ' title="' + title.replace(/"/g, "&quot;") + '"'
                    : "") +
                  ">",
              );
              walk(child);
              parts.push("</span>");
            } else {
              parts.push("<" + tagName + ">");
              walk(child);
              parts.push("</" + tagName + ">");
            }
          } else {
            walk(child);
          }
        }
      }
    };

    walk(doc.body);
    return parts.join("");
  }

  async fetchPublicLastMessage(roomAlias) {
    if (!this.publicReadToken) {
      console.warn("No public read token");
      return null;
    }
    try {
      const roomId = (
        await this.api(
          `/directory/room/${enc(roomAlias)}`,
          "GET",
          null,
          this.publicReadToken,
        )
      )?.room_id;
      if (!roomId) return null;
      const lastEvent = (
        await this.api(
          `/rooms/${enc(roomId)}/messages?dir=b&limit=10`,
          "GET",
          null,
          this.publicReadToken,
        )
      ).chunk?.find((e) => e?.type === M_MSG && e.content?.body);
      return lastEvent
        ? {
            sender: lastEvent.sender,
            body: lastEvent.content.body,
            timestamp: lastEvent.origin_server_ts || Date.now(),
          }
        : null;
    } catch (e) {
      cerr("public msg:", e);
      return null;
    }
  }

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
}

export default MxjsClient;
