
# mxjs-lite

Lightweight Matrix protocol client library (modern ES module, class-based, event-driven).

## Features

- 🚀 Lightweight, pure JavaScript, no dependencies
- 📡 Full Matrix API: register, login, join/create rooms, send/edit/delete messages, reactions, state events
- 👥 User presence, profile, avatar, power levels
- 🏷️ Room state management: name, topic, avatar, alias, members
- 🔔 Event system: `on`, `off`, `emit` for extensibility and custom hooks
- 🧠 State management: fetch all room state, restore users/rooms
- 📝 Mention detection, notification, sound alerts, visual highlights
- 🔍 Public read: fetch public room messages and presence without authentication
- 🖼️ Media upload: send images/files, avatar, room icon
- 🧩 Modular example: autocomplete, context menus, IRC-style formatting, Dracula theme

## Installation

```bash
npm install mxjs-lite
```

Or use as ES module:

```javascript
import MxjsClient from './mxjs-lite.js';
```

## Quick Start

### Basic Usage

```javascript
import MxjsClient from 'mxjs-lite';

const mx = new MxjsClient({ homeserver: 'https://matrix.org' });

// Register as guest
const { accessToken, userId } = await mx.registerGuest();

// Set display name
await mx.setDisplayName('MyNickname');

// Resolve room alias
const roomId = await mx.resolveRoomAlias('#room:matrix.org');

// Join room
await mx.joinRoom(roomId);

// Send message
await mx.sendMessage(roomId, 'Hello, world!');

// Sync messages
const syncData = await mx.sync();

// Listen for custom events
mx.on('mention', (event) => {
    // Handle mention notification
});
```

## Live Example

See [example/](example/) for a full-featured IRC-style chat interface:

```bash
cd example
# Open index.html in your browser or use:
python -m http.server 8000
```

Features demonstrated:
- Real-time message sync
- User list, power levels
- Autocomplete for slash commands and mentions
- Context menus, message editing, reactions
- Mention highlight, sound notification, browser notifications
- Dracula theme, modular ES module structure

See [example/README.md](example/README.md) for details.

### Public API (Unauthenticated)

Fetch public data without registration:

```javascript
const mx = new MxjsClient({
    homeserver: 'https://matrix.org',
    publicReadToken: 'your_public_read_token'
});

// Get latest public message
const message = await mx.fetchPublicLastMessage('#room:matrix.org');
console.log(`${message.sender}: ${message.body}`);

// Get user presence
const presence = await mx.fetchPublicPresence('@user:matrix.org');
console.log(`User is ${presence.presence}`);
```

## API Reference

### Class: `MxjsClient`

#### Constructor

`new MxjsClient({ homeserver, publicReadToken })`

#### Core Methods

- `register(username, password)`
- `registerGuest()`
- `login(username, password)`
- `logout()`
- `deactivateAccount(password)`
- `changePassword(oldPassword, newPassword)`
- `getProfile(userId?)`
- `setDisplayName(displayName)`
- `setAvatarUrl(avatarUrl)`
- `mxcToHttp(mxcUrl)`
- `resolveRoomAlias(roomAlias)`
- `joinRoom(roomIdOrAlias)`
- `createRoom(options)`
- `leaveRoom(roomId)`
- `inviteUser(roomId, userId)`
- `kickUser(roomId, userId, reason?)`
- `banUser(roomId, userId, reason?)`
- `unbanUser(roomId, userId)`
- `getRoomMembers(roomId)`
- `sendMessage(roomId, message, formattedBody?)`
- `sendImage(roomId, url, body?, info?)`
- `editMessage(roomId, eventId, newMessage)`
- `redactEvent(roomId, eventId, reason?)`
- `reactToMessage(roomId, eventId, reaction)`
- `sendStateEvent(roomId, type, content, stateKey?)`
- `setRoomName(roomId, name)`
- `setRoomTopic(roomId, topic)`
- `setRoomAvatar(roomId, url)`
- `getRoomState(roomId, type, stateKey?)`
- `getRoomName(roomId)`
- `getRoomTopic(roomId)`
- `getRoomAllState(roomId)`
- `removeReaction(roomId, reactionEventId)`
- `getMessages(roomId, { from, limit, dir })`
- `sendTyping(roomId, typing, timeout?)`
- `sendReadReceipt(roomId, eventId)`
- `uploadMedia(data, contentType, filename?)`
- `sync(since?, timeout?)`

#### Event System

- `on(event, fn)` — Register event listener
- `off(event, fn?)` — Remove event listener
- `emit(event, ...args)` — Emit custom event

#### Public API (Unauthenticated)

- `fetchPublicLastMessage(roomAlias)`
- `fetchPublicPresence(userId)`

## License

MIT
