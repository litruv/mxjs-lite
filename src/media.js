import { cerr, enc, M_MSG } from './constants.js';

/**
 * Mixin adding media upload and retrieval methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Media = (Base) => class extends Base {
  /**
   * Converts an `mxc://` URI to an HTTP download URL for the current homeserver.
   * @param {string} mxcUrl - An `mxc://` URI.
   * @returns {string|null} The HTTP URL, or `null` if the input is invalid.
   */
  mxcToHttp(mxcUrl) {
    if (!mxcUrl?.startsWith("mxc://")) return null;
    return `${this.homeserver}/_matrix/media/v3/download/${mxcUrl.slice(6)}`;
  }

  /**
   * Converts an `mxc://` URI to an HTTP thumbnail URL for the current homeserver.
   * @param {string} mxcUrl - An `mxc://` URI.
   * @param {number} [width=320] - Desired thumbnail width.
   * @param {number} [height=240] - Desired thumbnail height.
   * @param {string} [method="scale"] - Resize method: "crop" or "scale".
   * @returns {string|null} The HTTP thumbnail URL, or `null` if the input is invalid.
   */
  mxcToHttpThumbnail(mxcUrl, width = 320, height = 240, method = "scale") {
    if (!mxcUrl?.startsWith("mxc://")) return null;
    const path = mxcUrl.slice(6);
    return `${this.homeserver}/_matrix/media/v3/thumbnail/${path}?width=${width}&height=${height}&method=${method}`;
  }

  /**
   * Downloads media from an mxc:// URI as a Blob with authentication.
   * Tries thumbnail first (if dimensions provided), then falls back to full download.
   * @param {string} mxcUrl - An `mxc://` URI.
   * @param {Object} [options] - Optional download options.
   * @param {number} [options.width] - Thumbnail width (if omitted, downloads full size).
   * @param {number} [options.height] - Thumbnail height.
   * @param {string} [options.method="crop"] - Thumbnail method: "crop" or "scale".
   * @returns {Promise<Blob|null>} The media as a Blob, or `null` on failure.
   */
  async downloadMediaAsBlob(mxcUrl, options = {}) {
    if (!mxcUrl?.startsWith("mxc://")) return null;
    const path = mxcUrl.slice(6);
    const headers = {};
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;

    try {
      let url;
      if (options.width || options.height) {
        const w = options.width || 320;
        const h = options.height || 240;
        const m = options.method || "crop";
        url = `${this.homeserver}/_matrix/media/v3/thumbnail/${path}?width=${w}&height=${h}&method=${m}`;
      } else {
        url = `${this.homeserver}/_matrix/media/v3/download/${path}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        if (options.width && !options.fallbackAttempted) {
          return this.downloadMediaAsBlob(mxcUrl, { ...options, width: undefined, height: undefined, fallbackAttempted: true });
        }
        return null;
      }

      const contentType = response.headers.get("Content-Type");
      if (contentType?.startsWith("application/json")) {
        return null;
      }

      return await response.blob();
    } catch (e) {
      cerr("download blob:", e);
      return null;
    }
  }

  /**
   * Uploads binary media to the homeserver's media repository.
   * @param {Blob|ArrayBuffer|FormData} data - The media data to upload.
   * @param {string} contentType - MIME type (e.g. `"image/png"`).
   * @param {string} [filename=""] - Optional filename hint.
   * @returns {Promise<{contentUri: string}|null>} The `mxc://` content URI, or `null` on failure.
   */
  async uploadMedia(data, contentType, filename = "") {
    try {
      const qs = filename ? `?filename=${enc(filename)}` : "";
      const headers = { "Content-Type": contentType };
      if (this.accessToken)
        headers.Authorization = `Bearer ${this.accessToken}`;
      for (const v of ["v3", "r0"]) {
        const response = await fetch(
          `${this.homeserver}/_matrix/media/${v}/upload${qs}`,
          { method: "POST", headers, body: data },
        );
        if (response.status === 404) continue;
        const result = await response.json();
        return result.errcode ? null : { contentUri: result.content_uri };
      }
      return null;
    } catch (e) {
      cerr("upload:", e);
      return null;
    }
  }

  /**
   * Fetches the most recent text message from a public room using the public read token.
   * @param {string} roomAlias - The room alias to look up (e.g. `#room:server`).
   * @returns {Promise<{sender: string, body: string, timestamp: number}|null>}
   */
  async fetchPublicLastMessage(roomAlias) {
    if (!this.publicReadToken) {
      console.warn("No public read token");
      return null;
    }
    try {
      const roomId = (
        await this.api(
          `/directory/room/${enc(roomAlias)}`,
          "GET",
          null,
          this.publicReadToken,
        )
      )?.room_id;
      if (!roomId) return null;
      const lastEvent = (
        await this.api(
          `/rooms/${enc(roomId)}/messages?dir=b&limit=10`,
          "GET",
          null,
          this.publicReadToken,
        )
      ).chunk?.find((e) => e?.type === M_MSG && e.content?.body);
      return lastEvent
        ? {
            sender: lastEvent.sender,
            body: lastEvent.content.body,
            timestamp: lastEvent.origin_server_ts || Date.now(),
          }
        : null;
    } catch (e) {
      cerr("public msg:", e);
      return null;
    }
  }

  /**
   * Gets a preview of a URL from the homeserver.
   * @param {string} url - The URL to preview.
   * @param {number} [ts] - Optional preferred time to get the preview from.
   * @returns {Promise<{title: string|null, description: string|null, image: string|null}|null>}
   */
  async getUrlPreview(url, ts) {
    try {
      const endpoint = `/preview_url?url=${enc(url)}${ts ? `&ts=${ts}` : ""}`;
      const data = await this.api(endpoint);
      return data.errcode
        ? null
        : {
            title: data["og:title"] || null,
            description: data["og:description"] || null,
            image: data["og:image"] || null,
          };
    } catch (e) {
      cerr("url preview:", e);
      return null;
    }
  }

  /**
   * Gets the media configuration for the homeserver.
   * @returns {Promise<{uploadSize: number}|null>} The max upload size in bytes, or `null` on failure.
   */
  async getMediaConfig() {
    try {
      for (const v of ["v3", "r0"]) {
        const response = await fetch(
          `${this.homeserver}/_matrix/media/${v}/config`,
          {
            method: "GET",
            headers: this.accessToken
              ? { Authorization: `Bearer ${this.accessToken}` }
              : {},
          },
        );
        if (response.status === 404 && v !== "r0") continue;
        const data = await response.json();
        return data.errcode
          ? null
          : { uploadSize: data["m.upload.size"] || 0 };
      }
      return null;
    } catch (e) {
      cerr("media config:", e);
      return null;
    }
  }
};
