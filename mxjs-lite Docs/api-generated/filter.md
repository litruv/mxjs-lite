# Filter API

Filter API methods.

## Overview

This module provides 2 methods.

## Methods

- [`createFilter()`](#createfilter)
- [`getFilter()`](#getfilter)

---

## createFilter()

**Signature:** `async createFilter(filterDefinition)`

Filter API methods.

**Parameters:**

- `Base` **{T}**
- `filterDefinition` **{Object}** - The filter definition object

**Returns:** `Promise<string|null>` - The filter ID, or null on failure

**Example:**

```javascript
const result = await client.createFilter(Base, {});
if (result) {
  console.log('Created:', result);
}
```

---

## getFilter()

**Signature:** `async getFilter(filterId)`

Downloads a filter definition from the homeserver.

**Parameters:**

- `filterId` **{string}** - The filter ID to retrieve

**Returns:** `Promise<Object|null>` - The filter definition, or null on failure

