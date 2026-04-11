import { cerr } from './constants.js';

/**
 * VoIP methods.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const VoIP = (Base) => class extends Base {
  /**
   * Gets TURN server credentials for VoIP calls.
   * @returns {Promise<{username: string, password: string, ttl: number, uris: string[]}|null>}
   */
  async getTurnServer() {
    try {
      const result = await this.api('/voip/turnServer');
      if (result.errcode) throw new Error(result.error || result.errcode);
      return {
        username: result.username,
        password: result.password,
        ttl: result.ttl,
        uris: result.uris ?? [],
      };
    } catch (e) {
      cerr('getTurnServer:', e);
      return null;
    }
  }
};
