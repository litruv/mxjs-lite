# Spaces API

Matrix Spaces support (MSC1772 / Matrix v1.2). Spaces are rooms with `type: 'm.space'` in their `m.room.create` content. Children and parents are expressed via `m.space.child` / `m.space.parent` state events.

## Overview

This module provides 7 methods.

## Methods

- [`addSpaceChild()`](#addspacechild)
- [`createSpace()`](#createspace)
- [`getSpaceChildren()`](#getspacechildren)
- [`isSpaceRoom()`](#isspaceroom)
- [`removeSpaceChild()`](#removespacechild)
- [`removeSpaceParent()`](#removespaceparent)
- [`setSpaceParent()`](#setspaceparent)

---

## addSpaceChild()

**Signature:** `async addSpaceChild(spaceId, childRoomId, via, options = {})`

Adds a child room or subspace to a space via an `m.space.child` state event.

**Parameters:**

- `spaceId` **{string}** - Room ID of the space.
- `childRoomId` **{string}** - Room ID of the child to add.
- `via` **{string[]}** - List of candidate servers to use when joining the child room.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional fields: `order` (string) and `suggested` (boolean).

**Returns:** `Promise<{eventId: string` - |null>}

---

## createSpace()

**Signature:** `async createSpace(name, options = {})`

Matrix Spaces support (MSC1772 / Matrix v1.2). Spaces are rooms with `type: 'm.space'` in their `m.room.create` content. Children and parents are expressed via `m.space.child` / `m.space.parent` state events.

**Parameters:**

- `Base` **{T}**
- `name` **{string}** - Display name for the space.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Additional room creation options (e.g. `topic`, `visibility`).

**Returns:** `Promise<{roomId: string` - |null>}

**Example:**

```javascript
const result = await client.createSpace(Base, 'name');
if (result) {
  console.log('Created:', result);
}
```

---

## getSpaceChildren()

**Signature:** `async getSpaceChildren(spaceId)`

Returns all current children of a space by fetching its full room state and filtering for valid `m.space.child` events (those with a non-empty `via` array).

**Parameters:**

- `spaceId` **{string}** - Room ID of the space.

**Returns:** `Promise<Array<{roomId: string, via: string[], order: string|null, suggested: boolean` - >|null>}

---

## isSpaceRoom()

**Signature:** `isSpaceRoom(createContent)`

Returns `true` if the given `m.room.create` event content represents a space room.

**Parameters:**

- `createContent` **{Object}** - Content of the room's `m.room.create` event.

**Returns:** `boolean`

**Example:**

```javascript
if (client.isSpaceRoom({})) {
  // It's a space room
}
```

---

## removeSpaceChild()

**Signature:** `async removeSpaceChild(spaceId, childRoomId)`

Removes a child room from a space by sending an empty `m.space.child` state event.

**Parameters:**

- `spaceId` **{string}** - Room ID of the space.
- `childRoomId` **{string}** - Room ID of the child to remove.

**Returns:** `Promise<{eventId: string` - |null>}

---

## removeSpaceParent()

**Signature:** `async removeSpaceParent(roomId, spaceId)`

Removes a parent declaration from a room by sending an empty `m.space.parent` state event.

**Parameters:**

- `roomId` **{string}** - Room ID of the child room.
- `spaceId` **{string}** - Room ID of the parent space to remove.

**Returns:** `Promise<{eventId: string` - |null>}

---

## setSpaceParent()

**Signature:** `async setSpaceParent(roomId, spaceId, via, canonical = false)`

Declares a room's parent space via an `m.space.parent` state event.

**Parameters:**

- `roomId` **{string}** - Room ID of the child room.
- `spaceId` **{string}** - Room ID of the parent space.
- `via` **{string[]}** - List of candidate servers to use when joining the parent.
- `canonical` **{boolean}** _(optional)_ - Default: `false]` - Whether this is the primary (canonical) parent.

**Returns:** `Promise<{eventId: string` - |null>}

