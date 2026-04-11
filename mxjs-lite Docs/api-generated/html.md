# Html API

HTML utility methods and event inspection helpers.

## Overview

This module provides 13 methods.

## Methods

- [`buildMentionHtml()`](#buildmentionhtml)
- [`extractLocalpart()`](#extractlocalpart)
- [`formatMarkdownToHtml()`](#formatmarkdowntohtml)
- [`getEditedBody()`](#geteditedbody)
- [`getEventRelation()`](#geteventrelation)
- [`getMembershipChange()`](#getmembershipchange)
- [`getPrevContent()`](#getprevcontent)
- [`hasFormattedBody()`](#hasformattedbody)
- [`isEditEvent()`](#iseditevent)
- [`isImageMessage()`](#isimagemessage)
- [`isMention()`](#ismention)
- [`isReactionEvent()`](#isreactionevent)
- [`sanitizeHtml()`](#sanitizehtml)

---

## buildMentionHtml()

**Signature:** `buildMentionHtml(text, getDisplayName)`

Replaces `@user:server` patterns in plain text with HTML anchor mention links.

**Parameters:**

- `text` **{string}** - Plain text possibly containing Matrix user IDs.
- `getDisplayName` **{function(string): string}** - Callback to resolve a user ID to a display name.

**Returns:** `string|null` - HTML string with mentions linked, or `null` if no mentions were found.

---

## extractLocalpart()

**Signature:** `extractLocalpart(userId)`

Extracts the localpart from a Matrix user ID (the segment before the colon).

**Parameters:**

- `userId` **{string}** - A Matrix user ID (e.g. `@alice:example.com`).

**Returns:** `string` - The localpart, or `"?"` if extraction fails.

---

## formatMarkdownToHtml()

**Signature:** `formatMarkdownToHtml(markdown)`

Converts Markdown text to HTML. This is a basic implementation supporting common markdown syntax.

**Parameters:**

- `markdown` **{string}** - Markdown text to convert

**Returns:** `string` - HTML-formatted string

---

## getEditedBody()

**Signature:** `getEditedBody(event)`

Extracts the text body from an edited message event. Falls back to the regular `body` if no `m.new_content` is present.

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `string|null`

---

## getEventRelation()

**Signature:** `getEventRelation(event)`

Returns the `m.relates_to` relation object from an event, if present.

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `Object|null`

---

## getMembershipChange()

**Signature:** `getMembershipChange(event)`

Interprets an `m.room.member` event and returns a structured description of the membership change.

**Parameters:**

- `event` **{Object}** - A Matrix `m.room.member` state event.

**Returns:** `{type: "join"|"rename"|"avatar"|"leave"|"kick"|"ban"|"unknown", userId: string, displayName: string|null, prevDisplayName: string|null, avatarUrl: string|null, prevAvatarUrl?: string|null, kicker: string|null` - |null}

---

## getPrevContent()

**Signature:** `getPrevContent(event)`

Returns the previous content (`unsigned.prev_content`) of a state event, if present.

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `Object|null`

---

## hasFormattedBody()

**Signature:** `hasFormattedBody(event)`

Checks whether a message event contains an HTML-formatted body.

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `boolean`

**Example:**

```javascript
if (client.hasFormattedBody(event)) {
  // It's a formatted body
}
```

---

## isEditEvent()

**Signature:** `isEditEvent(event)`

Checks whether an event is a message edit (`m.replace` relation).

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `boolean`

**Example:**

```javascript
if (client.isEditEvent(event)) {
  // It's an edit event
}
```

---

## isImageMessage()

**Signature:** `isImageMessage(event)`

Checks whether an event is an image message.

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `boolean`

**Example:**

```javascript
if (client.isImageMessage(event)) {
  // It's an image message
}
```

---

## isMention()

**Signature:** `isMention(event, userId)`

HTML utility methods and event inspection helpers.

**Parameters:**

- `Base` **{T}**
- `event` **{Object}** - A Matrix room event.
- `userId` **{string}** - The user ID to check for.

**Returns:** `boolean`

**Example:**

```javascript
if (client.isMention(Base, event, '@user:matrix.org')) {
  // It's a mention
}
```

---

## isReactionEvent()

**Signature:** `isReactionEvent(event)`

Checks whether an event is a reaction annotation (`m.annotation`).

**Parameters:**

- `event` **{Object}** - A Matrix room event.

**Returns:** `boolean`

**Example:**

```javascript
if (client.isReactionEvent(event)) {
  // It's a reaction event
}
```

---

## sanitizeHtml()

**Signature:** `sanitizeHtml(html)`

Sanitizes an HTML string, permitting only a safe subset of tags and converting Matrix mention links into `<span class="mention">` elements.

**Parameters:**

- `html` **{string}** - Raw HTML string to sanitize.

**Returns:** `string` - The sanitized HTML string.

