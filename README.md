# mxjs-lite

Lightweight Matrix protocol client library.

## Features

- 🚀 Lightweight - No dependencies, pure JavaScript
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

## Live Example

Check out the [example/](example/) folder for a fully functional IRC-style chat interface:

```bash
cd example
# Open index.html in your browser or use:
python -m http.server 8000
```

The example demonstrates:
- Real-time message synchronization
- User list management
- IRC-style message formatting
- Connection handling

See [example/README.md](example/README.md) for details.

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
