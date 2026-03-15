# mxjs-lite

[![npm version](https://img.shields.io/npm/v/@litruv/mxjs-lite.svg)](https://www.npmjs.com/package/@litruv/mxjs-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![API Coverage](https://img.shields.io/badge/API%20coverage-78.87%25%20(112%2F142)-orange.svg)](test/api-coverage-report.txt)

Covers 100% of the non E2EE Matrix API endpoints!

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
import MxjsClient, { ClientEvents } from '@litruv/mxjs-lite';

const mx = new MxjsClient({ homeserver: 'https://matrix.org' });
await mx.login('alice', 's3cr3t');
await mx.joinRoom('#general:matrix.org');

mx.on(ClientEvents.Ready, () => console.log('Ready!'));
mx.on(ClientEvents.MessageCreate, ({ roomId, event }) => {
    console.log(`[${roomId}] ${event.sender}: ${event.content?.body}`);
});

mx.startSync();
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
| [`.startSync()`](#startsynctimeout-since) |
| [`.stopSync()`](#stopsync) |

### Event System

| Method |
|---|
| [`.on()`](#onevent-fn) |
| [`.off()`](#offevent-fn) |
| [`.emit()`](#emitevent-args) |
| [`ClientEvents`](#clientevents) |

### Events

[accountDataUpdate](#event-accountdataupdate)  
[canonicalAliasUpdate](#event-canonicaliasupdate)  
[connect](#event-connect)  
[disconnect](#event-disconnect)  
[inviteReceive](#event-invitereceive)  
[memberUpdate](#event-memberupdate)  
[mention](#event-mention)  
[messageCreate](#event-messagecreate)  
[messageDelete](#event-messagedelete)  
[messageUpdate](#event-messageupdate)  
[powerLevelUpdate](#event-powerlevelupdate)  
[presenceUpdate](#event-presenceupdate)  
[reactionAdd](#event-reactionadd)  
[reactionRemove](#event-reactionremove)  
[ready](#event-ready)  
[receiptUpdate](#event-receiptupdate)  
[roomAccountDataUpdate](#event-roomaccountdataupdate)  
[roomAvatarUpdate](#event-roomavatarupdate)  
[roomJoin](#event-roomjoin)  
[roomLeave](#event-roomleave)  
[roomNameUpdate](#event-roomnameupdate)  
[roomTopicUpdate](#event-roomtopicupdate)  
[spaceChildAdd](#event-spacechildadd)  
[spaceChildRemove](#event-spacechildremove)  
[syncComplete](#event-synccomplete)  
[syncError](#event-syncerror)  
[typingStart](#event-typingstart)  
[threadReply](#event-threadreply)  
[typingEnd](#event-typingend)

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

### Spaces (MSC1772)

| Method |
|---|
| [`.createSpace()`](#createspacename-options) |
| [`.addSpaceChild()`](#addspacechildspaceid-childroomid-via-options) |
| [`.removeSpaceChild()`](#removespacechildspaceid-childroomid) |
| [`.setSpaceParent()`](#setspaceparentroomid-spaceid-via-canonical) |
| [`.removeSpaceParent()`](#removespaceparentroomid-spaceid) |
| [`.getSpaceChildren()`](#getspacechildrenspaceid) |
| [`.isSpaceRoom()`](#isspaceroomcreatecontent) |

### Threads (MSC3440)

| Method |
|---|
| [`.sendThreadReply()`](#sendthreadreplyrooomid-threadrootid-message-formattedbody) |
| [`.sendThreadReplyTo()`](#sendthreadreplytorooomid-threadrootid-replytoeventid-message-formattedbody) |
| [`.getThreadEvents()`](#getthreadeventssroomid-threadrootid-options) |
| [`.getRoomThreads()`](#getroomthreadsroomid-options) |
| [`.isThreadEvent()`](#isthreadeventevent) |
| [`.getThreadRoot()`](#getthreadrootevent) |
| [`.isThreadFallback()`](#isthreadfallbackevent) |

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

Processes a raw sync response and emits structured events for all new activity. Called automatically by [`startSync()`](#startsynctimeout-since), or call manually after each `.sync()` poll. Emits `roomJoin`, `roomLeave`, `inviteReceive`, `messageCreate`, `messageUpdate`, `messageDelete`, `reactionAdd`, `reactionRemove`, `memberUpdate`, `typingStart`, `typingEnd`, `receiptUpdate`, `roomNameUpdate`, `roomTopicUpdate`, `roomAvatarUpdate`, `powerLevelUpdate`, `canonicalAliasUpdate`, `presenceUpdate`, `accountDataUpdate`, `roomAccountDataUpdate`, `spaceChildAdd`, `spaceChildRemove`, `threadReply` — see [Event Details](#event-details) for payload shapes.

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

> Prefer [`startSync()`](#startsynctimeout-since) for automatic loop management.

---

### .startSync([timeout[, since]])

Starts the automatic long-poll sync loop. On first call, performs an initial drain sync (timeout=0) to consume existing events and populate rooms, then emits [`ready`](#event-ready). Subsequent polls use `timeout` to keep the connection open until the server has new data.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `timeout` | `number` | `30000` | Long-poll timeout per request in ms |
| `since` | `string\|null` | `null` | Optional initial sync token. If provided, the drain sync is skipped and polling begins immediately from this token. |

**Returns:** `Promise<void>`

```js
await mx.login('alice', 's3cr3t');
mx.on(ClientEvents.Ready, () => console.log('Ready!'));
mx.startSync(30000);
```

---

### .stopSync()

Stops the automatic sync loop. The current in-flight request will complete before the loop exits.

**Returns:** `void`

```js
mx.stopSync();
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

### ClientEvents

A string constants object for all events emitted by the client. Use these with `.on()` instead of raw strings to avoid typos and benefit from editor autocompletion.

```js
import MxjsClient, { ClientEvents } from '@litruv/mxjs-lite';

mx.on(ClientEvents.MessageCreate, ({ roomId, event }) => { /* ... */ });
mx.on(ClientEvents.Ready, () => { /* ... */ });
```

| Constant | Value |
|---|---|
| `ClientEvents.Connect` | `'connect'` |
| `ClientEvents.Disconnect` | `'disconnect'` |
| `ClientEvents.Ready` | `'ready'` |
| `ClientEvents.MessageCreate` | `'messageCreate'` |
| `ClientEvents.MessageUpdate` | `'messageUpdate'` |
| `ClientEvents.MessageDelete` | `'messageDelete'` |
| `ClientEvents.ReactionAdd` | `'reactionAdd'` |
| `ClientEvents.ReactionRemove` | `'reactionRemove'` |
| `ClientEvents.RoomJoin` | `'roomJoin'` |
| `ClientEvents.RoomLeave` | `'roomLeave'` |
| `ClientEvents.InviteReceive` | `'inviteReceive'` |
| `ClientEvents.MemberUpdate` | `'memberUpdate'` |
| `ClientEvents.RoomNameUpdate` | `'roomNameUpdate'` |
| `ClientEvents.RoomTopicUpdate` | `'roomTopicUpdate'` |
| `ClientEvents.RoomAvatarUpdate` | `'roomAvatarUpdate'` |
| `ClientEvents.TypingStart` | `'typingStart'` |
| `ClientEvents.TypingEnd` | `'typingEnd'` |
| `ClientEvents.PresenceUpdate` | `'presenceUpdate'` |
| `ClientEvents.ReceiptUpdate` | `'receiptUpdate'` |
| `ClientEvents.AccountDataUpdate` | `'accountDataUpdate'` |
| `ClientEvents.RoomAccountDataUpdate` | `'roomAccountDataUpdate'` |
| `ClientEvents.SyncComplete` | `'syncComplete'` |
| `ClientEvents.SyncError` | `'syncError'` |
| `ClientEvents.PowerLevelUpdate` | `'powerLevelUpdate'` |
| `ClientEvents.CanonicalAliasUpdate` | `'canonicalAliasUpdate'` |
| `ClientEvents.SpaceChildAdd` | `'spaceChildAdd'` |
| `ClientEvents.SpaceChildRemove` | `'spaceChildRemove'` |
| `ClientEvents.ThreadReply` | `'threadReply'` |

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

### .createSpace(name[, options])

Creates a new space room. Sets `creation_content.type` to `m.space` and defaults `events_default` power level to `100` (preventing spam from non-admin members).

| Parameter | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | | Display name for the space |
| `options` | `Object` | `{}` | Additional room creation options (e.g. `topic`, `visibility`, `preset`) |

**Returns:** `Promise<{ roomId: string } | null>`

```js
const { roomId } = await mx.createSpace('My Community', { visibility: 'public' });
```

---

### .addSpaceChild(spaceId, childRoomId, via[, options])

Adds a child room or subspace to a space by sending an `m.space.child` state event.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `spaceId` | `string` | | Room ID of the space |
| `childRoomId` | `string` | | Room ID of the child to add |
| `via` | `string[]` | | Candidate servers for joining the child room |
| `options.order` | `string` | | Lexicographic sort key for siblings |
| `options.suggested` | `boolean` | | Whether to mark the child as suggested |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .removeSpaceChild(spaceId, childRoomId)

Removes a child from a space by sending an empty `m.space.child` state event.

| Parameter | Type | Description |
|---|---|---|
| `spaceId` | `string` | Room ID of the space |
| `childRoomId` | `string` | Room ID of the child to remove |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .setSpaceParent(roomId, spaceId, via[, canonical])

Declares a room's parent space via an `m.space.parent` state event.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room that will gain the parent link |
| `spaceId` | `string` | | Room ID of the parent space |
| `via` | `string[]` | | Candidate servers for joining the parent |
| `canonical` | `boolean` | `false` | Whether this is the primary parent for the room |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .removeSpaceParent(roomId, spaceId)

Removes a parent declaration by sending an empty `m.space.parent` state event.

| Parameter | Type | Description |
|---|---|---|
| `roomId` | `string` | The child room |
| `spaceId` | `string` | Room ID of the parent to remove |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .getSpaceChildren(spaceId)

Returns all current children of a space. Fetches full room state and filters for valid `m.space.child` events (those with a non-empty `via` array).

| Parameter | Type | Description |
|---|---|---|
| `spaceId` | `string` | Room ID of the space |

**Returns:**
```
Promise<Array<{
  roomId:    string,
  via:       string[],
  order:     string | null,
  suggested: boolean
}> | null>
```

```js
const children = await mx.getSpaceChildren(spaceRoomId);
for (const { roomId, suggested } of children) {
    console.log(roomId, suggested ? '(suggested)' : '');
}
```

---

### .isSpaceRoom(createContent)

Returns `true` if the given `m.room.create` event content represents a space room.

| Parameter | Type | Description |
|---|---|---|
| `createContent` | `Object` | Content of the room's `m.room.create` event |

**Returns:** `boolean`

---

### .sendThreadReply(roomId, threadRootId, message[, formattedBody])

Sends a reply into a thread. Includes a fallback `m.in_reply_to` pointing to the thread root for clients that do not support threads (per MSC3440 backwards-compatibility).

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `threadRootId` | `string` | | Event ID of the thread root message |
| `message` | `string` | | Plain text body |
| `formattedBody` | `string\|null` | `null` | Optional HTML-formatted body |

**Returns:** `Promise<{ eventId: string } | null>`

```js
await mx.sendThreadReply(roomId, rootEventId, 'My reply');
```

---

### .sendThreadReplyTo(roomId, threadRootId, replyToEventId, message[, formattedBody])

Sends a rich reply within a thread, targeting a specific event. Sets `is_falling_back: false` so thread-aware clients render it as a genuine reply rather than a plain thread message.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `threadRootId` | `string` | | Event ID of the thread root |
| `replyToEventId` | `string` | | Event ID being directly replied to |
| `message` | `string` | | Plain text body |
| `formattedBody` | `string\|null` | `null` | Optional HTML-formatted body |

**Returns:** `Promise<{ eventId: string } | null>`

---

### .getThreadEvents(roomId, threadRootId[, options])

Fetches events belonging to a thread via the Matrix `/relations` API.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | Room ID |
| `threadRootId` | `string` | | Event ID of the thread root |
| `options.from` | `string` | | Pagination token |
| `options.limit` | `number` | `50` | Maximum events to return |
| `options.dir` | `string` | `"b"` | Direction: `"b"` or `"f"` |

**Returns:** `Promise<{ events: Object[], nextBatch: string | null } | null>`

```js
const thread = await mx.getThreadEvents(roomId, rootEventId, { limit: 30 });
for (const event of thread.events) { /* ... */ }
```

---

### .isThreadEvent(event)

Returns `true` if the event is a thread reply (`rel_type` of `m.thread`).

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `boolean`

---

### .getThreadRoot(event)

Returns the event ID of the thread root this event belongs to, or `null`.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `string | null`

---

### .getRoomThreads(roomId[, options])

Fetches all thread root events in a room via `GET /_matrix/client/v1/rooms/{roomId}/threads` (MSC3856 / Matrix v1.4). Returns paginated thread roots.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `roomId` | `string` | | The room to list threads from |
| `options.include` | `'all'\|'participated'` | `'all'` | `'all'` returns every thread; `'participated'` returns only threads the authenticated user contributed to |
| `options.from` | `string` | | Pagination token from a previous `nextBatch` |
| `options.limit` | `number` | | Maximum number of thread roots to return |

**Returns:** `Promise<{threads: Object[], nextBatch: string|null}|null>`

---

### .isThreadFallback(event)

Returns `true` if the `m.in_reply_to` on a thread event is a backwards-compatibility fallback (`is_falling_back: true`) rather than a genuine reply.

| Parameter | Type | Description |
|---|---|---|
| `event` | `Object` | A Matrix room event |

**Returns:** `boolean`

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

### Event: messageUpdate

Emitted by `processSyncData` when a message is edited.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `edits` | `string` | Event ID of the original message being edited |
| `newBody` | `string` | The new text content |
| `event` | `Object` | The raw Matrix edit event |

```js
mx.on(ClientEvents.MessageUpdate, ({ roomId, edits, newBody }) => {
    console.log(`Message ${edits} edited to: ${newBody}`);
});
```

---

### Event: inviteReceive

Emitted by `processSyncData` when the client receives a room invitation.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room the invite is for |

```js
mx.on(ClientEvents.InviteReceive, ({ roomId }) => {
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
mx.on(ClientEvents.MemberUpdate, ({ roomId, change }) => {
    if (change.type === 'rename') {
        console.log(`${change.userId} changed name from ${change.prevDisplayName} to ${change.displayName}`);
    } else {
        console.log(`[${roomId}] ${change.userId} — ${change.type}`);
    }
});
```

---

### Event: mention

Emitted when an incoming message event contains a reference to the current user's ID. This event is not emitted by `processSyncData`; emit it manually inside your `messageCreate` handler using `isMention`.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room the mention occurred in |
| `event` | `Object` | The raw Matrix room event |
| `room` | `Object` | The room object from your local state |

```js
mx.on(ClientEvents.MessageCreate, ({ roomId, event }) => {
    if (mx.isMention(event, mx.userId)) {
        mx.emit('mention', { roomId, event, room: myRooms.get(roomId) });
    }
});

mx.on('mention', ({ roomId, event }) => {
    console.log(`Mentioned in ${roomId} by ${event.sender}`);
});
```

---

### Event: messageCreate

Emitted by `processSyncData` for each new (non-edit) `m.room.message` event.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `event` | `Object` | The raw Matrix message event |

```js
mx.on(ClientEvents.MessageCreate, ({ roomId, event }) => {
    console.log(`[${roomId}] ${event.sender}: ${event.content.body}`);
});
```

---

### Event: messageDelete

Emitted by `processSyncData` when an event is redacted (deleted).

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `redacts` | `string` | Event ID of the message that was deleted |
| `event` | `Object` | The raw Matrix redaction event |

```js
mx.on(ClientEvents.MessageDelete, ({ roomId, redacts, event }) => {
    console.log(`Message ${redacts} was deleted by ${event.sender}`);
});
```

---

### Event: roomAvatarUpdate

Emitted by `processSyncData` when a room's avatar is changed.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `avatarUrl` | `string\|null` | New avatar URL (mxc:// URI) |
| `prevAvatarUrl` | `string\|null` | Previous avatar URL |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on(ClientEvents.RoomAvatarUpdate, ({ roomId, avatarUrl }) => {
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
mx.on(ClientEvents.RoomJoin, ({ roomId }) => {
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
mx.on(ClientEvents.RoomLeave, ({ roomId }) => {
    console.log(`Left room ${roomId}`);
});
```

---

### Event: roomNameUpdate

Emitted by `processSyncData` when a room's name is changed.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `name` | `string\|null` | New room name |
| `prevName` | `string\|null` | Previous room name |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on(ClientEvents.RoomNameUpdate, ({ roomId, name, prevName }) => {
    console.log(`Room name changed from "${prevName}" to "${name}"`);
});
```

---

### Event: roomTopicUpdate

Emitted by `processSyncData` when a room's topic is changed.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `topic` | `string\|null` | New room topic |
| `prevTopic` | `string\|null` | Previous room topic |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on(ClientEvents.RoomTopicUpdate, ({ roomId, topic, prevTopic }) => {
    console.log(`Room topic changed from "${prevTopic}" to "${topic}"`);
});
```

---

### Event: typingStart

Emitted by `processSyncData` when users begin typing in a room. `userIds` contains only the users who *started* typing this cycle, not the full typing set.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `userIds` | `string[]` | User IDs who started typing |

```js
mx.on(ClientEvents.TypingStart, ({ roomId, userIds }) => {
    console.log(`${userIds.join(', ')} started typing in ${roomId}`);
});
```

---

### Event: typingEnd

Emitted by `processSyncData` when users stop typing in a room. `userIds` contains only the users who *stopped* typing this cycle.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `userIds` | `string[]` | User IDs who stopped typing |

```js
mx.on(ClientEvents.TypingEnd, ({ roomId, userIds }) => {
    console.log(`${userIds.join(', ')} stopped typing in ${roomId}`);
});
```

---

### Event: ready

Emitted by [`startSync()`](#startsynctimeout-since) once after the initial drain sync completes. All rooms the client belongs to will have already emitted `roomJoin` by the time `ready` fires. No payload.

```js
mx.on(ClientEvents.Ready, () => {
    console.log('Sync ready, rooms populated');
});
```

---

### Event: reactionAdd

Emitted by `processSyncData` when a reaction annotation is added to a message.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `reacts` | `string` | Event ID of the message that was reacted to |
| `key` | `string` | Reaction key, typically an emoji |
| `event` | `Object` | The raw Matrix reaction event |

```js
mx.on(ClientEvents.ReactionAdd, ({ roomId, reacts, key }) => {
    console.log(`Reaction ${key} added to ${reacts} in ${roomId}`);
});
```

---

### Event: reactionRemove

Emitted by `processSyncData` when a reaction is removed (the reaction event is redacted). The library tracks seen reaction event IDs automatically so this fires instead of `messageDelete` for reaction removals.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `reacts` | `string` | Event ID of the message the reaction was on |
| `key` | `string` | The reaction key that was removed |
| `event` | `Object` | The raw Matrix redaction event |

```js
mx.on(ClientEvents.ReactionRemove, ({ roomId, reacts, key }) => {
    console.log(`Reaction ${key} removed from ${reacts} in ${roomId}`);
});
```

---

### Event: presenceUpdate

Emitted by `processSyncData` when a presence update is received for any user.

| Property | Type | Description |
|---|---|---|
| `userId` | `string` | The user whose presence changed |
| `presence` | `string\|null` | e.g. `"online"`, `"offline"`, `"unavailable"` |
| `lastActiveAgo` | `number\|null` | Milliseconds since last active |
| `statusMsg` | `string\|null` | Optional status message |
| `currentlyActive` | `boolean\|null` | Whether the user is currently active |

```js
mx.on(ClientEvents.PresenceUpdate, ({ userId, presence }) => {
    console.log(`${userId} is now ${presence}`);
});
```

---

### Event: receiptUpdate

Emitted by `processSyncData` when read receipts arrive for a room.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `receipts` | `Array<{ eventId: string, read: string[] }>` | Array of receipt entries |

```js
mx.on(ClientEvents.ReceiptUpdate, ({ roomId, receipts }) => {
    for (const { eventId, read } of receipts) {
        console.log(`${eventId} read by: ${read.join(', ')}`);
    }
});
```

---

### Event: syncComplete

Emitted by [`startSync()`](#startsynctimeout-since) after every successful long-poll cycle. No payload.

```js
mx.on(ClientEvents.SyncComplete, () => {
    console.log('Sync cycle complete');
});
```

---

### Event: syncError

Emitted by [`startSync()`](#startsynctimeout-since) when a sync request fails. The loop retries after 5 seconds.

| Property | Type | Description |
|---|---|---|
| `error` | `Error` | The caught error |

```js
mx.on(ClientEvents.SyncError, ({ error }) => {
    console.error('Sync failed:', error);
});
```

---

### Event: powerLevelUpdate

Emitted by `processSyncData` when a room's power levels change (`m.room.power_levels`).

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `content` | `Object` | New power levels content |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on(ClientEvents.PowerLevelUpdate, ({ roomId, content }) => {
    console.log(`Power levels updated in ${roomId}`);
});
```

---

### Event: canonicalAliasUpdate

Emitted by `processSyncData` when a room's canonical alias changes (`m.room.canonical_alias`).

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `alias` | `string\|null` | New canonical alias, or `null` if removed |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on(ClientEvents.CanonicalAliasUpdate, ({ roomId, alias }) => {
    console.log(`Room ${roomId} canonical alias is now ${alias}`);
});
```

---

### Event: accountDataUpdate

Emitted by `processSyncData` when a global account data event is received.

| Property | Type | Description |
|---|---|---|
| `type` | `string` | Matrix event type, e.g. `"m.push_rules"` |
| `content` | `Object` | Event content |

```js
mx.on(ClientEvents.AccountDataUpdate, ({ type, content }) => {
    console.log(`Global account data updated: ${type}`);
});
```

---

### Event: roomAccountDataUpdate

Emitted by `processSyncData` when a room-level account data event is received.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `type` | `string` | Matrix event type, e.g. `"m.fully_read"` |
| `content` | `Object` | Event content |

```js
mx.on(ClientEvents.RoomAccountDataUpdate, ({ roomId, type, content }) => {
    console.log(`Room ${roomId} account data updated: ${type}`);
});
```

---

### Event: spaceChildAdd

Emitted by `processSyncData` when a child room is added or updated in a space (`m.space.child` state event with a valid `via` array arrives in the timeline).

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID of the space |
| `childRoomId` | `string` | Room ID of the added/updated child |
| `via` | `string[]` | Candidate servers for joining the child |
| `order` | `string\|null` | Sort order hint, or `null` if unset |
| `suggested` | `boolean` | Whether the child is marked as suggested |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on(ClientEvents.SpaceChildAdd, ({ roomId, childRoomId, suggested }) => {
    console.log(`Space ${roomId} gained child ${childRoomId}${suggested ? ' (suggested)' : ''}`);
});
```

---

### Event: spaceChildRemove

Emitted by `processSyncData` when a child room is removed from a space (`m.space.child` with empty or missing `via`).

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | Room ID of the space |
| `childRoomId` | `string` | Room ID of the removed child |
| `event` | `Object` | The raw Matrix state event |

```js
mx.on(ClientEvents.SpaceChildRemove, ({ roomId, childRoomId }) => {
    console.log(`Space ${roomId} removed child ${childRoomId}`);
});
```

---

### Event: threadReply

Emitted by `processSyncData` for every `m.room.message` that carries a `rel_type` of `m.thread`. Also fires as `messageCreate` simultaneously — listen to `threadReply` when you want thread-specific handling.

| Property | Type | Description |
|---|---|---|
| `roomId` | `string` | ID of the room |
| `threadRootId` | `string` | Event ID of the thread root message |
| `event` | `Object` | The raw Matrix message event |

```js
mx.on(ClientEvents.ThreadReply, ({ roomId, threadRootId, event }) => {
    console.log(`[${roomId}] thread reply to ${threadRootId}: ${event.content?.body}`);
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
