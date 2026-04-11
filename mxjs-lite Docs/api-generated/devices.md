# Devices API

Device management methods.

## Overview

This module provides 5 methods.

## Methods

- [`deleteDevice()`](#deletedevice)
- [`deleteDevices()`](#deletedevices)
- [`getDevice()`](#getdevice)
- [`getDevices()`](#getdevices)
- [`updateDevice()`](#updatedevice)

---

## deleteDevice()

**Signature:** `async deleteDevice(deviceId, auth)`

Deletes a specific device and invalidates its access token. Requires UIAA authentication via the `auth` parameter.

**Parameters:**

- `deviceId` **{string}**
- `auth` **{Object}** _(optional)_ - UIAA auth object. If omitted the server will initiate the UIAA flow.

**Returns:** `Promise<boolean>` - `true` on success.

---

## deleteDevices()

**Signature:** `async deleteDevices(deviceIds, auth)`

Deletes multiple devices and invalidates their access tokens. Requires UIAA authentication via the `auth` parameter.

**Parameters:**

- `deviceIds` **{string[]}** - Array of device IDs to delete.
- `auth` **{Object}** _(optional)_ - UIAA auth object. If omitted the server will initiate the UIAA flow.

**Returns:** `Promise<boolean>` - `true` on success.

---

## getDevice()

**Signature:** `async getDevice(deviceId)`

Gets information about a specific device.

**Parameters:**

- `deviceId` **{string}**

**Returns:** `Promise<{deviceId: string, displayName?: string, lastSeenIp?: string, lastSeenTs?: number` - |null>}

---

## getDevices()

**Signature:** `async getDevices()`

Device management methods.

**Parameters:**

- `Base` **{T}**

**Returns:** `Promise<Array<{deviceId: string, displayName?: string, lastSeenIp?: string, lastSeenTs?: number` - >|null>}

---

## updateDevice()

**Signature:** `async updateDevice(deviceId, displayName)`

Updates the display name of a specific device.

**Parameters:**

- `deviceId` **{string}**
- `displayName` **{string}** - New display name for the device.

**Returns:** `Promise<boolean>` - `true` on success.

