# Auth API

Matrix authentication methods.

## Overview

This module provides 19 methods.

## Common Usage

```javascript
// Basic authentication flow
const client = new MxjsClient({ homeserver: 'https://matrix.org' });
const session = await client.login('username', 'password');
if (session) {
  console.log('Logged in as:', session.userId);
}
```

## Methods

- [`addThirdPartyIdentifier()`](#addthirdpartyidentifier)
- [`addThirdPartyIdentifierNew()`](#addthirdpartyidentifiernew)
- [`bindThirdPartyIdentifier()`](#bindthirdpartyidentifier)
- [`changePassword()`](#changepassword)
- [`deactivateAccount()`](#deactivateaccount)
- [`deleteThirdPartyIdentifier()`](#deletethirdpartyidentifier)
- [`getThirdPartyIdentifiers()`](#getthirdpartyidentifiers)
- [`getVersions()`](#getversions)
- [`login()`](#login)
- [`logout()`](#logout)
- [`logoutAll()`](#logoutall)
- [`refreshToken()`](#refreshtoken)
- [`register()`](#register)
- [`registerGuest()`](#registerguest)
- [`requestEmailTokenFor3pid()`](#requestemailtokenfor3pid)
- [`requestMsisdnTokenFor3pid()`](#requestmsisdntokenfor3pid)
- [`requestPasswordEmailToken()`](#requestpasswordemailtoken)
- [`requestPasswordMsisdnToken()`](#requestpasswordmsisdntoken)
- [`unbindThirdPartyIdentifier()`](#unbindthirdpartyidentifier)

---

## addThirdPartyIdentifier()

**Signature:** `async addThirdPartyIdentifier(threePidCreds, bind = false)`

Associates a validated third-party identifier with the account (legacy endpoint).

**Parameters:**

- `bind` **{boolean}** _(optional)_ - Default: `false]` - Whether to also bind to the identity server.

**Returns:** `Promise<boolean>` - `true` on success.

---

## addThirdPartyIdentifierNew()

**Signature:** `async addThirdPartyIdentifierNew(threePidCreds, auth)`

Adds a third-party identifier to the account using UIAA authentication.

**Parameters:**

- `auth` **{Object}** - UIAA auth object.

**Returns:** `Promise<boolean>` - `true` on success.

---

## bindThirdPartyIdentifier()

**Signature:** `async bindThirdPartyIdentifier(threePidCreds)`

Binds a validated third-party identifier to the account via an identity server.

**Parameters:** None

**Returns:** `Promise<boolean>` - `true` on success.

---

## changePassword()

**Signature:** `async changePassword(oldPassword, newPassword)`

Changes the current user's password.

**Parameters:**

- `oldPassword` **{string}**
- `newPassword` **{string}**

**Returns:** `Promise<boolean>` - `true` on success.

---

## deactivateAccount()

**Signature:** `async deactivateAccount(password)`

Permanently deactivates the current user's account.

**Parameters:**

- `password` **{string}** - Current account password for UIAA confirmation.

**Returns:** `Promise<boolean>` - `true` on success.

---

## deleteThirdPartyIdentifier()

**Signature:** `async deleteThirdPartyIdentifier(medium, address, options = {})`

Removes a third-party identifier from the account.

**Parameters:**

- `medium` **{string}** - The medium of the identifier (`email` or `msisdn`).
- `address` **{string}** - The address of the identifier.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional extra parameters (id_server, etc.).

**Returns:** `Promise<{idServerUnbindResult?: string` - |null>} Result object, or `null` on failure.

---

## getThirdPartyIdentifiers()

**Signature:** `async getThirdPartyIdentifiers()`

Gets the list of third-party identifiers (email/phone) associated with the current account.

**Parameters:** None

**Returns:** `Promise<Array<{medium: string, address: string, validated_at: number, added_at: number` - >|null>}

---

## getVersions()

**Signature:** `async getVersions()`

Fetches the Matrix spec versions supported by the homeserver.

**Parameters:** None

**Returns:** `Promise<{versions: string[]` - |null>} Object containing versions array, or null on failure.

---

## login()

**Signature:** `async login(username, password)`

Logs in with a username and password.

**Parameters:**

- `username` **{string}**
- `password` **{string}**

**Returns:** `Promise<{accessToken: string, userId: string` - |null>} Session info, or `null` on failure.

**Example:**

```javascript
const session = await client.login('username', 'password');
if (session) {
  console.log('Logged in as:', session.userId);
}
```

---

## logout()

**Signature:** `async logout()`

Logs out from the current session, invalidating the access token on the server.

**Parameters:** None

**Returns:** `Promise<boolean>` - `true` on success.

---

## logoutAll()

**Signature:** `async logoutAll()`

Logs out from all sessions, invalidating all access tokens for this user.

**Parameters:** None

**Returns:** `Promise<boolean>` - `true` on success.

---

## refreshToken()

**Signature:** `async refreshToken(refreshToken)`

Refreshes the current access token using a refresh token. Stores the new access token if the server returns one.

**Parameters:**

- `refreshToken` **{string}** - The refresh token obtained from a previous login or refresh.

**Returns:** `Promise<{accessToken: string, refreshToken?: string` - |null>} New tokens, or `null` on failure.

---

## register()

**Signature:** `async register(username, password)`

Matrix authentication methods.

**Parameters:**

- `Base` **{T}**
- `username` **{string}**
- `password` **{string}**

**Returns:** `Promise<{accessToken: string, userId: string` - |null>} Session info, or `null` on failure.

**Example:**

```javascript
const session = await client.register(Base, 'username', 'password');
if (session) {
  console.log('Logged in as:', session.userId);
}
```

---

## registerGuest()

**Signature:** `async registerGuest()`

Registers an anonymous guest account on the homeserver.

**Parameters:** None

**Returns:** `Promise<{accessToken: string, userId: string` - |null>} Session info, or `null` on failure.

**Example:**

```javascript
const session = await client.registerGuest();
if (session) {
  console.log('Logged in as:', session.userId);
}
```

---

## requestEmailTokenFor3pid()

**Signature:** `async requestEmailTokenFor3pid(clientSecret, email, sendAttempt, options = {})`

Requests an email token used to validate an email address for a 3PID association.

**Parameters:**

- `clientSecret` **{string}** - Unique string generated by the client.
- `email` **{string}** - The email address to send the token to.
- `sendAttempt` **{number}** - Incremented each time a new email should be sent.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional extra parameters (next_link, id_server, etc.).

**Returns:** `Promise<{sid: string` - |null>} Session ID, or `null` on failure.

---

## requestMsisdnTokenFor3pid()

**Signature:** `async requestMsisdnTokenFor3pid(clientSecret, country, phoneNumber, sendAttempt, options = {})`

Requests a phone token used to validate a phone number for a 3PID association.

**Parameters:**

- `clientSecret` **{string}** - Unique string generated by the client.
- `country` **{string}** - ISO 3166-1 alpha-2 country code.
- `phoneNumber` **{string}** - The phone number to send the token to.
- `sendAttempt` **{number}** - Incremented each time a new SMS should be sent.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional extra parameters (next_link, id_server, etc.).

**Returns:** `Promise<{sid: string` - |null>} Session ID, or `null` on failure.

---

## requestPasswordEmailToken()

**Signature:** `async requestPasswordEmailToken(clientSecret, email, sendAttempt, options = {})`

Requests an email token to be used for a password reset flow.

**Parameters:**

- `clientSecret` **{string}** - Unique string generated by the client.
- `email` **{string}** - The email address to send the token to.
- `sendAttempt` **{number}** - Incremented each time a new email should be sent.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional extra parameters (next_link, id_server, etc.).

**Returns:** `Promise<{sid: string` - |null>} Session ID, or `null` on failure.

---

## requestPasswordMsisdnToken()

**Signature:** `async requestPasswordMsisdnToken(clientSecret, country, phoneNumber, sendAttempt, options = {})`

Requests a phone token to be used for a password reset flow.

**Parameters:**

- `clientSecret` **{string}** - Unique string generated by the client.
- `country` **{string}** - ISO 3166-1 alpha-2 country code.
- `phoneNumber` **{string}** - The phone number to send the token to.
- `sendAttempt` **{number}** - Incremented each time a new SMS should be sent.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional extra parameters (next_link, id_server, etc.).

**Returns:** `Promise<{sid: string` - |null>} Session ID, or `null` on failure.

---

## unbindThirdPartyIdentifier()

**Signature:** `async unbindThirdPartyIdentifier(medium, address, options = {})`

Unbinds a third-party identifier from the account on the identity server.

**Parameters:**

- `medium` **{string}** - The medium of the identifier (`email` or `msisdn`).
- `address` **{string}** - The address of the identifier.
- `options` **{Object}** _(optional)_ - Default: `{}]` - Optional extra parameters (id_server, etc.).

**Returns:** `Promise<{idServerUnbindResult?: string` - |null>} Result object, or `null` on failure.

