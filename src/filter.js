import { cerr, enc } from './constants.js';

/**
 * Mixin adding filter API methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Filter = (Base) => class extends Base {
  /**
   * Uploads a new filter definition to the homeserver.
   * @param {Object} filterDefinition - The filter definition object
   * @returns {Promise<string|null>} The filter ID, or null on failure
   */
  async createFilter(filterDefinition) {
    try {
      const result = await this.api(
        `/user/${enc(this.userId)}/filter`,
        "POST",
        filterDefinition
      );
      return result.filter_id || null;
    } catch (e) {
      cerr("createFilter:", e);
      return null;
    }
  }

  /**
   * Downloads a filter definition from the homeserver.
   * @param {string} filterId - The filter ID to retrieve
   * @returns {Promise<Object|null>} The filter definition, or null on failure
   */
  async getFilter(filterId) {
    try {
      const result = await this.api(
        `/user/${enc(this.userId)}/filter/${enc(filterId)}`
      );
      return result.errcode ? null : result;
    } catch (e) {
      cerr("getFilter:", e);
      return null;
    }
  }
};
