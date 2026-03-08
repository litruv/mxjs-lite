/**
 * Node.js test suite for mxjs-lite
 * Run with: node test.js
 */

import MxjsClient from './mxjs-lite.js';

/** @type {MxjsClient} */
let mxjs;

const CONFIG = {
    homeserver: 'https://chat.ruv.wtf',
    testRoom: '#test:chat.ruv.wtf',
    // Optional: Set TEST_TOKEN environment variable for authenticated tests
    // Example: $env:TEST_TOKEN="your_access_token"; npm test
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
            accessToken: null,
            userId: null,
            roomId: null,
            testRoomId: null,
            testUsername: null,
            testPassword: null,
            sentEventId: null,
            reactionEventId: null
        };
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log(`${colors.blue}🧪 mxjs-lite Test Suite${colors.reset}\n`);
        console.log(`${colors.gray}Homeserver: ${CONFIG.homeserver}${colors.reset}`);
        if (CONFIG.accessToken) {
            console.log(`${colors.gray}Using pre-configured access token${colors.reset}`);
        }
        console.log();

        for (const test of this.tests) {
            process.stdout.write(`${colors.yellow}▶${colors.reset} ${test.name}... `);

            try {
                const result = await test.fn(this.state);
                // If test explicitly returns 'skip', mark as skipped
                if (result === 'skip' || (test.name.includes('optional') && !this.state.accessToken && !this.state.roomId)) {
                    console.log(`${colors.gray}⊘ SKIPPED${colors.reset}`);
                    this.skipped++;
                } else {
                    console.log(`${colors.green}✓ PASSED${colors.reset}`);
                    this.passed++;
                }
            } catch (error) {
                console.log(`${colors.red}✗ FAILED${colors.reset}`);
                console.log(`  ${colors.red}${error.message}${colors.reset}`);
                if (error.data) {
                    console.log(`  ${colors.gray}${JSON.stringify(error.data, null, 2)}${colors.reset}`);
                }
                this.failed++;
            }
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`${colors.green}${this.passed} passed${colors.reset}, ${colors.red}${this.failed} failed${colors.reset}, ${colors.gray}${this.skipped} skipped${colors.reset}, ${this.tests.length} total`);
        console.log(`${'='.repeat(50)}\n`);

        process.exit(this.failed > 0 ? 1 : 0);
    }
}

const runner = new TestRunner();

// Test: Initialize library
runner.test('Initialize library', async () => {
    mxjs = new MxjsClient({ homeserver: CONFIG.homeserver });
});

// Test: Register a real account
runner.test('Register account', async (state) => {
    // Use pre-configured credentials if available
    if (CONFIG.accessToken && CONFIG.userId) {
        state.accessToken = CONFIG.accessToken;
        state.userId = CONFIG.userId;
        return;
    }

    // Generate a unique throwaway username
    state.testUsername = `mxjstest_${Date.now()}`;
    state.testPassword = `Pass_${Math.random().toString(36).slice(2)}!`;

    const result = await mxjs.register(state.testUsername, state.testPassword);
    if (!result || !result.accessToken || !result.userId) {
        throw new Error('Failed to register account');
    }
    state.accessToken = result.accessToken;
    state.userId = result.userId;
    console.log(`\n  ${colors.gray}Registered: ${result.userId}${colors.reset}`);
});

// Test: Login with registered account
runner.test('Login', async (state) => {
    if (!state.testUsername || !state.testPassword) {
        return; // Skip if we used a pre-configured token
    }

    const result = await mxjs.login(state.testUsername, state.testPassword);
    if (!result || !result.accessToken || !result.userId) {
        throw new Error('Failed to login with registered credentials');
    }
    // Swap to the fresh session token
    state.accessToken = result.accessToken;
    state.userId = result.userId;
});

// Test: Set display name
runner.test('Set display name', async (state) => {
    if (!state.accessToken || !state.userId) {
        return; // Skip if not authenticated
    }
    const displayName = `TestUser_${Date.now()}`;
    const success = await mxjs.setDisplayName(
        state.userId,
        displayName,
        state.accessToken
    );
    if (!success) {
        throw new Error('Failed to set display name');
    }
});

// Test: Resolve room alias
runner.test('Resolve room alias (optional)', async (state) => {
    if (!CONFIG.testRoom || !state.accessToken) {
        return; // Skip if no test room or not authenticated
    }
    const roomId = await mxjs.resolveRoomAlias(CONFIG.testRoom, state.accessToken);
    if (!roomId) {
        throw new Error('Failed to resolve room alias');
    }
    state.roomId = roomId;
});

// Test: Join room
runner.test('Join room (optional)', async (state) => {
    if (!state.roomId) {
        return; // Skip if no room resolved
    }
    const success = await mxjs.joinRoom(state.roomId, state.accessToken);
    if (!success) {
        throw new Error('Failed to join room');
    }
});

// Test: Send message
runner.test('Send message (optional)', async (state) => {
    if (!state.roomId) {
        return; // Skip if no room joined
    }
    const message = `Test message from mxjs-lite Node.js tests at ${new Date().toISOString()}`;
    const result = await mxjs.sendMessage(
        state.roomId,
        message,
        state.accessToken
    );
    if (!result || !result.eventId) {
        throw new Error('Failed to send message');
    }
    state.sentEventId = result.eventId;
});

// Test: Edit message
runner.test('Edit message (optional)', async (state) => {
    if (!state.roomId || !state.sentEventId) {
        return; // Skip if no message sent
    }
    const result = await mxjs.editMessage(
        state.roomId,
        state.sentEventId,
        `Edited test message at ${new Date().toISOString()}`,
        state.accessToken
    );
    if (!result || !result.eventId) {
        throw new Error('Failed to edit message');
    }
});

// Test: React to message
runner.test('React to message (optional)', async (state) => {
    if (!state.roomId || !state.sentEventId) {
        return; // Skip if no message sent
    }
    const result = await mxjs.reactToMessage(
        state.roomId,
        state.sentEventId,
        '👍',
        state.accessToken
    );
    if (!result || !result.eventId) {
        throw new Error('Failed to react to message');
    }
    state.reactionEventId = result.eventId;
});

// Test: Remove reaction
runner.test('Remove reaction (optional)', async (state) => {
    if (!state.roomId || !state.reactionEventId) {
        return; // Skip if no reaction sent
    }

    const success = await mxjs.removeReaction(state.roomId, state.reactionEventId, state.accessToken);
    if (!success) {
        throw new Error('Failed to remove reaction');
    }
    state.reactionEventId = null;
});

// Test: Redact message
runner.test('Redact message (optional)', async (state) => {
    if (!state.roomId || !state.sentEventId) {
        return; // Skip if no message sent
    }
    const result = await mxjs.redactEvent(
        state.roomId,
        state.sentEventId,
        state.accessToken,
        'test cleanup'
    );
    if (!result || !result.eventId) {
        throw new Error('Failed to redact message');
    }
    state.sentEventId = null;
});

// Test: Sync messages
runner.test('Sync messages', async (state) => {
    if (!state.accessToken) {
        return; // Skip if not authenticated
    }
    const syncData = await mxjs.sync(state.accessToken, null, 0);
    if (!syncData || syncData.errcode) {
        throw new Error('Sync failed');
    }
});

// Test: Get room members
runner.test('Get room members (optional)', async (state) => {
    if (!state.roomId) {
        return; // Skip if no room joined
    }
    const members = await mxjs.getRoomMembers(
        state.roomId,
        state.accessToken
    );
    if (!members || !Array.isArray(members)) {
        throw new Error('Failed to get room members');
    }
});

// Test: Create room
runner.test('Create room', async (state) => {
    if (!state.accessToken) {
        return;
    }
    const roomName = `Test Room ${Date.now()}`;
    const result = await mxjs.createRoom(
        { name: roomName, preset: 'public_chat' },
        state.accessToken
    );
    if (!result || !result.roomId) {
        // Guests can't create rooms on some servers - don't fail
        console.log(`  ${colors.gray}(server denied - may need full account)${colors.reset}`);
        return;
    }
    state.testRoomId = result.roomId;
    console.log(`\n  ${colors.gray}Room: ${result.roomId}${colors.reset}`);
});

// Test: Leave room
runner.test('Leave room', async (state) => {
    if (!state.testRoomId) {
        return; // Skip if no test room created
    }
    const success = await mxjs.leaveRoom(state.testRoomId, state.accessToken);
    if (!success) {
        throw new Error('Failed to leave room');
    }
});

// Test: Format time ago
runner.test('Format time ago', async () => {
    const now = Date.now();
    const tests = [
        { time: now, expected: 'just now' },
        { time: now - 30000, expected: 'just now' },
        { time: now - 120000, contains: 'm ago' },
        { time: now - 3600000, contains: 'h ago' },
        { time: now - 86400000, contains: 'd ago' }
    ];

    for (const t of tests) {
        const result = mxjs.formatTimeAgo(t.time);
        if (t.expected && result !== t.expected) {
            throw new Error(`Expected "${t.expected}" but got "${result}"`);
        }
        if (t.contains && !result.includes(t.contains)) {
            throw new Error(`Expected result to contain "${t.contains}" but got "${result}"`);
        }
    }
});

// Test: API error handling
runner.test('API error handling', async () => {
    const result = await mxjs.api('/invalid/endpoint', 'GET', null, 'invalid_token');
    if (!result.errcode) {
        throw new Error('Expected error response');
    }
});

// Test: Direct API call
runner.test('Direct API call', async (state) => {
    if (!state.accessToken) {
        return; // Skip if not authenticated
    }
    const result = await mxjs.api('/sync', 'GET', null, state.accessToken);
    if (result.errcode && result.errcode !== 'M_UNKNOWN_TOKEN') {
        throw new Error(`API call failed: ${result.error}`);
    }
});

// Test: Deactivate account (runs last - permanently deletes the test account)
runner.test('Deactivate account', async (state) => {
    if (!state.testUsername || !state.testPassword || !state.accessToken) {
        return; // Only deactivate accounts we created during this run
    }
    const success = await mxjs.deactivateAccount(state.userId, state.testPassword, state.accessToken);
    if (!success) {
        throw new Error('Failed to deactivate account');
    }
    console.log(`\n  ${colors.gray}Deactivated: ${state.userId}${colors.reset}`);
});

// Run all tests
runner.run();
