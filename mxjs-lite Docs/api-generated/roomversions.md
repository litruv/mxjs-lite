# RoomVersions API

Matrix room version upgrade support (MSC1501). Provides methods to upgrade a room, inspect its version, follow tombstone chains, and read predecessor information from `m.room.create`.

## Overview

This module provides 7 methods.

## Methods

- [`followTombstoneChain()`](#followtombstonechain)
- [`getRoomPredecessor()`](#getroompredecessor)
- [`getRoomTombstone()`](#getroomtombstone)
- [`getRoomVersion()`](#getroomversion)
- [`isRoomTombstoned()`](#isroomtombstoned)
- [`isTombstoneEvent()`](#istombstoneevent)
- [`upgradeRoom()`](#upgraderoom)

---

## followTombstoneChain()

**Signature:** `async followTombstoneChain(roomId)`

Follows the tombstone chain from a given room, returning each successive replacement room ID in order until a live (non-tombstoned) room is found. Stops automatically if a cycle is detected or if more than 20 hops are traversed.

**Parameters:**

- `roomId` **{string}** - The starting room ID.

**Returns:** `Promise<string>` - The ID of the most recent live room in the chain.

---

## getRoomPredecessor()

**Signature:** `async getRoomPredecessor(roomId)`

Returns the predecessor field from the `m.room.create` event, indicating this room was created as an upgrade of an older room.

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<{roomId: string, eventId: string` - |null>} Predecessor info, or `null` if none or on failure.

---

## getRoomTombstone()

**Signature:** `async getRoomTombstone(roomId)`

Returns the `m.room.tombstone` state event content for a room, if present. A tombstone indicates the room has been replaced and is no longer active.

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<{body: string, replacementRoomId: string` - |null>} The tombstone data, or `null` if the room is not dead.

---

## getRoomVersion()

**Signature:** `async getRoomVersion(roomId)`

Returns the current room version string from the `m.room.create` state event. Rooms without an explicit version are version `"1"` per the Matrix spec.

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<string|null>` - The version string, or `null` on failure.

---

## isRoomTombstoned()

**Signature:** `async isRoomTombstoned(roomId)`

Returns whether a room has been tombstoned (upgraded and replaced). Checks the live `m.room.tombstone` state event on the homeserver.

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<boolean>`

**Example:**

```javascript
if (client.isRoomTombstoned('!roomId:matrix.org')) {
  // It's a room tombstoned
}
```

---

## isTombstoneEvent()

**Signature:** `isTombstoneEvent(event)`

Returns whether a given timeline event is an `m.room.tombstone` state event. Useful when processing events received from sync without an extra API call.

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `boolean`

**Example:**

```javascript
if (client.isTombstoneEvent(event)) {
  // It's a tombstone event
}
```

---

## upgradeRoom()

**Signature:** `async upgradeRoom(roomId, newVersion)`

Matrix room version upgrade support (MSC1501). Provides methods to upgrade a room, inspect its version, follow tombstone chains, and read predecessor information from `m.room.create`.

**Parameters:**

- `Base` **{T}**
- `roomId` **{string}** - The room to upgrade.
- `newVersion` **{string}** - The target room version string (e.g. `"11"`).

**Returns:** `Promise<{replacementRoomId: string` - |null>}

