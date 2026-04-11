# Rooms API

Room management methods.

## Overview

This module provides 14 methods.

## Common Usage

```javascript
// Create and join a room
const room = await client.createRoom({ name: 'My Room' });
await client.joinRoom(room.roomId);
await client.sendMessage(room.roomId, 'Hello!');
```

## Methods

- [`banUser()`](#banuser)
- [`createRoom()`](#createroom)
- [`forgetRoom()`](#forgetroom)
- [`getRoomMembers()`](#getroommembers)
- [`inviteUser()`](#inviteuser)
- [`joinRoom()`](#joinroom)
- [`joinRoomById()`](#joinroombyid)
- [`kickUser()`](#kickuser)
- [`knockRoom()`](#knockroom)
- [`leaveRoom()`](#leaveroom)
- [`reportEvent()`](#reportevent)
- [`reportRoom()`](#reportroom)
- [`unbanUser()`](#unbanuser)
- [`upgradeRoom()`](#upgraderoom)

---

## banUser()

**Signature:** `async banUser(roomId, userId, reason = "")`

Bans a user from a room.

**Parameters:**

- `roomId` **{string}**
- `userId` **{string}**
- `reason` **{string}** _(optional)_ - Default: `""]`

**Returns:** `Promise<boolean>` - `true` on success.

---

## createRoom()

**Signature:** `async createRoom(options)`

Room management methods.

**Parameters:**

- `Base` **{T}**
- `options` **{Object}** - Room creation options passed directly to the Matrix API.

**Returns:** `Promise<{roomId: string` - |null>} The new room ID, or `null` on failure.

**Example:**

```javascript
const result = await client.createRoom(Base, { /* options */ });
if (result) {
  console.log('Created:', result);
}
```

---

## forgetRoom()

**Signature:** `async forgetRoom(roomId)`

Forgets a room (must be left first).

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<boolean>` - `true` on success.

---

## getRoomMembers()

**Signature:** `async getRoomMembers(roomId)`

Fetches the current joined members of a room.

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<Array<{userId: string, displayName: string` - >|null>}

---

## inviteUser()

**Signature:** `async inviteUser(roomId, userId)`

Invites a user to a room.

**Parameters:**

- `roomId` **{string}**
- `userId` **{string}**

**Returns:** `Promise<boolean>` - `true` on success.

---

## joinRoom()

**Signature:** `async joinRoom(roomIdOrAlias)`

Joins a room by its ID or alias.

**Parameters:**

- `roomIdOrAlias` **{string}**

**Returns:** `Promise<{roomId: string` - |null>} The joined room ID, or `null` on failure.

---

## joinRoomById()

**Signature:** `async joinRoomById(roomId, options = {})`

Joins a room by room ID directly.

**Parameters:**

- `roomId` **{string}**
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional join parameters (third_party_signed, reason, etc.).

**Returns:** `Promise<{roomId: string` - |null>} The joined room ID, or `null` on failure.

---

## kickUser()

**Signature:** `async kickUser(roomId, userId, reason = "")`

Kicks a user from a room.

**Parameters:**

- `roomId` **{string}**
- `userId` **{string}**
- `reason` **{string}** _(optional)_ - Default: `""]`

**Returns:** `Promise<boolean>` - `true` on success.

---

## knockRoom()

**Signature:** `async knockRoom(roomIdOrAlias, options = {})`

Knocks on a room (requests to join).

**Parameters:**

- `roomIdOrAlias` **{string}**
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional knock parameters (reason, server_name, etc.).

**Returns:** `Promise<{roomId: string` - |null>} The room ID, or `null` on failure.

---

## leaveRoom()

**Signature:** `async leaveRoom(roomId)`

Leaves a room.

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<boolean>` - `true` on success.

---

## reportEvent()

**Signature:** `async reportEvent(roomId, eventId, reason = '', score = 0)`

Reports an event in a room to the homeserver moderators.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}**
- `reason` **{string}** _(optional)_ - Default: `'']` - Human-readable reason for the report.
- `score` **{number}** _(optional)_ - Default: `0]` - Severity score between -100 (most offensive) and 0 (inoffensive).

**Returns:** `Promise<boolean>` - `true` on success.

---

## reportRoom()

**Signature:** `async reportRoom(roomId, reason = '', score = 0)`

Reports a room to the homeserver moderators.

**Parameters:**

- `roomId` **{string}**
- `reason` **{string}** _(optional)_ - Default: `'']` - Human-readable reason for the report.
- `score` **{number}** _(optional)_ - Default: `0]` - Severity score between -100 (most offensive) and 0 (inoffensive).

**Returns:** `Promise<boolean>` - `true` on success.

---

## unbanUser()

**Signature:** `async unbanUser(roomId, userId)`

Unbans a user from a room.

**Parameters:**

- `roomId` **{string}**
- `userId` **{string}**

**Returns:** `Promise<boolean>` - `true` on success.

---

## upgradeRoom()

**Signature:** `async upgradeRoom(roomId, newVersion)`

Upgrades a room to a new version.

**Parameters:**

- `roomId` **{string}**
- `newVersion` **{string}** - The new room version (e.g., "10").

**Returns:** `Promise<{replacementRoom: string` - |null>} The new room ID, or `null` on failure.

