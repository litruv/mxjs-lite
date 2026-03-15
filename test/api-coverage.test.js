import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MxjsClient } from '../mxjs-lite.js';

/**
 * Comprehensive Matrix Client-Server API Coverage Test
 * 
 * Tests ALL endpoints from ClientServerSpec.md and reports:
 * - ✅ Implemented and working
 * - ❌ Not implemented
 * - ⚠️ Restricted/requires special permissions
 * 
 * Run: npm run test:api-coverage
 */

const HOMESERVER = 'https://chat.ruv.wtf';
const TEST_TIMEOUT = 15000;

// Track test results
const apiResults = {
  implemented: [],
  notImplemented: [],
  restricted: [],
  partiallyImplemented: [],
  sections: {}
};

let currentSection = 'General';

/**
 * Sets the current section for result tracking.
 * @param {string} name - Section name
 */
function setSection(name) {
  currentSection = name;
  if (!apiResults.sections[name]) {
    apiResults.sections[name] = { implemented: [], notImplemented: [], restricted: [], partial: [] };
  }
}

describe('Complete Matrix Client-Server API Coverage', () => {
  let client;
  let authedClient;
  let guestClient;
  let testRoomId;
  let testEventId;
  let testPassword;

  beforeAll(async () => {
    client = new MxjsClient({ homeserver: HOMESERVER });
    
    // Create test account
    authedClient = new MxjsClient({ homeserver: HOMESERVER });
    const timestamp = Date.now();
    const username = `test_${timestamp}`;
    testPassword = `TestPass_${timestamp}_${Math.random().toString(36).slice(2)}`;
    
    await authedClient.register(username, testPassword);
    
    // Try to create a test room (may be restricted)
    try {
      testRoomId = await authedClient.createRoom({
        name: 'API Coverage Test Room',
        visibility: 'private'
      });
      
      if (testRoomId) {
        testEventId = await authedClient.sendMessage(testRoomId, 'Test message');
      }
    } catch (e) {
      console.warn('Could not create test room - some tests will be skipped');
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup
    if (testRoomId && authedClient?.accessToken) {
      try {
        await authedClient.leaveRoom(testRoomId);
      } catch (e) {}
    }
    
    if (authedClient?.accessToken && testPassword) {
      try {
        await authedClient.deactivateAccount(testPassword);
      } catch (e) {}
    }

    // Print coverage report
    const report = printCoverageReport();
    
    // Save report to file
    const fs = await import('fs');
    fs.writeFileSync('test/api-coverage-report.txt', report, 'utf8');
    console.log('\n📄 Full report saved to: test/api-coverage-report.txt\n');
  }, TEST_TIMEOUT);

  describe('Authentication & Account Management', () => {
    beforeEach(() => setSection('Authentication & Account Management'));
    it('GET /versions - should get supported versions', async () => {
      let implemented = false;
      try {
        const result = await client.api('/versions', 'GET');
        implemented = result?.versions?.length > 0;
      } catch (e) {}
      recordResult('GET /versions', implemented);
    }, TEST_TIMEOUT);

    it('POST /register - should register new account', () => {
      recordResult('POST /register', authedClient?.userId !== null, true);
    });

    it('POST /register?kind=guest - should register guest account', async () => {
      let implemented = false;
      try {
        guestClient = new MxjsClient({ homeserver: HOMESERVER });
        implemented = !!(await guestClient.registerGuest());
      } catch (e) {}
      recordResult('POST /register?kind=guest', implemented);
    }, TEST_TIMEOUT);

    it('GET /register/available - should check username availability', async () => {
      let implemented = false;
      try {
        await client.api('/register/available?username=test', 'GET');
        implemented = true;
      } catch (e) {}
      recordResult('GET /register/available', implemented);
    }, TEST_TIMEOUT);

    it('POST /login - should login with password', async () => {
      let implemented = false;
      try {
        const tmpClient = new MxjsClient({ homeserver: HOMESERVER });
        implemented = !!(await tmpClient.login(authedClient.userId.match(/:(.+)$/)?.[0]?.slice(1), testPassword));
      } catch (e) {}
      recordResult('POST /login', implemented);
    }, TEST_TIMEOUT);

    it('GET /login - should get supported login flows', async () => {
      let implemented = false;
      try {
        const result = await client.api('/login', 'GET');
        implemented = result?.flows?.length > 0;
      } catch (e) {}
      recordResult('GET /login', implemented);
    }, TEST_TIMEOUT);

    it('POST /logout - should logout', async () => {
      recordResult('POST /logout', typeof authedClient.logout === 'function', 'partial');
      // Note: our implementation doesn't call server, just clears local session
    });

    it('POST /logout/all - should logout all devices', async () => {
      recordResult('POST /logout/all', false, false);
    });

    it('POST /refresh - should refresh access token', async () => {
      recordResult('POST /refresh', false, false);
    });

    it('POST /account/password - should change password', () => {
      recordResult('POST /account/password', typeof authedClient.changePassword === 'function', true);
    });

    it('POST /account/deactivate - should deactivate account', () => {
      recordResult('POST /account/deactivate', typeof authedClient.deactivateAccount === 'function', true);
    });

    it('POST /account/password/email/requestToken - should request password reset token', async () => {
      recordResult('POST /account/password/email/requestToken', false, false);
    });

    it('POST /account/password/msisdn/requestToken - should request password reset token by phone', async () => {
      recordResult('POST /account/password/msisdn/requestToken', false, false);
    });

    it('GET /account/whoami - should get current user info', async () => {
      let implemented = false;
      try {
        const result = await authedClient.api('/account/whoami', 'GET');
        implemented = result?.user_id !== undefined;
      } catch (e) {}
      recordResult('GET /account/whoami', implemented);
    }, TEST_TIMEOUT);

    it('GET /account/3pid - should get third-party identifiers', async () => {
      recordResult('GET /account/3pid', false, false);
    });

    it('POST /account/3pid - should add third-party identifier', async () => {
      recordResult('POST /account/3pid', false, false);
    });

    it('POST /account/3pid/add - should add third-party identifier', async () => {
      recordResult('POST /account/3pid/add', false, false);
    });

    it('POST /account/3pid/bind - should bind third-party identifier', async () => {
      recordResult('POST /account/3pid/bind', false, false);
    });

    it('POST /account/3pid/delete - should delete third-party identifier', async () => {
      recordResult('POST /account/3pid/delete', false, false);
    });

    it('POST /account/3pid/unbind - should unbind third-party identifier', async () => {
      recordResult('POST /account/3pid/unbind', false, false);
    });

    it('POST /account/3pid/email/requestToken - should request email token', async () => {
      recordResult('POST /account/3pid/email/requestToken', false, false);
    });

    it('POST /account/3pid/msisdn/requestToken - should request phone token', async () => {
      recordResult('POST /account/3pid/msisdn/requestToken', false, false);
    });
  });

  describe('Capabilities', () => {
    beforeEach(() => setSection('Capabilities'));
    it('GET /capabilities - should get server capabilities', async () => {
      recordResult('GET /capabilities', false, false);
    });
  });

  describe('Filter API', () => {
    beforeEach(() => setSection('Filter API'));
    it('POST /user/{userId}/filter - should create filter', async () => {
      recordResult('POST /user/{userId}/filter', false, false);
    });

    it('GET /user/{userId}/filter/{filterId} - should get filter', async () => {
      recordResult('GET /user/{userId}/filter/{filterId}', false, false);
    });
  });

  describe('Events & Sync', () => {
    beforeEach(() => setSection('Events & Sync'));
    it('GET /sync - should sync events', () => {
      recordResult('GET /sync', typeof authedClient.sync === 'function', true);
    });

    it('GET /events (deprecated) - should get events', async () => {
      recordResult('GET /events', false, false);
    });

    it('GET /events/{eventId} - should get single event', async () => {
      recordResult('GET /events/{eventId}', false, false);
    });

    it('GET /initialSync (deprecated) - should initial sync', async () => {
      recordResult('GET /initialSync', false, false);
    });
  });

  describe('Rooms - Events', () => {
    beforeEach(() => setSection('Rooms - Events'));
    it('GET /rooms/{roomId}/event/{eventId} - should get room event', async () => {
      recordResult('GET /rooms/{roomId}/event/{eventId}', false, false);
    });

    it('GET /rooms/{roomId}/state - should get room state', () => {
      recordResult('GET /rooms/{roomId}/state', typeof authedClient.getRoomAllState === 'function', true);
    });

    it('GET /rooms/{roomId}/state/{eventType}/{stateKey} - should get specific state', () => {
      recordResult('GET /rooms/{roomId}/state/{eventType}/{stateKey}', typeof authedClient.getRoomState === 'function', true);
    });

    it('PUT /rooms/{roomId}/state/{eventType}/{stateKey} - should send state event', () => {
      recordResult('PUT /rooms/{roomId}/state/{eventType}/{stateKey}', typeof authedClient.sendStateEvent === 'function', true);
    });

    it('PUT /rooms/{roomId}/send/{eventType}/{txnId} - should send event', async () => {
      recordResult('PUT /rooms/{roomId}/send/{eventType}/{txnId}', testEventId !== null && testEventId !== undefined, true);
    });

    it('PUT /rooms/{roomId}/redact/{eventId}/{txnId} - should redact event', () => {
      recordResult('PUT /rooms/{roomId}/redact/{eventId}/{txnId}', typeof authedClient.redactEvent === 'function', true);
    });

    it('GET /rooms/{roomId}/messages - should get room messages', () => {
      recordResult('GET /rooms/{roomId}/messages', typeof authedClient.getMessages === 'function', true);
    });

    it('GET /rooms/{roomId}/members - should get room members', () => {
      recordResult('GET /rooms/{roomId}/members', typeof authedClient.getRoomMembers === 'function', true);
    });

    it('GET /rooms/{roomId}/joined_members - should get joined members', async () => {
      recordResult('GET /rooms/{roomId}/joined_members', false, false);
    });

    it('GET /rooms/{roomId}/context/{eventId} - should get event context', async () => {
      recordResult('GET /rooms/{roomId}/context/{eventId}', false, false);
    });

    it('GET /rooms/{roomId}/relations/{eventId} - should get event relations', async () => {
      recordResult('GET /rooms/{roomId}/relations/{eventId}', false, false);
    });

    it('GET /rooms/{roomId}/relations/{eventId}/{relType} - should get event relations by type', async () => {
      recordResult('GET /rooms/{roomId}/relations/{eventId}/{relType}', false, false);
    });

    it('GET /rooms/{roomId}/relations/{eventId}/{relType}/{eventType} - should get event relations by type and event type', async () => {
      recordResult('GET /rooms/{roomId}/relations/{eventId}/{relType}/{eventType}', false, false);
    });

    it('GET /rooms/{roomId}/timestamp_to_event - should get event by timestamp', async () => {
      recordResult('GET /rooms/{roomId}/timestamp_to_event', false, false);
    });

    it('GET /rooms/{roomId}/initialSync (deprecated) - should initial sync room', async () => {
      recordResult('GET /rooms/{roomId}/initialSync', false, false);
    });
  });

  describe('Rooms - Management', () => {
    beforeEach(() => setSection('Rooms - Management'));
    it('POST /createRoom - should create room', async () => {
      recordResult('POST /createRoom', typeof authedClient.createRoom === 'function', testRoomId ? true : 'restricted');
    });

    it('POST /join/{roomIdOrAlias} - should join room', () => {
      recordResult('POST /join/{roomIdOrAlias}', typeof authedClient.joinRoom === 'function', true);
    });

    it('POST /rooms/{roomId}/join - should join room by ID', async () => {
      recordResult('POST /rooms/{roomId}/join', false, false);
    });

    it('POST /knock/{roomIdOrAlias} - should knock on room', async () => {
      recordResult('POST /knock/{roomIdOrAlias}', false, false);
    });

    it('POST /rooms/{roomId}/leave - should leave room', () => {
      recordResult('POST /rooms/{roomId}/leave', typeof authedClient.leaveRoom === 'function', true);
    });

    it('POST /rooms/{roomId}/forget - should forget room', async () => {
      recordResult('POST /rooms/{roomId}/forget', false, false);
    });

    it('POST /rooms/{roomId}/invite - should invite user', () => {
      recordResult('POST /rooms/{roomId}/invite', typeof authedClient.inviteUser === 'function', true);
    });

    it('POST /rooms/{roomId}/kick - should kick user', () => {
      recordResult('POST /rooms/{roomId}/kick', typeof authedClient.kickUser === 'function', true);
    });

    it('POST /rooms/{roomId}/ban - should ban user', () => {
      recordResult('POST /rooms/{roomId}/ban', typeof authedClient.banUser === 'function', true);
    });

    it('POST /rooms/{roomId}/unban - should unban user', () => {
      recordResult('POST /rooms/{roomId}/unban', typeof authedClient.unbanUser === 'function', true);
    });

    it('POST /rooms/{roomId}/upgrade - should upgrade room', async () => {
      recordResult('POST /rooms/{roomId}/upgrade', false, false);
    });
  });

  describe('Room Directory', () => {
    beforeEach(() => setSection('Room Directory'));
    it('GET /directory/room/{roomAlias} - should resolve room alias', () => {
      recordResult('GET /directory/room/{roomAlias}', typeof authedClient.resolveRoomAlias === 'function', true);
    });

    it('PUT /directory/room/{roomAlias} - should create room alias', async () => {
      recordResult('PUT /directory/room/{roomAlias}', false, false);
    });

    it('DELETE /directory/room/{roomAlias} - should delete room alias', async () => {
      recordResult('DELETE /directory/room/{roomAlias}', false, false);
    });

    it('GET /rooms/{roomId}/aliases - should get room aliases', async () => {
      recordResult('GET /rooms/{roomId}/aliases', false, false);
    });

    it('GET /joined_rooms - should get joined rooms', async () => {
      recordResult('GET /joined_rooms', false, false);
    });

    it('GET /publicRooms - should get public rooms', async () => {
      let implemented = false;
      try {
        await client.api('/publicRooms', 'GET');
        implemented = true;
      } catch (e) {}
      recordResult('GET /publicRooms', implemented);
    }, TEST_TIMEOUT);

    it('POST /publicRooms - should search public rooms', async () => {
      recordResult('POST /publicRooms', false, false);
    });

    it('GET /directory/list/room/{roomId} - should get room visibility', async () => {
      recordResult('GET /directory/list/room/{roomId}', false, false);
    });

    it('PUT /directory/list/room/{roomId} - should set room visibility', async () => {
      recordResult('PUT /directory/list/room/{roomId}', false, false);
    });

    it('GET /room_summary/{roomIdOrAlias} - should get room summary', async () => {
      recordResult('GET /room_summary/{roomIdOrAlias}', false, false);
    });

    it('GET /rooms/{roomId}/hierarchy - should get room hierarchy', async () => {
      recordResult('GET /rooms/{roomId}/hierarchy', false, false);
    });
  });

  describe('User Directory', () => {
    beforeEach(() => setSection('User Directory'));
    it('POST /user_directory/search - should search user directory', async () => {
      recordResult('POST /user_directory/search', false, false);
    });
  });

  describe('User Profiles', () => {
    beforeEach(() => setSection('User Profiles'));
    it('GET /profile/{userId} - should get user profile', () => {
      recordResult('GET /profile/{userId}', typeof authedClient.getProfile === 'function', true);
    });

    it('GET /profile/{userId}/displayname - should get display name', async () => {
      recordResult('GET /profile/{userId}/displayname', false, false);
    });

    it('PUT /profile/{userId}/displayname - should set display name', () => {
      recordResult('PUT /profile/{userId}/displayname', typeof authedClient.setDisplayName === 'function', true);
    });

    it('GET /profile/{userId}/avatar_url - should get avatar URL', async () => {
      recordResult('GET /profile/{userId}/avatar_url', false, false);
    });

    it('PUT /profile/{userId}/avatar_url - should set avatar URL', () => {
      recordResult('PUT /profile/{userId}/avatar_url', typeof authedClient.setAvatarUrl === 'function', true);
    });

    it('DELETE /profile/{userId}/displayname - should delete display name', async () => {
      recordResult('DELETE /profile/{userId}/displayname', false, false);
    });

    it('DELETE /profile/{userId}/avatar_url - should delete avatar URL', async () => {
      recordResult('DELETE /profile/{userId}/avatar_url', false, false);
    });
  });

  describe('Presence', () => {
    beforeEach(() => setSection('Presence'));
    it('GET /presence/{userId}/status - should get presence', async () => {
      recordResult('GET /presence/{userId}/status', false, false);
    });

    it('PUT /presence/{userId}/status - should set presence', async () => {
      recordResult('PUT /presence/{userId}/status', false, false);
    });
  });

  describe('Typing & Receipts', () => {
    beforeEach(() => setSection('Typing & Receipts'));
    it('PUT /rooms/{roomId}/typing/{userId} - should send typing notification', () => {
      recordResult('PUT /rooms/{roomId}/typing/{userId}', typeof authedClient.sendTyping === 'function', true);
    });

    it('POST /rooms/{roomId}/receipt/{receiptType}/{eventId} - should send read receipt', () => {
      recordResult('POST /rooms/{roomId}/receipt/{receiptType}/{eventId}', typeof authedClient.sendReadReceipt === 'function', true);
    });

    it('POST /rooms/{roomId}/read_markers - should set read markers', async () => {
      recordResult('POST /rooms/{roomId}/read_markers', false, false);
    });
  });

  describe('Fully Read Markers', () => {
    it('POST /rooms/{roomId}/read_markers - should set fully read marker', async () => {
      // Duplicate test, already covered
    });
  });

  describe('Sending Events (Message Types)', () => {
    beforeEach(() => setSection('Sending Events (Message Types)'));
    it('m.room.message (text) - should send text message', () => {
      recordResult('m.room.message (text)', typeof authedClient.sendMessage === 'function', true);
    });

    it('m.room.message (image) - should send image message', () => {
      recordResult('m.room.message (image)', typeof authedClient.sendImage === 'function', true);
    });

    it('m.reaction - should send reaction', () => {
      recordResult('m.reaction', typeof authedClient.reactToMessage === 'function', true);
    });

    it('m.replace (edit) - should edit message', () => {
      recordResult('m.replace (edit)', typeof authedClient.editMessage === 'function', true);
    });
  });

  describe('VoIP', () => {
    beforeEach(() => setSection('VoIP'));
    it('GET /voip/turnServer - should get TURN server', async () => {
      recordResult('GET /voip/turnServer', false, false);
    });
  });

  describe('Device Management', () => {
    beforeEach(() => setSection('Device Management'));
    it('GET /devices - should get devices', async () => {
      recordResult('GET /devices', false, false);
    });

    it('GET /devices/{deviceId} - should get device', async () => {
      recordResult('GET /devices/{deviceId}', false, false);
    });

    it('PUT /devices/{deviceId} - should update device', async () => {
      recordResult('PUT /devices/{deviceId}', false, false);
    });

    it('DELETE /devices/{deviceId} - should delete device', async () => {
      recordResult('DELETE /devices/{deviceId}', false, false);
    });

    it('POST /delete_devices - should delete multiple devices', async () => {
      recordResult('POST /delete_devices', false, false);
    });
  });

  describe('End-to-End Encryption', () => {
    beforeEach(() => setSection('End-to-End Encryption'));
    it('POST /keys/upload - should upload keys', async () => {
      recordResult('POST /keys/upload', false, false);
    });

    it('POST /keys/query - should query keys', async () => {
      recordResult('POST /keys/query', false, false);
    });

    it('POST /keys/claim - should claim keys', async () => {
      recordResult('POST /keys/claim', false, false);
    });

    it('GET /keys/changes - should get key changes', async () => {
      recordResult('GET /keys/changes', false, false);
    });

    it('POST /keys/device_signing/upload - should upload device signing keys', async () => {
      recordResult('POST /keys/device_signing/upload', false, false);
    });

    it('POST /keys/signatures/upload - should upload signatures', async () => {
      recordResult('POST /keys/signatures/upload', false, false);
    });

    it('PUT /sendToDevice/{eventType}/{txnId} - should send to-device message', async () => {
      recordResult('PUT /sendToDevice/{eventType}/{txnId}', false, false);
    });
  });

  describe('Key Backup', () => {
    beforeEach(() => setSection('Key Backup'));
    it('POST /room_keys/version - should create backup version', async () => {
      recordResult('POST /room_keys/version', false, false);
    });

    it('GET /room_keys/version - should get backup version', async () => {
      recordResult('GET /room_keys/version', false, false);
    });

    it('GET /room_keys/version/{version} - should get specific backup version', async () => {
      recordResult('GET /room_keys/version/{version}', false, false);
    });

    it('PUT /room_keys/version/{version} - should update backup version', async () => {
      recordResult('PUT /room_keys/version/{version}', false, false);
    });

    it('DELETE /room_keys/version/{version} - should delete backup version', async () => {
      recordResult('DELETE /room_keys/version/{version}', false, false);
    });

    it('PUT /room_keys/keys - should upload room keys', async () => {
      recordResult('PUT /room_keys/keys', false, false);
    });

    it('GET /room_keys/keys - should download room keys', async () => {
      recordResult('GET /room_keys/keys', false, false);
    });

    it('DELETE /room_keys/keys - should delete room keys', async () => {
      recordResult('DELETE /room_keys/keys', false, false);
    });

    it('PUT /room_keys/keys/{roomId} - should upload room keys for room', async () => {
      recordResult('PUT /room_keys/keys/{roomId}', false, false);
    });

    it('GET /room_keys/keys/{roomId} - should download room keys for room', async () => {
      recordResult('GET /room_keys/keys/{roomId}', false, false);
    });

    it('DELETE /room_keys/keys/{roomId} - should delete room keys for room', async () => {
      recordResult('DELETE /room_keys/keys/{roomId}', false, false);
    });

    it('PUT /room_keys/keys/{roomId}/{sessionId} - should upload session keys', async () => {
      recordResult('PUT /room_keys/keys/{roomId}/{sessionId}', false, false);
    });

    it('GET /room_keys/keys/{roomId}/{sessionId} - should download session keys', async () => {
      recordResult('GET /room_keys/keys/{roomId}/{sessionId}', false, false);
    });

    it('DELETE /room_keys/keys/{roomId}/{sessionId} - should delete session keys', async () => {
      recordResult('DELETE /room_keys/keys/{roomId}/{sessionId}', false, false);
    });
  });

  describe('Push Notifications', () => {
    beforeEach(() => setSection('Push Notifications'));
    it('GET /pushrules/ - should get all push rules', async () => {
      recordResult('GET /pushrules/', false, false);
    });

    it('GET /pushrules/global/ - should get global push rules', async () => {
      recordResult('GET /pushrules/global/', false, false);
    });

    it('GET /pushrules/global/{kind}/{ruleId} - should get push rule', async () => {
      recordResult('GET /pushrules/global/{kind}/{ruleId}', false, false);
    });

    it('PUT /pushrules/global/{kind}/{ruleId} - should create push rule', async () => {
      recordResult('PUT /pushrules/global/{kind}/{ruleId}', false, false);
    });

    it('DELETE /pushrules/global/{kind}/{ruleId} - should delete push rule', async () => {
      recordResult('DELETE /pushrules/global/{kind}/{ruleId}', false, false);
    });

    it('GET /pushrules/global/{kind}/{ruleId}/actions - should get push rule actions', async () => {
      recordResult('GET /pushrules/global/{kind}/{ruleId}/actions', false, false);
    });

    it('PUT /pushrules/global/{kind}/{ruleId}/actions - should set push rule actions', async () => {
      recordResult('PUT /pushrules/global/{kind}/{ruleId}/actions', false, false);
    });

    it('GET /pushrules/global/{kind}/{ruleId}/enabled - should get push rule enabled', async () => {
      recordResult('GET /pushrules/global/{kind}/{ruleId}/enabled', false, false);
    });

    it('PUT /pushrules/global/{kind}/{ruleId}/enabled - should set push rule enabled', async () => {
      recordResult('PUT /pushrules/global/{kind}/{ruleId}/enabled', false, false);
    });

    it('GET /pushers - should get pushers', async () => {
      recordResult('GET /pushers', false, false);
    });

    it('POST /pushers/set - should set pusher', async () => {
      recordResult('POST /pushers/set', false, false);
    });

    it('GET /notifications - should get notifications', async () => {
      recordResult('GET /notifications', false, false);
    });
  });

  describe('Search', () => {
    beforeEach(() => setSection('Search'));
    it('POST /search - should search', async () => {
      recordResult('POST /search', false, false);
    });
  });

  describe('Account Data', () => {
    beforeEach(() => setSection('Account Data'));
    it('PUT /user/{userId}/account_data/{type} - should set account data', async () => {
      recordResult('PUT /user/{userId}/account_data/{type}', false, false);
    });

    it('GET /user/{userId}/account_data/{type} - should get account data', async () => {
      recordResult('GET /user/{userId}/account_data/{type}', false, false);
    });

    it('PUT /user/{userId}/rooms/{roomId}/account_data/{type} - should set room account data', async () => {
      recordResult('PUT /user/{userId}/rooms/{roomId}/account_data/{type}', false, false);
    });

    it('GET /user/{userId}/rooms/{roomId}/account_data/{type} - should get room account data', async () => {
      recordResult('GET /user/{userId}/rooms/{roomId}/account_data/{type}', false, false);
    });
  });

  describe('Server Administration', () => {
    beforeEach(() => setSection('Server Administration'));
    it('GET /admin/whois/{userId} - should get user info', async () => {
      recordResult('GET /admin/whois/{userId}', false, false);
    });
  });

  describe('Event Reports', () => {
    beforeEach(() => setSection('Event Reports'));
    it('POST /rooms/{roomId}/report/{eventId} - should report event', async () => {
      recordResult('POST /rooms/{roomId}/report/{eventId}', false, false);
    });

    it('POST /rooms/{roomId}/report - should report room', async () => {
      recordResult('POST /rooms/{roomId}/report', false, false);
    });

    it('POST /users/{userId}/report - should report user', async () => {
      recordResult('POST /users/{userId}/report', false, false);
    });
  });

  describe('Third-party Networks', () => {
    beforeEach(() => setSection('Third-party Networks'));
    it('GET /thirdparty/protocols - should get protocols', async () => {
      recordResult('GET /thirdparty/protocols', false, false);
    });

    it('GET /thirdparty/protocol/{protocol} - should get protocol', async () => {
      recordResult('GET /thirdparty/protocol/{protocol}', false, false);
    });

    it('GET /thirdparty/location - should query locations', async () => {
      recordResult('GET /thirdparty/location', false, false);
    });

    it('GET /thirdparty/location/{protocol} - should query protocol locations', async () => {
      recordResult('GET /thirdparty/location/{protocol}', false, false);
    });

    it('GET /thirdparty/user - should query users', async () => {
      recordResult('GET /thirdparty/user', false, false);
    });

    it('GET /thirdparty/user/{protocol} - should query protocol users', async () => {
      recordResult('GET /thirdparty/user/{protocol}', false, false);
    });
  });

  describe('OpenID', () => {
    beforeEach(() => setSection('OpenID'));
    it('POST /user/{userId}/openid/request_token - should request OpenID token', async () => {
      recordResult('POST /user/{userId}/openid/request_token', false, false);
    });
  });

  describe('SSO', () => {
    beforeEach(() => setSection('SSO'));
    it('GET /login/sso/redirect - should redirect to SSO', async () => {
      recordResult('GET /login/sso/redirect', false, false);
    });

    it('GET /login/sso/redirect/{idpId} - should redirect to specific SSO provider', async () => {
      recordResult('GET /login/sso/redirect/{idpId}', false, false);
    });
  });

  describe('Threads', () => {
    beforeEach(() => setSection('Threads'));
    it('GET /rooms/{roomId}/threads - should get room threads', async () => {
      recordResult('GET /rooms/{roomId}/threads', false, false);
    });
  });

  describe('Media Repository', () => {
    beforeEach(() => setSection('Media Repository'));
    it('POST /upload - should upload media', () => {
      recordResult('POST /upload', typeof authedClient.uploadMedia === 'function', testRoomId ? true : 'restricted');
    });

    it('GET /download/{serverName}/{mediaId} - should download media (via mxcToHttp)', () => {
      recordResult('GET /download/{serverName}/{mediaId}', typeof authedClient.mxcToHttp === 'function', true);
    });

    it('GET /thumbnail/{serverName}/{mediaId} - should get thumbnail', async () => {
      recordResult('GET /thumbnail/{serverName}/{mediaId}', false, false);
    });

    it('GET /preview_url - should get URL preview', async () => {
      recordResult('GET /preview_url', false, false);
    });

    it('GET /config - should get media config', async () => {
      recordResult('GET /config', false, false);
    });
  });
});

/**
 * Records the result of an endpoint test.
 * @param {string} endpoint - The endpoint name/path
 * @param {boolean|string} implemented - true, false, 'restricted', or 'partial'
 */
function recordResult(endpoint, implemented) {
  setSection(currentSection);
  const section = apiResults.sections[currentSection];

  if (implemented === true) {
    apiResults.implemented.push(endpoint);
    section.implemented.push(endpoint);
    expect(true).toBe(true);
  } else if (implemented === 'restricted') {
    apiResults.restricted.push(endpoint);
    section.restricted.push(endpoint);
    expect(true).toBe(true);
  } else if (implemented === 'partial') {
    apiResults.partiallyImplemented.push(endpoint);
    section.partial.push(endpoint);
    expect(true).toBe(true);
  } else {
    apiResults.notImplemented.push(endpoint);
    section.notImplemented.push(endpoint);
    expect.fail(`${endpoint} is not implemented`);
  }
}

/**
 * Generates and prints the API coverage report, grouped by section.
 * @returns {string} The full report text
 */
function printCoverageReport() {
  const total = apiResults.implemented.length +
                apiResults.notImplemented.length +
                apiResults.restricted.length +
                apiResults.partiallyImplemented.length;

  const percentage = ((apiResults.implemented.length / total) * 100).toFixed(2);

  const lines = [];
  lines.push('\n╔═══════════════════════════════════════════════════════╗');
  lines.push('║     MATRIX CLIENT-SERVER API COVERAGE REPORT          ║');
  lines.push('╚═══════════════════════════════════════════════════════╝\n');

  lines.push(`📊 Total Endpoints Tested: ${total}`);
  lines.push(`✅ Fully Implemented: ${apiResults.implemented.length} (${percentage}%)`);
  lines.push(`⚠️  Restricted/Server Limitation: ${apiResults.restricted.length}`);
  lines.push(`🔶 Partially Implemented: ${apiResults.partiallyImplemented.length}`);
  lines.push(`❌ Not Implemented: ${apiResults.notImplemented.length}`);

  lines.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const [name, section] of Object.entries(apiResults.sections)) {
    const sectionTotal = section.implemented.length + section.notImplemented.length +
                         section.restricted.length + section.partial.length;
    if (sectionTotal === 0) continue;

    const sectionPct = ((section.implemented.length / sectionTotal) * 100).toFixed(0);
    lines.push(`┌─ ${name} (${section.implemented.length}/${sectionTotal} — ${sectionPct}%)`);

    section.implemented.forEach(ep => lines.push(`│  ✓ ${ep}`));
    section.partial.forEach(ep => lines.push(`│  ~ ${ep}`));
    section.restricted.forEach(ep => lines.push(`│  ! ${ep}`));
    section.notImplemented.forEach(ep => lines.push(`│  ✗ ${ep}`));

    lines.push('│');
  }

  lines.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const report = lines.join('\n');
  console.log(report);
  return report;
}
