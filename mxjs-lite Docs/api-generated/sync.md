# Sync API

Matrix /sync polling and sync data processing.

## Overview

This module provides 2 methods.

## Common Usage

```javascript
// Start syncing
const syncData = await client.sync();
client.processSyncData(syncData);
```

## Methods

- [`processSyncData()`](#processsyncdata)
- [`sync()`](#sync)

---

## processSyncData()

**Signature:** `processSyncData(data)`

Processes a sync response and emits structured events for new activity. Call this with the data returned by {@link sync} after each poll, or use {@link startSync} to have the library handle the loop automatically. Emits (use {@link ClientEvents} constants as event names): - `roomJoin` `{ roomId }` — a room appeared in sync for the first time. - `roomLeave` `{ roomId }` — the client left or was removed from a room. - `inviteReceive` `{ roomId }` — a room invitation was received. - `messageCreate` `{ roomId, event }` — a new (non-edit) `m.room.message` event. - `messageUpdate` `{ roomId, edits, newBody, event }` — a message was edited. - `messageDelete` `{ roomId, redacts, event }` — an event was redacted. - `reactionAdd` `{ roomId, reacts, key, event }` — an `m.reaction` was added. - `reactionRemove` `{ roomId, reacts, key, event }` — a reaction was removed (its event was redacted). - `memberUpdate` `{ roomId, change, event }` — a membership state change. - `roomNameUpdate` `{ roomId, name, prevName, event }` — room name changed. - `roomTopicUpdate` `{ roomId, topic, prevTopic, event }` — room topic changed. - `roomAvatarUpdate` `{ roomId, avatarUrl, prevAvatarUrl, event }` — room avatar changed. - `typingStart` `{ roomId, userIds }` — users who started typing this cycle. - `typingEnd` `{ roomId, userIds }` — users who stopped typing this cycle. - `receiptUpdate` `{ roomId, receipts }` — read receipts arrived. - `roomAccountDataUpdate` `{ roomId, type, content }` — room account data changed. - `presenceUpdate` `{ userId, presence, lastActiveAgo, statusMsg, currentlyActive }` — user presence changed. - `accountDataUpdate` `{ type, content }` — global account data changed. - `spaceChildAdd` `{ roomId, childRoomId, via, order, suggested, event }` — child added/updated in a space. - `spaceChildRemove` `{ roomId, childRoomId, event }` — child removed from a space. - `threadReply` `{ roomId, threadRootId, event }` — a thread reply arrived (also fires as `messageCreate`). - `roomTombstone` `{ roomId, replacementRoomId, body, event }` — the room has been replaced by a newer room.

**Parameters:**

- `data` **{Object}** - The sync response as returned by {@link sync}.

---

## sync()

**Signature:** `async sync(since = null, timeout = 0)`

Matrix /sync polling and sync data processing.

**Parameters:**

- `Base` **{T}**
- `since` **{string|null}** _(optional)_ - Default: `null]` - The sync token from a previous sync response.
- `timeout` **{number}** _(optional)_ - Default: `0]` - Long-poll timeout in milliseconds.

**Returns:** `Promise<Object|null>` - The raw sync response, or `null` on failure.

