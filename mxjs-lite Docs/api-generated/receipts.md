# Receipts API

Typing notifications and read receipts.

## Overview

This module provides 3 methods.

## Methods

- [`sendReadReceipt()`](#sendreadreceipt)
- [`sendTyping()`](#sendtyping)
- [`setReadMarkers()`](#setreadmarkers)

---

## sendReadReceipt()

**Signature:** `async sendReadReceipt(roomId, eventId)`

Marks an event as read by sending a read receipt.

**Parameters:**

- `roomId` **{string}**
- `eventId` **{string}**

**Returns:** `Promise<boolean>` - `true` on success.

**Example:**

```javascript
const result = await client.sendReadReceipt('!roomId:matrix.org', '$eventId');
if (result) {
  console.log('Created:', result);
}
```

---

## sendTyping()

**Signature:** `async sendTyping(roomId, typing, timeout = 30000)`

Typing notifications and read receipts.

**Parameters:**

- `Base` **{T}**
- `roomId` **{string}**
- `typing` **{boolean}** - `true` to indicate typing, `false` to stop.
- `timeout` **{number}** _(optional)_ - Default: `30000]` - How long (ms) the typing indicator should remain active.

**Returns:** `Promise<boolean>` - `true` on success.

---

## setReadMarkers()

**Signature:** `async setReadMarkers(roomId, fullyReadEventId, readReceiptEventId)`

Sets read markers for a room (fully read marker and optional read receipt).

**Parameters:**

- `roomId` **{string}** - The room ID
- `fullyReadEventId` **{string}** - The event ID to mark as fully read
- `readReceiptEventId` **{string}** _(optional)_ - Optional event ID to send a read receipt for

**Returns:** `Promise<boolean>` - `true` on success.

