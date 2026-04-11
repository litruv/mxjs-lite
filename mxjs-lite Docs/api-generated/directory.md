# Directory API

Room directory methods.

## Overview

This module provides 13 methods.

## Methods

- [`createRoomAlias()`](#createroomalias)
- [`deleteRoomAlias()`](#deleteroomalias)
- [`findHomeServer()`](#findhomeserver)
- [`getJoinedRooms()`](#getjoinedrooms)
- [`getPublicRooms()`](#getpublicrooms)
- [`getRoomAliases()`](#getroomaliases)
- [`getRoomHierarchy()`](#getroomhierarchy)
- [`getRoomSummary()`](#getroomsummary)
- [`getRoomVisibility()`](#getroomvisibility)
- [`resolveRoomAlias()`](#resolveroomalias)
- [`searchPublicRooms()`](#searchpublicrooms)
- [`searchUserDirectory()`](#searchuserdirectory)
- [`setRoomVisibility()`](#setroomvisibility)

---

## createRoomAlias()

**Signature:** `async createRoomAlias(roomAlias, roomId)`

Creates a new room alias pointing to a room ID.

**Parameters:**

- `roomAlias` **{string}** - The room alias to create (e.g., #alias:server.com)
- `roomId` **{string}** - The room ID to point the alias to

**Returns:** `Promise<boolean>` - True if successful, false otherwise

**Example:**

```javascript
const result = await client.createRoomAlias('roomAlias', '!roomId:matrix.org');
if (result) {
  console.log('Created:', result);
}
```

---

## deleteRoomAlias()

**Signature:** `async deleteRoomAlias(roomAlias)`

Deletes a room alias.

**Parameters:**

- `roomAlias` **{string}** - The room alias to delete (e.g., #alias:server.com)

**Returns:** `Promise<boolean>` - True if successful, false otherwise

---

## findHomeServer()

**Signature:** `async findHomeServer(options = {})`

Finds the homeserver for a given user or server name.

**Parameters:**

- `options` **{Object}** _(optional)_ - Query options
- `options` **{string}** _(optional)_ - .server_name] - Server name to look up

**Returns:** `Promise<{server: string` - |null>} Server information, or null on failure

---

## getJoinedRooms()

**Signature:** `async getJoinedRooms()`

Gets the list of room IDs the user has joined.

**Parameters:** None

**Returns:** `Promise<string[]|null>` - Array of room IDs, or null on failure

---

## getPublicRooms()

**Signature:** `async getPublicRooms(options = {})`

Gets the list of public rooms on the homeserver.

**Parameters:**

- `options` **{Object}** _(optional)_ - Optional query parameters
- `options` **{number}** _(optional)_ - .limit] - Maximum number of rooms to return
- `options` **{string}** _(optional)_ - .since] - Pagination token from a previous request
- `options` **{string}** _(optional)_ - .server] - Server to fetch the public room list from

**Returns:** `Promise<Object|null>` - Public rooms response with chunk array, or null on failure

---

## getRoomAliases()

**Signature:** `async getRoomAliases(roomId)`

Gets the list of aliases for a room (deprecated endpoint, may not be available on all servers).

**Parameters:**

- `roomId` **{string}** - The room ID

**Returns:** `Promise<string[]|null>` - Array of alias strings, or null on failure

---

## getRoomHierarchy()

**Signature:** `async getRoomHierarchy(roomId, options = {})`

Gets the hierarchy of a space (rooms and subspaces).

**Parameters:**

- `roomId` **{string}** - The space room ID
- `options` **{Object}** _(optional)_ - Optional query parameters
- `options` **{boolean}** _(optional)_ - .suggested_only] - Only return rooms/spaces marked as suggested
- `options` **{number}** _(optional)_ - .max_depth] - Maximum depth to traverse (default server-dependent)
- `options` **{string}** _(optional)_ - .from] - Pagination token from a previous request

**Returns:** `Promise<Object|null>` - Hierarchy object with rooms array, or null on failure

---

## getRoomSummary()

**Signature:** `async getRoomSummary(roomIdOrAlias, options = {})`

Gets a summary of a room (used for spaces and room previews).

**Parameters:**

- `roomIdOrAlias` **{string}** - The room ID or alias
- `options` **{Object}** _(optional)_ - Optional query parameters
- `options` **{string[]}** _(optional)_ - .via] - List of servers to try and use for joining

**Returns:** `Promise<Object|null>` - Room summary object, or null on failure

---

## getRoomVisibility()

**Signature:** `async getRoomVisibility(roomId)`

Gets the visibility of a room in the public room directory.

**Parameters:**

- `roomId` **{string}** - The room ID

**Returns:** `Promise<string|null>` - 'public' or 'private', or null on failure

---

## resolveRoomAlias()

**Signature:** `async resolveRoomAlias(roomAlias)`

Room directory methods.

**Parameters:**

- `Base` **{T}**
- `roomAlias` **{string}**

**Returns:** `Promise<string|null>` - The room ID, or `null` on failure.

---

## searchPublicRooms()

**Signature:** `async searchPublicRooms(options = {})`

Searches public rooms with filters (using POST for more complex queries).

**Parameters:**

- `options` **{Object}** _(optional)_ - Search options
- `options` **{number}** _(optional)_ - .limit] - Maximum number of rooms to return
- `options` **{string}** _(optional)_ - .since] - Pagination token from a previous request
- `options` **{string}** _(optional)_ - .server] - Server to fetch the public room list from
- `options` **{Object}** _(optional)_ - .filter] - Filter object with optional search_term, room_types, etc.
- `options` **{boolean}** _(optional)_ - .include_all_networks] - Whether to include all third-party networks
- `options` **{string}** _(optional)_ - .third_party_instance_id] - Third-party network instance ID

**Returns:** `Promise<Object|null>` - Search results with chunk array, or null on failure

---

## searchUserDirectory()

**Signature:** `async searchUserDirectory(searchTerm, options = {})`

Searches the user directory for users matching a given search term.

**Parameters:**

- `searchTerm` **{string}** - The term to search for.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional parameters.
- `options` **{number}** _(optional)_ - .limit] - Maximum number of results to return.
- `options` **{string}** _(optional)_ - .language] - BCP 47 language tag for the search.

**Returns:** `Promise<{results: Array<{userId: string, displayName?: string, avatarUrl?: string` - >, limited: boolean}|null>}

---

## setRoomVisibility()

**Signature:** `async setRoomVisibility(roomId, visibility)`

Sets the visibility of a room in the public room directory.

**Parameters:**

- `roomId` **{string}** - The room ID
- `visibility` **{string}** - Either 'public' or 'private'

**Returns:** `Promise<boolean>` - True if successful, false otherwise

