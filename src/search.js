import { cerr } from './constants.js';

/**
 * Mixin adding search methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Search = (Base) => class extends Base {
  /**
   * Performs a server-side search across room events.
   * @param {Object} searchCategories - The search categories (room_events, etc.)
   * @param {Object} [options] - Optional search parameters
   * @param {string} [options.next_batch] - Pagination token
   * @returns {Promise<Object|null>} Search results, or null on failure
   */
  async search(searchCategories, options = {}) {
    try {
      const body = { search_categories: searchCategories };
      if (options.next_batch) {
        body.next_batch = options.next_batch;
      }
      const result = await this.api('/search', 'POST', body);
      return result.errcode ? null : result;
    } catch (e) {
      cerr("search:", e);
      return null;
    }
  }
};
