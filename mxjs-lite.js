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
        this.accessToken = null;
        this.userId = null;
    }

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
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(url, options);
        const data = await response.json();
        if (data.errcode === 'M_LIMIT_EXCEEDED') {
            await new Promise(r => setTimeout(r, data.retry_after_ms ?? 1000));
            return (await fetch(url, options)).json();
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
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const url = `${this.homeserver}/_matrix/client/r0${endpoint}`;
        const initRes = await fetch(url, { method: 'POST', headers, body: JSON.stringify(firstBody) });
        const initData = await initRes.json();
        if (initRes.ok) return initData;
        if (!initData.session) throw new Error(initData.error || initData.errcode);
        const authData = await (await fetch(url, { method: 'POST', headers, body: JSON.stringify(buildAuthBody(initData.session)) })).json();
        if (authData.errcode) throw new Error(authData.error || authData.errcode);
        return authData;
    }

    /**
     * Register a new user account. Stores accessToken and userId on success.
     * @param {string} username - Localpart only (no @ or server)
     * @param {string} password
     * @returns {Promise<{accessToken: string, userId: string} | null>}
     */
    async register(username, password) {
        try {
            const data = await this.#uiaaRequest('/register', { username, password }, s => ({ username, password, auth: { type: 'm.login.dummy', session: s } }), null);
            this.accessToken = data.access_token;
            this.userId = data.user_id;
            return { accessToken: data.access_token, userId: data.user_id };
        } catch (e) {
            console.error('register:', e);
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
        } catch (e) {
            console.error('guest:', e);
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
            const data = await this.api('/login', 'POST', { type: 'm.login.password', identifier: { type: 'm.id.user', user: username }, password }, null);
            if (data.errcode) throw new Error(data.error || data.errcode);
            this.accessToken = data.access_token;
            this.userId = data.user_id;
            return { accessToken: data.access_token, userId: data.user_id };
        } catch (e) {
            console.error('login:', e);
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
            await this.#uiaaRequest('/account/deactivate', {}, s => ({ auth: { type: 'm.login.password', session: s, identifier: { type: 'm.id.user', user: this.userId }, password } }));
            this.logout();
            return true;
        } catch (e) {
            console.error('deactivate:', e);
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
            await this.#uiaaRequest('/account/password', { new_password: newPassword }, s => ({ new_password: newPassword, auth: { type: 'm.login.password', session: s, identifier: { type: 'm.id.user', user: this.userId }, password: oldPassword } }));
            return true;
        } catch (e) {
            console.error('password:', e);
            return false;
        }
    }

    /**
     * Get a user's profile (display name and avatar URL).
     * @param {string} [userId] - Defaults to the logged-in user
     * @returns {Promise<{displayName: string|null, avatarUrl: string|null} | null>}
     */
    async getProfile(userId = this.userId) {
        try {
            const data = await this.api(`/profile/${encodeURIComponent(userId)}`);
            return data.errcode ? null : { displayName: data.displayname || null, avatarUrl: data.avatar_url || null };
        } catch (e) {
            console.error('profile:', e);
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

    /**
     * Convert an mxc:// URI to a downloadable HTTP URL via this homeserver.
     * @param {string} mxcUrl - e.g. mxc://server/mediaId
     * @returns {string | null} HTTP URL, or null if the URI is not a valid mxc://
     */
    mxcToHttp(mxcUrl) {
        if (!mxcUrl?.startsWith('mxc://')) return null;
        return `${this.homeserver}/_matrix/media/r0/download/${mxcUrl.slice(6)}`;
    }

    /**
     * Resolve a room alias to a room ID.
     * @param {string} roomAlias - e.g. #room:server.com
     * @returns {Promise<string | null>}
     */
    async resolveRoomAlias(roomAlias) {
        try {
            return (await this.api(`/directory/room/${encodeURIComponent(roomAlias)}`)).room_id || null;
        } catch (e) {
            console.error('alias:', e);
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
            return result.errcode ? null : { roomId: result.room_id };
        } catch (e) {
            console.error('join:', e);
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
            console.error('create:', result.errcode);
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
            return !(await this.api(`/rooms/${roomId}/leave`, 'POST', {})).errcode;
        } catch (e) {
            console.error('leave:', e);
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
            return !(await this.api(`/rooms/${roomId}/invite`, 'POST', { user_id: userId })).errcode;
        } catch (e) {
            console.error('invite:', e);
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
            return !(await this.api(`/rooms/${roomId}/kick`, 'POST', body)).errcode;
        } catch (e) {
            console.error('kick:', e);
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
            return !(await this.api(`/rooms/${roomId}/ban`, 'POST', body)).errcode;
        } catch (e) {
            console.error('ban:', e);
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
            return !(await this.api(`/rooms/${roomId}/unban`, 'POST', { user_id: userId })).errcode;
        } catch (e) {
            console.error('unban:', e);
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
            return result.chunk.filter(e => e.content?.membership === 'join').map(e => ({ userId: e.state_key, displayName: e.content.displayname || e.state_key.split(':')[0].substring(1) }));
        } catch (e) {
            console.error('members:', e);
            return null;
        }
    }

    /**
     * Send a text message to a room.
     * @param {string} roomId
     * @param {string} message
     * @returns {Promise<{eventId: string} | null>}
     */
    async sendMessage(roomId, message) {
        try {
            const result = await this.api(`/rooms/${roomId}/send/m.room.message/${Date.now()}`, 'PUT', { msgtype: 'm.text', body: message });
            return result.errcode ? null : { eventId: result.event_id };
        } catch (e) {
            console.error('send:', e);
            return null;
        }
    }

    /**
     * Send an image message to a room.
     * @param {string} roomId
     * @param {string} url - mxc:// URI from uploadMedia
     * @param {string} [body] - Alt text/filename (default: 'Image')
     * @param {Object} [info] - Optional image info (w, h, mimetype, size)
     * @returns {Promise<{eventId: string} | null>}
     */
    async sendImage(roomId, url, body = 'Image', info = {}) {
        try {
            const content = { msgtype: 'm.image', body, url };
            if (Object.keys(info).length) content.info = info;
            const result = await this.api(`/rooms/${roomId}/send/m.room.message/${Date.now()}`, 'PUT', content);
            return result.errcode ? null : { eventId: result.event_id };
        } catch (e) {
            console.error('send image:', e);
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
            const result = await this.api(`/rooms/${roomId}/send/m.room.message/${Date.now()}`, 'PUT', { msgtype: 'm.text', body: `* ${newMessage}`, 'm.new_content': { msgtype: 'm.text', body: newMessage }, 'm.relates_to': { rel_type: 'm.replace', event_id: eventId } });
            return result.errcode ? null : { eventId: result.event_id };
        } catch (e) {
            console.error('edit:', e);
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
            const result = await this.api(`/rooms/${roomId}/redact/${eventId}/${Date.now()}`, 'PUT', reason ? { reason } : {});
            return result.errcode ? null : { eventId: result.event_id };
        } catch (e) {
            console.error('redact:', e);
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
            const result = await this.api(`/rooms/${roomId}/send/m.reaction/${Date.now()}`, 'PUT', { 'm.relates_to': { rel_type: 'm.annotation', event_id: eventId, key: reaction } });
            return result.errcode ? null : { eventId: result.event_id };
        } catch (e) {
            console.error('react:', e);
            return null;
        }
    }

    /**
     * Send a state event to a room.
     * @param {string} roomId
     * @param {string} type - State event type (e.g. 'm.room.name')
     * @param {Object} content - Event content
     * @param {string} [stateKey] - State key (default '')
     * @returns {Promise<{eventId: string} | null>}
     */
    async sendStateEvent(roomId, type, content, stateKey = '') {
        try {
            const result = await this.api(`/rooms/${roomId}/state/${encodeURIComponent(type)}/${encodeURIComponent(stateKey)}`, 'PUT', content);
            return result.errcode ? null : { eventId: result.event_id };
        } catch (e) {
            console.error('state event:', e);
            return null;
        }
    }

    /**
     * Set the name of a room.
     * @param {string} roomId
     * @param {string} name
     * @returns {Promise<{eventId: string} | null>}
     */
    async setRoomName(roomId, name) {
        return this.sendStateEvent(roomId, 'm.room.name', { name });
    }

    /**
     * Set the topic of a room.
     * @param {string} roomId
     * @param {string} topic
     * @returns {Promise<{eventId: string} | null>}
     */
    async setRoomTopic(roomId, topic) {
        return this.sendStateEvent(roomId, 'm.room.topic', { topic });
    }

    /**
     * Set the avatar (icon) of a room.
     * @param {string} roomId
     * @param {string} url - mxc:// URI
     * @returns {Promise<{eventId: string} | null>}
     */
    async setRoomAvatar(roomId, url) {
        return this.sendStateEvent(roomId, 'm.room.avatar', { url });
    }

    /**
     * Get a specific state event from a room.
     * @param {string} roomId
     * @param {string} type - State event type (e.g. 'm.room.name')
     * @param {string} [stateKey] - State key (default '')
     * @returns {Promise<Object | null>} The event content, or null if not found / no permission
     */
    async getRoomState(roomId, type, stateKey = '') {
        try {
            const result = await this.api(`/rooms/${roomId}/state/${encodeURIComponent(type)}/${encodeURIComponent(stateKey)}`);
            return result.errcode ? null : result;
        } catch (e) {
            console.error('get state:', e);
            return null;
        }
    }

    /**
     * Get the current name of a room.
     * @param {string} roomId
     * @returns {Promise<string | null>}
     */
    async getRoomName(roomId) {
        return (await this.getRoomState(roomId, 'm.room.name'))?.name ?? null;
    }

    /**
     * Get the current topic of a room.
     * @param {string} roomId
     * @returns {Promise<string | null>}
     */
    async getRoomTopic(roomId) {
        return (await this.getRoomState(roomId, 'm.room.topic'))?.topic ?? null;
    }

    /**
     * Fetch all current state events for a room.
     * Returns a structured summary of the room's state.
     * @param {string} roomId
     * @returns {Promise<{name: string|null, topic: string|null, avatarUrl: string|null, canonicalAlias: string|null, powerLevels: Object|null, members: Array<{userId: string, displayName: string, membership: string}>} | null>}
     */
    async getRoomAllState(roomId) {
        try {
            const result = await this.api(`/rooms/${roomId}/state`);
            if (!Array.isArray(result)) return null;
            const find = (type, key = '') => result.find(e => e.type === type && (e.state_key ?? '') === key)?.content ?? null;
            return {
                name:           find('m.room.name')?.name ?? null,
                topic:          find('m.room.topic')?.topic ?? null,
                avatarUrl:      find('m.room.avatar')?.url ?? null,
                canonicalAlias: find('m.room.canonical_alias')?.alias ?? null,
                powerLevels:    find('m.room.power_levels'),
                members:        result
                    .filter(e => e.type === 'm.room.member')
                    .map(e => ({ userId: e.state_key, displayName: e.content?.displayname || null, membership: e.content?.membership || 'leave' })),
            };
        } catch (e) {
            console.error('all state:', e);
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
            const endpoint = `/rooms/${roomId}/messages?dir=${dir}&limit=${limit}${from ? '&from=' + encodeURIComponent(from) : ''}`;
            const result = await this.api(endpoint);
            return result.errcode ? null : { messages: result.chunk || [], start: result.start, end: result.end };
        } catch (e) {
            console.error('messages:', e);
            return null;
        }
    }

    /**
     * Send a typing notification.
     * @param {string} roomId
     * @param {boolean} typing
     * @param {number} [timeout] - How long the typing state lasts in ms (default 30000, ignored if typing=false)
     * @returns {Promise<boolean>}
     */
    async sendTyping(roomId, typing, timeout = 30000) {
        try {
            return !(await this.api(`/rooms/${roomId}/typing/${this.userId}`, 'PUT', typing ? { typing: true, timeout } : { typing: false })).errcode;
        } catch (e) {
            console.error('typing:', e);
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
            return !(await this.api(`/rooms/${roomId}/receipt/m.read/${encodeURIComponent(eventId)}`, 'POST', {})).errcode;
        } catch (e) {
            console.error('receipt:', e);
            return false;
        }
    }

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
            if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;
            for (const v of ['v3', 'r0']) {
                const response = await fetch(`${this.homeserver}/_matrix/media/${v}/upload${qs}`, { method: 'POST', headers, body: data });
                if (response.status === 404) continue;
                const result = await response.json();
                return result.errcode ? null : { contentUri: result.content_uri };
            }
            return null;
        } catch (e) {
            console.error('upload:', e);
            return null;
        }
    }

    /**
     * Sync events from the server (long-polling).
     * @param {string} [since] - Sync token from a previous sync
     * @param {number} [timeout] - Long-polling timeout in ms
     * @returns {Promise<object | null>}
     */
    async sync(since = null, timeout = 0) {
        try {
            const result = await this.api(`/sync?timeout=${timeout}${since ? '&since=' + since : ''}`);
            return result.errcode ? null : result;
        } catch (e) {
            console.error('sync:', e);
            return null;
        }
    }

    /**
     * Fetch the latest public message from a room (uses publicReadToken).
     * @param {string} roomAlias
     * @returns {Promise<{sender: string, body: string, timestamp: number} | null>}
     */
    async fetchPublicLastMessage(roomAlias) {
        if (!this.publicReadToken) {
            console.warn('No public read token');
            return null;
        }
        try {
            const roomId = (await this.api(`/directory/room/${encodeURIComponent(roomAlias)}`, 'GET', null, this.publicReadToken))?.room_id;
            if (!roomId) return null;
            const lastEvent = (await this.api(`/rooms/${encodeURIComponent(roomId)}/messages?dir=b&limit=10`, 'GET', null, this.publicReadToken)).chunk?.find(e => e?.type === 'm.room.message' && e.content?.body);
            return lastEvent ? { sender: lastEvent.sender, body: lastEvent.content.body, timestamp: lastEvent.origin_server_ts || Date.now() } : null;
        } catch (e) {
            console.error('public msg:', e);
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
            console.warn('No public read token');
            return null;
        }
        try {
            const data = await this.api(`/presence/${encodeURIComponent(userId)}/status`, 'GET', null, this.publicReadToken);
            return data.errcode ? null : { presence: data.presence, lastActive: data.last_active_ago || 0 };
        } catch (e) {
            console.error('presence:', e);
            return null;
        }
    }

}

export default MxjsClient;
