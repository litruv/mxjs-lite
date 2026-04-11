# BaseMxjsClient API

## Overview

This module provides 4 methods.

## Methods

- [`api()`](#api)
- [`emit()`](#emit)
- [`off()`](#off)
- [`on()`](#on)

---

## api()

**Signature:** `async api(endpoint,
    method = "GET",
    body = null,
    accessToken = this.accessToken,
    pinVersion = null,)`

Makes a raw Matrix Client-Server API request.

**Parameters:**

- `endpoint` **{string}** - The endpoint path relative to `/_matrix/client`.
- `method` **{string}** _(optional)_ - Default: `"GET"]` - HTTP method.
- `body` **{Object|null}** _(optional)_ - Default: `null]` - Request body, serialized as JSON.
- `accessToken` **{string|null}** _(optional)_ - Default: `this.accessToken]` - Bearer token override.
- `pinVersion` **{string|null}** _(optional)_ - Default: `null]` - Force a specific API version prefix (e.g. `'v1'`). When `null`, auto-tries `v3 → v1 → r0`.

**Returns:** `Promise<Object>` - The parsed JSON response.

---

## emit()

**Signature:** `emit(event, ...args)`

Emits a named event, invoking all registered listeners with the provided arguments.

**Parameters:**

- `event` **{string}** - Event name.
- `args` **{...*}** - Arguments forwarded to each listener.

---

## off()

**Signature:** `off(event, fn)`

Removes a listener (or all listeners) for a named event.

**Parameters:**

- `event` **{string}** - Event name.
- `fn` **{function}** _(optional)_ - Specific listener to remove. Omit to remove all.

**Returns:** `this`

---

## on()

**Signature:** `on(event, fn)`

Registers a listener for a named event.

**Parameters:**

- `event` **{string}** - Event name.
- `fn` **{function}** - Listener callback.

**Returns:** `this`

