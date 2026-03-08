/**
 * mxjs-lite - Lightweight Matrix protocol client library
 * @version 1.0.0
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
    }

    /**
     * Make a Matrix API call
     * @param {string} endpoint - API endpoint (e.g. '/sync')
     * @param {string} [method] - HTTP method
     * @param {object} [body] - Request body
     * @param {string} [accessToken] - Access token for authentication
     * @returns {Promise<object>} API response
     */
    async api(endpoint, method = 'GET', body = null, accessToken = null) {
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
            const retryResponse = await fetch(url, options);
            return retryResponse.json();
        }
        return data;
    }

    /**
     * Perform a Matrix UIAA two-step request.
     * First POST initiates the flow, second completes with the auth object.
     * @param {string} endpoint - API endpoint
     * @param {object} firstBody - Body for the initiation request
     * @param {function(string): object} buildAuthBody - Builds the completion body given the UIAA session token
     * @param {string} [accessToken] - Optional access token
     * @returns {Promise<object>} Final response data
     */
    async #uiaaRequest(endpoint, firstBody, buildAuthBody, accessToken = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const url = `${this.homeserver}/_matrix/client/r0${endpoint}`;

        const initResponse = await fetch(url, { method: 'POST', headers, body: JSON.stringify(firstBody) });
        const initData = await initResponse.json();

        if (initResponse.ok) return initData;

        if (!initData.session) {
            throw new Error(initData.error || initData.errcode || 'No UIAA session returned');
        }

        const authResponse = await fetch(url, { method: 'POST', headers, body: JSON.stringify(buildAuthBody(initData.session)) });
        const authData = await authResponse.json();

        if (authData.errcode) throw new Error(authData.error || authData.errcode);

        return authData;
    }

    /**
     * Fetch the latest public message from a room
     * @param {string} roomAlias - Room alias (e.g. #room:server.com)
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
            const lastEvent = messagesData.chunk?.find(e =>
                e && e.type === 'm.room.message' && e.content && e.content.body
            );

            if (!lastEvent) return null;

            return {
                sender: lastEvent.sender,
                body: lastEvent.content.body,
                timestamp: lastEvent.origin_server_ts || Date.now()
            };
        } catch (error) {
            console.error('[mxjs-lite] Failed to fetch public last message:', error);
            return null;
        }
    }

    /**
     * Fetch user presence
     * @param {string} userId - Full Matrix user ID
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
            return {
                presence: data.presence,
                lastActive: data.last_active_ago || 0
            };
        } catch (error) {
            console.error('[mxjs-lite] Failed to fetch presence:', error);
            return null;
        }
    }

    /**
     * Register as guest user
     * @returns {Promise<{accessToken: string, userId: string} | null>}
     */
    async registerGuest() {
        try {
            const data = await this.api('/register?kind=guest', 'POST', {});
            if (data.errcode) throw new Error(data.error || data.errcode);
            return { accessToken: data.access_token, userId: data.user_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to register guest:', error);
            return null;
        }
    }

    /**
     * Register a new user account.
     * Handles the Matrix UIAA two-step flow automatically.
     * @param {string} username - Desired username (localpart only, no @ or server)
     * @param {string} password - Account password
     * @returns {Promise<{accessToken: string, userId: string} | null>}
     */
    async register(username, password) {
        try {
            const data = await this.#uiaaRequest(
                '/register',
                { username, password },
                session => ({ username, password, auth: { type: 'm.login.dummy', session } })
            );
            return { accessToken: data.access_token, userId: data.user_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to register:', error);
            return null;
        }
    }

    /**
     * Login with username and password
     * @param {string} username - Username or full Matrix user ID
     * @param {string} password - Account password
     * @returns {Promise<{accessToken: string, userId: string} | null>}
     */
    async login(username, password) {
        try {
            const data = await this.api('/login', 'POST', {
                type: 'm.login.password',
                identifier: { type: 'm.id.user', user: username },
                password
            });
            if (data.errcode) throw new Error(data.error || data.errcode);
            return { accessToken: data.access_token, userId: data.user_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to login:', error);
            return null;
        }
    }

    /**
     * Deactivate (permanently delete) the current user account.
     * Requires re-authentication via UIAA password flow.
     * @param {string} userId - Full Matrix user ID
     * @param {string} password - Account password for re-auth
     * @param {string} accessToken - Access token
     * @returns {Promise<boolean>}
     */
    async deactivateAccount(userId, password, accessToken) {
        try {
            await this.#uiaaRequest(
                '/account/deactivate',
                {},
                session => ({
                    auth: {
                        type: 'm.login.password',
                        session,
                        identifier: { type: 'm.id.user', user: userId },
                        password
                    }
                }),
                accessToken
            );
            return true;
        } catch (error) {
            console.error('[mxjs-lite] Failed to deactivate account:', error);
            return false;
        }
    }

    /**
     * Set display name for user
     * @param {string} userId - User ID
     * @param {string} displayName - Display name to set
     * @param {string} accessToken - Access token
     * @returns {Promise<boolean>}
     */
    async setDisplayName(userId, displayName, accessToken) {
        const result = await this.api(`/profile/${userId}/displayname`, 'PUT', { displayname: displayName }, accessToken);
        return !result.errcode;
    }

    /**
     * Resolve room alias to room ID
     * @param {string} roomAlias - Room alias (e.g. #room:server.com)
     * @param {string} accessToken - Access token
     * @returns {Promise<string | null>}
     */
    async resolveRoomAlias(roomAlias, accessToken) {
        try {
            const data = await this.api(`/directory/room/${encodeURIComponent(roomAlias)}`, 'GET', null, accessToken);
            return data.room_id || null;
        } catch (error) {
            console.error('[mxjs-lite] Failed to resolve room alias:', error);
            return null;
        }
    }

    /**
     * Join a room by room ID or alias
     * @param {string} roomIdOrAlias - Room ID (e.g. !abc:server.com) or alias (e.g. #room:server.com)
     * @param {string} accessToken - Access token
     * @returns {Promise<{roomId: string} | null>}
     */
    async joinRoom(roomIdOrAlias, accessToken) {
        try {
            const result = await this.api(`/join/${encodeURIComponent(roomIdOrAlias)}`, 'POST', {}, accessToken);
            if (result.errcode) return null;
            return { roomId: result.room_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to join room:', error);
            return null;
        }
    }

    /**
     * Create a new room
     * @param {Object} options - Room creation options
     * @param {string} [options.name] - Room name
     * @param {string} [options.topic] - Room topic
     * @param {string} [options.room_alias_name] - Room alias (without server part)
     * @param {string} [options.preset] - Room preset ('private_chat', 'public_chat', 'trusted_private_chat')
     * @param {boolean} [options.is_direct] - Is this a direct message room
     * @param {string} accessToken - Access token
     * @returns {Promise<{roomId: string} | null>}
     */
    async createRoom(options, accessToken) {
        const result = await this.api('/createRoom', 'POST', options, accessToken);
        if (result.errcode) {
            console.error('[mxjs-lite] Failed to create room:', result.errcode, result.error);
            return null;
        }
        return { roomId: result.room_id };
    }

    /**
     * Leave a room
     * @param {string} roomId - Room ID
     * @param {string} accessToken - Access token
     * @returns {Promise<boolean>}
     */
    async leaveRoom(roomId, accessToken) {
        try {
            const result = await this.api(`/rooms/${roomId}/leave`, 'POST', {}, accessToken);
            return !result.errcode;
        } catch (error) {
            console.error('[mxjs-lite] Failed to leave room:', error);
            return false;
        }
    }

    /**
     * Send a text message to a room
     * @param {string} roomId - Room ID
     * @param {string} message - Message text
     * @param {string} accessToken - Access token
     * @returns {Promise<{eventId: string} | null>}
     */
    async sendMessage(roomId, message, accessToken) {
        try {
            const txnId = Date.now().toString();
            const result = await this.api(
                `/rooms/${roomId}/send/m.room.message/${txnId}`,
                'PUT',
                { msgtype: 'm.text', body: message },
                accessToken
            );
            if (result.errcode) return null;
            return { eventId: result.event_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to send message:', error);
            return null;
        }
    }

    /**
     * Edit an existing message
     * @param {string} roomId - Room ID
     * @param {string} eventId - Event ID of the message to edit
     * @param {string} newMessage - New message text
     * @param {string} accessToken - Access token
     * @returns {Promise<{eventId: string} | null>}
     */
    async editMessage(roomId, eventId, newMessage, accessToken) {
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
                },
                accessToken
            );
            if (result.errcode) return null;
            return { eventId: result.event_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to edit message:', error);
            return null;
        }
    }

    /**
     * Redact (delete) an event
     * @param {string} roomId - Room ID
     * @param {string} eventId - Event ID of the message to redact
     * @param {string} accessToken - Access token
     * @param {string} [reason] - Optional reason for redaction
     * @returns {Promise<{eventId: string} | null>}
     */
    async redactEvent(roomId, eventId, accessToken, reason = '') {
        try {
            const txnId = Date.now().toString();
            const body = reason ? { reason } : {};
            const result = await this.api(
                `/rooms/${roomId}/redact/${eventId}/${txnId}`,
                'PUT',
                body,
                accessToken
            );
            if (result.errcode) return null;
            return { eventId: result.event_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to redact event:', error);
            return null;
        }
    }

    /**
     * Send a reaction to a message
     * @param {string} roomId - Room ID
     * @param {string} eventId - Event ID of the message to react to
     * @param {string} reaction - Reaction key (e.g. '👍')
     * @param {string} accessToken - Access token
     * @returns {Promise<{eventId: string} | null>}
     */
    async reactToMessage(roomId, eventId, reaction, accessToken) {
        try {
            const txnId = Date.now().toString();
            const result = await this.api(
                `/rooms/${roomId}/send/m.reaction/${txnId}`,
                'PUT',
                {
                    'm.relates_to': {
                        rel_type: 'm.annotation',
                        event_id: eventId,
                        key: reaction
                    }
                },
                accessToken
            );
            if (result.errcode) return null;
            return { eventId: result.event_id };
        } catch (error) {
            console.error('[mxjs-lite] Failed to react to message:', error);
            return null;
        }
    }

    /**
     * Remove a reaction by redacting the reaction event.
     * Pass the event ID returned from reactToMessage.
     * @param {string} roomId - Room ID
     * @param {string} reactionEventId - Event ID of the reaction to remove
     * @param {string} accessToken - Access token
     * @returns {Promise<boolean>}
     */
    async removeReaction(roomId, reactionEventId, accessToken) {
        const result = await this.redactEvent(roomId, reactionEventId, accessToken);
        return result !== null;
    }

    /**
     * Sync messages from a room
     * @param {string} accessToken - Access token
     * @param {string} [since] - Sync token from previous sync
     * @param {number} [timeout] - Long-polling timeout in ms
     * @returns {Promise<object | null>}
     */
    async sync(accessToken, since = null, timeout = 0) {
        try {
            let endpoint = `/sync?timeout=${timeout}`;
            if (since) endpoint += `&since=${since}`;
            const result = await this.api(endpoint, 'GET', null, accessToken);
            if (result.errcode) return null;
            return result;
        } catch (error) {
            console.error('[mxjs-lite] Sync failed:', error);
            return null;
        }
    }

    /**
     * Get room members
     * @param {string} roomId - Room ID
     * @param {string} accessToken - Access token
     * @returns {Promise<Array<{userId: string, displayName: string}> | null>}
     */
    async getRoomMembers(roomId, accessToken) {
        try {
            const result = await this.api(`/rooms/${roomId}/members`, 'GET', null, accessToken);
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

    /**
     * Format a unix-millisecond timestamp as relative age text
     * @param {number} timestampMs - Epoch timestamp in milliseconds
     * @returns {string} Relative time label
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
