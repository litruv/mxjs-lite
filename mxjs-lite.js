import { BaseMxjsClient } from './src/BaseMxjsClient.js';
import { Auth } from './src/auth.js';
import { Profile } from './src/profile.js';
import { Directory } from './src/directory.js';
import { Rooms } from './src/rooms.js';
import { Events } from './src/events.js';
import { Receipts } from './src/receipts.js';
import { Sync } from './src/sync.js';
import { SyncLoop } from './src/SyncLoop.js';
import { Media } from './src/media.js';
import { Html } from './src/html.js';
import { Capabilities } from './src/capabilities.js';
import { Filter } from './src/filter.js';
import { AccountData } from './src/accountdata.js';
import { Search } from './src/search.js';
import { Devices } from './src/devices.js';
import { VoIP } from './src/voip.js';
import { Push } from './src/push.js';
import { Spaces } from './src/spaces.js';
import { Threads } from './src/threads.js';
import { RoomVersions } from './src/roomversions.js';
export { ClientEvents } from './src/ClientEvents.js';

const mixins = [
  Html,
  Media,
  Sync,
  SyncLoop,
  Receipts,
  Events,
  Rooms,
  Directory,
  Profile,
  Auth,
  Capabilities,
  Filter,
  AccountData,
  Search,
  Devices,
  VoIP,
  Push,
  Spaces,
  Threads,
  RoomVersions,
];

/**
 * A lightweight Matrix client for interacting with the Matrix homeserver API.
 *
 * Composed from categorised mixins:
 * {@link Auth}, {@link Profile}, {@link Directory},
 * {@link Rooms}, {@link Events}, {@link Receipts},
 * {@link Sync}, {@link SyncLoop}, {@link Media}, {@link Html}, {@link Capabilities},
 * {@link Filter}, {@link AccountData}, {@link Search}, {@link Devices}, {@link VoIP}, {@link Push},
 * {@link Spaces}, {@link Threads}, {@link RoomVersions}.
 *
 * All emitted event names are available as string constants on {@link ClientEvents}.
 *
 * @example
 * import MxjsClient, { ClientEvents } from 'mxjs-lite';
 *
 * const client = new MxjsClient({ homeserver: 'https://matrix.org' });
 * client.on(ClientEvents.Ready, () => console.log('ready'));
 * client.on(ClientEvents.MessageCreate, ({ roomId, event }) => {
 *   console.log(event.content?.body);
 * });
 * await client.login('user', 'pass');
 * client.startSync();
 */
export class MxjsClient extends mixins.reduce((Base, mixin) => mixin(Base), BaseMxjsClient) {}

export default MxjsClient;
