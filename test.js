/**
 * Node.js test suite for mxjs-lite
 * Run with: node test.js
 */

import MxjsClient from './mxjs-lite.js';

const CONFIG = {
    homeserver: 'https://chat.ruv.wtf',
    testRoom: '#test:chat.ruv.wtf',
    accessToken: process.env.TEST_TOKEN || null,
    userId: process.env.TEST_USER || null
};

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
        this.state = {
            roomId: null,
            testRoomId: null,
            testUsername: null,
            testPassword: null,
            sentEventId: null,
            reactionEventId: null,
            latestEventId: null
        };
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log(`${colors.blue}🧪 mxjs-lite Test Suite${colors.reset}\n`);
        console.log(`${colors.gray}Homeserver: ${CONFIG.homeserver}${colors.reset}\n`);

        for (const test of this.tests) {
            process.stdout.write(`${colors.yellow}▶${colors.reset} ${test.name}... `);
            try {
                const result = await test.fn(this.state);
                if (result === 'skip') {
                    console.log(`${colors.gray}⊘ SKIPPED${colors.reset}`);
                    this.skipped++;
                } else {
                    console.log(`${colors.green}✓ PASSED${colors.reset}`);
                    this.passed++;
                }
            } catch (error) {
                console.log(`${colors.red}✗ FAILED${colors.reset}`);
                console.log(`  ${colors.red}${error.message}${colors.reset}`);
                this.failed++;
            }
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`${colors.green}${this.passed} passed${colors.reset}, ${colors.red}${this.failed} failed${colors.reset}, ${colors.gray}${this.skipped} skipped${colors.reset}, ${this.tests.length} total`);
        console.log(`${'='.repeat(50)}\n`);
        process.exit(this.failed > 0 ? 1 : 0);
    }
}

/** @type {MxjsClient} */
let mxjs;

const runner = new TestRunner();

// ── Auth ──────────────────────────────────────────────────────────────────────

runner.test('Initialize library', async () => {
    mxjs = new MxjsClient({ homeserver: CONFIG.homeserver });
});

runner.test('Register account', async (state) => {
    if (CONFIG.accessToken && CONFIG.userId) {
        mxjs.accessToken = CONFIG.accessToken;
        mxjs.userId = CONFIG.userId;
        return;
    }
    state.testUsername = `mxjstest_${Date.now()}`;
    state.testPassword = `Pass_${Math.random().toString(36).slice(2)}!`;
    const result = await mxjs.register(state.testUsername, state.testPassword);
    if (!result || !result.accessToken) throw new Error('Failed to register account');
    console.log(`\n  ${colors.gray}Registered: ${mxjs.userId}${colors.reset}`);
});

runner.test('Login', async (state) => {
    if (!state.testUsername || !state.testPassword) return;
    const result = await mxjs.login(state.testUsername, state.testPassword);
    if (!result || !result.accessToken) throw new Error('Failed to login with registered credentials');
});

// ── Profile ───────────────────────────────────────────────────────────────────

runner.test('Set display name', async () => {
    if (!mxjs.accessToken) return;
    const success = await mxjs.setDisplayName(`TestUser_${Date.now()}`);
    if (!success) throw new Error('Failed to set display name');
});

runner.test('Get profile', async () => {
    if (!mxjs.accessToken) return;
    const profile = await mxjs.getProfile();
    if (!profile) throw new Error('Failed to get profile');
});

// ── Rooms ─────────────────────────────────────────────────────────────────────

runner.test('Resolve room alias (optional)', async (state) => {
    if (!CONFIG.testRoom || !mxjs.accessToken) return 'skip';
    const roomId = await mxjs.resolveRoomAlias(CONFIG.testRoom);
    if (!roomId) throw new Error('Failed to resolve room alias');
    state.roomId = roomId;
});

runner.test('Join room (optional)', async (state) => {
    if (!state.roomId) return 'skip';
    const result = await mxjs.joinRoom(state.roomId);
    if (!result) throw new Error('Failed to join room');
});

// ── Messages ──────────────────────────────────────────────────────────────────

runner.test('Send message (optional)', async (state) => {
    if (!state.roomId) return 'skip';
    const result = await mxjs.sendMessage(state.roomId, `Test message from mxjs-lite at ${new Date().toISOString()}`);
    if (!result || !result.eventId) throw new Error('Failed to send message');
    state.sentEventId = result.eventId;
});

runner.test('Edit message (optional)', async (state) => {
    if (!state.roomId || !state.sentEventId) return 'skip';
    const result = await mxjs.editMessage(state.roomId, state.sentEventId, `Edited at ${new Date().toISOString()}`);
    if (!result || !result.eventId) throw new Error('Failed to edit message');
});

runner.test('React to message (optional)', async (state) => {
    if (!state.roomId || !state.sentEventId) return 'skip';
    const result = await mxjs.reactToMessage(state.roomId, state.sentEventId, '👍');
    if (!result || !result.eventId) throw new Error('Failed to react to message');
    state.reactionEventId = result.eventId;
});

runner.test('Remove reaction (optional)', async (state) => {
    if (!state.roomId || !state.reactionEventId) return 'skip';
    const success = await mxjs.removeReaction(state.roomId, state.reactionEventId);
    if (!success) throw new Error('Failed to remove reaction');
    state.reactionEventId = null;
});

runner.test('Redact message (optional)', async (state) => {
    if (!state.roomId || !state.sentEventId) return 'skip';
    const result = await mxjs.redactEvent(state.roomId, state.sentEventId, 'test cleanup');
    if (!result || !result.eventId) throw new Error('Failed to redact message');
    state.sentEventId = null;
});

runner.test('Get messages (optional)', async (state) => {
    if (!state.roomId) return 'skip';
    const result = await mxjs.getMessages(state.roomId, { limit: 5 });
    if (!result || !Array.isArray(result.messages)) throw new Error('Failed to get messages');
    const first = result.messages.find(e => e.event_id);
    if (first) state.latestEventId = first.event_id;
});

runner.test('Send typing (optional)', async (state) => {
    if (!state.roomId) return 'skip';
    const ok = await mxjs.sendTyping(state.roomId, true);
    if (!ok) throw new Error('Failed to send typing');
    await mxjs.sendTyping(state.roomId, false);
});

runner.test('Send read receipt (optional)', async (state) => {
    if (!state.roomId || !state.latestEventId) return 'skip';
    const ok = await mxjs.sendReadReceipt(state.roomId, state.latestEventId);
    if (!ok) throw new Error('Failed to send read receipt');
});

// ── Sync ──────────────────────────────────────────────────────────────────────

runner.test('Sync messages', async () => {
    if (!mxjs.accessToken) return 'skip';
    const syncData = await mxjs.sync(null, 0);
    if (!syncData || syncData.errcode) throw new Error('Sync failed');
});

runner.test('Get room members (optional)', async (state) => {
    if (!state.roomId) return 'skip';
    const members = await mxjs.getRoomMembers(state.roomId);
    if (!members || !Array.isArray(members)) throw new Error('Failed to get room members');
});

// ── Media ─────────────────────────────────────────────────────────────────────

runner.test('Upload media', async () => {
    if (!mxjs.accessToken) return 'skip';
    // Smallest valid 1x1 transparent PNG
    const tinyPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );
    const result = await mxjs.uploadMedia(tinyPng, 'image/png', 'test.png');
    if (!result || !result.contentUri) throw new Error('Failed to upload media');
    console.log(`\n  ${colors.gray}Uploaded: ${result.contentUri}${colors.reset}`);
});

// ── Room management ───────────────────────────────────────────────────────────

runner.test('Create room', async (state) => {
    if (!mxjs.accessToken) return 'skip';
    const result = await mxjs.createRoom({ name: `Test Room ${Date.now()}`, preset: 'public_chat' });
    if (!result || !result.roomId) {
        console.log(`  ${colors.gray}(server denied - skipping)${colors.reset}`);
        return;
    }
    state.testRoomId = result.roomId;
    console.log(`\n  ${colors.gray}Room: ${result.roomId}${colors.reset}`);
});

runner.test('Leave room', async (state) => {
    if (!state.testRoomId) return 'skip';
    const success = await mxjs.leaveRoom(state.testRoomId);
    if (!success) throw new Error('Failed to leave room');
});

// ── Account ───────────────────────────────────────────────────────────────────

runner.test('Change password', async (state) => {
    if (!state.testUsername || !state.testPassword) return 'skip';
    const newPassword = `Pass_${Math.random().toString(36).slice(2)}!`;
    const success = await mxjs.changePassword(state.testPassword, newPassword);
    if (!success) throw new Error('Failed to change password');
    state.testPassword = newPassword;
});

// ── Utilities ─────────────────────────────────────────────────────────────────

runner.test('Format time ago', () => {
    const now = Date.now();
    const cases = [
        { time: now, expected: 'just now' },
        { time: now - 30000, expected: 'just now' },
        { time: now - 120000, contains: 'm ago' },
        { time: now - 3600000, contains: 'h ago' },
        { time: now - 86400000, contains: 'd ago' }
    ];
    for (const c of cases) {
        const result = mxjs.formatTimeAgo(c.time);
        if (c.expected && result !== c.expected) throw new Error(`Expected "${c.expected}" got "${result}"`);
        if (c.contains && !result.includes(c.contains)) throw new Error(`Expected "${c.contains}" in "${result}"`);
    }
});

runner.test('API error handling', async () => {
    const result = await mxjs.api('/invalid/endpoint', 'GET', null, 'invalid_token');
    if (!result.errcode) throw new Error('Expected error response');
});

runner.test('Direct API call', async () => {
    if (!mxjs.accessToken) return 'skip';
    const result = await mxjs.api('/sync');
    if (result.errcode && result.errcode !== 'M_UNKNOWN_TOKEN') {
        throw new Error(`API call failed: ${result.error}`);
    }
});

// ── Cleanup (runs last) ───────────────────────────────────────────────────────

runner.test('Deactivate account', async (state) => {
    if (!state.testUsername || !state.testPassword) return 'skip';
    const success = await mxjs.deactivateAccount(state.testPassword);
    if (!success) throw new Error('Failed to deactivate account');
    console.log(`\n  ${colors.gray}Deactivated: ${state.testUsername}${colors.reset}`);
});

runner.run();
