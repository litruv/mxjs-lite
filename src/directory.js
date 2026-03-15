import { cerr, enc } from './constants.js';

/**
 * Mixin adding room directory methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Directory = (Base) => class extends Base {
  /**
   * Resolves a room alias (e.g. `#room:server`) to a room ID.
   * @param {string} roomAlias
   * @returns {Promise<string|null>} The room ID, or `null` on failure.
   */
  async resolveRoomAlias(roomAlias) {
    try {
      return (
        (await this.api(`/directory/room/${enc(roomAlias)}`)).room_id || null
      );
    } catch (e) {
      cerr("alias:", e);
      return null;
    }
  }
};
