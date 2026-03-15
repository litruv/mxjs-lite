# mxjs-lite

[![npm version](https://img.shields.io/npm/v/@litruv/mxjs-lite.svg)](https://www.npmjs.com/package/@litruv/mxjs-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![API Coverage](https://img.shields.io/badge/API%20coverage-54.93%25%20(78%2F142)-orange.svg)](test/api-coverage-report.txt)

Lightweight Matrix protocol client. Pure ES module, no dependencies.

```
npm install @litruv/mxjs-lite
```

or import directly into your website
```html
<script src="https://unpkg.com/@litruv/mxjs-lite/dist/mxjs-lite.min.js"></script>
```

### Sample script


```js
import MxjsClient from '@litruv/mxjs-lite';

const mx = new MxjsClient({ homeserver: 'https://matrix.org' });
await mx.login('alice', 's3cr3t');
const roomId = await mx.resolveRoomAlias('#general:matrix.org');
await mx.joinRoom(roomId);
await mx.sendMessage(roomId, 'Hello, world!');
```

---

## Constructor

```
new MxjsClient([options])
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `options.homeserver` | `string` | `"https://matrix.org"` | Homeserver base URL |
| `options.publicReadToken` | `string \| null` | `null` | Token for unauthenticated public reads |

---

## Properties

| Name |
|---|
| [`.homeserver`](#homeserver) |
| [`.accessToken`](#accesstoken) |
| [`.userId`](#userid) |
| [`.publicReadToken`](#publicreadtoken) |

---

## Methods

### Authentication

| Method |
|---|
| [`.register()`](#registerusername-password) |
| [`.registerGuest()`](#registerguest) |
| [`.login()`](#loginusername-password) |
| [`.logout()`](#logout) |
| [`.deactivateAccount()`](#deactivateaccountpassword) |
| [`.changePassword()`](#changepasswordoldpassword-newpassword) |

### Profile

| Method |
|---|
| [`.getProfile()`](#getprofileuserid) |
| [`.setDisplayName()`](#setdisplaynamedisplayname) |
| [`.setAvatarUrl()`](#setavatarurlavatarurl) |
| [`.mxcToHttp()`](#mxctohttpmxcurl) |

### Rooms

| Method |
|---|
| [`.resolveRoomAlias()`](#resolveroomaliastoomalias) |
| [`.joinRoom()`](#joinroomroomidoralias) |
| [`.createRoom()`](#createroomoptions) |
| [`.leaveRoom()`](#leaveroomroomid) |
| [`.inviteUser()`](#inviteuserroomid-userid) |
| [`.kickUser()`](#kickuserroomid-userid-reason) |
| [`.banUser()`](#banuserroomid-userid-reason) |
| [`.unbanUser()`](#unbanuserroomid-userid) |
| [`.getRoomMembers()`](#getroommembersroomid) |

### Messages

| Method |
|---|
| [`.sendMessage()`](#sendmessageroomid-message-formattedbody) |
| [`.sendImage()`](#sendimageroomid-url-body-info) |
| [`.editMessage()`](#editmessageroomid-eventid-newmessage) |
| [`.redactEvent()`](#redacteventroomid-eventid-reason) |
| [`.reactToMessage()`](#reacttomessageroomid-eventid-reaction) |
| [`.removeReaction()`](#removereactionroomid-reactioneventid) |
| [`.getMessages()`](#getmessagesroomid-options) |
| [`.sendTyping()`](#sendtypingroomid-typing-timeout) |
| [`.sendReadReceipt()`](#sendreadreceiptroomid-eventid) |

### Room State

| Method |
|---|
| [`.sendStateEvent()`](#sendstateeventroomid-type-content-statekey) |
| [`.setRoomName()`](#setroomnameroomid-name) |
| [`.setRoomTopic()`](#setroomtopicroomid-topic) |
| [`.setRoomAvatar()`](#setroomavatarroomid-url) |
| [`.getRoomState()`](#getroomstateroomid-type-statekey) |
| [`.getRoomName()`](#getroomnameroomid) |
| [`.getRoomTopic()`](#getroomtopicroomid) |
| [`.getRoomAllState()`](#getroomallstateroomid) |

### Media & Sync

| Method |
|---|
| [`.uploadMedia()`](#uploadmediadata-contenttype-filename) |
| [`.sync()`](#syncsince-timeout) |
| [`.processSyncData()`](#processsyncdatadata) |

### Event System

| Method |
|---|
| [`.on()`](#onevent-fn) |
| [`.off()`](#offevent-fn) |
| [`.emit()`](#emitevent-args) |

### Events

[connect](#event-connect)  
[disconnect](#event-disconnect)  
[edit](#event-edit)  
[invite](#event-invite)  
[memberUpdate](#event-memberupdate)  
[mention](#event-mention)  
[message](#event-message)  
[redaction](#event-redaction)  
[roomAvatarChange](#event-roomavatarchange)  
[roomJoin](#event-roomjoin)  
[roomLeave](#event-roomleave)  
[roomNameChange](#event-roomnamechange)  
[roomTopicChange](#event-roomtopicchange)  
[typing](#event-typing)

### Event Helpers

| Method |
|---|
| [`.isMention()`](#ismentonevent-userid) |
| [`.getEventRelation()`](#geteventrelationevent) |
| [`.isEditEvent()`](#isediteventevent) |
| [`.isReactionEvent()`](#isreactioneventevent) |
| [`.getEditedBody()`](#geteditedBodyevent) |
| [`.getPrevContent()`](#getprevcontentevent) |
| [`.getMembershipChange()`](#getmembershipchangeevent) |
| [`.isImageMessage()`](#isimagemessageevent) |
| [`.hasFormattedBody()`](#hasformattedbodyevent) |
| [`.extractLocalpart()`](#extractlocalpartuserid) |

### HTML Utilities

| Method |
|---|
| [`.buildMentionHtml()`](#buildmentionhtmltext-getdisplayname) |
| [`.sanitizeHtml()`](#sanitizehtmlhtml) |

### Public / Unauthenticated

| Method |
|---|
| [`.fetchPublicLastMessage()`](#fetchpubliclastmessageroomalias) |
| [`.fetchPublicPresence()`](#fetchpublicpresenceuserid) |

### Low-level

| Method |
|---|
| [`.api()`](#apiendpoint-method-body-accesstoken) |

---

## Property Details

### .homeserver
**Type:** `string`

The base URL of the Matrix homeserver used for all API requests.

---

### .accessToken
**Type:** `string | null`

The access token for the currently authenticated session. Set automatically by [`login`](#loginusername-password), [`register`](#registerusername-password), and [`registerGuest`](#registerguest). Cleared by [`logout`](#logout).

---

### .userId
**Type:** `string | null`

The Matrix user ID (e.g. `@alice:matrix.org`) of the currently authenticated user. Set alongside [`accessToken`](#accesstoken).

---

### .publicReadToken
**Type:** `string | null`

An access token used for unauthenticated public read operations via [`fetchPublicLastMessage`](#fetchpubliclastmessageroomalias) and [`fetchPublicPresence`](#fetchpublicpresenceuserid).

---

## Method Details

### .register(username, password)

Registers a new account on the homeserver using the `m.login.dummy` UIAA flow.

| Parameter | Type | Description |
|---|---|---|
| `username` | `string` | Desired username |
| `password` | `string` | Account password |

**Returns:** `Promise<{ accessToken: string, userId: string } | null>`

```js
const session = await mx.register('alice', 's3cr3t');
```

---

### .registerGuest()

Registers an anonymous guest account. No credentials required.

**Returns:** `Promise<{ accessToken: string, userId: string } | null>`

```js
const session = await mx.registerGuest();
```

---

### .login(username, password)

Authenticates with an existing account using `m.login.password`.

| Parameter | Type | Description |
|---|---|---|
| `username` | `string` | Account username |
| `password` | `string` | Account password |

**Returns:** `Promise<{ accessToken: string, userId: string } | null>`

```js
const session = await mx.login('alice', 's3cr3t');
```

---

### .logout()

Clears the local `accessToken` and `userId`. Does not call the homeserver logout endpoint.

**Returns:** `void`

---

### .deactivateAccount(password)

Permanently deactivates the current user's account via UIAA confirmation.

| Parameter | Type | Description |
|---|---|---|
| `password` | `string` | Current account password |

**Returns:** `Promise<boolean>`

---

### .changePassword(oldPassword, newPassword)

Changes the current user's password via UIAA confirmation.

| Parameter | Type | Description |
|---|---|---|
| `oldPassword` | `string` | Current password |
| `newPassword` | `string` | New password |

**Returns:** `Promise<boolean>`

---

### .getProfile([userId])

Fetches the display name and avatar URL for a user.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `userId` | `string` | `this.userId` | Target user ID |

**Returns:** `Promise<{ displayName: string | null, avatarUrl: string | null } | null>`

```js
const profile = await mx.getProfile('@alice:matrix.org');
console.log(profile.displayName);
```

---

### .setDisplayName(displayName)

Sets the display name for the current user.

| Parameter | Type | Description |
|---|---|---|
| `displayName` | `string` | New display name |

**Returns:** `Promise<boolean>`

---

### .setAvatarUrl(avatarUrl)

Sets the avatar for the current user.

| Parameter | Type | Description |
|---|---|---|
| `avatarUrl` | `string` | An `mxc://` URI |

**Returns:** `Promise<boolean>`

---

### .mxcToHttp(mxcUrl)

Converts an `mxc://` URI to a full HTTP download URL on the current homeserver.

| Parameter | Type | Description |
|---|---|---|
| `mxcUrl` | `string` | An `mxc://` URI |

**Returns:** `string | null` — `null` if the input is not a valid `mxc://` URI.

```js
const url = mx.mxcToHttp('mxc://matrix.org/abc123');
```

---

### .resolveRoomAlias(roomAlias)

Resolves a room alias to its internal room ID.

| Parameter | Type | Description |
|---|---|---|
| `roomAlias` | `string` | e.g. `#general:matrix.org` |

**Returns:** `Promise<string | null>`

```js
const roomId = await mx.resolveRoomAlias('#general:matrix.org');
```

---

### .joinRoom(roomIdOrAlias)

Joins a room by room ID or alias.

| Parameter | Type | Description |
|---|---|---|
| `roomIdOrAlias` | `string` | Room ID or alias |

**Returns:** `Promise<{ roomId: string } | null>`

---

### .createRoom(options)

Creates a new room. The `options` object is passed directly to the Matrix `POST /createRoom` endpoint.

| Parameter | Type | Description |
|---|---|---|
| `options` | `Object` | Matrix room creation options |

**Returns:** `Promise<{ roomId: string } | null>`

```js
const { roomId } = await mx.createRoom({ name: 'My Room', preset: 'public_chat' });
```

---

### .leaveRoom(roomId)

Leaves a room.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |

**Returns:** `Promise<boolean>`

---

### .inviteUser(roomId, userId)

Invites a user to a room.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `userId` | `string` | User to invite |

**Returns:** `Promise<boolean>`

---

### .kickUser(roomId, userId[, reason])

Kicks a user from a room.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `userId` | `string` | | User to kick |
| `reason` | `string` | `""` | Optional reason |

**Returns:** `Promise<boolean>`

---

### .banUser(roomId, userId[, reason])

Bans a user from a room.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `userId` | `string` | | User to ban |
| `reason` | `string` | `""` | Optional reason |

**Returns:** `Promise<boolean>`

---

### .unbanUser(roomId, userId)

Unbans a previously banned user.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `userId` | `string` | User to unban |

**Returns:** `Promise<boolean>`

---

### .getRoomMembers(roomId)

Returns an array of currently joined members for a room.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |

**Returns:** `Promise<Array<{ userId: string, displayName: string }> | null>`

---

### .sendMessage(roomId, message[, formattedBody])

Sends a plain text message. Optionally includes an HTML-formatted body.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `message` | `string` | | Plain text body |
| `formattedBody` | `string \| null` | `null` | HTML body (`org.matrix.custom.html`) |

**Returns:** `Promise<{ eventId: string } | null>`

```js
await mx.sendMessage(roomId, 'Hello!');
await mx.sendMessage(roomId, 'Hello!', '<b>Hello!</b>');
```

---

### .sendImage(roomId, url[, body[, info]])

Sends an image message.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `url` | `string` | | An `mxc://` URI |
| `body` | `string` | `"Image"` | Alt text / fallback label |
| `info` | `Object` | `{}` | Image metadata (e.g. `w`, `h`, `mimetype`) |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .editMessage(roomId, eventId, newMessage)

Edits a previously sent message using the `m.replace` relation.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `eventId` | `string` | Event ID of the original message |
| `newMessage` | `string` | Replacement text body |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .redactEvent(roomId, eventId[, reason])

Redacts (deletes) a room event.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `eventId` | `string` | | Event to redact |
| `reason` | `string` | `""` | Optional reason |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .reactToMessage(roomId, eventId, reaction)

Sends a reaction annotation (`m.annotation`) to an event.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `eventId` | `string` | Event to react to |
| `reaction` | `string` | Reaction key, typically an emoji |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .removeReaction(roomId, reactionEventId)

Removes a reaction by redacting its event.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `reactionEventId` | `string` | Event ID of the reaction |

**Returns:** `Promise<boolean>`

---

### .getMessages(roomId[, options])

Fetches a page of events from a room's timeline.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `options.from` | `string \| null` | `null` | Pagination token |
| `options.limit` | `number` | `50` | Maximum events to return |
| `options.dir` | `string` | `"b"` | Direction: `"b"` (backwards) or `"f"` (forwards) |

**Returns:** `Promise<{ messages: Object[], start: string, end: string } | null>`

```js
const page = await mx.getMessages(roomId, { limit: 30 });
for (const event of page.messages) { /* ... */ }

// Next page
const nextPage = await mx.getMessages(roomId, { from: page.end });
```

---

### .sendTyping(roomId, typing[, timeout])

Sends a typing notification to a room.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `typing` | `boolean` | | `true` to start, `false` to stop |
| `timeout` | `number` | `30000` | Active duration in ms |

**Returns:** `Promise<boolean>`

---

### .sendReadReceipt(roomId, eventId)

Marks an event as read by sending an `m.read` receipt.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `eventId` | `string` | Event ID to mark as read |

**Returns:** `Promise<boolean>`

---

### .sendStateEvent(roomId, type, content[, stateKey])

Sends a raw state event to a room.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `type` | `string` | | Matrix event type |
| `content` | `Object` | | Event content |
| `stateKey` | `string` | `""` | Optional state key |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .setRoomName(roomId, name)

Sets the name of a room (`m.room.name`).

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `name` | `string` | New room name |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .setRoomTopic(roomId, topic)

Sets the topic of a room (`m.room.topic`).

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `topic` | `string` | New room topic |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .setRoomAvatar(roomId, url)

Sets the avatar of a room (`m.room.avatar`).

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |
| `url` | `string` | An `mxc://` URI |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .getRoomState(roomId, type[, stateKey])

Fetches the content of a specific state event.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `type` | `string` | | Matrix state event type |
| `stateKey` | `string` | `""` | Optional state key |

**Returns:** `Promise<Object | null>`

---

### .getRoomName(roomId)

Gets the current name of a room.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |

**Returns:** `Promise<string | null>`

---

### .getRoomTopic(roomId)

Gets the current topic of a room.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |

**Returns:** `Promise<string | null>`

---

### .getRoomAllState(roomId)

Fetches a snapshot of common room state in a single call.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID |

**Returns:**
```
Promise<{
  name:           string | null,
  topic:          string | null,
  avatarUrl:      string | null,
  canonicalAlias: string | null,
  powerLevels:    Object | null,
  members: Array<{
    userId:      string,
    displayName: string | null,
    membership:  string
  }>
} | null>
```

---

### .uploadMedia(data, contentType[, filename])

Uploads binary data to the homeserver's media repository. Tries the `v3` endpoint, falls back to `r0`.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `data` | `Blob \| ArrayBuffer \| FormData` | | Media data |
| `contentType` | `string` | | MIME type, e.g. `"image/png"` |
| `filename` | `string` | `""` | Optional filename hint |

**Returns:** `Promise<{ contentUri: string } | null>` — `contentUri` is an `mxc://` URI.

```js
const { contentUri } = await mx.uploadMedia(blob, 'image/jpeg', 'photo.jpg');
await mx.sendImage(roomId, contentUri);
```

---

### .sync([since[, timeout]])

Performs a single `/sync` poll to retrieve new events.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `since` | `string \| null` | `null` | Sync token from a previous response |
| `timeout` | `number` | `0` | Long-poll timeout in ms |

**Returns:** `Promise<Object | null>` — Raw Matrix sync response.

```js
let since = null;
while (true) {
    const data = await mx.sync(since, 30000);
    mx.processSyncData(data);
    since = data?.next_batch ?? since;
}
```

---

### .processSyncData(data)

Processes a raw sync response and emits structured events for all new activity. Call this after each `.sync()` poll. Emits `roomJoin`, `roomLeave`, `invite`, `message`, `memberUpdate`, and `typing` — see [Event Details](#event-details) for payload shapes.

| Parameter | Type | Description |
|---|---|---|
| `data` | `Object` | Sync response returned by `.sync()` |

**Returns:** `void`

```js
let since = null;
while (true) {
    const data = await mx.sync(since, 30000);
    mx.processSyncData(data);
    since = data?.next_batch ?? since;
}
```

---

### .on(event, fn)

Registers a listener for a named event.

| Parameter | Type | Description |
|---|---|---|
| `event` | `string` | Event name |
| `fn` | `function` | Callback |

**Returns:** `this`

```js
mx.on('mention', (event) => alert(`Mentioned in ${event.room_id}`));
```

---

### .off(event[, fn])

Removes a listener, or all listeners for an event if `fn` is omitted.

| Parameter | Type | Description |
|---|---|---|
| `event` | `string` | Event name |
| `fn` | `function` *(optional)* | Specific listener to remove |

**Returns:** `this`

---

### .emit(event, ...args)

Emits a named event, invoking all registered listeners.

| Parameter | Type | Description |
|---|---|---|
| `event` | `string` | Event name |
| `...args` | `any` | Arguments forwarded to each listener |

**Returns:** `void`

---

### .isMention(event, userId)

Returns `true` if the event's body or formatted body contains a reference to `userId` and was not sent by `userId`.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |
| `userId` | `string` | User ID to check for |

**Returns:** `boolean`

---

### .getEventRelation(event)

Returns the `m.relates_to` object from an event's content, or `null`.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `Object | null`

---

### .isEditEvent(event)

Returns `true` if the event is a message edit (`m.replace` relation).

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `boolean`

---

### .isReactionEvent(event)

Returns `true` if the event is a reaction annotation (`m.annotation`).

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `boolean`

---

### .getEditedBody(event)

Extracts the text body from an edit event's `m.new_content`, falling back to the regular `body`.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `string | null`

---

### .getPrevContent(event)

Returns `unsigned.prev_content` from a state event, or `null`.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `Object | null`

---

### .getMembershipChange(event)

Interprets an `m.room.member` event and returns a structured summary of the change.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix `m.room.member` event |

**Returns:**
```
{
  type:            "join" | "rename" | "leave" | "kick" | "ban" | "unknown",
  userId:          string,
  displayName:     string | null,
  prevDisplayName: string | null,
  kicker:          string | null
} | null
```

Returns `null` for non-member events or no meaningful change.

---

### .isImageMessage(event)

Returns `true` if the event is a message of type `m.image`.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `boolean`

---

### .hasFormattedBody(event)

Returns `true` if the event has an `org.matrix.custom.html` formatted body.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `boolean`

---

### .extractLocalpart(userId)

Extracts the localpart from a Matrix user ID (the segment before the `:`).

| Parameter | Type | Description |
|---|---|---|
| `userId` | `string` | e.g. `@alice:matrix.org` |

**Returns:** `string` — The localpart (e.g. `alice`), or `"?"` on failure.

---

### .buildMentionHtml(text, getDisplayName)

Scans plain text for `@user:server` patterns and wraps each match in an anchor link pointing to `matrix.to`.

| Parameter | Type | Description |
|---|---|---|
| `text` | `string` | Plain text potentially containing Matrix user IDs |
| `getDisplayName` | `function(userId): string` | Callback to resolve a user ID to a display name |

**Returns:** `string | null` — HTML string with mentions linked, or `null` if no mentions were found.

```js
const html = mx.buildMentionHtml('cc @alice:matrix.org', (id) => members[id] ?? id);
```

---

### .sanitizeHtml(html)

Sanitizes an HTML string against a safe allowlist of tags. Matrix mention links (`<a href="https://matrix.to/#/@...">`) are converted to `<span class="mention">` elements.

Allowed tags: `a`, `b`, `strong`, `i`, `em`, `code`, `del`, `s`, `u`, `span`, `br`.

| Parameter | Type | Description |
|---|---|---|
| `html` | `string` | Raw HTML to sanitize |

**Returns:** `string`

> Requires `DOMParser` (browser environment). In Node, returns the input unchanged.

---

### .fetchPublicLastMessage(roomAlias)

Fetches the most recent text message from a public room without authentication. Requires [`publicReadToken`](#publicreadtoken) to be set.

| Parameter | Type | Description |
|---|---|---|
| `roomAlias` | `string` | e.g. `#general:matrix.org` |

**Returns:** `Promise<{ sender: string, body: string, timestamp: number } | null>`

```js
const mx = new MxjsClient({ homeserver: 'https://matrix.org', publicReadToken: 'tok' });
const msg = await mx.fetchPublicLastMessage('#general:matrix.org');
console.log(`${msg.sender}: ${msg.body}`);
```

---

### .fetchPublicPresence(userId)

Fetches the presence status for a user without authentication. Requires [`publicReadToken`](#publicreadtoken) to be set.

| Parameter | Type | Description |
|---|---|---|
| `userId` | `string` | e.g. `@alice:matrix.org` |

**Returns:** `Promise<{ presence: string, lastActive: number } | null>`

---

### .api(endpoint[, method[, body[, accessToken]]])

Makes a raw request to the Matrix Client-Server API at `/_matrix/client/r0`.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `endpoint` | `string` | | Path relative to `/_matrix/client/r0` |
| `method` | `string` | `"GET"` | HTTP method |
| `body` | `Object \| null` | `null` | Request body, serialized as JSON |
| `accessToken` | `string \| null` | `this.accessToken` | Bearer token override |

**Returns:** `Promise<Object>` — Parsed JSON response.

Automatically retries once if the server returns `M_LIMIT_EXCEEDED`, waiting the requested `retry_after_ms`.

---

## Event Details

### Event: connect

Emitted after a successful `login`, `register`, or `registerGuest` call.

| Property | Type | Description |
|---|---|---|
| `accessToken` | `string` | The session access token |
| `userId` | `string` | The authenticated user's ID |

```js
mx.on('connect', ({ userId }) => {
    console.log(`Signed in as ${userId}`);
});
```

---

### Event: disconnect

Emitted after `logout` is called. No payload.

```js
mx.on('disconnect', () => {
    console.log('Signed out');
});
```

---

### Event: edit

Emitted by `processSyncData` when a message is edited.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `edits` | `string` | Event ID of the original message being edited |
| `newBody` | `string` | The new text content |
| `event` | `Object` | The raw Matrix edit event |

```js
mx.on('edit', ({ roomId, edits, newBody }) => {
    console.log(`Message ${edits} edited to: ${newBody}`);
});
```

---

### Event: invite

Emitted by `processSyncData` when the client receives a room invitation.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room the invite is for |

```js
mx.on('invite', ({ roomId }) => {
    console.log(`Invited to ${roomId}`);
});
```

---

### Event: memberUpdate

Emitted by `processSyncData` for each `m.room.member` event in the timeline. `change` is the object returned by `getMembershipChange`. This includes joins, leaves, kicks, bans, and display name changes. For display name changes, `change.type` will be `"rename"`.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `change` | `Object` | Parsed membership change (see `getMembershipChange`) |
| `event` | `Object` | The raw Matrix event |

```js
mx.on('memberUpdate', ({ roomId, change }) => {
    if (change.type === 'rename') {
        console.log(`${change.userId} changed name from ${change.prevDisplayName} to ${change.displayName}`);
    } else {
        console.log(`[${roomId}] ${change.userId} — ${change.type}`);
    }
});
```

---

### Event: mention

Emitted when an incoming message event contains a reference to the current user's ID. This event is not emitted by `processSyncData`; emit it manually inside your `message` handler using `isMention`.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room the mention occurred in |
| `event` | `Object` | The raw Matrix room event |
| `room` | `Object` | The room object from your local state |

```js
mx.on('message', ({ roomId, event }) => {
    if (mx.isMention(event, mx.userId)) {
        mx.emit('mention', { roomId, event, room: myRooms.get(roomId) });
    }
});

mx.on('mention', ({ roomId, event }) => {
    console.log(`Mentioned in ${roomId} by ${event.sender}`);
});
```

---

### Event: message

Emitted by `processSyncData` for each new (non-edit) `m.room.message` event.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `event` | `Object` | The raw Matrix message event |

```js
mx.on('message', ({ roomId, event }) => {
    console.log(`[${roomId}] ${event.sender}: ${event.content.body}`);
});
```

---

### Event: redaction

Emitted by `processSyncData` when an event is redacted (deleted).

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `redacts` | `string` | Event ID of the message that was deleted |
| `event` | `Object` | The raw Matrix redaction event |

```js
mx.on('redaction', ({ roomId, redacts, event }) => {
    console.log(`Message ${redacts} was deleted by ${event.sender}`);
});
```

---

### Event: roomAvatarChange

Emitted by `processSyncData` when a room's avatar is changed.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `avatarUrl` | `string\|null` | New avatar URL (mxc:// URI) |
| `prevAvatarUrl` | `string\|null` | Previous avatar URL |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on('roomAvatarChange', ({ roomId, avatarUrl }) => {
    console.log(`Room avatar changed to ${avatarUrl}`);
});
```

---

### Event: roomJoin

Emitted by `processSyncData` the first time a room appears in a sync response (i.e. the client joined a new room or this is the first sync).

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the newly joined room |

```js
mx.on('roomJoin', ({ roomId }) => {
    console.log(`Joined room ${roomId}`);
});
```

---

### Event: roomLeave

Emitted by `processSyncData` when the client has left or been removed from a room.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room that was left |

```js
mx.on('roomLeave', ({ roomId }) => {
    console.log(`Left room ${roomId}`);
});
```

---

### Event: roomNameChange

Emitted by `processSyncData` when a room's name is changed.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `name` | `string\|null` | New room name |
| `prevName` | `string\|null` | Previous room name |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on('roomNameChange', ({ roomId, name, prevName }) => {
    console.log(`Room name changed from "${prevName}" to "${name}"`);
});
```

---

### Event: roomTopicChange

Emitted by `processSyncData` when a room's topic is changed.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `topic` | `string\|null` | New room topic |
| `prevTopic` | `string\|null` | Previous room topic |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on('roomTopicChange', ({ roomId, topic, prevTopic }) => {
    console.log(`Room topic changed from "${prevTopic}" to "${topic}"`);
});
```

---

### Event: typing

Emitted by `processSyncData` whenever the set of typing users in a room changes.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `userIds` | `string[]` | Current list of typing user IDs |

```js
mx.on('typing', ({ roomId, userIds }) => {
    console.log(`${userIds.join(', ')} is typing in ${roomId}`);
});
```
## Testing

Check Matrix Client-Server API coverage:

```bash
npm test
```

Runs all Matrix Client-Server API endpoint tests against a live homeserver (chat.ruv.wtf). Test accounts are created and removed automatically — no configuration needed. Results are saved to [test/api-coverage-report.txt](test/api-coverage-report.txt).

---

## License

MIT
