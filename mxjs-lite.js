/**
 * mxjs-lite - Lightweight Matrix protocol client library
 * @version 2.0.0
 * @license MIT
 */

export class MxjsClient {
    /**
     * @param {Object} [config]
     * @param {string} [config.homeserver] - Matrix homeserver URL
     * @param {string} [config.publicReadToken] - Public read token for unauthenticated requests
     */
    constructor({ homeserver = 'https://matrix.org', publicReadToken = null } = {}) {
        this.homeserver = homeserver;
        this.publicReadToken = publicReadToken;
        /** @type {string|null} Access token — set automatically after login or register */
        this.accessToken = null;
        /** @type {string|null} Full Matrix user ID — set automatically after login or register */
        this.userId = null;
    }

    // ── Core ──────────────────────────────────────────────────────────────────

    /**
     * Make a Matrix Client-Server API call.
     * Defaults to the stored access token. Pass an explicit token to override.
     * @param {string} endpoint - API endpoint (e.g. '/sync')
     * @param {string} [method] - HTTP method
     * @param {object} [body] - Request body
     * @param {string} [accessToken] - Override access token (defaults to this.accessToken)
     * @returns {Promise<object>} API response
     */
    async api(endpoint, method = 'GET', body = null, accessToken = this.accessToken) {
        const url = `${this.homeserver}/_matrix/client/r0${endpoint}`;
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(url, options);
        const data = await response.json();
        if (data.errcode === 'M_LIMIT_EXCEEDED') {
            const delay = data.retry_after_ms ?? 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            const retry = await fetch(url, options);
            return retry.json();
        }
        return data;
    }

    /**
     * Perform a Matrix UIAA two-step request (initiate → complete with auth object).
     * @param {string} endpoint
     * @param {object} firstBody
     * @param {function(string): object} buildAuthBody - Given UIAA session token, returns completion body
     * @param {string} [accessToken]
     * @returns {Promise<object>}
     */
    async #uiaaRequest(endpoint, firstBody, buildAuthBody, accessToken = this.accessToken) {
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const url = `${this.homeserver}/_matrix/client/r0${endpoint}`;
        const initRes = await fetch(url, { method: 'POST', headers, body: JSON.stringify(firstBody) });
        const initData = await initRes.json();
        if (initRes.ok) return initData;
        if (!initData.session) throw new Error(initData.error || initData.errcode || 'No UIAA session returned');
        const authRes = await fetch(url, { method: 'POST', headers, body: JSON.stringify(buildAuthBody(initData.session)) });
        const authData = await authRes.json();
        if (authData.errcode) throw new Error(authData.error || authData.errcode);
        return authData;
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    /**
     * Register a new user account. Stores accessToken and userId on success.
     * @param {string} username - Localpart only (no @ or server)
     * @param {string} password
     * @returns {Promise<{accessToken: string, userId: string} | null>}
     */
    async register(username, password) {
        try {
            const data = await this.#uiaaRequest(
                '/register',
                { username, password },
                session => ({ username, password, auth: { type: 'm.login.dummy', session } }),
                null
            );
            this.accessToken = data.access_token;
            this.userId = data.user_id;
            return { accessToken: data.access_token, userId: data.user_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to register:', error);
            return null;
        }
    }

    /**
     * Register as guest user. Stores accessToken and userId on success.
     * @returns {Promise<{accessToken: string, userId: string} | null>}
     */
    async registerGuest() {
        try {
            const data = await this.api('/register?kind=guest', 'POST', {}, null);
            if (data.errcode) throw new Error(data.error || data.errcode);
            this.accessToken = data.access_token;
            this.userId = data.user_id;
            return { accessToken: data.access_token, userId: data.user_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to register guest:', error);
            return null;
        }
    }

    /**
     * Login with username and password. Stores accessToken and userId on success.
     * @param {string} username - Username or full Matrix user ID
     * @param {string} password
     * @returns {Promise<{accessToken: string, userId: string} | null>}
     */
    async login(username, password) {
        try {
            const data = await this.api('/login', 'POST', {
                type: 'm.login.password',
                identifier: { type: 'm.id.user', user: username },
                password
            }, null);
            if (data.errcode) throw new Error(data.error || data.errcode);
            this.accessToken = data.access_token;
            this.userId = data.user_id;
            return { accessToken: data.access_token, userId: data.user_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to login:', error);
            return null;
        }
    }

    /**
     * Clear the stored access token and user ID (client-side only, does not invalidate the session).
     */
    logout() {
        this.accessToken = null;
        this.userId = null;
    }

    /**
     * Deactivate (permanently delete) the current user account.
     * Calls logout() on success.
     * @param {string} password - Account password for re-auth
     * @returns {Promise<boolean>}
     */
    async deactivateAccount(password) {
        try {
            await this.#uiaaRequest(
                '/account/deactivate',
                {},
                session => ({
                    auth: {
                        type: 'm.login.password',
                        session,
                        identifier: { type: 'm.id.user', user: this.userId },
                        password
                    }
                })
            );
            this.logout();
            return true;
        } catch (error) {
            console.error('[mxjs-lite] Failed to deactivate account:', error);
            return false;
        }
    }

    /**
     * Change the account password.
     * @param {string} oldPassword
     * @param {string} newPassword
     * @returns {Promise<boolean>}
     */
    async changePassword(oldPassword, newPassword) {
        try {
            await this.#uiaaRequest(
                '/account/password',
                { new_password: newPassword },
                session => ({
                    new_password: newPassword,
                    auth: {
                        type: 'm.login.password',
                        session,
                        identifier: { type: 'm.id.user', user: this.userId },
                        password: oldPassword
                    }
                })
            );
            return true;
        } catch (error) {
            console.error('[mxjs-lite] Failed to change password:', error);
            return false;
        }
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    /**
     * Get a user's profile (display name and avatar URL).
     * @param {string} [userId] - Defaults to the logged-in user
     * @returns {Promise<{displayName: string|null, avatarUrl: string|null} | null>}
     */
    async getProfile(userId = this.userId) {
        try {
            const data = await this.api(`/profile/${encodeURIComponent(userId)}`);
            if (data.errcode) return null;
            return { displayName: data.displayname || null, avatarUrl: data.avatar_url || null };
        } catch (error) {
            console.error('[mxjs-lite] Failed to get profile:', error);
            return null;
        }
    }

    /**
     * Set the display name for the logged-in user.
     * @param {string} displayName
     * @returns {Promise<boolean>}
     */
    async setDisplayName(displayName) {
        const result = await this.api(`/profile/${this.userId}/displayname`, 'PUT', { displayname: displayName });
        return !result.errcode;
    }

    /**
     * Set the avatar URL for the logged-in user.
     * @param {string} avatarUrl - mxc:// URI (obtain one from uploadMedia)
     * @returns {Promise<boolean>}
     */
    async setAvatarUrl(avatarUrl) {
        const result = await this.api(`/profile/${this.userId}/avatar_url`, 'PUT', { avatar_url: avatarUrl });
        return !result.errcode;
    }

    // ── Rooms ─────────────────────────────────────────────────────────────────

    /**
     * Resolve a room alias to a room ID.
     * @param {string} roomAlias - e.g. #room:server.com
     * @returns {Promise<string | null>}
     */
    async resolveRoomAlias(roomAlias) {
        try {
            const data = await this.api(`/directory/room/${encodeURIComponent(roomAlias)}`);
            return data.room_id || null;
        } catch (error) {
            console.error('[mxjs-lite] Failed to resolve room alias:', error);
            return null;
        }
    }

    /**
     * Join a room by room ID or alias.
     * @param {string} roomIdOrAlias
     * @returns {Promise<{roomId: string} | null>}
     */
    async joinRoom(roomIdOrAlias) {
        try {
            const result = await this.api(`/join/${encodeURIComponent(roomIdOrAlias)}`, 'POST', {});
            if (result.errcode) return null;
            return { roomId: result.room_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to join room:', error);
            return null;
        }
    }

    /**
     * Create a new room.
     * @param {Object} options - name, topic, preset, is_direct, room_alias_name, etc.
     * @returns {Promise<{roomId: string} | null>}
     */
    async createRoom(options) {
        const result = await this.api('/createRoom', 'POST', options);
        if (result.errcode) {
            console.error('[mxjs-lite] Failed to create room:', result.errcode, result.error);
            return null;
        }
        return { roomId: result.room_id };
    }

    /**
     * Leave a room.
     * @param {string} roomId
     * @returns {Promise<boolean>}
     */
    async leaveRoom(roomId) {
        try {
            const result = await this.api(`/rooms/${roomId}/leave`, 'POST', {});
            return !result.errcode;
        } catch (error) {
            console.error('[mxjs-lite] Failed to leave room:', error);
            return false;
        }
    }

    /**
     * Invite a user to a room.
     * @param {string} roomId
     * @param {string} userId - Full Matrix user ID to invite
     * @returns {Promise<boolean>}
     */
    async inviteUser(roomId, userId) {
        try {
            const result = await this.api(`/rooms/${roomId}/invite`, 'POST', { user_id: userId });
            return !result.errcode;
        } catch (error) {
            console.error('[mxjs-lite] Failed to invite user:', error);
            return false;
        }
    }

    /**
     * Kick a user from a room.
     * @param {string} roomId
     * @param {string} userId
     * @param {string} [reason]
     * @returns {Promise<boolean>}
     */
    async kickUser(roomId, userId, reason = '') {
        try {
            const body = { user_id: userId };
            if (reason) body.reason = reason;
            const result = await this.api(`/rooms/${roomId}/kick`, 'POST', body);
            return !result.errcode;
        } catch (error) {
            console.error('[mxjs-lite] Failed to kick user:', error);
            return false;
        }
    }

    /**
     * Ban a user from a room.
     * @param {string} roomId
     * @param {string} userId
     * @param {string} [reason]
     * @returns {Promise<boolean>}
     */
    async banUser(roomId, userId, reason = '') {
        try {
            const body = { user_id: userId };
            if (reason) body.reason = reason;
            const result = await this.api(`/rooms/${roomId}/ban`, 'POST', body);
            return !result.errcode;
        } catch (error) {
            console.error('[mxjs-lite] Failed to ban user:', error);
            return false;
        }
    }

    /**
     * Unban a user from a room.
     * @param {string} roomId
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    async unbanUser(roomId, userId) {
        try {
            const result = await this.api(`/rooms/${roomId}/unban`, 'POST', { user_id: userId });
            return !result.errcode;
        } catch (error) {
            console.error('[mxjs-lite] Failed to unban user:', error);
            return false;
        }
    }

    /**
     * Get room members.
     * @param {string} roomId
     * @returns {Promise<Array<{userId: string, displayName: string}> | null>}
     */
    async getRoomMembers(roomId) {
        try {
            const result = await this.api(`/rooms/${roomId}/members`);
            if (result.errcode || !result.chunk) return null;
            return result.chunk
                .filter(event => event.content && event.content.membership === 'join')
                .map(event => ({
                    userId: event.state_key,
                    displayName: event.content.displayname || event.state_key.split(':')[0].substring(1)
                }));
        } catch (error) {
            console.error('[mxjs-lite] Failed to get room members:', error);
            return null;
        }
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    /**
     * Send a text message to a room.
     * @param {string} roomId
     * @param {string} message
     * @returns {Promise<{eventId: string} | null>}
     */
    async sendMessage(roomId, message) {
        try {
            const txnId = Date.now().toString();
            const result = await this.api(
                `/rooms/${roomId}/send/m.room.message/${txnId}`,
                'PUT',
                { msgtype: 'm.text', body: message }
            );
            if (result.errcode) return null;
            return { eventId: result.event_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to send message:', error);
            return null;
        }
    }

    /**
     * Edit an existing message.
     * @param {string} roomId
     * @param {string} eventId - Event ID of the message to edit
     * @param {string} newMessage
     * @returns {Promise<{eventId: string} | null>}
     */
    async editMessage(roomId, eventId, newMessage) {
        try {
            const txnId = Date.now().toString();
            const result = await this.api(
                `/rooms/${roomId}/send/m.room.message/${txnId}`,
                'PUT',
                {
                    msgtype: 'm.text',
                    body: `* ${newMessage}`,
                    'm.new_content': { msgtype: 'm.text', body: newMessage },
                    'm.relates_to': { rel_type: 'm.replace', event_id: eventId }
                }
            );
            if (result.errcode) return null;
            return { eventId: result.event_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to edit message:', error);
            return null;
        }
    }

    /**
     * Redact (delete) an event.
     * @param {string} roomId
     * @param {string} eventId
     * @param {string} [reason]
     * @returns {Promise<{eventId: string} | null>}
     */
    async redactEvent(roomId, eventId, reason = '') {
        try {
            const txnId = Date.now().toString();
            const result = await this.api(
                `/rooms/${roomId}/redact/${eventId}/${txnId}`,
                'PUT',
                reason ? { reason } : {}
            );
            if (result.errcode) return null;
            return { eventId: result.event_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to redact event:', error);
            return null;
        }
    }

    /**
     * Send a reaction to a message.
     * @param {string} roomId
     * @param {string} eventId - Event ID to react to
     * @param {string} reaction - Emoji or annotation key (e.g. '👍')
     * @returns {Promise<{eventId: string} | null>}
     */
    async reactToMessage(roomId, eventId, reaction) {
        try {
            const txnId = Date.now().toString();
            const result = await this.api(
                `/rooms/${roomId}/send/m.reaction/${txnId}`,
                'PUT',
                { 'm.relates_to': { rel_type: 'm.annotation', event_id: eventId, key: reaction } }
            );
            if (result.errcode) return null;
            return { eventId: result.event_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to react to message:', error);
            return null;
        }
    }

    /**
     * Remove a reaction by redacting its event.
     * @param {string} roomId
     * @param {string} reactionEventId - Event ID returned by reactToMessage
     * @returns {Promise<boolean>}
     */
    async removeReaction(roomId, reactionEventId) {
        const result = await this.redactEvent(roomId, reactionEventId);
        return result !== null;
    }

    /**
     * Fetch messages from a room (paginated, newest-first by default).
     * @param {string} roomId
     * @param {Object} [options]
     * @param {string} [options.from] - Pagination token from a previous call's end value
     * @param {number} [options.limit] - Max number of messages to return (default 50)
     * @param {'b'|'f'} [options.dir] - Direction: 'b' = backwards from end (default), 'f' = forwards
     * @returns {Promise<{messages: Array, start: string, end: string} | null>}
     */
    async getMessages(roomId, { from = null, limit = 50, dir = 'b' } = {}) {
        try {
            let endpoint = `/rooms/${roomId}/messages?dir=${dir}&limit=${limit}`;
            if (from) endpoint += `&from=${encodeURIComponent(from)}`;
            const result = await this.api(endpoint);
            if (result.errcode) return null;
            return { messages: result.chunk || [], start: result.start, end: result.end };
        } catch (error) {
            console.error('[mxjs-lite] Failed to get messages:', error);
            return null;
        }
    }

    // ── Presence & Receipts ───────────────────────────────────────────────────

    /**
     * Send a typing notification.
     * @param {string} roomId
     * @param {boolean} typing
     * @param {number} [timeout] - How long the typing state lasts in ms (default 30000, ignored if typing=false)
     * @returns {Promise<boolean>}
     */
    async sendTyping(roomId, typing, timeout = 30000) {
        try {
            const body = typing ? { typing: true, timeout } : { typing: false };
            const result = await this.api(`/rooms/${roomId}/typing/${this.userId}`, 'PUT', body);
            return !result.errcode;
        } catch (error) {
            console.error('[mxjs-lite] Failed to send typing:', error);
            return false;
        }
    }

    /**
     * Mark a message as read (sends a read receipt).
     * @param {string} roomId
     * @param {string} eventId - Latest event the user has read
     * @returns {Promise<boolean>}
     */
    async sendReadReceipt(roomId, eventId) {
        try {
            const result = await this.api(`/rooms/${roomId}/receipt/m.read/${encodeURIComponent(eventId)}`, 'POST', {});
            return !result.errcode;
        } catch (error) {
            console.error('[mxjs-lite] Failed to send read receipt:', error);
            return false;
        }
    }

    // ── Media ─────────────────────────────────────────────────────────────────

    /**
     * Upload a file to the media server.
     * Returns an mxc:// URI usable in setAvatarUrl or image/file messages.
     * @param {Blob|Buffer|ArrayBuffer} data - File data
     * @param {string} contentType - MIME type (e.g. 'image/png')
     * @param {string} [filename] - Optional filename hint
     * @returns {Promise<{contentUri: string} | null>}
     */
    async uploadMedia(data, contentType, filename = '') {
        try {
            const qs = filename ? `?filename=${encodeURIComponent(filename)}` : '';
            const headers = { 'Content-Type': contentType };
            if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`;

            // Try v3 endpoint first, fall back to r0 for older servers
            for (const version of ['v3', 'r0']) {
                const url = `${this.homeserver}/_matrix/media/${version}/upload${qs}`;
                const response = await fetch(url, { method: 'POST', headers, body: data });
                if (response.status === 404) continue;
                const result = await response.json();
                if (result.errcode) return null;
                return { contentUri: result.content_uri };
            }
            return null;
        } catch (error) {
            console.error('[mxjs-lite] Failed to upload media:', error);
            return null;
        }
    }

    // ── Sync ──────────────────────────────────────────────────────────────────

    /**
     * Sync events from the server (long-polling).
     * @param {string} [since] - Sync token from a previous sync
     * @param {number} [timeout] - Long-polling timeout in ms
     * @returns {Promise<object | null>}
     */
    async sync(since = null, timeout = 0) {
        try {
            let endpoint = `/sync?timeout=${timeout}`;
            if (since) endpoint += `&since=${since}`;
            const result = await this.api(endpoint);
            if (result.errcode) return null;
            return result;
        } catch (error) {
            console.error('[mxjs-lite] Sync failed:', error);
            return null;
        }
    }

    // ── Public read (unauthenticated) ─────────────────────────────────────────

    /**
     * Fetch the latest public message from a room (uses publicReadToken).
     * @param {string} roomAlias
     * @returns {Promise<{sender: string, body: string, timestamp: number} | null>}
     */
    async fetchPublicLastMessage(roomAlias) {
        if (!this.publicReadToken) {
            console.warn('[mxjs-lite] No public read token configured');
            return null;
        }
        try {
            const roomData = await this.api(`/directory/room/${encodeURIComponent(roomAlias)}`, 'GET', null, this.publicReadToken);
            const roomId = roomData?.room_id;
            if (!roomId) return null;
            const messagesData = await this.api(`/rooms/${encodeURIComponent(roomId)}/messages?dir=b&limit=10`, 'GET', null, this.publicReadToken);
            const lastEvent = messagesData.chunk?.find(e => e?.type === 'm.room.message' && e.content?.body);
            if (!lastEvent) return null;
            return { sender: lastEvent.sender, body: lastEvent.content.body, timestamp: lastEvent.origin_server_ts || Date.now() };
        } catch (error) {
            console.error('[mxjs-lite] Failed to fetch public last message:', error);
            return null;
        }
    }

    /**
     * Fetch user presence (uses publicReadToken).
     * @param {string} userId
     * @returns {Promise<{presence: string, lastActive: number} | null>}
     */
    async fetchPublicPresence(userId) {
        if (!this.publicReadToken) {
            console.warn('[mxjs-lite] No public read token configured');
            return null;
        }
        try {
            const data = await this.api(`/presence/${encodeURIComponent(userId)}/status`, 'GET', null, this.publicReadToken);
            if (data.errcode) return null;
            return { presence: data.presence, lastActive: data.last_active_ago || 0 };
        } catch (error) {
            console.error('[mxjs-lite] Failed to fetch presence:', error);
            return null;
        }
    }

    // ── Utils ─────────────────────────────────────────────────────────────────

    /**
     * Format a unix-millisecond timestamp as relative age text.
     * @param {number} timestampMs
     * @returns {string}
     */
    formatTimeAgo(timestampMs) {
        if (typeof timestampMs !== 'number') return 'unknown';
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
        if (elapsedSeconds < 60) return 'just now';
        if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
        if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
        return `${Math.floor(elapsedSeconds / 86400)}d ago`;
    }
}

export default MxjsClient;
