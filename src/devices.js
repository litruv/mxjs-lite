import { cerr, enc } from './constants.js';

/**
 * Mixin adding device management methods to a base client class.
 * @template {typeof import('./BaseMxjsClient.js').BaseMxjsClient} T
 * @param {T} Base
 * @returns {T}
 */
export const Devices = (Base) => class extends Base {
  /**
   * Gets the list of all registered devices for the current user.
   * @returns {Promise<Array<{deviceId: string, displayName?: string, lastSeenIp?: string, lastSeenTs?: number}>|null>}
   */
  async getDevices() {
    try {
      const result = await this.api('/devices');
      if (result.errcode) throw new Error(result.error || result.errcode);
      return (result.devices ?? []).map(d => ({
        deviceId: d.device_id,
        displayName: d.display_name,
        lastSeenIp: d.last_seen_ip,
        lastSeenTs: d.last_seen_ts,
      }));
    } catch (e) {
      cerr('getDevices:', e);
      return null;
    }
  }

  /**
   * Gets information about a specific device.
   * @param {string} deviceId
   * @returns {Promise<{deviceId: string, displayName?: string, lastSeenIp?: string, lastSeenTs?: number}|null>}
   */
  async getDevice(deviceId) {
    try {
      const result = await this.api(`/devices/${enc(deviceId)}`);
      if (result.errcode) throw new Error(result.error || result.errcode);
      return {
        deviceId: result.device_id,
        displayName: result.display_name,
        lastSeenIp: result.last_seen_ip,
        lastSeenTs: result.last_seen_ts,
      };
    } catch (e) {
      cerr('getDevice:', e);
      return null;
    }
  }

  /**
   * Updates the display name of a specific device.
   * @param {string} deviceId
   * @param {string} displayName - New display name for the device.
   * @returns {Promise<boolean>} `true` on success.
   */
  async updateDevice(deviceId, displayName) {
    try {
      const result = await this.api(`/devices/${enc(deviceId)}`, 'PUT', { display_name: displayName });
      return !result.errcode;
    } catch (e) {
      cerr('updateDevice:', e);
      return false;
    }
  }

  /**
   * Deletes a specific device and invalidates its access token.
   * Requires UIAA authentication via the `auth` parameter.
   * @param {string} deviceId
   * @param {Object} [auth] - UIAA auth object. If omitted the server will initiate the UIAA flow.
   * @returns {Promise<boolean>} `true` on success.
   */
  async deleteDevice(deviceId, auth) {
    try {
      const body = auth ? { auth } : {};
      const result = await this.api(`/devices/${enc(deviceId)}`, 'DELETE', body);
      return !result.errcode;
    } catch (e) {
      cerr('deleteDevice:', e);
      return false;
    }
  }

  /**
   * Deletes multiple devices and invalidates their access tokens.
   * Requires UIAA authentication via the `auth` parameter.
   * @param {string[]} deviceIds - Array of device IDs to delete.
   * @param {Object} [auth] - UIAA auth object. If omitted the server will initiate the UIAA flow.
   * @returns {Promise<boolean>} `true` on success.
   */
  async deleteDevices(deviceIds, auth) {
    try {
      const body = { devices: deviceIds };
      if (auth) body.auth = auth;
      const result = await this.api('/delete_devices', 'POST', body);
      return !result.errcode;
    } catch (e) {
      cerr('deleteDevices:', e);
      return false;
    }
  }

};
