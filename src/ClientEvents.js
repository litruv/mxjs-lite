/**
 * String constants for all events emitted by {@link MxjsClient}.
 * Use these with `client.on()` for type-safe, Discord.js-style event handling.
 *
 * @example
 * import MxjsClient, { ClientEvents } from 'mxjs-lite';
 *
 * const client = new MxjsClient({ homeserver: 'https://matrix.org' });
 *
 * client.on(ClientEvents.Ready, () => console.log('Client ready'));
 * client.on(ClientEvents.MessageCreate, ({ roomId, event }) => {
 *   console.log(`[${roomId}] ${event.sender}: ${event.content?.body}`);
 * });
 *
 * await client.login('username', 'password');
 * client.startSync();
 */
export const ClientEvents = {
  // ── Connection lifecycle ─────────────────────────────────────────────────

  /**
   * Emitted once credentials are stored after a successful {@link login} or {@link register}.
   * Payload: `{ accessToken: string, userId: string }`
   */
  Connect: 'connect',

  /**
   * Emitted when the session is cleared (via {@link logout}, {@link logoutAll}, or {@link deactivateAccount}).
   * No payload.
   */
  Disconnect: 'disconnect',

  /**
   * Emitted once when the first sync loop cycle completes successfully after {@link startSync}.
   * No payload.
   */
  Ready: 'ready',

  // ── Messages ─────────────────────────────────────────────────────────────

  /**
   * Emitted for each new (non-edit) `m.room.message` timeline event.
   * Payload: `{ roomId: string, event: Object }`
   */
  MessageCreate: 'messageCreate',

  /**
   * Emitted when a message is edited via an `m.replace` relation.
   * Payload: `{ roomId: string, edits: string, newBody: string, event: Object }`
   * - `edits` — event ID of the original message that was edited.
   * - `newBody` — the replacement plain-text body.
   */
  MessageUpdate: 'messageUpdate',

  /**
   * Emitted when an event is redacted.
   * Payload: `{ roomId: string, redacts: string, event: Object }`
   * - `redacts` — event ID of the original event that was redacted.
   */
  MessageDelete: 'messageDelete',

  /**
   * Emitted for each `m.reaction` annotation event.
   * Payload: `{ roomId: string, reacts: string, key: string, event: Object }`
   * - `reacts` — event ID of the message that was reacted to.
   * - `key` — the reaction key (typically an emoji).
   */
  ReactionAdd: 'reactionAdd',

  // ── Room lifecycle ───────────────────────────────────────────────────────

  /**
   * Emitted when a room first appears in the sync response (i.e. the client joined it).
   * Payload: `{ roomId: string }`
   */
  RoomJoin: 'roomJoin',

  /**
   * Emitted when the client leaves or is removed from a room.
   * Payload: `{ roomId: string }`
   */
  RoomLeave: 'roomLeave',

  /**
   * Emitted when a room invitation is received.
   * Payload: `{ roomId: string }`
   */
  InviteReceive: 'inviteReceive',

  // ── Room state changes ───────────────────────────────────────────────────

  /**
   * Emitted for `m.room.member` state changes (joins, leaves, bans, kicks, profile updates).
   * Payload: `{ roomId: string, change: Object, event: Object }`
   * - `change` — the object returned by `getMembershipChange`.
   */
  MemberUpdate: 'memberUpdate',

  /**
   * Emitted when the room display name changes (`m.room.name`).
   * Payload: `{ roomId: string, name: string|null, prevName: string|null, event: Object }`
   */
  RoomNameUpdate: 'roomNameUpdate',

  /**
   * Emitted when the room topic changes (`m.room.topic`).
   * Payload: `{ roomId: string, topic: string|null, prevTopic: string|null, event: Object }`
   */
  RoomTopicUpdate: 'roomTopicUpdate',

  /**
   * Emitted when the room avatar changes (`m.room.avatar`).
   * Payload: `{ roomId: string, avatarUrl: string|null, prevAvatarUrl: string|null, event: Object }`
   */
  RoomAvatarUpdate: 'roomAvatarUpdate',

  // ── User activity ────────────────────────────────────────────────────────

  /**
   * Emitted when the set of typing users in a room changes.
   * Payload: `{ roomId: string, userIds: string[] }`
   */
  TypingStart: 'typingStart',

  /**
   * Emitted when a user presence event arrives via sync.
   * Payload: `{ userId: string, presence: string, lastActiveAgo: number|null, statusMsg: string|null, currentlyActive: boolean|null }`
   */
  PresenceUpdate: 'presenceUpdate',

  /**
   * Emitted when read receipt events arrive via sync.
   * Payload: `{ roomId: string, receipts: Array<{ eventId: string, read: string[] }> }`
   * - `receipts` — array of objects mapping event IDs to the list of user IDs who read them.
   */
  ReceiptUpdate: 'receiptUpdate',

  // ── Account data ─────────────────────────────────────────────────────────

  /**
   * Emitted when a global account data entry changes in sync.
   * Payload: `{ type: string, content: Object }`
   */
  AccountDataUpdate: 'accountDataUpdate',

  /**
   * Emitted when a room-level account data entry changes in sync.
   * Payload: `{ roomId: string, type: string, content: Object }`
   */
  RoomAccountDataUpdate: 'roomAccountDataUpdate',

  // ── Sync lifecycle ───────────────────────────────────────────────────────

  /**
   * Emitted after each successful sync cycle when using the built-in sync loop.
   * Payload: `{ nextBatch: string }`
   */
  SyncComplete: 'syncComplete',

  /**
   * Emitted when a sync cycle fails (network error, bad response, etc).
   * The loop will retry after a short delay.
   * Payload: `{ error: Error }`
   */
  SyncError: 'syncError',

  // ── Room structure ───────────────────────────────────────────────────────

  /**
   * Emitted when an `m.room.power_levels` event arrives in the timeline.
   * Payload: `{ roomId: string, content: Object, event: Object }`
   */
  PowerLevelUpdate: 'powerLevelUpdate',

  /**
   * Emitted when an `m.room.canonical_alias` event arrives in the timeline.
   * Payload: `{ roomId: string, alias: string|null, event: Object }`
   */
  CanonicalAliasUpdate: 'canonicalAliasUpdate',
};
