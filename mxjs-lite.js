/**
 * mxjs-lite - Lightweight Matrix protocol client library
 * @version 1.0.0
 * @license MIT
 */

// Configuration
let config = {
    homeserver: 'https://matrix.org',
    bridgeUrl: null,
    useBridge: false,
    publicReadToken: null
};

/**
 * Matrix Bridge - Iframe-based communication for CSP-restricted hosts
 */
const matrixBridge = {
    iframe: null,
    ready: false,
    pendingRequests: new Map(),
    requestCounter: 0
};

/**
 * Initialize mxjs-lite with configuration
 * @param {Object} userConfig - Configuration options
 * @param {string} userConfig.homeserver - Matrix homeserver URL
 * @param {string} [userConfig.bridgeUrl] - Bridge iframe URL for CSP-restricted hosts
 * @param {boolean} [userConfig.useBridge] - Whether to use iframe bridge
 * @param {string} [userConfig.publicReadToken] - Public read token for unauthenticated requests
 */
export function init(userConfig) {
    config = { ...config, ...userConfig };
    
    // Setup bridge message listener if using bridge
    if (config.useBridge && config.bridgeUrl && !matrixBridge.messageListenerAttached) {
        window.addEventListener('message', handleBridgeMessage);
        matrixBridge.messageListenerAttached = true;
    }
}

/**
 * Initialize the Matrix iframe bridge
 * @returns {Promise<boolean>} True if bridge loaded successfully
 */
async function initMatrixBridge() {
    if (!config.bridgeUrl) {
        throw new Error('Bridge URL not configured');
    }
    
    if (matrixBridge.iframe) {
        return matrixBridge.ready;
    }

    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.src = config.bridgeUrl;
        iframe.style.display = 'none';
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        
        const timeout = setTimeout(() => {
            console.error('[mxjs-lite] Failed to load iframe bridge');
            matrixBridge.ready = false;
            resolve(false);
        }, 10000);

        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'matrix:bridge:ready') {
                clearTimeout(timeout);
                matrixBridge.ready = true;
                console.log('[mxjs-lite] Iframe bridge ready');
                resolve(true);
            }
        });

        document.body.appendChild(iframe);
        matrixBridge.iframe = iframe;
    });
}

/**
 * Send a request to the Matrix bridge via postMessage
 * @param {string} type - Request type (e.g. 'matrix:auth', 'matrix:sendMessage')
 * @param {object} payload - Request payload
 * @returns {Promise<any>} Response from bridge
 */
function matrixBridgeRequest(type, payload) {
    return new Promise((resolve, reject) => {
        if (!matrixBridge.iframe || !matrixBridge.ready) {
            reject(new Error('Matrix bridge not initialized'));
            return;
        }

        const requestId = `req_${++matrixBridge.requestCounter}`;
        const timeout = setTimeout(() => {
            matrixBridge.pendingRequests.delete(requestId);
            reject(new Error('Matrix bridge request timeout'));
        }, 30000);

        matrixBridge.pendingRequests.set(requestId, { resolve, reject, timeout });

        matrixBridge.iframe.contentWindow.postMessage({
            type,
            requestId,
            payload
        }, config.bridgeUrl);
    });
}

/**
 * Handle responses from the Matrix bridge
 */
function handleBridgeMessage(event) {
    if (config.bridgeUrl && event.origin !== new URL(config.bridgeUrl).origin) {
        return;
    }

    const { type, requestId, payload } = event.data;
    
    if (!type || !requestId || !type.includes(':response')) {
        return;
    }

    const pending = matrixBridge.pendingRequests.get(requestId);
    if (pending) {
        clearTimeout(pending.timeout);
        matrixBridge.pendingRequests.delete(requestId);
        pending.resolve(payload);
    }
}

/**
 * Make authenticated Matrix API call
 * @param {string} endpoint - API endpoint (e.g. '/sync')
 * @param {string} method - HTTP method
 * @param {object} body - Request body
 * @param {string} accessToken - Access token for authentication
 * @returns {Promise<object>} API response
 */
export async function api(endpoint, method = 'GET', body = null, accessToken = null) {
    // Use iframe bridge if configured
    if (config.useBridge) {
        if (!matrixBridge.ready) {
            const initialized = await initMatrixBridge();
            if (!initialized) {
                return {
                    errcode: 'M_BRIDGE_UNAVAILABLE',
                    error: 'Matrix bridge failed to initialize'
                };
            }
        }

        try {
            const result = await matrixBridgeRequest('matrix:api', {
                endpoint,
                method,
                body,
                accessToken
            });
            return result;
        } catch (error) {
            return {
                errcode: 'M_BRIDGE_ERROR',
                error: error.message
            };
        }
    }

    // Direct API call
    const url = `${config.homeserver}/_matrix/client/r0${endpoint}`;
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    return response.json();
}

/**
 * Fetch the latest public message from a room
 * @param {string} roomAlias - Room alias (e.g. #room:server.com)
 * @returns {Promise<{sender: string, body: string, timestamp: number} | null>}
 */
export async function fetchPublicLastMessage(roomAlias) {
    if (!config.publicReadToken) {
        console.warn('[mxjs-lite] No public read token configured');
        return null;
    }
    
    try {
        // Use iframe bridge if configured
        if (config.useBridge) {
            if (!matrixBridge.ready) {
                await initMatrixBridge();
            }
            
            const result = await matrixBridgeRequest('matrix:fetchLastMessage', { 
                roomAlias,
                publicToken: config.publicReadToken
            });
            
            if (!result || result.error || !Array.isArray(result.chunk)) {
                return null;
            }
            
            const lastEvent = result.chunk.find(e => 
                e && e.type === 'm.room.message' && e.content && e.content.body
            );
            
            if (!lastEvent) return null;
            
            return {
                sender: lastEvent.sender,
                body: lastEvent.content.body,
                timestamp: lastEvent.origin_server_ts || Date.now()
            };
        }
        
        // Direct API call
        const resolvedAlias = encodeURIComponent(roomAlias);
        const roomResponse = await fetch(
            `${config.homeserver}/_matrix/client/r0/directory/room/${resolvedAlias}`,
            { headers: { 'Authorization': `Bearer ${config.publicReadToken}` } }
        );
        
        if (!roomResponse.ok) return null;
        
        const roomData = await roomResponse.json();
        const roomId = roomData?.room_id;
        if (!roomId) return null;
        
        const messagesResponse = await fetch(
            `${config.homeserver}/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/messages?dir=b&limit=10`,
            { headers: { 'Authorization': `Bearer ${config.publicReadToken}` } }
        );
        
        if (!messagesResponse.ok) return null;
        
        const messagesData = await messagesResponse.json();
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
export async function fetchPublicPresence(userId) {
    if (!config.publicReadToken) {
        console.warn('[mxjs-lite] No public read token configured');
        return null;
    }
    
    try {
        // Use iframe bridge if configured
        if (config.useBridge) {
            if (!matrixBridge.ready) {
                await initMatrixBridge();
            }
            
            const result = await matrixBridgeRequest('matrix:fetchPresence', { 
                userId,
                publicToken: config.publicReadToken
            });
            
            if (result && !result.error && result.presence) {
                return {
                    presence: result.presence,
                    lastActive: result.last_active_ago || 0
                };
            }
            return null;
        }
        
        // Direct API call
        const response = await fetch(
            `${config.homeserver}/_matrix/client/r0/presence/${encodeURIComponent(userId)}/status`,
            { headers: { 'Authorization': `Bearer ${config.publicReadToken}` } }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
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
export async function registerGuest() {
    try {
        if (config.useBridge) {
            if (!matrixBridge.ready) {
                await initMatrixBridge();
            }
            
            const result = await matrixBridgeRequest('matrix:auth', {
                action: 'register'
            });
            
            if (result.errcode) {
                throw new Error(result.error || result.errcode);
            }
            
            return {
                accessToken: result.access_token,
                userId: result.user_id
            };
        }
        
        // Direct API call
        const response = await fetch(
            `${config.homeserver}/_matrix/client/r0/register?kind=guest`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            }
        );
        
        const data = await response.json();
        
        if (data.errcode) {
            throw new Error(data.error || data.errcode);
        }
        
        return {
            accessToken: data.access_token,
            userId: data.user_id
        };
    } catch (error) {
        console.error('[mxjs-lite] Failed to register guest:', error);
        return null;
    }
}

/**
 * Set display name for user
 * @param {string} userId - User ID
 * @param {string} displayName - Display name to set
 * @param {string} accessToken - Access token
 * @returns {Promise<boolean>}
 */
export async function setDisplayName(userId, displayName, accessToken) {
    try {
        const result = await api(
            `/profile/${userId}/displayname`,
            'PUT',
            { displayname: displayName },
            accessToken
        );
        
        return !result.errcode;
    } catch (error) {
        console.error('[mxjs-lite] Failed to set display name:', error);
        return false;
    }
}

/**
 * Resolve room alias to room ID
 * @param {string} roomAlias - Room alias (e.g. #room:server.com)
 * @param {string} accessToken - Access token
 * @returns {Promise<string | null>}
 */
export async function resolveRoomAlias(roomAlias, accessToken) {
    try {
        if (config.useBridge) {
            if (!matrixBridge.ready) {
                await initMatrixBridge();
            }
            
            const result = await matrixBridgeRequest('matrix:resolveAlias', {
                roomAlias,
                accessToken
            });
            
            if (result.errcode) {
                return null;
            }
            
            return result.room_id;
        }
        
        // Direct API call
        const response = await fetch(
            `${config.homeserver}/_matrix/client/r0/directory/room/${encodeURIComponent(roomAlias)}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.room_id || null;
    } catch (error) {
        console.error('[mxjs-lite] Failed to resolve room alias:', error);
        return null;
    }
}

/**
 * Join a room
 * @param {string} roomId - Room ID
 * @param {string} accessToken - Access token
 * @returns {Promise<boolean>}
 */
export async function joinRoom(roomId, accessToken) {
    try {
        const result = await api(
            `/rooms/${roomId}/join`,
            'POST',
            {},
            accessToken
        );
        
        return !result.errcode;
    } catch (error) {
        console.error('[mxjs-lite] Failed to join room:', error);
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
export async function sendMessage(roomId, message, accessToken) {
    try {
        const txnId = Date.now().toString();
        const result = await api(
            `/rooms/${roomId}/send/m.room.message/${txnId}`,
            'PUT',
            {
                msgtype: 'm.text',
                body: message
            },
            accessToken
        );
        
        if (result.errcode) {
            return null;
        }
        
        return { eventId: result.event_id };
    } catch (error) {
        console.error('[mxjs-lite] Failed to send message:', error);
        return null;
    }
}

/**
 * Sync messages from a room
 * @param {string} accessToken - Access token
 * @param {string} [since] - Sync token from previous sync
 * @param {number} [timeout] - Long-polling timeout in ms
 * @returns {Promise<object | null>}
 */
export async function sync(accessToken, since = null, timeout = 0) {
    try {
        let endpoint = `/sync?timeout=${timeout}`;
        if (since) {
            endpoint += `&since=${since}`;
        }
        
        const result = await api(endpoint, 'GET', null, accessToken);
        
        if (result.errcode) {
            return null;
        }
        
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
export async function getRoomMembers(roomId, accessToken) {
    try {
        const result = await api(`/rooms/${roomId}/members`, 'GET', null, accessToken);
        
        if (result.errcode || !result.chunk) {
            return null;
        }
        
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
export function formatTimeAgo(timestampMs) {
    if (typeof timestampMs !== 'number') {
        return 'unknown';
    }

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
    if (elapsedSeconds < 60) {
        return 'just now';
    }

    if (elapsedSeconds < 3600) {
        return `${Math.floor(elapsedSeconds / 60)}m ago`;
    }

    if (elapsedSeconds < 86400) {
        return `${Math.floor(elapsedSeconds / 3600)}h ago`;
    }

    return `${Math.floor(elapsedSeconds / 86400)}d ago`;
}

export default {
    init,
    api,
    fetchPublicLastMessage,
    fetchPublicPresence,
    registerGuest,
    setDisplayName,
    resolveRoomAlias,
    joinRoom,
    sendMessage,
    sync,
    getRoomMembers,
    formatTimeAgo
};
