# Threads API

Matrix Threads support (MSC3440 / Matrix v1.3). Threads are conversations branched off a root message using the `m.thread` relation type.

## Overview

This module provides 7 methods.

## Methods

- [`getRoomThreads()`](#getroomthreads)
- [`getThreadEvents()`](#getthreadevents)
- [`getThreadRoot()`](#getthreadroot)
- [`isThreadEvent()`](#isthreadevent)
- [`isThreadFallback()`](#isthreadfallback)
- [`sendThreadReply()`](#sendthreadreply)
- [`sendThreadReplyTo()`](#sendthreadreplyto)

---

## getRoomThreads()

**Signature:** `async getRoomThreads(roomId, options = {})`

Fetches all thread root events in a room using the dedicated threads list endpoint (`GET /_matrix/client/v1/rooms/{roomId}/threads`, MSC3856 / Matrix v1.4).

**Parameters:**

- `roomId` **{string}**
- `options` **{Object}** _(optional)_ - Default: `{}]`
- `options` **{'all'|'participated'}** _(optional)_ - .include='all'] - `'all'` returns every thread; `'participated'` returns only threads the current user contributed to.
- `options` **{string}** _(optional)_ - .from] - Pagination token from a previous call's `nextBatch`.
- `options` **{number}** _(optional)_ - .limit] - Maximum number of thread roots to return.

**Returns:** `Promise<{threads: Object[], nextBatch: string|null` - |null>}

---

## getThreadEvents()

**Signature:** `async getThreadEvents(roomId, threadRootId, options = {})`

Fetches the events belonging to a thread via the `/relations` API.

**Parameters:**

- `roomId` **{string}**
- `threadRootId` **{string}** - Event ID of the thread root message.
- `options` **{Object}** _(optional)_ - Default: `{}]`
- `options` **{string}** _(optional)_ - .from] - Pagination token.
- `options` **{number}** _(optional)_ - .limit=50] - Maximum number of events to return.
- `options` **{string}** _(optional)_ - .dir="b"] - Direction: `"b"` (backwards) or `"f"` (forwards).

**Returns:** `Promise<{events: Object[], nextBatch: string|null` - |null>}

---

## getThreadRoot()

**Signature:** `getThreadRoot(event)`

Returns the event ID of the thread root this event belongs to, or `null`.

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `string|null`

---

## isThreadEvent()

**Signature:** `isThreadEvent(event)`

Returns `true` if the event is a thread reply (`rel_type` of `m.thread`).

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `boolean`

**Example:**

```javascript
if (client.isThreadEvent(event)) {
  // It's a thread event
}
```

---

## isThreadFallback()

**Signature:** `isThreadFallback(event)`

Returns `true` if the `m.in_reply_to` on a thread event is a fallback for non-thread clients (i.e. `is_falling_back` is `true`).

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `boolean`

**Example:**

```javascript
if (client.isThreadFallback(event)) {
  // It's a thread fallback
}
```

---

## sendThreadReply()

**Signature:** `async sendThreadReply(roomId, threadRootId, message, formattedBody = null)`

Matrix Threads support (MSC3440 / Matrix v1.3). Threads are conversations branched off a root message using the `m.thread` relation type.

**Parameters:**

- `Base` **{T}**
- `roomId` **{string}**
- `threadRootId` **{string}** - Event ID of the thread root message.
- `message` **{string}** - Plain text body.
- `formattedBody` **{string|null}** _(optional)_ - Default: `null]` - Optional HTML-formatted body.

**Returns:** `Promise<{eventId: string` - |null>}

---

## sendThreadReplyTo()

**Signature:** `async sendThreadReplyTo(roomId, threadRootId, replyToEventId, message, formattedBody = null)`

Sends a rich reply within a thread, targeting a specific event rather than the root. Sets `is_falling_back: false` so clients treat this as a genuine reply.

**Parameters:**

- `roomId` **{string}**
- `threadRootId` **{string}** - Event ID of the thread root.
- `replyToEventId` **{string}** - Event ID within the thread being directly replied to.
- `message` **{string}** - Plain text body.
- `formattedBody` **{string|null}** _(optional)_ - Default: `null]` - Optional HTML-formatted body.

**Returns:** `Promise<{eventId: string` - |null>}

