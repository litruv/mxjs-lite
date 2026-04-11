# Push API

Push notification methods.

## Overview

This module provides 14 methods.

## Methods

- [`deletePushRule()`](#deletepushrule)
- [`getGlobalPushRules()`](#getglobalpushrules)
- [`getNotifications()`](#getnotifications)
- [`getPushers()`](#getpushers)
- [`getPushRule()`](#getpushrule)
- [`getPushRuleActions()`](#getpushruleactions)
- [`getPushRuleEnabled()`](#getpushruleenabled)
- [`getPushRules()`](#getpushrules)
- [`getTombstoneNotificationsEnabled()`](#gettombstonenotificationsenabled)
- [`setPusher()`](#setpusher)
- [`setPushRule()`](#setpushrule)
- [`setPushRuleActions()`](#setpushruleactions)
- [`setPushRuleEnabled()`](#setpushruleenabled)
- [`setTombstoneNotificationsEnabled()`](#settombstonenotificationsenabled)

---

## deletePushRule()

**Signature:** `async deletePushRule(kind, ruleId)`

Deletes a global push rule.

**Parameters:**

- `kind` **{string}** - The kind of rule.
- `ruleId` **{string}** - The identifier for the rule.

**Returns:** `Promise<boolean>` - `true` on success.

---

## getGlobalPushRules()

**Signature:** `async getGlobalPushRules()`

Gets all global push rules for the current user.

**Parameters:** None

**Returns:** `Promise<Object|null>` - Global push rules object keyed by kind, or `null` on failure.

---

## getNotifications()

**Signature:** `async getNotifications(options = {})`

Gets a list of events that triggered push notifications for the current user.

**Parameters:**

- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional query parameters.
- `options` **{string}** _(optional)_ - .from] - Pagination token.
- `options` **{number}** _(optional)_ - .limit] - Maximum number of results.
- `options` **{string}** _(optional)_ - .only] - Filter to only return notifications of this type (e.g. `highlight`).

**Returns:** `Promise<{notifications: Array, nextToken?: string` - |null>}

---

## getPushers()

**Signature:** `async getPushers()`

Gets all pushers for the current user.

**Parameters:** None

**Returns:** `Promise<Array<Object>|null>` - Array of pusher objects, or `null` on failure.

---

## getPushRule()

**Signature:** `async getPushRule(kind, ruleId)`

Gets a specific global push rule.

**Parameters:**

- `kind` **{string}** - The kind of rule: `override`, `underride`, `sender`, `room`, or `content`.
- `ruleId` **{string}** - The identifier for the rule.

**Returns:** `Promise<Object|null>` - The push rule object, or `null` on failure.

---

## getPushRuleActions()

**Signature:** `async getPushRuleActions(kind, ruleId)`

Gets the actions for a global push rule.

**Parameters:**

- `kind` **{string}** - The kind of rule.
- `ruleId` **{string}** - The identifier for the rule.

**Returns:** `Promise<{actions: Array` - |null>} Actions object, or `null` on failure.

---

## getPushRuleEnabled()

**Signature:** `async getPushRuleEnabled(kind, ruleId)`

Gets the enabled state of a global push rule.

**Parameters:**

- `kind` **{string}** - The kind of rule.
- `ruleId` **{string}** - The identifier for the rule.

**Returns:** `Promise<{enabled: boolean` - |null>} Enabled state, or `null` on failure.

---

## getPushRules()

**Signature:** `async getPushRules()`

Push notification methods.

**Parameters:**

- `Base` **{T}**

**Returns:** `Promise<Object|null>` - Push rules object keyed by scope, or `null` on failure.

---

## getTombstoneNotificationsEnabled()

**Signature:** `async getTombstoneNotificationsEnabled()`

Returns whether the default tombstone push rule (`.m.rule.tombstone`) is enabled. This rule highlights the user when a room they are in is upgraded (MSC1930).

**Parameters:** None

**Returns:** `Promise<boolean|null>` - `true` if enabled, `false` if disabled, `null` on failure.

---

## setPusher()

**Signature:** `async setPusher(pusher)`

Creates, updates, or removes a pusher for the current user.

**Parameters:**

- `pusher` **{Object}** - The pusher configuration object.

**Returns:** `Promise<boolean>` - `true` on success.

---

## setPushRule()

**Signature:** `async setPushRule(kind, ruleId, rule, options = {})`

Creates or updates a global push rule.

**Parameters:**

- `kind` **{string}** - The kind of rule: `override`, `underride`, `sender`, `room`, or `content`.
- `ruleId` **{string}** - The identifier for the rule.
- `rule` **{Object}** - The rule definition (actions, conditions, pattern, etc.).
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional query parameters (before, after).

**Returns:** `Promise<boolean>` - `true` on success.

---

## setPushRuleActions()

**Signature:** `async setPushRuleActions(kind, ruleId, actions)`

Sets the actions for a global push rule.

**Parameters:**

- `kind` **{string}** - The kind of rule.
- `ruleId` **{string}** - The identifier for the rule.
- `actions` **{Array}** - The new actions array.

**Returns:** `Promise<boolean>` - `true` on success.

---

## setPushRuleEnabled()

**Signature:** `async setPushRuleEnabled(kind, ruleId, enabled)`

Enables or disables a global push rule.

**Parameters:**

- `kind` **{string}** - The kind of rule.
- `ruleId` **{string}** - The identifier for the rule.
- `enabled` **{boolean}** - Whether to enable the rule.

**Returns:** `Promise<boolean>` - `true` on success.

---

## setTombstoneNotificationsEnabled()

**Signature:** `async setTombstoneNotificationsEnabled(enabled)`

Enables or disables the default tombstone push rule (`.m.rule.tombstone`). When enabled, the user receives a highlight notification whenever a room they are in is upgraded via `m.room.tombstone` (MSC1930).

**Parameters:**

- `enabled` **{boolean}**

**Returns:** `Promise<boolean>` - `true` on success.

