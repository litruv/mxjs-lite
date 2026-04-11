# Profile API

User profile and presence methods.

## Overview

This module provides 15 methods.

## Common Usage

```javascript
// Update user profile
await client.setDisplayName('John Doe');
await client.setAvatarUrl(avatarMxcUrl);
```

## Methods

- [`adminWhois()`](#adminwhois)
- [`deleteAvatarUrl()`](#deleteavatarurl)
- [`deleteDisplayName()`](#deletedisplayname)
- [`fetchPublicPresence()`](#fetchpublicpresence)
- [`getAvatarUrl()`](#getavatarurl)
- [`getDisplayName()`](#getdisplayname)
- [`getPresence()`](#getpresence)
- [`getProfile()`](#getprofile)
- [`getProfileInfo()`](#getprofileinfo)
- [`getTimeZone()`](#gettimezone)
- [`reportUser()`](#reportuser)
- [`setAvatarUrl()`](#setavatarurl)
- [`setDisplayName()`](#setdisplayname)
- [`setPresence()`](#setpresence)
- [`setTimeZone()`](#settimezone)

---

## adminWhois()

**Signature:** `async adminWhois(userId)`

Gets information about a specific user from the server administrator perspective. Requires server admin privileges.

**Parameters:**

- `userId` **{string}**

**Returns:** `Promise<Object|null>` - User info object, or `null` on failure.

---

## deleteAvatarUrl()

**Signature:** `async deleteAvatarUrl()`

Deletes the avatar URL for the current user (sets it to empty).

**Parameters:** None

**Returns:** `Promise<boolean>` - `true` on success.

---

## deleteDisplayName()

**Signature:** `async deleteDisplayName()`

Deletes the display name for the current user (sets it to empty).

**Parameters:** None

**Returns:** `Promise<boolean>` - `true` on success.

---

## fetchPublicPresence()

**Signature:** `async fetchPublicPresence(userId)`

Fetches the presence status of a user using the public read token.

**Parameters:**

- `userId` **{string}**

**Returns:** `Promise<{presence: string, lastActive: number` - |null>}

---

## getAvatarUrl()

**Signature:** `async getAvatarUrl(userId = this.userId)`

Gets the avatar URL for a specific user.

**Parameters:**

- `userId` **{string}** _(optional)_ - Default: `this.userId]` - The user ID to look up.

**Returns:** `Promise<string|null>` - The avatar URL (mxc://), or null if not set or on error.

---

## getDisplayName()

**Signature:** `async getDisplayName(userId = this.userId)`

Gets the display name for a specific user.

**Parameters:**

- `userId` **{string}** _(optional)_ - Default: `this.userId]` - The user ID to look up.

**Returns:** `Promise<string|null>` - The display name, or null if not set or on error.

---

## getPresence()

**Signature:** `async getPresence(userId)`

Gets the presence status of a user.

**Parameters:**

- `userId` **{string}** - The user ID to check.

**Returns:** `Promise<{presence: string, lastActive: number, currentlyActive: boolean, statusMsg: string|null` - |null>}

---

## getProfile()

**Signature:** `async getProfile(userId = this.userId)`

User profile and presence methods.

**Parameters:**

- `Base` **{T}**
- `userId` **{string}** _(optional)_ - Default: `this.userId]` - The user ID to look up.

**Returns:** `Promise<{displayName: string|null, avatarUrl: string|null` - |null>}

---

## getProfileInfo()

**Signature:** `async getProfileInfo()`

Gets the current logged-in user's profile information.

**Parameters:** None

**Returns:** `Promise<{user_id: string, displayname: string|null, avatar_url: string|null` - |null>}

---

## getTimeZone()

**Signature:** `async getTimeZone(userId = this.userId)`

Gets the IANA time zone for a user (MSC4175). Returns the value of the `m.tz` profile field, e.g. `"Europe/Paris"`. Returns `null` if the field is not set or on failure.

**Parameters:**

- `userId` **{string}** _(optional)_ - Default: `this.userId]`

**Returns:** `Promise<string|null>`

---

## reportUser()

**Signature:** `async reportUser(userId, reason = '', score = 0)`

Reports a user to the homeserver moderators.

**Parameters:**

- `userId` **{string}**
- `reason` **{string}** _(optional)_ - Default: `'']` - Human-readable reason for the report.
- `score` **{number}** _(optional)_ - Default: `0]` - Severity score between -100 (most offensive) and 0 (inoffensive).

**Returns:** `Promise<boolean>` - `true` on success.

---

## setAvatarUrl()

**Signature:** `async setAvatarUrl(avatarUrl)`

Sets the avatar URL for the current user.

**Parameters:**

- `avatarUrl` **{string}** - An `mxc://` URI.

**Returns:** `Promise<boolean>` - `true` on success.

---

## setDisplayName()

**Signature:** `async setDisplayName(displayName)`

Sets the display name for the current user.

**Parameters:**

- `displayName` **{string}**

**Returns:** `Promise<boolean>` - `true` on success.

---

## setPresence()

**Signature:** `async setPresence(presence, statusMsg = null)`

Sets the presence status for the current user.

**Parameters:**

- `presence` **{string}** - The presence state: "online", "offline", or "unavailable".
- `statusMsg` **{string|null}** _(optional)_ - Default: `null]` - Optional status message.

**Returns:** `Promise<boolean>` - `true` on success.

---

## setTimeZone()

**Signature:** `async setTimeZone(tz)`

Sets the IANA time zone for the current user (MSC4175). The value must be a valid IANA Time Zone Database name (e.g. `"America/New_York"`). Pass `null` to clear the field.

**Parameters:**

- `tz` **{string|null}** - IANA time zone name, or `null` to remove the field.

**Returns:** `Promise<boolean>` - `true` on success.

