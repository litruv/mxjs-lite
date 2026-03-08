/**
 * mxjs-lite IRC-style Chat Interface
 */

import MxjsClient from '../mxjs-lite.js';
import { RoomState } from './room-state.js';
import { ContextMenu } from './context-menu.js';
import { CommandHandler } from './chat-commands.js';
import { Autocomplete } from './autocomplete.js';

export class ChatClient {
    /** @type {{roomId: string, eventId: string}|null} */
    #pendingEdit = null;

    constructor() {
        this.client       = null;
        /** @type {Map<string, RoomState>} */
        this.rooms        = new Map();
        /** @type {string|null} */
        this.activeRoomId = null;
        this.syncToken    = null;
        this.syncing      = false;
        this.password     = null;
        this.isNewAccount = false;
        this.authMode     = 'register';
        this.typingTimeout = null;

        this.contextMenu = new ContextMenu();
        this.commands    = new CommandHandler(this);

        this.elements = {
            statusText:      document.getElementById('statusText'),
            statusIndicator: document.querySelector('.status-indicator'),
            topic:           document.getElementById('topic'),
            globalMessages:  document.getElementById('globalMessages'),
            messagesWrap:    document.getElementById('messagesWrap'),
            userList:        document.getElementById('userList'),
            channelList:     document.getElementById('channelList'),
            connectionForm:  document.getElementById('connectionForm'),
            messageForm:     document.getElementById('messageForm'),
            homeserverInput: document.getElementById('homeserverInput'),
            usernameInput:   document.getElementById('usernameInput'),
            passwordInput:   document.getElementById('passwordInput'),
            roomInput:       document.getElementById('roomInput'),
            messageInput:    document.getElementById('messageInput'),
            connectBtn:      document.getElementById('connectBtn'),
            sendBtn:         document.getElementById('sendBtn'),
            disconnectBtn:   document.getElementById('disconnectBtn'),
            tabRegister:     document.getElementById('tabRegister'),
            tabLogin:        document.getElementById('tabLogin'),
            tabGuest:        document.getElementById('tabGuest'),
            uploadBtn:       document.getElementById('uploadBtn'),
            fileInput:       document.getElementById('fileInput'),
            inputContainer:  document.querySelector('.input-container'),
        };

        this.autocomplete = new Autocomplete(
            this.elements.messageInput,
            this.elements.inputContainer,
        );
        this.autocomplete.setMembersProvider(
            () => this.rooms.get(this.activeRoomId)?.members ?? new Map()
        );

        this.#initEventListeners();
    }

    #initEventListeners() {
        this.elements.connectBtn   .addEventListener('click',    () => this.connect());
        this.elements.sendBtn      .addEventListener('click',    () => this.sendMessage());
        this.elements.disconnectBtn.addEventListener('click',    () => this.disconnect());
        this.elements.messageInput .addEventListener('keydown',  (e) => {
            if (e.key === 'Enter' && !this.autocomplete.isVisible) this.sendMessage();
            if (e.key === 'Escape') this.#cancelEdit();
        });
        this.elements.messageInput.addEventListener('input', () => {
            if (!this.client || !this.activeRoomId) return;
            clearTimeout(this.typingTimeout);
            this.client.sendTyping(this.activeRoomId, true, 5000);
            this.typingTimeout = setTimeout(() => this.client.sendTyping(this.activeRoomId, false), 5000);
        });
        this.elements.uploadBtn.addEventListener('click',  () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => { if (e.target.files.length) this.uploadAndSendImage(e.target.files[0]); });
        this.elements.tabRegister.addEventListener('click', () => this.setAuthMode('register'));
        this.elements.tabLogin   .addEventListener('click', () => this.setAuthMode('login'));
        this.elements.tabGuest   .addEventListener('click', () => this.setAuthMode('guest'));
        [this.elements.homeserverInput, this.elements.usernameInput,
         this.elements.passwordInput,   this.elements.roomInput]
            .forEach(el => el.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.connect(); }));

        this.elements.userList.addEventListener('contextmenu', (e) => {
            const item = e.target.closest('[data-user-id]');
            if (!item) return;
            e.preventDefault();
            e.stopPropagation();
            this.#showUserContextMenu(e.clientX, e.clientY, item.dataset.userId);
        });

        this.elements.channelList.addEventListener('contextmenu', (e) => {
            const item = e.target.closest('[data-room-id]');
            if (!item) return;
            e.preventDefault();
            e.stopPropagation();
            this.#showChannelContextMenu(e.clientX, e.clientY, item.dataset.roomId);
        });
    }

    get #connectLabel() {
        return this.authMode === 'guest' ? 'Connect as Guest'
            : this.authMode === 'register' ? 'Register & Connect' : 'Login & Connect';
    }

    setAuthMode(mode) {
        this.authMode = mode;
        ['register', 'login', 'guest'].forEach(m => {
            this.elements[`tab${m[0].toUpperCase() + m.slice(1)}`].classList.toggle('active', m === mode);
        });
        const guest = mode === 'guest';
        this.elements.usernameInput.style.display = guest ? 'none' : '';
        this.elements.passwordInput.style.display = guest ? 'none' : '';
        this.elements.connectBtn.textContent = this.#connectLabel;
    }

    setStatus(status, text) {
        this.elements.statusText.textContent = text;
        this.elements.statusIndicator.className = `status-indicator ${status}`;
    }

    get #activeMessages() {
        if (this.activeRoomId) {
            const room = this.rooms.get(this.activeRoomId);
            if (room?.messagesEl) return room.messagesEl;
        }
        return this.elements.globalMessages;
    }

    addSystemMessage(text) {
        const div = Object.assign(document.createElement('div'), { className: 'system-message', textContent: `*** ${text}` });
        this.#activeMessages.appendChild(div);
        this.#activeMessages.scrollTop = this.#activeMessages.scrollHeight;
    }

    addErrorMessage(text) {
        const div = Object.assign(document.createElement('div'), { className: 'error-message', textContent: `*** ERROR: ${text}` });
        this.#activeMessages.appendChild(div);
        this.#activeMessages.scrollTop = this.#activeMessages.scrollHeight;
    }

    /** @param {number} ts @returns {string} */
    #formatTime(ts) {
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    /**
     * @param {string} userId
     * @param {RoomState|null} [room]
     * @returns {string}
     */
    getDisplayName(userId, room = null) {
        const r = room ?? this.rooms.get(this.activeRoomId);
        const m = r?.members.get(userId);
        if (m?.displayName) return m.displayName;
        return this.client?.extractLocalpart(userId) ?? userId ?? '?';
    }

    /**
     * Creates or returns a RoomState, constructing its messages DOM element on first call.
     * @param {string} roomId
     * @param {string|null} [alias]
     * @returns {RoomState}
     */
    ensureRoom(roomId, alias = null) {
        if (this.rooms.has(roomId)) {
            const existing = this.rooms.get(roomId);
            if (alias && !existing.alias) { existing.alias = alias; existing.displayName = alias; }
            return existing;
        }
        const room = new RoomState(roomId, alias);
        const el   = Object.assign(document.createElement('div'), { className: 'messages' });
        el.style.display = 'none';
        el.addEventListener('contextmenu', (e) => {
            const msgEl = e.target.closest('[data-event-id]');
            if (!msgEl) return;
            e.preventDefault();
            e.stopPropagation();
            this.#showMessageContextMenu(e.clientX, e.clientY, msgEl.dataset.eventId, msgEl.dataset.sender, room);
        });
        this.elements.messagesWrap.appendChild(el);
        room.messagesEl = el;
        this.rooms.set(roomId, room);
        return room;
    }

    /**
     * Switches the visible room; updates topic, user list, and channel list.
     * Triggers a background history + member load for rooms not yet fetched.
     * @param {string} roomId
     */
    setActiveRoom(roomId) {
        if (this.activeRoomId) {
            const prev = this.rooms.get(this.activeRoomId);
            if (prev?.messagesEl) prev.messagesEl.style.display = 'none';
        }
        this.elements.globalMessages.style.display = 'none';
        this.activeRoomId = roomId;
        const room = this.rooms.get(roomId);
        if (room?.messagesEl) room.messagesEl.style.display = 'flex';
        this.elements.topic.textContent = room?.displayName ?? roomId;
        if (room) { room.unreadCount = 0; }
        this.updateChannelList();
        this.updateUserList(room ?? null);
        if (room && !room.historyLoaded) {
            this.loadMembers(room);
            this.#loadRoomHistory(room);
        }
    }

    /**
     * Removes a room from the view, switching back to the global pane if it was active.
     * @param {string} roomId
     */
    removeRoom(roomId) {
        const room      = this.rooms.get(roomId);
        const wasActive = this.activeRoomId === roomId;
        if (!room) return;
        room.destroy();
        this.rooms.delete(roomId);
        if (wasActive) {
            this.activeRoomId = null;
            this.elements.globalMessages.style.display = 'flex';
            this.elements.topic.textContent = 'Not in a room';
            this.addSystemMessage('Left room');
            this.updateUserList(null);
        }
        this.updateChannelList();
    }

    updateChannelList() {
        this.elements.channelList.innerHTML = '';
        for (const [roomId, room] of this.rooms) {
            const div = Object.assign(document.createElement('div'), {
                className: 'channel-item' + (roomId === this.activeRoomId ? ' active' : ''),
                textContent: room.displayName,
            });
            div.dataset.roomId = roomId;
            if (room.unreadCount > 0) {
                div.appendChild(Object.assign(document.createElement('span'), {
                    className: 'unread-badge',
                    textContent: String(room.unreadCount),
                }));
            }
            div.addEventListener('click', () => this.setActiveRoom(roomId));
            this.elements.channelList.appendChild(div);
        }
    }

    /**
     * Re-renders the right-side user list grouped by role.
     * @param {RoomState|null} room
     */
    updateUserList(room) {
        if (!room) {
            this.elements.userList.innerHTML = '<div class="user-count">Not connected</div>';
            return;
        }

        const admins = [], mods = [], users = [];
        for (const [userId, info] of room.members) {
            const entry = { userId, displayName: info.displayName || this.getDisplayName(userId, room) };
            const pl = room.getPowerLevel(userId);
            if   (pl >= 100) admins.push(entry);
            else if (pl >= 50) mods.push(entry);
            else               users.push(entry);
        }
        const sort = arr => arr.sort((a, b) => a.displayName.localeCompare(b.displayName));
        sort(admins); sort(mods); sort(users);

        const makeItem = ({ userId, displayName }) => {
            const div = Object.assign(document.createElement('div'), {
                className: 'user-item' + (userId === this.client?.userId ? ' self' : ''),
                textContent: displayName,
            });
            div.dataset.userId = userId;
            return div;
        };

        this.elements.userList.innerHTML = '';
        this.elements.userList.appendChild(Object.assign(document.createElement('div'), {
            className: 'user-count',
            textContent: `${room.members.size} user${room.members.size !== 1 ? 's' : ''}`,
        }));

        [['👑 Admins', admins], ['⚡ Mods', mods], ['👤 Users', users]].forEach(([label, arr]) => {
            if (!arr.length) return;
            this.elements.userList.appendChild(Object.assign(document.createElement('div'), { className: 'user-group-header', textContent: label }));
            arr.forEach(e => this.elements.userList.appendChild(makeItem(e)));
        });

        if (room.typingUsers.size > 0) {
            const names = [...room.typingUsers].map(uid => this.getDisplayName(uid, room)).join(', ');
            this.elements.userList.appendChild(Object.assign(document.createElement('div'), {
                className: 'typing-indicator',
                textContent: `${names} ${room.typingUsers.size === 1 ? 'is' : 'are'} typing…`,
            }));
        }
    }

    /**
     * Dispatches a single timeline event to the appropriate render method.
     * @param {RoomState} room
     * @param {Object} event
     */
    renderEvent(room, event) {
        if (event?.type !== 'm.room.message' || !event.content) return;
        if (this.client.isEditEvent(event)) return;
        const ts  = event.origin_server_ts || Date.now();
        const eid = event.event_id;
        if (this.client.isImageMessage(event) && event.content.url) {
            this.#renderImage(room, event.sender, event.content.url, event.content.body || 'Image', ts, eid);
        } else if (event.content.body) {
            let content = event.content.body;
            if (this.client.hasFormattedBody(event)) {
                try { content = this.#htmlToFragment(this.client.sanitizeHtml(event.content.formatted_body)); } catch { }
            }
            this.#renderMessage(room, event.sender, content, ts, eid);
        }
    }

    #renderMessage(room, sender, content, ts, eventId) {
        const div = Object.assign(document.createElement('div'), { className: 'message' });
        div.dataset.eventId = eventId ?? '';
        div.dataset.sender  = sender;
        const contentEl = Object.assign(document.createElement('span'), { className: 'message-content' });
        if (content instanceof Node) {
            contentEl.appendChild(content);
        } else {
            contentEl.textContent = content;
        }
        div.append(
            Object.assign(document.createElement('span'), { className: 'message-time',   textContent: this.#formatTime(ts) }),
            Object.assign(document.createElement('span'), { className: `message-sender${sender === this.client?.userId ? ' self' : ''}`, textContent: this.getDisplayName(sender, room) }),
            contentEl,
        );
        room.messagesEl.appendChild(div);
        room.messagesEl.scrollTop = room.messagesEl.scrollHeight;
    }

    #renderImage(room, sender, url, body, ts, eventId) {
        const httpUrl = this.client.mxcToHttp(url) ?? url;
        const img = Object.assign(document.createElement('img'), { src: httpUrl, alt: body, title: body });
        img.className = 'chat-image';
        const bodyEl = Object.assign(document.createElement('span'), { className: 'message-content' });
        bodyEl.appendChild(img);
        const div = Object.assign(document.createElement('div'), { className: 'message' });
        div.dataset.eventId = eventId ?? '';
        div.dataset.sender  = sender;
        div.append(
            Object.assign(document.createElement('span'), { className: 'message-time',    textContent: this.#formatTime(ts) }),
            Object.assign(document.createElement('span'), { className: `message-sender${sender === this.client?.userId ? ' self' : ''}`, textContent: this.getDisplayName(sender, room) }),
            bodyEl,
        );
        room.messagesEl.appendChild(div);
        room.messagesEl.scrollTop = room.messagesEl.scrollHeight;
    }

    #showMessageContextMenu(x, y, eventId, sender, room) {
        const isSelf  = sender === this.client?.userId;
        const canMod  = room.getPowerLevel(this.client?.userId) >= 50;
        const bodyEl  = room.messagesEl?.querySelector(`[data-event-id="${eventId}"] .message-content`);
        const body    = bodyEl?.textContent ?? '';
        this.contextMenu.show(x, y, [
            ...['👍','👎','❤️','😂','😮','😢'].map(e => ({
                label: e,
                action: () => this.client.reactToMessage(room.roomId, eventId, e),
            })),
            null,
            ...(isSelf ? [{ label: '✏️ Edit…', action: () => {
                this.#pendingEdit = { roomId: room.roomId, eventId };
                this.elements.messageInput.value = body;
                this.elements.messageInput.placeholder = 'Editing… (Esc to cancel)';
                this.elements.sendBtn.textContent = 'Save';
                this.elements.messageInput.focus();
                this.elements.messageInput.selectionStart = this.elements.messageInput.selectionEnd = body.length;
            }}] : []),
            ...(isSelf || canMod ? [{ label: '🗑️ Delete', danger: true, action: () => this.client.redactEvent(room.roomId, eventId) }] : []),
            { label: '📋 Copy Event ID', action: () => navigator.clipboard?.writeText(eventId) },
        ]);
    }

    #cancelEdit() {
        if (!this.#pendingEdit) return;
        this.#pendingEdit = null;
        this.elements.messageInput.value = '';
        this.elements.messageInput.placeholder = '';
        this.elements.sendBtn.textContent = 'Send';
    }

    /**
     * Updates or creates a reaction pill on an existing message element.
     * @param {RoomState} room
     * @param {string} eventId
     * @param {string} emoji
     * @param {string} senderId
     */
    #addReaction(room, eventId, emoji, senderId) {
        const msgEl = room.messagesEl?.querySelector(`[data-event-id="${eventId}"]`);
        if (!msgEl) return;
        let bar = msgEl.querySelector('.reaction-bar');
        if (!bar) {
            bar = Object.assign(document.createElement('div'), { className: 'reaction-bar' });
            msgEl.appendChild(bar);
        }
        let pill = [...bar.querySelectorAll('.reaction-pill')].find(p => p.dataset.emoji === emoji);
        if (!pill) {
            pill = Object.assign(document.createElement('span'), { className: 'reaction-pill' });
            pill.dataset.emoji = emoji;
            pill.dataset.count = '0';
            bar.appendChild(pill);
        }
        pill.dataset.count = String(parseInt(pill.dataset.count) + 1);
        if (senderId === this.client?.userId) pill.classList.add('self');
        pill.textContent = `${emoji} ${pill.dataset.count}`;
    }

    #showChannelContextMenu(x, y, roomId) {
        const room   = this.rooms.get(roomId);
        if (!room) return;
        const canMod = room.getPowerLevel(this.client?.userId) >= 50;
        this.contextMenu.show(x, y, [
            ...(canMod ? [{ label: '✏️ Rename…', action: async () => {
                const name = prompt('New room name:', room.displayName);
                if (!name?.trim()) return;
                try {
                    await this.client.setRoomName(roomId, name.trim());
                    room.displayName = name.trim();
                    this.updateChannelList();
                    if (roomId === this.activeRoomId) this.elements.topic.textContent = room.displayName;
                    this.addSystemMessage(`Room renamed to ${name.trim()}`);
                } catch (e) { this.addErrorMessage(`Failed to rename: ${e.message}`); }
            }}] : []),
            ...(canMod ? [null] : []),
            { label: '🚪 Leave', danger: true, action: async () => {
                try {
                    if (!await this.client.leaveRoom(roomId)) throw new Error('Server refused');
                    this.removeRoom(roomId);
                } catch (e) { this.addErrorMessage(`Failed to leave: ${e.message}`); }
            }},
        ]);
    }

    #showUserContextMenu(x, y, userId) {
        const isSelf = userId === this.client?.userId;
        const roomId = this.activeRoomId;
        this.contextMenu.show(x, y, [
            { label: '👤 View Profile', action: async () => {
                const p = await this.client.getProfile(userId);
                this.addSystemMessage(`${userId}: ${p?.displayName || '(no name)'} | ${p?.avatarUrl || '(no avatar)'}`);
            }},
            ...(isSelf ? [] : [
                null,
                { label: '👢 Kick', danger: true, action: () => this.client.kickUser(roomId, userId) },
                { label: '🚫 Ban',  danger: true, action: () => this.client.banUser(roomId, userId) },
            ]),
        ]);
    }

    async uploadAndSendImage(file) {
        try {
            this.addSystemMessage(`Uploading ${file.name}…`);
            const up = await this.client.uploadMedia(file, file.type, file.name);
            if (!up?.contentUri) throw new Error('Upload failed');
            const sent = await this.client.sendImage(this.activeRoomId, up.contentUri, file.name, { mimetype: file.type, size: file.size });
            if (!sent?.eventId) throw new Error('Send failed');
            this.elements.fileInput.value = '';
        } catch (e) { this.addErrorMessage(`Failed to upload image: ${e.message}`); }
    }

    /**
     * Fetches the last 50 messages for a room, renders them, then applies any
     * edits (m.replace) found in the same batch to update rendered content.
     * @param {RoomState} room
     */
    async #loadRoomHistory(room) {
        if (room.historyLoaded) return;
        room.historyLoaded = true;
        const history = await this.client.getMessages(room.roomId, { limit: 50 });
        if (!history?.messages) {
            room.historyLoaded = false;
            return;
        }
        const messages = [...history.messages].reverse();
        // First pass – render base messages
        for (const event of messages) this.renderEvent(room, event);
        // Second pass – apply edits
        for (const event of messages) {
            if (!this.client.isEditEvent(event)) continue;
            const rel = this.client.getEventRelation(event);
            const newBody = this.client.getEditedBody(event);
            const msgEl   = room.messagesEl?.querySelector(`[data-event-id="${rel.event_id}"]`);
            if (!msgEl) continue;
            const contentEl = msgEl.querySelector('.message-content');
            if (contentEl) contentEl.textContent = newBody;
            if (!msgEl.querySelector('.edited-tag'))
                msgEl.appendChild(Object.assign(document.createElement('span'), { className: 'edited-tag', textContent: '(edited)' }));
        }
    }

    /**
     * Joins a room, loads its history and members, then switches to it.
     * @param {string} roomId
     * @param {string|null} [alias]
     */
    async enterRoom(roomId, alias = null) {
        const room = this.ensureRoom(roomId, alias);
        this.setActiveRoom(roomId);
        this.updateChannelList();
        this.addSystemMessage(`Joined ${room.displayName}`);
    }

    async connect() {
        const homeserver = this.elements.homeserverInput.value.trim();
        const username   = this.elements.usernameInput.value.trim();
        const password   = this.elements.passwordInput.value;
        const roomAlias  = this.elements.roomInput.value.trim();

        if (!homeserver || !roomAlias) { this.addErrorMessage('Please fill in homeserver and room alias'); return; }
        if (this.authMode !== 'guest' && (!username || !password)) { this.addErrorMessage('Please fill in username and password'); return; }

        this.elements.connectBtn.disabled    = true;
        this.elements.connectBtn.textContent = 'Connecting…';
        this.setStatus('connecting', 'Connecting…');

        try {
            this.client = new MxjsClient({ homeserver });

            if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                Notification.requestPermission();
            }

            // Mention handler
            this.client.on('mention', ({ roomId, event, room }) => {
                const msgEl = room.messagesEl?.querySelector(`[data-event-id="${event.event_id}"]`);
                if (msgEl) msgEl.classList.add('mentioned');
                const senderName = this.getDisplayName(event.sender, room);
                this.#showMentionNotification(senderName, event.content.body || '', roomId);
            });
            let authResult;

            if (this.authMode === 'guest') {
                authResult = await this.client.registerGuest();
                if (!authResult) throw new Error('Guest registration failed');
                this.isNewAccount = true;
            } else if (this.authMode === 'register') {
                authResult = await this.client.register(username, password);
                if (!authResult) throw new Error('Registration failed – username may be taken');
                this.isNewAccount = true;
            } else {
                authResult = await this.client.login(username, password);
                if (!authResult) throw new Error('Login failed – check credentials');
                this.isNewAccount = false;
            }

            this.password = password || null;
            this.addSystemMessage(`Connected as ${authResult.userId}`);

            const joinResult = await this.client.joinRoom(roomAlias);
            if (!joinResult) throw new Error(`Failed to join room – check alias and server`);

            this.setStatus('connected', authResult.userId);
            this.elements.connectionForm.style.display  = 'none';
            this.elements.messageForm.style.display     = 'flex';
            this.elements.disconnectBtn.style.display   = 'inline-block';

            // Drain the initial sync to get a next_batch token, so the ongoing
            // sync loop doesn't re-deliver the same messages that enterRoom
            // fetches via getMessages.
            const initSync = await this.client.sync(null, 0);
            if (initSync?.next_batch) this.syncToken = initSync.next_batch;

            // Restore all rooms the user is already joined to — state only, no API calls.
            // History and members load lazily when a room is activated.
            for (const [roomId, roomData] of Object.entries(initSync?.rooms?.join ?? {})) {
                const stateEvents = roomData.state?.events ?? [];
                const alias = stateEvents.find(e => e.type === 'm.room.canonical_alias')?.content?.alias ?? null;
                const name  = stateEvents.find(e => e.type === 'm.room.name')?.content?.name ?? null;
                const room  = this.ensureRoom(roomId, alias);
                if (name) room.displayName = name;
                stateEvents.forEach(e => {
                    if (e.type === 'm.room.power_levels') room.applyPowerLevels(e.content);
                    if (e.type === 'm.room.member' && e.content?.membership === 'join')
                        room.setMember(e.state_key, e.content.displayname, null);
                });
            }
            this.updateChannelList();

            await this.enterRoom(joinResult.roomId, roomAlias);
            this.elements.messageInput.focus();
            this.startSync();

        } catch (error) {
            this.addErrorMessage(error.message);
            this.setStatus('disconnected', 'Connection failed');
            this.elements.connectBtn.disabled    = false;
            this.elements.connectBtn.textContent = this.#connectLabel;
        }
    }

    async disconnect() {
        this.syncing = false;

        this.activeRoomId = null;
        this.elements.globalMessages.style.display = 'flex';

        if (this.isNewAccount && this.client?.userId && this.password) {
            const id = this.client.userId;
            await this.client.deactivateAccount(this.password);
            this.addSystemMessage(`Account ${id} deactivated`);
        } else {
            this.addSystemMessage('Disconnected');
        }

        if (this.typingTimeout) { clearTimeout(this.typingTimeout); this.typingTimeout = null; }
        this.rooms.forEach(r => r.destroy());
        this.rooms.clear();
        this.password     = null;
        this.syncToken    = null;
        this.isNewAccount = false;

        this.setStatus('disconnected', 'Disconnected');
        this.elements.topic.textContent             = 'Not connected';
        this.elements.connectionForm.style.display  = 'flex';
        this.elements.messageForm.style.display     = 'none';
        this.elements.disconnectBtn.style.display   = 'none';
        this.elements.connectBtn.disabled    = false;
        this.elements.connectBtn.textContent = this.#connectLabel;
        this.updateChannelList();
        this.updateUserList(null);
    }

    /** @param {RoomState} room */
    async loadMembers(room) {
        const members = await this.client.getRoomMembers(room.roomId);
        if (!members) return;
        room.members.clear();
        members.forEach(m => room.setMember(m.userId, m.displayName, null));
        this.updateUserList(room);
    }

    startSync() {
        this.syncing = true;
        this.#syncLoop();
    }

    async #syncLoop() {
        while (this.syncing) {
            try {
                const data = await this.client.sync(this.syncToken, 30000);
                if (!data || data.errcode) throw new Error('Sync failed');
                this.syncToken = data.next_batch;
                for (const [roomId, roomData] of Object.entries(data.rooms?.join ?? {})) {
                    const room = this.rooms.get(roomId);
                    if (room) this.#processSyncRoom(room, roomData);
                }
            } catch (e) {
                console.error('Sync error:', e);
                this.addErrorMessage('Sync error, retrying…');
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    }

    /** @param {RoomState} room  @param {Object} roomData */
    #processSyncRoom(room, roomData) {
        const isActive = room.roomId === this.activeRoomId;

        for (const event of roomData.state?.events ?? []) {
            if (event.type === 'm.room.power_levels') room.applyPowerLevels(event.content);
            if (event.type === 'm.room.member' && event.content?.membership === 'join')
                room.setMember(event.state_key, event.content.displayname, null);
            if (event.type === 'm.room.name' && event.content?.name)
                room.displayName = event.content.name;
            if (event.type === 'm.room.canonical_alias' && event.content?.alias)
                room.displayName = event.content.alias;
        }

        let lastEventId = null;
        for (const event of roomData.timeline?.events ?? []) {
            if (event.type === 'm.room.power_levels') {
                room.applyPowerLevels(event.content);
                if (isActive) this.updateUserList(room);
            }

            if (event.type === 'm.room.name' && event.content?.name) {
                room.displayName = event.content.name;
                if (isActive) this.elements.topic.textContent = room.displayName;
                this.updateChannelList();
            }

            if (event.type === 'm.room.canonical_alias' && event.content?.alias) {
                room.displayName = event.content.alias;
                if (isActive) this.elements.topic.textContent = room.displayName;
                this.updateChannelList();
            }

            if (event.type === 'm.room.message') {
                if (this.client.isEditEvent(event)) {
                    const rel = this.client.getEventRelation(event);
                    const newBody = this.client.getEditedBody(event);
                    const msgEl   = room.messagesEl?.querySelector(`[data-event-id="${rel.event_id}"]`);
                    if (msgEl) {
                        const contentEl = msgEl.querySelector('.message-content');
                        if (contentEl) contentEl.textContent = newBody;
                        if (!msgEl.querySelector('.edited-tag'))
                            msgEl.appendChild(Object.assign(document.createElement('span'), { className: 'edited-tag', textContent: '(edited)' }));
                    }
                } else {
                    lastEventId = event.event_id;
                    this.renderEvent(room, event);
                    if (this.client.isMention(event, this.client.userId)) {
                        this.client.emit('mention', { roomId: room.roomId, event, room });
                    }
                    if (!isActive) { room.unreadCount++; this.updateChannelList(); }
                }
            }

            if (this.client.isReactionEvent(event)) {
                const rel = this.client.getEventRelation(event);
                if (rel?.event_id && rel.key)
                    this.#addReaction(room, rel.event_id, rel.key, event.sender);
            }

            if (event.type === 'm.room.member') {
                const change = this.client.getMembershipChange(event);
                if (!change) continue;
                const name = change.displayName || this.getDisplayName(change.userId, room);

                if (change.type === 'join') {
                    room.setMember(change.userId, change.displayName, null);
                    if (isActive) this.addSystemMessage(`${name} joined`);
                } else if (change.type === 'rename') {
                    room.setMember(change.userId, change.displayName, null);
                    if (isActive) this.addSystemMessage(`${change.prevDisplayName} → ${name}`);
                } else if (change.type === 'leave') {
                    room.members.delete(change.userId);
                    if (isActive) this.addSystemMessage(`${name} left`);
                } else if (change.type === 'kick') {
                    room.members.delete(change.userId);
                    if (isActive) this.addSystemMessage(`${name} was kicked by ${this.getDisplayName(change.kicker, room)}`);
                } else if (change.type === 'ban') {
                    room.members.delete(change.userId);
                    if (isActive) this.addSystemMessage(`${name} was banned by ${this.getDisplayName(change.kicker, room)}`);
                }
                if (isActive) this.updateUserList(room);
            }
        }

        if (lastEventId && lastEventId !== room.lastReadEventId) {
            room.lastReadEventId = lastEventId;
            this.client.sendReadReceipt(room.roomId, lastEventId).catch(() => {});
        }

        for (const event of roomData.ephemeral?.events ?? []) {
            if (event.type !== 'm.typing') continue;
            const typingIds = new Set(event.content?.user_ids ?? []);
            for (const uid of [...room.typingUsers]) {
                if (!typingIds.has(uid)) room.setTyping(uid, false, r => isActive && this.updateUserList(r));
            }
            for (const uid of typingIds) {
                if (uid !== this.client?.userId) room.setTyping(uid, true, r => isActive && this.updateUserList(r));
            }
        }
    }

    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        if (!message) return;
        this.elements.sendBtn.disabled      = true;
        this.elements.messageInput.disabled = true;
        try {
            if (this.#pendingEdit) {
                const { roomId, eventId } = this.#pendingEdit;
                const result = await this.client.editMessage(roomId, eventId, message);
                if (!result?.eventId) throw new Error('Server refused edit');
                this.#pendingEdit = null;
                this.elements.messageInput.placeholder = '';
                this.elements.sendBtn.textContent = 'Send';
            } else if (message.startsWith('/')) {
                await this.commands.handle(message);
            } else {
                const room = this.rooms.get(this.activeRoomId);
                const formattedBody = this.client.buildMentionHtml(message, (uid) => this.getDisplayName(uid, room));
                const result = await this.client.sendMessage(this.activeRoomId, message, formattedBody);
                if (!result?.eventId) throw new Error('Failed to send message');
            }
            this.elements.messageInput.value = '';
        } catch (e) {
            this.addErrorMessage(`Failed to send: ${e.message}`);
        } finally {
            this.elements.sendBtn.disabled      = false;
            this.elements.messageInput.disabled = false;
            this.elements.messageInput.focus();
        }
    }

    /**
     * Show a browser notification for a mention, if permission is granted.
     * Does nothing when the page is currently focused.
     * @param {string} sender
     * @param {string} body
     * @param {string} roomId
     */
    #showMentionNotification(sender, body, roomId) {
        const audio = document.getElementById('mentionSound');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        if (document.hasFocus()) return;
        const preview = body.length > 80 ? body.slice(0, 77) + '…' : body;
        const n = new Notification(`${sender} mentioned you`, { body: preview, tag: roomId });
        n.onclick = () => { window.focus(); this.setActiveRoom(roomId); n.close(); };
    }

    /**
     * Converts an HTML string to a DocumentFragment for safe DOM insertion.
     * @param {string} html
     * @returns {DocumentFragment}
     */
    #htmlToFragment(html) {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    }
}

const chat = new ChatClient();
