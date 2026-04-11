# mxjs-lite API Reference

> Auto-generated documentation from source code JSDoc comments

Last updated: 12/04/2026, 8:21:20 am

## Coverage Statistics

- **Total Modules:** 21
- **Total Methods:** 169
- **Documentation Coverage:** 100% ✅

## Modules

### [AccountData](accountdata.md) — 6 methods

Account data methods.

### [Auth](auth.md) — 19 methods

Matrix authentication methods.

### [BaseMxjsClient](BaseMxjsClient.md) — 4 methods

### [Capabilities](capabilities.md) — 1 method

Server capabilities methods.

### [Devices](devices.md) — 5 methods

Device management methods.

### [Directory](directory.md) — 13 methods

Room directory methods.

### [Events](events.md) — 24 methods

Room event methods for sending, editing, redacting, reacting, and fetching room events and state.

### [Filter](filter.md) — 2 methods

Filter API methods.

### [Html](html.md) — 13 methods

HTML utility methods and event inspection helpers.

### [Media](media.md) — 9 methods

Media upload and retrieval methods.

### [Profile](profile.md) — 15 methods

User profile and presence methods.

### [Push](push.md) — 14 methods

Push notification methods.

### [Receipts](receipts.md) — 3 methods

Typing notifications and read receipts.

### [Rooms](rooms.md) — 14 methods

Room management methods.

### [RoomVersions](roomversions.md) — 7 methods

Matrix room version upgrade support (MSC1501). Provides methods to upgrade a room, inspect its version, follow tombstone chains, and read predecessor information from `m.room.create`.

### [Search](search.md) — 1 method

Search methods.

### [Spaces](spaces.md) — 7 methods

Matrix Spaces support (MSC1772 / Matrix v1.2). Spaces are rooms with `type: 'm.space'` in their `m.room.create` content. Children and parents are expressed via `m.space.child` / `m.space.parent` state events.

### [Sync](sync.md) — 2 methods

Matrix /sync polling and sync data processing.

### [SyncLoop](SyncLoop.md) — 2 methods

Automatic long-poll sync loop. Depends on the {@link Sync} mixin being present in the chain.

### [Threads](threads.md) — 7 methods

Matrix Threads support (MSC3440 / Matrix v1.3). Threads are conversations branched off a root message using the `m.thread` relation type.

### [VoIP](voip.md) — 1 method

VoIP methods.

---

## Example Workflows

### Complete Authentication Flow
```javascript
import MxjsClient from '@litruv/mxjs-lite';

const client = new MxjsClient({ homeserver: 'https://matrix.org' });

// Login
const session = await client.login('username', 'password');
if (!session) {
  console.error('Login failed');
  process.exit(1);
}

console.log('Logged in as:', session.userId);
```

### Complete Room Workflow
```javascript
// Create a room
const room = await client.createRoom({
  name: 'My Chat Room',
  visibility: 'private'
});

// Join the room
await client.joinRoom(room.roomId);

// Send a message
const msg = await client.sendMessage(room.roomId, 'Hello, world!');

// React to the message
await client.reactToMessage(room.roomId, msg.eventId, '👋');
```

### Event Handling
```javascript
// Listen for new messages
client.on('messageCreate', ({ roomId, event }) => {
  const sender = event.sender;
  const body = event.content.body;
  console.log(`[${roomId}] ${sender}: ${body}`);
});

// Start syncing
const syncData = await client.sync();
client.processSyncData(syncData);
```

