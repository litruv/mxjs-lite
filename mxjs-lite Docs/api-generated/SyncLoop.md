# SyncLoop API

Automatic long-poll sync loop. Depends on the {@link Sync} mixin being present in the chain.

## Overview

This module provides 2 methods.

## Methods

- [`startSync()`](#startsync)
- [`stopSync()`](#stopsync)

---

## startSync()

**Signature:** `async startSync(pollTimeout = 30000, since = null)`

Automatic long-poll sync loop. Depends on the {@link Sync} mixin being present in the chain.

**Parameters:**

- `Base` **{T}**
- `pollTimeout` **{number}** _(optional)_ - Default: `30000]` - Long-poll timeout per request in milliseconds.
- `since` **{string|null}** _(optional)_ - Default: `null]` - Optional initial sync token. If provided the

**Returns:** `Promise<void>`

---

## stopSync()

**Signature:** `stopSync()`

Stops the automatic sync polling loop. The current in-flight request will complete before the loop exits.

**Parameters:** None

