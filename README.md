# mxjs-lite

Lightweight Matrix protocol client library with iframe bridge support for CSP-restricted environments like Neocities.

## Features

- 🚀 Lightweight - No dependencies, pure JavaScript
- 🔒 CSP-friendly - Optional iframe bridge for restricted environments
- 📡 Core Matrix API - Register, join rooms, send/receive messages
- 👥 User presence - Fetch user status and last active time
- 📖 Public read - Fetch public room messages without authentication

## Installation

```bash
npm install mxjs-lite
```

Or use as ES6 module:

```javascript
import mxjs from './mxjs-lite.js';
```

## Quick Start

### Basic Usage

```javascript
import mxjs from 'mxjs-lite';

// Initialize with your Matrix homeserver
mxjs.init({
    homeserver: 'https://matrix.org'
});

// Register as guest
const { accessToken, userId } = await mxjs.registerGuest();

// Set display name
await mxjs.setDisplayName(userId, 'MyNickname', accessToken);

// Resolve room alias
const roomId = await mxjs.resolveRoomAlias('#room:matrix.org', accessToken);

// Join room
await mxjs.joinRoom(roomId, accessToken);

// Send message
await mxjs.sendMessage(roomId, 'Hello, world!', accessToken);

// Sync messages
const syncData = await mxjs.sync(accessToken);
```

### With CSP Bridge (Neocities, etc.)

For environments with strict Content Security Policy:

```javascript
import mxjs from 'mxjs-lite';

// Initialize with bridge
mxjs.init({
    homeserver: 'https://matrix.org',
    bridgeUrl: 'https://yourdomain.com/matrix-bridge.html',
    useBridge: true
});

// All API calls now route through the iframe bridge
const { accessToken, userId } = await mxjs.registerGuest();
// ... rest of code works the same
```

### Public API (Unauthenticated)

Fetch public data without registration:

```javascript
import mxjs from 'mxjs-lite';

mxjs.init({
    homeserver: 'https://matrix.org',
    publicReadToken: 'your_public_read_token'
});

// Get latest public message
const message = await mxjs.fetchPublicLastMessage('#room:matrix.org');
console.log(`${message.sender}: ${message.body}`);

// Get user presence
const presence = await mxjs.fetchPublicPresence('@user:matrix.org');
console.log(`User is ${presence.presence}`);
```

## API Reference

### `init(config)`

Initialize the library with configuration.

**Parameters:**
- `config.homeserver` (string) - Matrix homeserver URL
- `config.bridgeUrl` (string, optional) - Bridge iframe URL for CSP hosts
- `config.useBridge` (boolean, optional) - Use iframe bridge
- `config.publicReadToken` (string, optional) - Public read token

### `api(endpoint, method, body, accessToken)`

Make authenticated Matrix API call.

**Returns:** `Promise<object>`

### `registerGuest()`

Register as guest user.

**Returns:** `Promise<{accessToken: string, userId: string}>`

### `setDisplayName(userId, displayName, accessToken)`

Set user display name.

**Returns:** `Promise<boolean>`

### `resolveRoomAlias(roomAlias, accessToken)`

Resolve room alias to room ID.

**Returns:** `Promise<string>`

### `joinRoom(roomId, accessToken)`

Join a room.

**Returns:** `Promise<boolean>`

### `sendMessage(roomId, message, accessToken)`

Send text message to room.

**Returns:** `Promise<{eventId: string}>`

### `sync(accessToken, since?, timeout?)`

Sync messages from server.

**Returns:** `Promise<object>`

### `getRoomMembers(roomId, accessToken)`

Get room members list.

**Returns:** `Promise<Array<{userId: string, displayName: string}>>`

### `fetchPublicLastMessage(roomAlias)`

Fetch latest public message (requires publicReadToken).

**Returns:** `Promise<{sender: string, body: string, timestamp: number}>`

### `fetchPublicPresence(userId)`

Fetch user presence (requires publicReadToken).

**Returns:** `Promise<{presence: string, lastActive: number}>`

### `formatTimeAgo(timestampMs)`

Format timestamp as relative time string.

**Returns:** `string` (e.g., "5m ago", "2h ago")

## License

MIT
