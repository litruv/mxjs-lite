# Media API

Media upload and retrieval methods.

## Overview

This module provides 9 methods.

## Common Usage

```javascript
// Upload and send media
const upload = await client.uploadMedia(fileData, 'image/png', 'photo.png');
await client.sendImage(roomId, upload.contentUri, 'My photo');
```

## Methods

- [`downloadMediaAsBlob()`](#downloadmediaasblob)
- [`fetchPublicLastMessage()`](#fetchpubliclastmessage)
- [`getMediaConfig()`](#getmediaconfig)
- [`getMediaInfo()`](#getmediainfo)
- [`getThumbnail()`](#getthumbnail)
- [`getUrlPreview()`](#geturlpreview)
- [`mxcToHttp()`](#mxctohttp)
- [`mxcToHttpThumbnail()`](#mxctohttpthumbnail)
- [`uploadMedia()`](#uploadmedia)

---

## downloadMediaAsBlob()

**Signature:** `async downloadMediaAsBlob(mxcUrl, options = {})`

Downloads media from an mxc:// URI as a Blob with authentication. Tries thumbnail first (if dimensions provided), then falls back to full download.

**Parameters:**

- `mxcUrl` **{string}** - An `mxc://` URI.
- `options` **{Object}** _(optional)_ - Optional download options.
- `options` **{number}** _(optional)_ - .width] - Thumbnail width (if omitted, downloads full size).
- `options` **{number}** _(optional)_ - .height] - Thumbnail height.
- `options` **{string}** _(optional)_ - .method="crop"] - Thumbnail method: "crop" or "scale".

**Returns:** `Promise<Blob|null>` - The media as a Blob, or `null` on failure.

---

## fetchPublicLastMessage()

**Signature:** `async fetchPublicLastMessage(roomAlias)`

Fetches the most recent text message from a public room using the public read token.

**Parameters:**

- `roomAlias` **{string}** - The room alias to look up (e.g. `#room:server`).

**Returns:** `Promise<{sender: string, body: string, timestamp: number` - |null>}

---

## getMediaConfig()

**Signature:** `async getMediaConfig()`

Gets the media configuration for the homeserver.

**Parameters:** None

**Returns:** `Promise<{uploadSize: number` - |null>} The max upload size in bytes, or `null` on failure.

---

## getMediaInfo()

**Signature:** `async getMediaInfo(mxcUri)`

Gets information about a media file from its mxc:// URI.

**Parameters:**

- `mxcUri` **{string}** - An `mxc://` URI

**Returns:** `Promise<{content_type: string|null, size: number|null` - |null>}

---

## getThumbnail()

**Signature:** `async getThumbnail(mxcUri, size = {})`

Gets thumbnail URLs for a media file.

**Parameters:**

- `mxcUri` **{string}** - An `mxc://` URI
- `size` **{Object}** _(optional)_ - Desired thumbnail size
- `size` **{number}** _(optional)_ - .width=320] - Thumbnail width
- `size` **{number}** _(optional)_ - .height=240] - Thumbnail height

**Returns:** `Promise<{[key: string]: string` - |null>} Object with thumbnail URLs by size

---

## getUrlPreview()

**Signature:** `async getUrlPreview(url, ts)`

Gets a preview of a URL from the homeserver.

**Parameters:**

- `url` **{string}** - The URL to preview.
- `ts` **{number}** _(optional)_ - Optional preferred time to get the preview from.

**Returns:** `Promise<{title: string|null, description: string|null, image: string|null` - |null>}

---

## mxcToHttp()

**Signature:** `mxcToHttp(mxcUrl)`

Media upload and retrieval methods.

**Parameters:**

- `Base` **{T}**
- `mxcUrl` **{string}** - An `mxc://` URI.

**Returns:** `string|null` - The HTTP URL, or `null` if the input is invalid.

---

## mxcToHttpThumbnail()

**Signature:** `mxcToHttpThumbnail(mxcUrl, width = 320, height = 240, method = "scale")`

Converts an `mxc://` URI to an HTTP thumbnail URL for the current homeserver.

**Parameters:**

- `mxcUrl` **{string}** - An `mxc://` URI.
- `width` **{number}** _(optional)_ - Default: `320]` - Desired thumbnail width.
- `height` **{number}** _(optional)_ - Default: `240]` - Desired thumbnail height.
- `method` **{string}** _(optional)_ - Default: `"scale"]` - Resize method: "crop" or "scale".

**Returns:** `string|null` - The HTTP thumbnail URL, or `null` if the input is invalid.

---

## uploadMedia()

**Signature:** `async uploadMedia(data, contentType, filename = "")`

Uploads binary media to the homeserver's media repository.

**Parameters:**

- `data` **{Blob|ArrayBuffer|FormData}** - The media data to upload.
- `contentType` **{string}** - MIME type (e.g. `"image/png"`).
- `filename` **{string}** _(optional)_ - Default: `""]` - Optional filename hint.

**Returns:** `Promise<{contentUri: string` - |null>} The `mxc://` content URI, or `null` on failure.

