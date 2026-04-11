# Search API

Search methods.

## Overview

This module provides 1 method.

## Methods

- [`search()`](#search)

---

## search()

**Signature:** `async search(searchCategories, options = {})`

Search methods.

**Parameters:**

- `Base` **{T}**
- `searchCategories` **{Object}** - The search categories (room_events, etc.)
- `options` **{Object}** _(optional)_ - Optional search parameters
- `options` **{string}** _(optional)_ - .next_batch] - Pagination token

**Returns:** `Promise<Object|null>` - Search results, or null on failure

