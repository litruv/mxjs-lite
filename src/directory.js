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

  /**
   * Gets the list of public rooms on the homeserver.
   * @param {Object} [options] - Optional query parameters
   * @param {number} [options.limit] - Maximum number of rooms to return
   * @param {string} [options.since] - Pagination token from a previous request
   * @param {string} [options.server] - Server to fetch the public room list from
   * @returns {Promise<Object|null>} Public rooms response with chunk array, or null on failure
   */
  async getPublicRooms(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit);
      if (options.since) params.set('since', options.since);
      if (options.server) params.set('server', options.server);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.api(`/publicRooms${query}`, 'GET');
    } catch (e) {
      cerr("getPublicRooms:", e);
      return null;
    }
  }
};
