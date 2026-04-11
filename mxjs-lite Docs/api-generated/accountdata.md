# AccountData API

Account data methods.

## Overview

This module provides 6 methods.

## Methods

- [`getAccountData()`](#getaccountdata)
- [`getInviteBlocking()`](#getinviteblocking)
- [`getRoomAccountData()`](#getroomaccountdata)
- [`setAccountData()`](#setaccountdata)
- [`setInviteBlocking()`](#setinviteblocking)
- [`setRoomAccountData()`](#setroomaccountdata)

---

## getAccountData()

**Signature:** `async getAccountData(type)`

Gets account data for the user.

**Parameters:**

- `type` **{string}** - The event type of the account data

**Returns:** `Promise<Object|null>` - The account data content, or null on failure

---

## getInviteBlocking()

**Signature:** `async getInviteBlocking()`

Returns whether the current user has invite blocking enabled. When `true`, the homeserver will reject all incoming room invites (MSC4380).

**Parameters:** None

**Returns:** `Promise<boolean|null>` - `true` if blocking is on, `false` if off, `null` on failure.

---

## getRoomAccountData()

**Signature:** `async getRoomAccountData(roomId, type)`

Gets room-specific account data for the user.

**Parameters:**

- `roomId` **{string}** - The room ID
- `type` **{string}** - The event type of the account data

**Returns:** `Promise<Object|null>` - The account data content, or null on failure

---

## setAccountData()

**Signature:** `async setAccountData(type, content)`

Account data methods.

**Parameters:**

- `Base` **{T}**
- `type` **{string}** - The event type of the account data
- `content` **{Object}** - The content to store

**Returns:** `Promise<boolean>` - `true` on success

---

## setInviteBlocking()

**Signature:** `async setInviteBlocking(block)`

Enables or disables invite blocking for the current user (MSC4380). When enabled, the homeserver will reject all incoming room invites. Sets the `m.invite_permission_config` account data event.

**Parameters:**

- `block` **{boolean}** - `true` to block all invites, `false` to allow invites.

**Returns:** `Promise<boolean>` - `true` on success.

---

## setRoomAccountData()

**Signature:** `async setRoomAccountData(roomId, type, content)`

Sets room-specific account data for the user.

**Parameters:**

- `roomId` **{string}** - The room ID
- `type` **{string}** - The event type of the account data
- `content` **{Object}** - The content to store

**Returns:** `Promise<boolean>` - `true` on success

