# Events API

Mixin adding room event methods to a base client class. Covers sending, editing, redacting, reacting, and fetching room events and state.

## Overview

This module provides 24 methods.

## Common Usage

```javascript
// Send and react to messages
const msg = await client.sendMessage(roomId, 'Hello!');
await client.reactToMessage(roomId, msg.eventId, '👍');
```

## Methods

- [`editMessage()`](#editmessage)
- [`getEvent()`](#getevent)
- [`getEventByTimestamp()`](#geteventbytimestamp)
- [`getEventContext()`](#geteventcontext)
- [`getEventRelations()`](#geteventrelations)
- [`getEventRelationsByType()`](#geteventrelationsbytype)
- [`getEventRelationsByTypeAndEvent()`](#geteventrelationsbytypeandevent)
- [`getJoinedMembers()`](#getjoinedmembers)
- [`getMessages()`](#getmessages)
- [`getRoomAllState()`](#getroomallstate)
- [`getRoomName()`](#getroomname)
- [`getRoomState()`](#getroomstate)
- [`getRoomTopic()`](#getroomtopic)
- [`getThreads()`](#getthreads)
- [`reactToMessage()`](#reacttomessage)
- [`redactEvent()`](#redactevent)
- [`removeReaction()`](#removereaction)
- [`sendEvent()`](#sendevent)
- [`sendImage()`](#sendimage)
- [`sendMessage()`](#sendmessage)
- [`sendStateEvent()`](#sendstateevent)
- [`setRoomAvatar()`](#setroomavatar)
- [`setRoomName()`](#setroomname)
- [`setRoomTopic()`](#setroomtopic)

---

## <a id="editmessage"></a>`async editMessage(roomId, eventId, newMessage)`

Edits a previously sent message using the `m.replace` relation.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}** - The event ID of the original message.
- `newMessage` **{string}** - The replacement text body.

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="getevent"></a>`async getEvent(roomId, eventId)`

Gets a single event by its ID.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}**

**Returns:** `Promise<Object|null>` - The event object, or `null` on failure.

---

## <a id="geteventbytimestamp"></a>`async getEventByTimestamp(roomId, timestamp, dir = "f")`

Gets the event ID at or before a given timestamp.

**Parameters:**

- `roomId` **{string}**
- `timestamp` **{number}** - Unix timestamp in milliseconds.
- `dir` **{string}** _(optional)_ - Default: `"f"]` - Direction: "f" (forwards) or "b" (backwards).

**Returns:** `Promise<{eventId: string, timestamp: number` - |null>}

---

## <a id="geteventcontext"></a>`async getEventContext(roomId, eventId, { limit = 10 } = {})`

Gets events before and after a specific event (context).

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}**
- `options` **{object}** _(optional)_
- `options` **{number}** _(optional)_ - .limit=10] - Maximum number of events to return on each side.

**Returns:** `Promise<{event: Object, eventsBefore: Object[], eventsAfter: Object[], start: string, end: string` - |null>}

---

## <a id="geteventrelations"></a>`async getEventRelations(roomId, eventId, { from = null, limit = 50 } = {})`

Gets all relations to an event.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}**
- `options` **{object}** _(optional)_
- `options` **{string|null}** _(optional)_ - .from=null] - Pagination token.
- `options` **{number}** _(optional)_ - .limit=50] - Maximum number of events to return.

**Returns:** `Promise<{events: Object[], nextBatch: string|null, prevBatch: string|null` - |null>}

---

## <a id="geteventrelationsbytype"></a>`async getEventRelationsByType(roomId, eventId, relType, { from = null, limit = 50 } = {})`

Gets relations to an event filtered by relation type.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}**
- `relType` **{string}** - The relation type (e.g. "m.annotation", "m.replace").
- `options` **{object}** _(optional)_
- `options` **{string|null}** _(optional)_ - .from=null] - Pagination token.
- `options` **{number}** _(optional)_ - .limit=50] - Maximum number of events to return.

**Returns:** `Promise<{events: Object[], nextBatch: string|null, prevBatch: string|null` - |null>}

---

## <a id="geteventrelationsbytypeandevent"></a>`async getEventRelationsByTypeAndEvent(roomId, eventId, relType, eventType, { from = null, limit = 50 } = {})`

Gets relations to an event filtered by relation type and event type.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}**
- `relType` **{string}** - The relation type (e.g. "m.annotation").
- `eventType` **{string}** - The event type (e.g. "m.reaction").
- `options` **{object}** _(optional)_
- `options` **{string|null}** _(optional)_ - .from=null] - Pagination token.
- `options` **{number}** _(optional)_ - .limit=50] - Maximum number of events to return.

**Returns:** `Promise<{events: Object[], nextBatch: string|null, prevBatch: string|null` - |null>}

---

## <a id="getjoinedmembers"></a>`async getJoinedMembers(roomId)`

Gets the list of users that are currently in a room (joined members).

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<{members: Array<{userId: string, displayName: string|null, avatarUrl: string|null` - >}|null>}

---

## <a id="getmessages"></a>`async getMessages(roomId, { from = null, limit = 50, dir = "b" } = {})`

Fetches a page of messages from a room's timeline.

**Parameters:**

- `roomId` **{string}**
- `options` **{object}** _(optional)_
- `options` **{string|null}** _(optional)_ - .from=null] - Pagination token to start from.
- `options` **{number}** _(optional)_ - .limit=50] - Maximum number of events to return.
- `options` **{string}** _(optional)_ - .dir="b"] - Direction: `"b"` (backwards) or `"f"` (forwards).

**Returns:** `Promise<{messages: Object[], start: string, end: string` - |null>}

---

## <a id="getroomallstate"></a>`async getRoomAllState(roomId)`

Fetches a snapshot of common room state (name, topic, avatar, power levels, members).

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<{name: string|null, topic: string|null, avatarUrl: string|null, canonicalAlias: string|null, powerLevels: Object|null, members: Array<{userId: string, displayName: string|null, membership: string` - >}|null>}

---

## <a id="getroomname"></a>`async getRoomName(roomId)`

Gets the name of a room.

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<string|null>`

---

## <a id="getroomstate"></a>`async getRoomState(roomId, type, stateKey = "")`

Fetches a specific state event from a room.

**Parameters:**

- `roomId` **{string}**
- `type` **{string}** - Matrix state event type.
- `stateKey` **{string}** _(optional)_ - Default: `""]`

**Returns:** `Promise<Object|null>` - The state event content, or `null` on failure.

---

## <a id="getroomtopic"></a>`async getRoomTopic(roomId)`

Gets the topic of a room.

**Parameters:**

- `roomId` **{string}**

**Returns:** `Promise<string|null>`

---

## <a id="getthreads"></a>`async getThreads(roomId, { from = null, limit = 50, include = "all" } = {})`

Gets a list of threads in a room.

**Parameters:**

- `roomId` **{string}**
- `options` **{object}** _(optional)_
- `options` **{string|null}** _(optional)_ - .from=null] - Pagination token to start from.
- `options` **{number}** _(optional)_ - .limit=50] - Maximum number of thread roots to return.
- `options` **{string}** _(optional)_ - .include="all"] - Filter threads: "all" or "participated".

**Returns:** `Promise<{threads: Object[], nextBatch: string|null` - |null>}

---

## <a id="reacttomessage"></a>`async reactToMessage(roomId, eventId, reaction)`

Sends a reaction annotation to a message.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}** - The event to react to.
- `reaction` **{string}** - The reaction key (typically an emoji).

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="redactevent"></a>`async redactEvent(roomId, eventId, reason = "")`

Redacts (deletes) a room event.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}**
- `reason` **{string}** _(optional)_ - Default: `""]` - Optional reason for the redaction.

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="removereaction"></a>`async removeReaction(roomId, reactionEventId)`

Removes a reaction by redacting its event.

**Parameters:**

- `roomId` **{string}**
- `reactionEventId` **{string}** - The event ID of the reaction to remove.

**Returns:** `Promise<boolean>` - `true` on success.

---

## <a id="sendevent"></a>`async sendEvent(roomId, eventType, content, txnId = null)`

Sends a custom event to a room using a transaction ID.

**Parameters:**

- `roomId` **{string}**
- `eventType` **{string}** - The event type (e.g. "m.room.message").
- `content` **{Object}** - The event content.
- `txnId` **{string}** _(optional)_ - Optional transaction ID. Defaults to timestamp.

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="sendimage"></a>`async sendImage(roomId, url, body = "Image", info = {})`

Sends an image message to a room.

**Parameters:**

- `roomId` **{string}**
- `url` **{string}** - An `mxc://` URI for the image.
- `body` **{string}** _(optional)_ - Default: `"Image"]` - Alt text / fallback body.
- `info` **{Object}** _(optional)_ - Default: `{}]` - Optional image metadata (e.g. `w`, `h`, `mimetype`).

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="sendmessage"></a>`async sendMessage(roomId, message, formattedBody = null)`

Sends a plain text (or optionally HTML-formatted) message to a room.

**Parameters:**

- `roomId` **{string}**
- `message` **{string}** - Plain text body.
- `formattedBody` **{string|null}** _(optional)_ - Default: `null]` - Optional HTML-formatted body.

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="sendstateevent"></a>`async sendStateEvent(roomId, type, content, stateKey = "")`

Sends a state event to a room.

**Parameters:**

- `roomId` **{string}**
- `type` **{string}** - Matrix state event type.
- `content` **{Object}** - Event content.
- `stateKey` **{string}** _(optional)_ - Default: `""]` - Optional state key.

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="setroomavatar"></a>`async setRoomAvatar(roomId, url)`

Sets the avatar for a room.

**Parameters:**

- `roomId` **{string}**
- `url` **{string}** - An `mxc://` URI.

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="setroomname"></a>`async setRoomName(roomId, name)`

Sets the name of a room.

**Parameters:**

- `roomId` **{string}**
- `name` **{string}**

**Returns:** `Promise<{eventId: string` - |null>}

---

## <a id="setroomtopic"></a>`async setRoomTopic(roomId, topic)`

Sets the topic of a room.

**Parameters:**

- `roomId` **{string}**
- `topic` **{string}**

**Returns:** `Promise<{eventId: string` - |null>}

---

## Related Methods

This module contains 24 methods. Common workflows:

**Getters:** `getEvent()`, `getEventByTimestamp()`, `getEventContext()`, `getEventRelations()`, `getEventRelationsByType()`, `getEventRelationsByTypeAndEvent()`, `getJoinedMembers()`, `getMessages()`, `getRoomAllState()`, `getRoomName()`, `getRoomState()`, `getRoomTopic()`, `getThreads()`

**Setters:** `setRoomAvatar()`, `setRoomName()`, `setRoomTopic()`

