import { cerr, enc, M_CREATE, M_TOMBSTONE } from './constants.js';

/**
 * Mixin adding Matrix room version upgrade support (MSC1501) to a base client class.
 * Provides methods to upgrade a room, inspect its version, follow tombstone chains,
 * and read predecessor information from `m.room.create`.
 *
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const RoomVersions = (Base) => class extends Base {
  /**
   * Upgrades a room to a new room version via `POST /rooms/{roomId}/upgrade`.
   * The server creates a replacement room, sends an `m.room.tombstone` into the
   * old room, and replicates power levels, aliases, and topic to the new room.
   * Requires the caller to have permission to send `m.room.tombstone` state events.
   * @param {string} roomId - The room to upgrade.
   * @param {string} newVersion - The target room version string (e.g. `"11"`).
   * @returns {Promise<{replacementRoomId: string}|null>}
   */
  async upgradeRoom(roomId, newVersion) {
    const res = await this.api(
      `/rooms/${roomId}/upgrade`,
      'POST',
      { new_version: newVersion },
    ).catch(cerr);
    if (!res || res.errcode) return null;
    return { replacementRoomId: res.replacement_room };
  }

  /**
   * Returns the current room version string from the `m.room.create` state event.
   * Rooms without an explicit version are version `"1"` per the Matrix spec.
   * @param {string} roomId
   * @returns {Promise<string|null>} The version string, or `null` on failure.
   */
  async getRoomVersion(roomId) {
    const res = await this.api(`/rooms/${roomId}/state/${M_CREATE}/`).catch(cerr);
    if (!res || res.errcode) return null;
    return res.room_version ?? '1';
  }

  /**
   * Returns the predecessor field from the `m.room.create` event, indicating this
   * room was created as an upgrade of an older room.
   * @param {string} roomId
   * @returns {Promise<{roomId: string, eventId: string}|null>} Predecessor info, or `null` if none or on failure.
   */
  async getRoomPredecessor(roomId) {
    const res = await this.api(`/rooms/${roomId}/state/${M_CREATE}/`).catch(cerr);
    if (!res || res.errcode || !res.predecessor) return null;
    return { roomId: res.predecessor.room_id, eventId: res.predecessor.event_id };
  }

  /**
   * Returns the `m.room.tombstone` state event content for a room, if present.
   * A tombstone indicates the room has been replaced and is no longer active.
   * @param {string} roomId
   * @returns {Promise<{body: string, replacementRoomId: string}|null>} The tombstone data, or `null` if the room is not dead.
   */
  async getRoomTombstone(roomId) {
    const res = await this.api(`/rooms/${enc(roomId)}/state/${M_TOMBSTONE}/`).catch(cerr);
    if (!res || res.errcode) return null;
    return { body: res.body, replacementRoomId: res.replacement_room };
  }

  /**
   * Returns whether a room has been tombstoned (upgraded and replaced).
   * Checks the live `m.room.tombstone` state event on the homeserver.
   * @param {string} roomId
   * @returns {Promise<boolean>}
   */
  async isRoomTombstoned(roomId) {
    const res = await this.api(`/rooms/${enc(roomId)}/state/${M_TOMBSTONE}/`).catch(() => null);
    return !!res && !res.errcode && !!res.replacement_room;
  }

  /**
   * Returns whether a given timeline event is an `m.room.tombstone` state event.
   * Useful when processing events received from sync without an extra API call.
   * @param {Object} event - A Matrix room event.
   * @returns {boolean}
   */
  isTombstoneEvent(event) {
    return event?.type === M_TOMBSTONE && event?.state_key === '';
  }

  /**
   * Follows the tombstone chain from a given room, returning each successive
   * replacement room ID in order until a live (non-tombstoned) room is found.
   * Stops automatically if a cycle is detected or if more than 20 hops are traversed.
   * @param {string} roomId - The starting room ID.
   * @returns {Promise<string>} The ID of the most recent live room in the chain.
   */
  async followTombstoneChain(roomId) {
    const visited = new Set();
    let current = roomId;
    for (let i = 0; i < 20; i++) {
      if (visited.has(current)) break;
      visited.add(current);
      const tombstone = await this.getRoomTombstone(current);
      if (!tombstone?.replacementRoomId) break;
      current = tombstone.replacementRoomId;
    }
    return current;
  }
};
