import { cerr, enc, M_SPACE, M_SPACE_CHILD, M_SPACE_PARENT } from './constants.js';

/**
 * Matrix Spaces support (MSC1772 / Matrix v1.2).
 * Spaces are rooms with `type: 'm.space'` in their `m.room.create` content.
 * Children and parents are expressed via `m.space.child` / `m.space.parent` state events.
 *
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Spaces = (Base) => class extends Base {
  /**
   * Creates a new space room.
   * @param {string} name - Display name for the space.
   * @param {Object} [options={}] - Additional room creation options (e.g. `topic`, `visibility`).
   * @returns {Promise<{roomId: string}|null>}
   */
  async createSpace(name, options = {}) {
    return this.createRoom({
      name,
      creation_content: { type: M_SPACE },
      power_level_content_override: { events_default: 100 },
      ...options,
    });
  }

  /**
   * Adds a child room or subspace to a space via an `m.space.child` state event.
   * @param {string} spaceId - Room ID of the space.
   * @param {string} childRoomId - Room ID of the child to add.
   * @param {string[]} via - List of candidate servers to use when joining the child room.
   * @param {Object} [options={}] - Optional fields: `order` (string) and `suggested` (boolean).
   * @returns {Promise<{eventId: string}|null>}
   */
  async addSpaceChild(spaceId, childRoomId, via, options = {}) {
    return this.sendStateEvent(spaceId, M_SPACE_CHILD, { via, ...options }, childRoomId);
  }

  /**
   * Removes a child room from a space by sending an empty `m.space.child` state event.
   * @param {string} spaceId - Room ID of the space.
   * @param {string} childRoomId - Room ID of the child to remove.
   * @returns {Promise<{eventId: string}|null>}
   */
  async removeSpaceChild(spaceId, childRoomId) {
    return this.sendStateEvent(spaceId, M_SPACE_CHILD, {}, childRoomId);
  }

  /**
   * Declares a room's parent space via an `m.space.parent` state event.
   * @param {string} roomId - Room ID of the child room.
   * @param {string} spaceId - Room ID of the parent space.
   * @param {string[]} via - List of candidate servers to use when joining the parent.
   * @param {boolean} [canonical=false] - Whether this is the primary (canonical) parent.
   * @returns {Promise<{eventId: string}|null>}
   */
  async setSpaceParent(roomId, spaceId, via, canonical = false) {
    return this.sendStateEvent(roomId, M_SPACE_PARENT, { via, canonical }, spaceId);
  }

  /**
   * Removes a parent declaration from a room by sending an empty `m.space.parent` state event.
   * @param {string} roomId - Room ID of the child room.
   * @param {string} spaceId - Room ID of the parent space to remove.
   * @returns {Promise<{eventId: string}|null>}
   */
  async removeSpaceParent(roomId, spaceId) {
    return this.sendStateEvent(roomId, M_SPACE_PARENT, {}, spaceId);
  }

  /**
   * Returns all current children of a space by fetching its full room state and filtering for
   * valid `m.space.child` events (those with a non-empty `via` array).
   * @param {string} spaceId - Room ID of the space.
   * @returns {Promise<Array<{roomId: string, via: string[], order: string|null, suggested: boolean}>|null>}
   */
  async getSpaceChildren(spaceId) {
    try {
      const state = await this.api(`/rooms/${enc(spaceId)}/state`);
      if (!Array.isArray(state)) return null;
      return state
        .filter(e => e.type === M_SPACE_CHILD && Array.isArray(e.content?.via) && e.content.via.length > 0)
        .map(e => ({
          roomId: e.state_key,
          via: e.content.via,
          order: e.content.order ?? null,
          suggested: e.content.suggested === true,
        }));
    } catch (e) {
      cerr('getSpaceChildren:', e);
      return null;
    }
  }

  /**
   * Returns `true` if the given `m.room.create` event content represents a space room.
   * @param {Object} createContent - Content of the room's `m.room.create` event.
   * @returns {boolean}
   */
  isSpaceRoom(createContent) {
    return createContent?.type === M_SPACE;
  }
};
