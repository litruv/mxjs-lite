/**
 * Handles all IRC-style slash commands for ChatClient.
 */
export class CommandHandler {
    /**
     * Canonical command definitions used by autocomplete and the help text.
     * @type {Array<{name: string, args: string, desc: string, aliases: string[]}>}
     */
    static COMMANDS = [
        { name: 'join',     args: '#room:server',          desc: 'Join a room',          aliases: ['j'] },
        { name: 'leave',    args: '',                      desc: 'Leave current room',   aliases: ['part'] },
        { name: 'create',   args: '<Room Name>',           desc: 'Create a new room',    aliases: [] },
        { name: 'nick',     args: '<name>',                desc: 'Change display name',  aliases: [] },
        { name: 'invite',   args: '@user:server',          desc: 'Invite a user',        aliases: [] },
        { name: 'kick',     args: '@user:server [reason]', desc: 'Kick a user',          aliases: [] },
        { name: 'ban',      args: '@user:server [reason]', desc: 'Ban a user',           aliases: [] },
        { name: 'unban',    args: '@user:server',          desc: 'Unban a user',         aliases: [] },
        { name: 'history',  args: '[limit]',               desc: 'Load message history', aliases: ['hist'] },
        { name: 'edit',     args: '<eventId> <text>',      desc: 'Edit a message',       aliases: [] },
        { name: 'delete',   args: '<eventId> [reason]',    desc: 'Delete a message',     aliases: ['del'] },
        { name: 'react',    args: '<eventId> <emoji>',     desc: 'React to a message',   aliases: [] },
        { name: 'profile',  args: '[@user:server]',        desc: 'View a profile',       aliases: ['me'] },
        { name: 'password', args: '<old> <new>',           desc: 'Change password',      aliases: ['passwd'] },
        { name: 'resolve',  args: '#room:server',          desc: 'Resolve room alias',   aliases: [] },
        { name: 'quit',     args: '',                      desc: 'Disconnect',           aliases: [] },
        { name: 'help',     args: '',                      desc: 'Show command list',    aliases: [] },
    ];

    /**
     * @param {import('./chat.js').ChatClient} chat
     */
    constructor(chat) {
        this.chat = chat;
    }

    get client() { return this.chat.client; }
    get roomId()  { return this.chat.activeRoomId; }

    /**
     * Parses and dispatches a slash command string.
     * Aliases are resolved dynamically from {@link CommandHandler.COMMANDS}.
     * @param {string} message - Full message starting with /
     */
    async handle(message) {
        const parts   = message.slice(1).split(' ');
        const command = parts[0].toLowerCase();
        const args    = parts.slice(1);

        /** @type {Map<string, string>} alias/name → canonical name */
        const aliasMap = new Map();
        for (const def of CommandHandler.COMMANDS) {
            aliasMap.set(def.name, def.name);
            for (const alias of def.aliases) aliasMap.set(alias, def.name);
        }

        const canonical = aliasMap.get(command);
        if (!canonical || typeof this[canonical] !== 'function') {
            this.chat.addErrorMessage(`Unknown command: /${command}. Type /help for commands.`);
            return;
        }
        await this[canonical](args);
    }

    async join(args) {
        if (!args[0]) { this.chat.addErrorMessage('Usage: /join #room:server'); return; }
        let alias = args[0];
        if (!alias.includes(':')) {
            alias = `${alias}:${new URL(this.chat.elements.homeserverInput.value).hostname}`;
        }
        try {
            this.chat.addSystemMessage(`Joining ${alias}...`);
            const result = await this.client.joinRoom(alias);
            if (!result) throw new Error(`Room not found or access denied: ${alias}`);
            await this.chat.enterRoom(result.roomId, alias);
        } catch (e) { this.chat.addErrorMessage(`Failed to join: ${e.message}`); }
    }

    async leave() {
        if (!this.roomId) { this.chat.addErrorMessage('Not in a room'); return; }
        try {
            if (!await this.client.leaveRoom(this.roomId)) throw new Error('Server refused');
            this.chat.removeRoom(this.roomId);
        } catch (e) { this.chat.addErrorMessage(`Failed to leave: ${e.message}`); }
    }

    async create(args) {
        const name = args.join(' ');
        if (!name) { this.chat.addErrorMessage('Usage: /create Room Name'); return; }
        try {
            this.chat.addSystemMessage(`Creating "${name}"...`);
            const result = await this.client.createRoom({ name, preset: 'public_chat', visibility: 'public' });
            if (!result?.roomId) throw new Error('Server denied room creation');
            await this.chat.enterRoom(result.roomId, name);
        } catch (e) { this.chat.addErrorMessage(`Failed to create room: ${e.message}`); }
    }

    async nick(args) {
        if (!args[0]) { this.chat.addErrorMessage('Usage: /nick NewNickname'); return; }
        try {
            if (!await this.client.setDisplayName(args[0])) throw new Error('Server refused');
            this.chat.addSystemMessage(`Nickname changed to ${args[0]}`);
            for (const room of this.chat.rooms.values()) {
                const m = room.members.get(this.client.userId);
                if (m) m.displayName = args[0];
            }
            const active = this.chat.rooms.get(this.roomId);
            if (active) this.chat.updateUserList(active);
        } catch (e) { this.chat.addErrorMessage(`Failed to change nickname: ${e.message}`); }
    }

    async invite(args) {
        const userId = args[0];
        if (!this.#validUserId(userId)) { this.chat.addErrorMessage('Usage: /invite @user:server'); return; }
        try {
            if (!await this.client.inviteUser(this.roomId, userId)) throw new Error('Server refused');
            this.chat.addSystemMessage(`Invited ${userId}`);
        } catch (e) { this.chat.addErrorMessage(`Failed to invite: ${e.message}`); }
    }

    async kick(args) {
        const userId = args[0]; const reason = args.slice(1).join(' ');
        if (!this.#validUserId(userId)) { this.chat.addErrorMessage('Usage: /kick @user:server [reason]'); return; }
        try {
            if (!await this.client.kickUser(this.roomId, userId, reason)) throw new Error('Insufficient permissions?');
            this.chat.addSystemMessage(`Kicked ${userId}${reason ? `: ${reason}` : ''}`);
        } catch (e) { this.chat.addErrorMessage(`Failed to kick: ${e.message}`); }
    }

    async ban(args) {
        const userId = args[0]; const reason = args.slice(1).join(' ');
        if (!this.#validUserId(userId)) { this.chat.addErrorMessage('Usage: /ban @user:server [reason]'); return; }
        try {
            if (!await this.client.banUser(this.roomId, userId, reason)) throw new Error('Insufficient permissions?');
            this.chat.addSystemMessage(`Banned ${userId}${reason ? `: ${reason}` : ''}`);
        } catch (e) { this.chat.addErrorMessage(`Failed to ban: ${e.message}`); }
    }

    async unban(args) {
        const userId = args[0];
        if (!this.#validUserId(userId)) { this.chat.addErrorMessage('Usage: /unban @user:server'); return; }
        try {
            if (!await this.client.unbanUser(this.roomId, userId)) throw new Error('Insufficient permissions?');
            this.chat.addSystemMessage(`Unbanned ${userId}`);
        } catch (e) { this.chat.addErrorMessage(`Failed to unban: ${e.message}`); }
    }

    async history(args) {
        const limit = parseInt(args[0]) || 20;
        if (limit < 1 || limit > 100) { this.chat.addErrorMessage('Usage: /history [limit] (1-100)'); return; }
        try {
            const result = await this.client.getMessages(this.roomId, { limit });
            if (!result?.messages) throw new Error('No messages returned');
            const room = this.chat.rooms.get(this.roomId);
            result.messages.reverse().forEach(e => this.chat.renderEvent(room, e));
            this.chat.addSystemMessage(`Loaded ${result.messages.length} messages`);
        } catch (e) { this.chat.addErrorMessage(`Failed to load history: ${e.message}`); }
    }

    async edit(args) {
        if (args.length < 2) { this.chat.addErrorMessage('Usage: /edit <eventId> <message>'); return; }
        try {
            const result = await this.client.editMessage(this.roomId, args[0], args.slice(1).join(' '));
            if (!result?.eventId) throw new Error('Server refused');
            this.chat.addSystemMessage('Message edited');
        } catch (e) { this.chat.addErrorMessage(`Failed to edit: ${e.message}`); }
    }

    async delete(args) {
        if (!args[0]) { this.chat.addErrorMessage('Usage: /delete <eventId> [reason]'); return; }
        try {
            const result = await this.client.redactEvent(this.roomId, args[0], args.slice(1).join(' '));
            if (!result?.eventId) throw new Error('Server refused');
            this.chat.addSystemMessage('Message deleted');
        } catch (e) { this.chat.addErrorMessage(`Failed to delete: ${e.message}`); }
    }

    async react(args) {
        if (args.length < 2) { this.chat.addErrorMessage('Usage: /react <eventId> <emoji>'); return; }
        try {
            const result = await this.client.reactToMessage(this.roomId, args[0], args[1]);
            if (!result?.eventId) throw new Error('Server refused');
            this.chat.addSystemMessage(`Reacted with ${args[1]}`);
        } catch (e) { this.chat.addErrorMessage(`Failed to react: ${e.message}`); }
    }

    async profile(args) {
        const userId = args[0] || this.client.userId;
        try {
            const p = await this.client.getProfile(userId);
            if (!p) throw new Error('Failed to fetch profile');
            this.chat.addSystemMessage(`${userId} — ${p.displayName || '(no name)'} | Avatar: ${p.avatarUrl || '(none)'}`);
        } catch (e) { this.chat.addErrorMessage(`Failed to get profile: ${e.message}`); }
    }

    async password(args) {
        if (args.length < 2) { this.chat.addErrorMessage('Usage: /password <old> <new>'); return; }
        try {
            if (!await this.client.changePassword(args[0], args[1])) throw new Error('Server refused');
            this.chat.password = args[1];
            this.chat.addSystemMessage('Password changed successfully');
        } catch (e) { this.chat.addErrorMessage(`Failed to change password: ${e.message}`); }
    }

    async resolve(args) {
        if (!args[0]) { this.chat.addErrorMessage('Usage: /resolve #room:server'); return; }
        try {
            const roomId = await this.client.resolveRoomAlias(args[0]);
            if (!roomId) throw new Error('Not found');
            this.chat.addSystemMessage(`${args[0]} → ${roomId}`);
        } catch (e) { this.chat.addErrorMessage(`Failed to resolve: ${e.message}`); }
    }

    async quit() {
        await this.chat.disconnect();
    }

    help() {
        [
            '─── Commands ─────────────────────────────────────────────',
            'Rooms:   /join #room:server  (alias: /j)',
            '         /leave              (alias: /part)',
            '         /create <Room Name>',
            '         /resolve #room:server',
            'Profile: /nick <name>',
            '         /profile [@user:server]  (alias: /me)',
            '         /password <old> <new>    (alias: /passwd)',
            'Mod:     /invite @user:server',
            '         /kick @user:server [reason]',
            '         /ban @user:server [reason]',
            '         /unban @user:server',
            'History: /history [limit 1-100]   (alias: /hist)',
            'Events:  /edit <eventId> <new text>',
            '         /delete <eventId> [reason]  (alias: /del)',
            '         /react <eventId> <emoji>',
            'Other:   /quit',
            '─── Right-click shortcuts ────────────────────────────────',
            'Messages: react, edit, delete, copy event ID',
            'Users:    view profile, kick, ban',
            'Channels: rename (if mod+), leave',
        ].forEach(l => this.chat.addSystemMessage(l));
    }

    /**
     * @param {string|undefined} userId
     * @returns {boolean}
     */
    #validUserId(userId) {
        return !!(userId?.startsWith('@') && userId.includes(':'));
    }
}
