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
    return `${this.homeserver}/_matrix/media/r0/download/${mxcUrl.slice(6)}`;
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
};
