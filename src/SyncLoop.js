import { cerr } from './constants.js';

/**
 * Automatic long-poll sync loop.
 * Depends on the {@link Sync} mixin being present in the chain.
 *
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const SyncLoop = (Base) => class extends Base {
  /** @type {string|null} */
  _syncToken = null;

  /** @type {boolean} */
  _syncing = false;

  /** @type {boolean} */
  _syncReady = false;

  /**
   * Whether the sync loop is currently running.
   * @type {boolean}
   */
  get isSyncing() {
    return this._syncing;
  }

  /**
   * Starts the automatic sync polling loop.
   *
   * On first call, an initial drain sync (timeout=0) is performed to consume past
   * events and obtain a `next_batch` token. Subsequent long-poll requests use
   * `pollTimeout` so the connection stays open until the server has new data.
   *
   * Emits `ready` (see {@link ClientEvents.Ready}) once after the first successful
   * long-poll cycle, then `syncComplete` (see {@link ClientEvents.SyncComplete}) after
   * every cycle. On error, emits `syncError` (see {@link ClientEvents.SyncError}) and
   * retries after 5 seconds.
   *
   * @param {number} [pollTimeout=30000] - Long-poll timeout per request in milliseconds.
   * @param {string|null} [since=null] - Optional initial sync token. If provided the
   *   drain sync is skipped and polling begins from this token immediately.
   * @returns {Promise<void>}
   */
  async startSync(pollTimeout = 30000, since = null) {
    if (this._syncing) return;
    this._syncing = true;
    this._syncReady = false;

    if (since !== null) {
      this._syncToken = since;
    } else {
      const init = await this.sync(null, 0);
      if (!this._syncing) return;
      if (init) {
        this.processSyncData(init);
        this._syncToken = init.next_batch ?? null;
        this._syncReady = true;
        this.emit('ready');
      }
    }

    this._syncLoop(pollTimeout);
  }

  /**
   * Stops the automatic sync polling loop.
   * The current in-flight request will complete before the loop exits.
   */
  stopSync() {
    this._syncing = false;
  }

  /**
   * @param {number} pollTimeout
   * @private
   */
  async _syncLoop(pollTimeout) {
    while (this._syncing) {
      try {
        const data = await this.sync(this._syncToken, pollTimeout);
        if (!this._syncing) break;

        if (!data) {
          this.emit('syncError', { error: new Error('Sync returned null') });
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }

        this._syncToken = data.next_batch;
        this.processSyncData(data);

        if (!this._syncReady) {
          this._syncReady = true;
          this.emit('ready');
        }

        this.emit('syncComplete', { nextBatch: this._syncToken });
      } catch (e) {
        cerr('syncLoop:', e);
        this.emit('syncError', { error: e });
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
};
