import { cerr, enc } from './constants.js';

/**
 * Mixin adding push notification methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Push = (Base) => class extends Base {
  /**
   * Gets all push rules for the current user.
   * @returns {Promise<Object|null>} Push rules object keyed by scope, or `null` on failure.
   */
  async getPushRules() {
    try {
      const result = await this.api('/pushrules/');
      if (result.errcode) throw new Error(result.error || result.errcode);
      return result;
    } catch (e) {
      cerr('getPushRules:', e);
      return null;
    }
  }

  /**
   * Gets all global push rules for the current user.
   * @returns {Promise<Object|null>} Global push rules object keyed by kind, or `null` on failure.
   */
  async getGlobalPushRules() {
    try {
      const result = await this.api('/pushrules/global/');
      if (result.errcode) throw new Error(result.error || result.errcode);
      return result;
    } catch (e) {
      cerr('getGlobalPushRules:', e);
      return null;
    }
  }

  /**
   * Gets a specific global push rule.
   * @param {string} kind - The kind of rule: `override`, `underride`, `sender`, `room`, or `content`.
   * @param {string} ruleId - The identifier for the rule.
   * @returns {Promise<Object|null>} The push rule object, or `null` on failure.
   */
  async getPushRule(kind, ruleId) {
    try {
      const result = await this.api(`/pushrules/global/${enc(kind)}/${enc(ruleId)}`);
      if (result.errcode) throw new Error(result.error || result.errcode);
      return result;
    } catch (e) {
      cerr('getPushRule:', e);
      return null;
    }
  }

  /**
   * Creates or updates a global push rule.
   * @param {string} kind - The kind of rule: `override`, `underride`, `sender`, `room`, or `content`.
   * @param {string} ruleId - The identifier for the rule.
   * @param {Object} rule - The rule definition (actions, conditions, pattern, etc.).
   * @param {Object} [options={}] - Optional query parameters (before, after).
   * @returns {Promise<boolean>} `true` on success.
   */
  async setPushRule(kind, ruleId, rule, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.before) params.set('before', options.before);
      if (options.after) params.set('after', options.after);
      const query = params.toString() ? `?${params.toString()}` : '';
      const result = await this.api(`/pushrules/global/${enc(kind)}/${enc(ruleId)}${query}`, 'PUT', rule);
      return !result.errcode;
    } catch (e) {
      cerr('setPushRule:', e);
      return false;
    }
  }

  /**
   * Deletes a global push rule.
   * @param {string} kind - The kind of rule.
   * @param {string} ruleId - The identifier for the rule.
   * @returns {Promise<boolean>} `true` on success.
   */
  async deletePushRule(kind, ruleId) {
    try {
      const result = await this.api(`/pushrules/global/${enc(kind)}/${enc(ruleId)}`, 'DELETE', {});
      return !result.errcode;
    } catch (e) {
      cerr('deletePushRule:', e);
      return false;
    }
  }

  /**
   * Gets the actions for a global push rule.
   * @param {string} kind - The kind of rule.
   * @param {string} ruleId - The identifier for the rule.
   * @returns {Promise<{actions: Array}|null>} Actions object, or `null` on failure.
   */
  async getPushRuleActions(kind, ruleId) {
    try {
      const result = await this.api(`/pushrules/global/${enc(kind)}/${enc(ruleId)}/actions`);
      if (result.errcode) throw new Error(result.error || result.errcode);
      return { actions: result.actions ?? [] };
    } catch (e) {
      cerr('getPushRuleActions:', e);
      return null;
    }
  }

  /**
   * Sets the actions for a global push rule.
   * @param {string} kind - The kind of rule.
   * @param {string} ruleId - The identifier for the rule.
   * @param {Array} actions - The new actions array.
   * @returns {Promise<boolean>} `true` on success.
   */
  async setPushRuleActions(kind, ruleId, actions) {
    try {
      const result = await this.api(`/pushrules/global/${enc(kind)}/${enc(ruleId)}/actions`, 'PUT', { actions });
      return !result.errcode;
    } catch (e) {
      cerr('setPushRuleActions:', e);
      return false;
    }
  }

  /**
   * Gets the enabled state of a global push rule.
   * @param {string} kind - The kind of rule.
   * @param {string} ruleId - The identifier for the rule.
   * @returns {Promise<{enabled: boolean}|null>} Enabled state, or `null` on failure.
   */
  async getPushRuleEnabled(kind, ruleId) {
    try {
      const result = await this.api(`/pushrules/global/${enc(kind)}/${enc(ruleId)}/enabled`);
      if (result.errcode) throw new Error(result.error || result.errcode);
      return { enabled: result.enabled };
    } catch (e) {
      cerr('getPushRuleEnabled:', e);
      return null;
    }
  }

  /**
   * Enables or disables a global push rule.
   * @param {string} kind - The kind of rule.
   * @param {string} ruleId - The identifier for the rule.
   * @param {boolean} enabled - Whether to enable the rule.
   * @returns {Promise<boolean>} `true` on success.
   */
  async setPushRuleEnabled(kind, ruleId, enabled) {
    try {
      const result = await this.api(`/pushrules/global/${enc(kind)}/${enc(ruleId)}/enabled`, 'PUT', { enabled });
      return !result.errcode;
    } catch (e) {
      cerr('setPushRuleEnabled:', e);
      return false;
    }
  }

  /**
   * Gets all pushers for the current user.
   * @returns {Promise<Array<Object>|null>} Array of pusher objects, or `null` on failure.
   */
  async getPushers() {
    try {
      const result = await this.api('/pushers');
      if (result.errcode) throw new Error(result.error || result.errcode);
      return result.pushers ?? [];
    } catch (e) {
      cerr('getPushers:', e);
      return null;
    }
  }

  /**
   * Creates, updates, or removes a pusher for the current user.
   * @param {Object} pusher - The pusher configuration object.
   * @returns {Promise<boolean>} `true` on success.
   */
  async setPusher(pusher) {
    try {
      const result = await this.api('/pushers/set', 'POST', pusher);
      return !result.errcode;
    } catch (e) {
      cerr('setPusher:', e);
      return false;
    }
  }

  /**
   * Gets a list of events that triggered push notifications for the current user.
   * @param {Object} [options={}] - Optional query parameters.
   * @param {string} [options.from] - Pagination token.
   * @param {number} [options.limit] - Maximum number of results.
   * @param {string} [options.only] - Filter to only return notifications of this type (e.g. `highlight`).
   * @returns {Promise<{notifications: Array, nextToken?: string}|null>}
   */
  async getNotifications(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.from) params.set('from', options.from);
      if (options.limit !== undefined) params.set('limit', options.limit);
      if (options.only) params.set('only', options.only);
      const query = params.toString() ? `?${params.toString()}` : '';
      const result = await this.api(`/notifications${query}`);
      if (result.errcode) throw new Error(result.error || result.errcode);
      return {
        notifications: result.notifications ?? [],
        nextToken: result.next_token,
      };
    } catch (e) {
      cerr('getNotifications:', e);
      return null;
    }
  }
};
