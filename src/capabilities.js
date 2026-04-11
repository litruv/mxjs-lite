import { cerr } from './constants.js';

/**
 * Server capabilities methods.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Capabilities = (Base) => class extends Base {
  /**
   * Gets the capabilities of the homeserver.
   * @returns {Promise<{capabilities: Object}|null>} The server capabilities object, or `null` on failure.
   */
  async getCapabilities() {
    try {
      const data = await this.api('/capabilities');
      return data.errcode ? null : data;
    } catch (e) {
      cerr('capabilities:', e);
      return null;
    }
  }
};
