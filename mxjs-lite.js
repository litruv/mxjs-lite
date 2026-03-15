import { BaseMxjsClient } from './src/BaseMxjsClient.js';
import { Auth } from './src/auth.js';
import { Profile } from './src/profile.js';
import { Directory } from './src/directory.js';
import { Rooms } from './src/rooms.js';
import { Events } from './src/events.js';
import { Receipts } from './src/receipts.js';
import { Sync } from './src/sync.js';
import { Media } from './src/media.js';
import { Html } from './src/html.js';

const mixins = [
  Html,
  Media,
  Sync,
  Receipts,
  Events,
  Rooms,
  Directory,
  Profile,
  Auth,
];

/**
 * A lightweight Matrix client for interacting with the Matrix homeserver API.
 *
 * Composed from categorised mixins:
 * {@link Auth}, {@link Profile}, {@link Directory},
 * {@link Rooms}, {@link Events}, {@link Receipts},
 * {@link Sync}, {@link Media}, {@link Html}.
 */
export class MxjsClient extends mixins.reduce((Base, mixin) => mixin(Base), BaseMxjsClient) {}

export default MxjsClient;
