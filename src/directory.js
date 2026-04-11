import { cerr, enc } from './constants.js';

/**
 * Room directory methods.
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

  /**
   * Creates a new room alias pointing to a room ID.
   * @param {string} roomAlias - The room alias to create (e.g., #alias:server.com)
   * @param {string} roomId - The room ID to point the alias to
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async createRoomAlias(roomAlias, roomId) {
    try {
      await this.api(`/directory/room/${enc(roomAlias)}`, 'PUT', { room_id: roomId });
      return true;
    } catch (e) {
      cerr("createRoomAlias:", e);
      return false;
    }
  }

  /**
   * Deletes a room alias.
   * @param {string} roomAlias - The room alias to delete (e.g., #alias:server.com)
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async deleteRoomAlias(roomAlias) {
    try {
      await this.api(`/directory/room/${enc(roomAlias)}`, 'DELETE');
      return true;
    } catch (e) {
      cerr("deleteRoomAlias:", e);
      return false;
    }
  }

  /**
   * Gets the list of aliases for a room (deprecated endpoint, may not be available on all servers).
   * @param {string} roomId - The room ID
   * @returns {Promise<string[]|null>} Array of alias strings, or null on failure
   */
  async getRoomAliases(roomId) {
    try {
      const result = await this.api(`/rooms/${enc(roomId)}/aliases`);
      return result.aliases || [];
    } catch (e) {
      cerr("getRoomAliases:", e);
      return null;
    }
  }

  /**
   * Gets the list of room IDs the user has joined.
   * @returns {Promise<string[]|null>} Array of room IDs, or null on failure
   */
  async getJoinedRooms() {
    try {
      const result = await this.api('/joined_rooms');
      return result.joined_rooms || [];
    } catch (e) {
      cerr("getJoinedRooms:", e);
      return null;
    }
  }

  /**
   * Searches public rooms with filters (using POST for more complex queries).
   * @param {Object} [options] - Search options
   * @param {number} [options.limit] - Maximum number of rooms to return
   * @param {string} [options.since] - Pagination token from a previous request
   * @param {string} [options.server] - Server to fetch the public room list from
   * @param {Object} [options.filter] - Filter object with optional search_term, room_types, etc.
   * @param {boolean} [options.include_all_networks] - Whether to include all third-party networks
   * @param {string} [options.third_party_instance_id] - Third-party network instance ID
   * @returns {Promise<Object|null>} Search results with chunk array, or null on failure
   */
  async searchPublicRooms(options = {}) {
    try {
      const body = {};
      if (options.limit) body.limit = options.limit;
      if (options.since) body.since = options.since;
      if (options.server) body.server = options.server;
      if (options.filter) body.filter = options.filter;
      if (options.include_all_networks !== undefined) body.include_all_networks = options.include_all_networks;
      if (options.third_party_instance_id) body.third_party_instance_id = options.third_party_instance_id;
      return await this.api('/publicRooms', 'POST', body);
    } catch (e) {
      cerr("searchPublicRooms:", e);
      return null;
    }
  }

  /**
   * Gets the visibility of a room in the public room directory.
   * @param {string} roomId - The room ID
   * @returns {Promise<string|null>} 'public' or 'private', or null on failure
   */
  async getRoomVisibility(roomId) {
    try {
      const result = await this.api(`/directory/list/room/${enc(roomId)}`);
      return result.visibility || null;
    } catch (e) {
      cerr("getRoomVisibility:", e);
      return null;
    }
  }

  /**
   * Sets the visibility of a room in the public room directory.
   * @param {string} roomId - The room ID
   * @param {string} visibility - Either 'public' or 'private'
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async setRoomVisibility(roomId, visibility) {
    try {
      await this.api(`/directory/list/room/${enc(roomId)}`, 'PUT', { visibility });
      return true;
    } catch (e) {
      cerr("setRoomVisibility:", e);
      return false;
    }
  }

  /**
   * Gets a summary of a room (used for spaces and room previews).
   * @param {string} roomIdOrAlias - The room ID or alias
   * @param {Object} [options] - Optional query parameters
   * @param {string[]} [options.via] - List of servers to try and use for joining
   * @returns {Promise<Object|null>} Room summary object, or null on failure
   */
  async getRoomSummary(roomIdOrAlias, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.via) {
        options.via.forEach(server => params.append('via', server));
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.api(`/room_summary/${enc(roomIdOrAlias)}${query}`);
    } catch (e) {
      cerr("getRoomSummary:", e);
      return null;
    }
  }

  /**
   * Finds the homeserver for a given user or server name.
   * @param {Object} [options] - Query options
   * @param {string} [options.server_name] - Server name to look up
   * @returns {Promise<{server: string}|null>} Server information, or null on failure
   */
  async findHomeServer(options = {}) {
    try {
      const serverName = options.server_name || options.servername || 'matrix.org';
      // Use .well-known discovery
      const response = await fetch(`https://${serverName}/.well-known/matrix/client`);
      if (!response.ok) return null;
      const data = await response.json();
      const baseUrl = data['m.homeserver']?.base_url;
      return baseUrl ? { server: baseUrl } : null;
    } catch (e) {
      cerr("findHomeServer:", e);
      return null;
    }
  }

  /**
   * Gets the hierarchy of a space (rooms and subspaces).
   * @param {string} roomId - The space room ID
   * @param {Object} [options] - Optional query parameters
   * @param {boolean} [options.suggested_only] - Only return rooms/spaces marked as suggested
   * @param {number} [options.max_depth] - Maximum depth to traverse (default server-dependent)
   * @param {string} [options.from] - Pagination token from a previous request
   * @returns {Promise<Object|null>} Hierarchy object with rooms array, or null on failure
   */
  async getRoomHierarchy(roomId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.suggested_only !== undefined) params.set('suggested_only', options.suggested_only);
      if (options.max_depth !== undefined) params.set('max_depth', options.max_depth);
      if (options.from) params.set('from', options.from);
      const query = params.toString() ? `?${params.toString()}` : '';
      return await this.api(`/rooms/${enc(roomId)}/hierarchy${query}`);
    } catch (e) {
      cerr("getRoomHierarchy:", e);
      return null;
    }
  }

  /**
   * Searches the user directory for users matching a given search term.
   * @param {string} searchTerm - The term to search for.
   * @param {Object} [options={}] - Optional parameters.
   * @param {number} [options.limit] - Maximum number of results to return.
   * @param {string} [options.language] - BCP 47 language tag for the search.
   * @returns {Promise<{results: Array<{userId: string, displayName?: string, avatarUrl?: string}>, limited: boolean}|null>}
   */
  async searchUserDirectory(searchTerm, options = {}) {
    try {
      const body = { search_term: searchTerm };
      if (options.limit !== undefined) body.limit = options.limit;
      if (options.language) body.language = options.language;
      const result = await this.api('/user_directory/search', 'POST', body);
      if (result.errcode) throw new Error(result.error || result.errcode);
      return {
        results: (result.results ?? []).map(u => ({
          userId: u.user_id,
          displayName: u.display_name,
          avatarUrl: u.avatar_url,
        })),
        limited: result.limited ?? false,
      };
    } catch (e) {
      cerr('searchUserDirectory:', e);
      return null;
    }
  }
};
