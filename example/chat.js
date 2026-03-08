/**
 * mxjs-lite IRC-style Chat Interface
 */

import MxjsClient from '../mxjs-lite.js';

class ChatClient {
    constructor() {
        this.client = null;         // MxjsClient instance, created on connect
        this.roomId = null;
        this.syncToken = null;
        this.syncing = false;
        this.members = new Map();
        this.nickname = null;
        this.password = null;       // Stored for deactivation on disconnect
        this.isNewAccount = false;  // Whether we registered this session
        this.authMode = 'register'; // 'register' | 'login'
        this.typingUsers = new Set(); // Track who is currently typing
        this.typingTimeout = null;
        this.typingTimeouts = new Map(); // Track timeouts for each typing user
        this.lastReadEventId = null; // Track last read event for receipts
        
        this.elements = {
            status: document.getElementById('status'),
            statusText: document.getElementById('statusText'),
            statusIndicator: document.querySelector('.status-indicator'),
            topic: document.getElementById('topic'),
            messages: document.getElementById('messages'),
            userList: document.getElementById('userList'),
            connectionForm: document.getElementById('connectionForm'),
            messageForm: document.getElementById('messageForm'),
            homeserverInput: document.getElementById('homeserverInput'),
            usernameInput: document.getElementById('usernameInput'),
            passwordInput: document.getElementById('passwordInput'),
            roomInput: document.getElementById('roomInput'),
            messageInput: document.getElementById('messageInput'),
            connectBtn: document.getElementById('connectBtn'),
            sendBtn: document.getElementById('sendBtn'),
            disconnectBtn: document.getElementById('disconnectBtn'),
            tabRegister: document.getElementById('tabRegister'),
            tabLogin: document.getElementById('tabLogin'),
            tabGuest: document.getElementById('tabGuest'),
            uploadBtn: document.getElementById('uploadBtn'),
            fileInput: document.getElementById('fileInput')
        };
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        this.elements.connectBtn.addEventListener('click', () => this.connect());
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Typing indicator
        this.elements.messageInput.addEventListener('input', () => {
            if (!this.client || !this.roomId) return;
            clearTimeout(this.typingTimeout);
            this.client.sendTyping(this.roomId, true, 5000);
            this.typingTimeout = setTimeout(() => {
                this.client.sendTyping(this.roomId, false);
            }, 5000);
        });
        
        // File upload
        this.elements.uploadBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });
        
        this.elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadAndSendImage(e.target.files[0]);
            }
        });
        
        // Tab switching
        this.elements.tabRegister.addEventListener('click', () => this.setAuthMode('register'));
        this.elements.tabLogin.addEventListener('click', () => this.setAuthMode('login'));
        this.elements.tabGuest.addEventListener('click', () => this.setAuthMode('guest'));
        
        // Allow pressing Enter in connection form fields
        [this.elements.homeserverInput, this.elements.usernameInput,
         this.elements.passwordInput, this.elements.roomInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.connect();
            });
        });
    }
    
    setAuthMode(mode) {
        this.authMode = mode;
        this.elements.tabRegister.classList.toggle('active', mode === 'register');
        this.elements.tabLogin.classList.toggle('active', mode === 'login');
        this.elements.tabGuest.classList.toggle('active', mode === 'guest');
        
        // Hide username/password for guest mode
        if (mode === 'guest') {
            this.elements.usernameInput.style.display = 'none';
            this.elements.passwordInput.style.display = 'none';
            this.elements.connectBtn.textContent = 'Connect as Guest';
        } else {
            this.elements.usernameInput.style.display = '';
            this.elements.passwordInput.style.display = '';
            this.elements.connectBtn.textContent = mode === 'register' ? 'Register & Connect' : 'Login & Connect';
        }
    }
    
    setStatus(status, text) {
        this.elements.statusText.textContent = text;
        this.elements.statusIndicator.className = `status-indicator ${status}`;
    }
    
    addSystemMessage(text) {
        const div = document.createElement('div');
        div.className = 'system-message';
        div.textContent = `*** ${text}`;
        this.elements.messages.appendChild(div);
        this.scrollToBottom();
    }
    
    addErrorMessage(text) {
        const div = document.createElement('div');
        div.className = 'error-message';
        div.textContent = `*** ERROR: ${text}`;
        this.elements.messages.appendChild(div);
        this.scrollToBottom();
    }
    
    addMessage(sender, content, timestamp) {
        const div = document.createElement('div');
        div.className = 'message';
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = this.formatTime(timestamp);
        
        const senderEl = document.createElement('span');
        senderEl.className = sender === this.client?.userId ? 'message-sender self' : 'message-sender';
        senderEl.textContent = this.getDisplayName(sender);
        
        const contentEl = document.createElement('span');
        contentEl.className = 'message-content';
        contentEl.textContent = content;
        
        div.appendChild(time);
        div.appendChild(senderEl);
        div.appendChild(contentEl);
        
        this.elements.messages.appendChild(div);
        this.scrollToBottom();
    }
    
    addImageMessage(sender, url, body, timestamp) {
        const div = document.createElement('div');
        div.className = 'message';
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = this.formatTime(timestamp);
        
        const senderEl = document.createElement('span');
        senderEl.className = sender === this.client?.userId ? 'message-sender self' : 'message-sender';
        senderEl.textContent = this.getDisplayName(sender);
        
        const contentEl = document.createElement('span');
        contentEl.className = 'message-content';
        
        const img = document.createElement('img');
        const httpUrl = url.replace('mxc://', `${this.client.homeserver}/_matrix/media/r0/download/`);
        img.src = httpUrl;
        img.alt = body;
        img.style.maxWidth = '300px';
        img.style.maxHeight = '300px';
        img.title = body;
        
        contentEl.appendChild(img);
        
        div.appendChild(time);
        div.appendChild(senderEl);
        div.appendChild(contentEl);
        
        this.elements.messages.appendChild(div);
        this.scrollToBottom();
    }
    
    async uploadAndSendImage(file) {
        try {
            this.addSystemMessage(`Uploading ${file.name}...`);
            
            const uploadResult = await this.client.uploadMedia(file, file.type, file.name);
            
            if (!uploadResult || !uploadResult.contentUri) {
                throw new Error('Failed to upload image');
            }
            
            const sendResult = await this.client.sendImage(
                this.roomId,
                uploadResult.contentUri,
                file.name,
                {
                    mimetype: file.type,
                    size: file.size
                }
            );
            
            if (!sendResult || !sendResult.eventId) {
                throw new Error('Failed to send image');
            }
            
            this.addSystemMessage(`Image sent: ${file.name}`);
            this.elements.fileInput.value = '';
            
        } catch (error) {
            this.addErrorMessage(`Failed to upload image: ${error.message}`);
        }
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    getDisplayName(userId) {
        const member = this.members.get(userId);
        if (member && member.displayName) {
            return member.displayName;
        }
        // Fallback to localpart
        const match = userId.match(/^@([^:]+):/);
        return match ? match[1] : userId;
    }
    
    updateUserList() {
        const userCount = this.members.size;
        const users = Array.from(this.members.entries()).sort((a, b) => {
            const nameA = a[1].displayName || a[0];
            const nameB = b[1].displayName || b[0];
            return nameA.localeCompare(nameB);
        });
        
        const typingIndicator = this.typingUsers.size > 0 
            ? `<div class="typing-indicator">${Array.from(this.typingUsers).map(userId => this.getDisplayName(userId)).join(', ')} ${this.typingUsers.size === 1 ? 'is' : 'are'} typing...</div>`
            : '';
        
        this.elements.userList.innerHTML = `
            <div class="user-count">${userCount} user${userCount !== 1 ? 's' : ''}</div>
            ${users.map(([userId, info]) => `
                <div class="user-item ${userId === this.client?.userId ? 'self' : ''}">
                    ${info.displayName || this.getDisplayName(userId)}
                </div>
            `).join('')}
            ${typingIndicator}
        `;
    }
    
    setUserTyping(userId, typing) {
        if (userId === this.client?.userId) return; // Don't show our own typing
        
        if (typing) {
            this.typingUsers.add(userId);
            
            // Clear existing timeout for this user
            if (this.typingTimeouts.has(userId)) {
                clearTimeout(this.typingTimeouts.get(userId));
            }
            
            // Set timeout to remove typing indicator
            const timeout = setTimeout(() => {
                this.typingUsers.delete(userId);
                this.typingTimeouts.delete(userId);
                this.updateUserList();
            }, 5000);
            
            this.typingTimeouts.set(userId, timeout);
        } else {
            this.typingUsers.delete(userId);
            if (this.typingTimeouts.has(userId)) {
                clearTimeout(this.typingTimeouts.get(userId));
                this.typingTimeouts.delete(userId);
            }
        }
        
        this.updateUserList();
    }
    
    scrollToBottom() {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
    
    async connect() {
        const homeserver = this.elements.homeserverInput.value.trim();
        const username   = this.elements.usernameInput.value.trim();
        const password   = this.elements.passwordInput.value;
        const roomAlias  = this.elements.roomInput.value.trim();
        
        if (!homeserver || !roomAlias) {
            this.addErrorMessage('Please fill in homeserver and room alias');
            return;
        }
        
        if (this.authMode !== 'guest' && (!username || !password)) {
            this.addErrorMessage('Please fill in username and password');
            return;
        }
        
        this.elements.connectBtn.disabled = true;
        this.elements.connectBtn.textContent = 'Connecting...';
        this.setStatus('connecting', 'Connecting...');
        
        try {
            this.client = new MxjsClient({ homeserver });

            let authResult;
            
            if (this.authMode === 'guest') {
                this.addSystemMessage('Registering as guest...');
                authResult = await this.client.registerGuest();
                if (!authResult) throw new Error('Guest registration failed');
                this.isNewAccount = true;
                this.addSystemMessage(`Registered as guest: ${authResult.userId}`);
            } else if (this.authMode === 'register') {
                this.addSystemMessage(`Registering as ${username}...`);
                authResult = await this.client.register(username, password);
                if (!authResult) throw new Error('Registration failed - username may be taken');
                this.isNewAccount = true;
                this.addSystemMessage(`Registered as ${authResult.userId}`);
            } else {
                this.addSystemMessage(`Logging in as ${username}...`);
                authResult = await this.client.login(username, password);
                if (!authResult) throw new Error('Login failed - check username and password');
                this.isNewAccount = false;
                this.addSystemMessage(`Logged in as ${authResult.userId}`);
            }
            
            this.password = password; // Kept for deactivation
            this.nickname = username || 'Guest';

            // Join room
            this.addSystemMessage(`Joining ${roomAlias}...`);
            const joinResult = await this.client.joinRoom(roomAlias);

            if (!joinResult) throw new Error(`Failed to join room - check alias and server`);

            this.roomId = joinResult.roomId;

            this.addSystemMessage(`Joined ${roomAlias}`);
            this.setStatus('connected', this.client.userId);
            this.elements.topic.textContent = roomAlias;
            
            await this.loadMembers();
            
            // Load recent history
            this.addSystemMessage('Loading recent messages...');
            const history = await this.client.getMessages(this.roomId, { limit: 20 });
            if (history && history.messages) {
                history.messages.reverse().forEach(event => {
                    if (event.type === 'm.room.message' && event.content) {
                        if (event.content.msgtype === 'm.image' && event.content.url) {
                            this.addImageMessage(
                                event.sender,
                                event.content.url,
                                event.content.body || 'Image',
                                event.origin_server_ts || Date.now()
                            );
                        } else if (event.content.body && !event.content['m.relates_to']?.rel_type) {
                            this.addMessage(
                                event.sender,
                                event.content.body,
                                event.origin_server_ts || Date.now()
                            );
                        }
                    }
                });
            }
            
            // Switch to chat UI
            this.elements.connectionForm.style.display = 'none';
            this.elements.messageForm.style.display = 'flex';
            this.elements.disconnectBtn.style.display = 'inline-block';
            this.elements.messageInput.focus();
            
            this.startSync();
            
        } catch (error) {
            this.addErrorMessage(error.message);
            this.setStatus('disconnected', 'Connection failed');
            this.elements.connectBtn.disabled = false;
            this.elements.connectBtn.textContent =
                this.authMode === 'guest' ? 'Connect as Guest' :
                this.authMode === 'register' ? 'Register & Connect' : 'Login & Connect';
        }
    }
    
    async disconnect() {
        this.syncing = false;

        if (this.isNewAccount && this.client?.userId && this.password) {
            this.addSystemMessage('Deactivating temporary account...');
            const deactivatedId = this.client.userId;
            await this.client.deactivateAccount(this.password);
            this.addSystemMessage(`Account ${deactivatedId} deactivated`);
        } else if (this.isNewAccount && this.client?.userId && !this.password) {
            // Guest account, just log out
            this.addSystemMessage('Guest session ended');
        } else {
            this.addSystemMessage('Disconnected');
        }

        this.password = null;
        this.roomId = null;
        this.syncToken = null;
        this.isNewAccount = false;
        this.lastReadEventId = null;
        this.members.clear();
        this.typingUsers.clear();
        
        // Clear all typing timeouts
        this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.typingTimeouts.clear();
        
        // Clear own typing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
        
        this.updateUserList();
        
        this.setStatus('disconnected', 'Disconnected');
        this.elements.topic.textContent = 'Not connected';
        this.elements.connectionForm.style.display = 'flex';
        this.elements.messageForm.style.display = 'none';
        this.elements.disconnectBtn.style.display = 'none';
        this.elements.connectBtn.disabled = false;
        this.elements.connectBtn.textContent =
            this.authMode === 'guest' ? 'Connect as Guest' :
            this.authMode === 'register' ? 'Register & Connect' : 'Login & Connect';
    }
    
    async loadMembers() {
        try {
            const members = await this.client.getRoomMembers(this.roomId);
            if (members) {
                this.members.clear();
                members.forEach(member => {
                    this.members.set(member.userId, {
                        displayName: member.displayName
                    });
                });
                this.updateUserList();
            }
        } catch (error) {
            console.error('Failed to load members:', error);
        }
    }
    
    async startSync() {
        this.syncing = true;

        while (this.syncing) {
            try {
                const syncData = await this.client.sync(this.syncToken, 30000);
                
                if (!syncData || syncData.errcode) {
                    throw new Error('Sync failed');
                }
                
                this.syncToken = syncData.next_batch;
                
                // Process room events
                if (syncData.rooms && syncData.rooms.join && syncData.rooms.join[this.roomId]) {
                    const roomData = syncData.rooms.join[this.roomId];
                    
                    // Process timeline events (messages)
                    if (roomData.timeline && roomData.timeline.events) {
                        let lastEventId = null;
                        
                        roomData.timeline.events.forEach(event => {
                            if (event.type === 'm.room.message' && event.content) {
                                lastEventId = event.event_id;
                                
                                if (event.content.msgtype === 'm.image' && event.content.url) {
                                    this.addImageMessage(
                                        event.sender,
                                        event.content.url,
                                        event.content.body || 'Image',
                                        event.origin_server_ts || Date.now()
                                    );
                                } else if (event.content.body && !event.content['m.relates_to']?.rel_type) {
                                    // Regular text message (ignore edits and reactions)
                                    this.addMessage(
                                        event.sender,
                                        event.content.body,
                                        event.origin_server_ts || Date.now()
                                    );
                                }
                            } else if (event.type === 'm.room.member') {
                                // Handle join/leave/kick events
                                const userId = event.state_key;
                                const membership = event.content?.membership;
                                const prevMembership = event.unsigned?.prev_content?.membership;
                                const displayName = event.content?.displayname || this.getDisplayName(userId);
                                
                                if (membership === 'join' && prevMembership !== 'join') {
                                    // User joined
                                    this.addSystemMessage(`${displayName} joined the room`);
                                    this.members.set(userId, {
                                        displayName: event.content.displayname
                                    });
                                    this.updateUserList();
                                } else if (membership === 'leave') {
                                    // User left or was kicked/banned
                                    if (prevMembership === 'join') {
                                        if (event.sender === userId) {
                                            this.addSystemMessage(`${displayName} left the room`);
                                        } else {
                                            this.addSystemMessage(`${displayName} was kicked by ${this.getDisplayName(event.sender)}`);
                                        }
                                    }
                                    this.members.delete(userId);
                                    this.updateUserList();
                                } else if (membership === 'ban') {
                                    this.addSystemMessage(`${displayName} was banned by ${this.getDisplayName(event.sender)}`);
                                    this.members.delete(userId);
                                    this.updateUserList();
                                } else if (membership === 'join' && prevMembership === 'join') {
                                    // Display name change
                                    const oldName = event.unsigned?.prev_content?.displayname || this.getDisplayName(userId);
                                    if (oldName !== displayName) {
                                        this.addSystemMessage(`${oldName} changed name to ${displayName}`);
                                        this.members.set(userId, {
                                            displayName: event.content.displayname
                                        });
                                        this.updateUserList();
                                    }
                                }
                            }
                        });
                        
                        // Send read receipt for last message
                        if (lastEventId && lastEventId !== this.lastReadEventId) {
                            this.lastReadEventId = lastEventId;
                            this.client.sendReadReceipt(this.roomId, lastEventId).catch(err => {
                                console.warn('Failed to send read receipt:', err);
                            });
                        }
                    }
                    
                    // Process ephemeral events (typing indicators)
                    if (roomData.ephemeral && roomData.ephemeral.events) {
                        roomData.ephemeral.events.forEach(event => {
                            if (event.type === 'm.typing' && event.content && event.content.user_ids) {
                                // Clear all typing indicators first
                                this.typingUsers.forEach(userId => {
                                    if (!event.content.user_ids.includes(userId)) {
                                        this.setUserTyping(userId, false);
                                    }
                                });
                                
                                // Set typing for current users
                                event.content.user_ids.forEach(userId => {
                                    if (userId !== this.client?.userId) {
                                        this.setUserTyping(userId, true);
                                    }
                                });
                            }
                        });
                    }
                    
                    // Update member list from state
                    if (roomData.state && roomData.state.events) {
                        let membersUpdated = false;
                        roomData.state.events.forEach(event => {
                            if (event.type === 'm.room.member' && event.content) {
                                if (event.content.membership === 'join') {
                                    this.members.set(event.state_key, {
                                        displayName: event.content.displayname
                                    });
                                    membersUpdated = true;
                                } else if (event.content.membership === 'leave') {
                                    this.members.delete(event.state_key);
                                    membersUpdated = true;
                                }
                            }
                        });
                        if (membersUpdated) {
                            this.updateUserList();
                        }
                    }
                }
                
            } catch (error) {
                console.error('Sync error:', error);
                this.addErrorMessage('Sync error, retrying...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    
    async sendMessage() {
        const message = this.elements.messageInput.value.trim();
        
        if (!message) return;
        
        this.elements.sendBtn.disabled = true;
        this.elements.messageInput.disabled = true;
        
        try {
            // Handle IRC-style commands
            if (message.startsWith('/')) {
                await this.handleCommand(message);
            } else {
                // Regular message
                const result = await this.client.sendMessage(this.roomId, message);
                
                if (!result || !result.eventId) {
                    throw new Error('Failed to send message');
                }
            }
            
            this.elements.messageInput.value = '';
            
        } catch (error) {
            this.addErrorMessage(`Failed to send: ${error.message}`);
        } finally {
            this.elements.sendBtn.disabled = false;
            this.elements.messageInput.disabled = false;
            this.elements.messageInput.focus();
        }
    }
    
    async handleCommand(message) {
        const parts = message.slice(1).split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        switch (command) {
            case 'j':
            case 'join':
                await this.commandJoin(args);
                break;
                
            case 'leave':
            case 'part':
                await this.commandLeave();
                break;
                
            case 'create':
                await this.commandCreate(args);
                break;
                
            case 'nick':
                await this.commandNick(args);
                break;
                
            case 'invite':
                await this.commandInvite(args);
                break;
                
            case 'kick':
                await this.commandKick(args);
                break;
                
            case 'ban':
                await this.commandBan(args);
                break;
                
            case 'unban':
                await this.commandUnban(args);
                break;
                
            case 'history':
            case 'hist':
                await this.commandHistory(args);
                break;
                
            case 'edit':
                await this.commandEdit(args);
                break;
                
            case 'delete':
            case 'del':
                await this.commandDelete(args);
                break;
                
            case 'react':
                await this.commandReact(args);
                break;
                
            case 'profile':
            case 'me':
                await this.commandProfile(args);
                break;
                
            case 'password':
            case 'passwd':
                await this.commandPassword(args);
                break;
                
            case 'guest':
                await this.commandGuest();
                break;
                
            case 'resolve':
                await this.commandResolve(args);
                break;
                
            case 'quit':
                await this.disconnect();
                break;
                
            case 'help':
                this.commandHelp();
                break;
                
            default:
                this.addErrorMessage(`Unknown command: /${command}. Type /help for commands.`);
        }
    }
    
    async commandJoin(args) {
        if (args.length === 0) {
            this.addErrorMessage('Usage: /join #room or /j #room:server.com');
            return;
        }
        
        let roomAlias = args[0];
        
        // Auto-append homeserver if no server part given (e.g. #test → #test:chat.ruv.wtf)
        if (!roomAlias.includes(':')) {
            const serverName = new URL(this.elements.homeserverInput.value).hostname;
            roomAlias = `${roomAlias}:${serverName}`;
        }
        
        try {
            this.addSystemMessage(`Joining ${roomAlias}...`);
            const result = await this.client.joinRoom(roomAlias);
            
            if (!result) {
                throw new Error(`Room not found or access denied: ${roomAlias}`);
            }
            
            // Switch to new room
            this.roomId = result.roomId;
            this.members.clear();
            this.typingUsers.clear();
            this.lastReadEventId = null;
            
            // Clear typing timeouts
            this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
            this.typingTimeouts.clear();
            
            this.addSystemMessage(`Joined ${roomAlias}`);
            this.elements.topic.textContent = roomAlias;
            
            // Load members
            await this.loadMembers();
            
        } catch (error) {
            this.addErrorMessage(`Failed to join: ${error.message}`);
        }
    }
    
    async commandLeave() {
        if (!this.roomId) {
            this.addErrorMessage('Not in a room');
            return;
        }
        
        try {
            this.addSystemMessage('Leaving room...');
            const left = await this.client.leaveRoom(this.roomId);
            
            if (!left) {
                throw new Error('Failed to leave room');
            }
            
            this.addSystemMessage('Left room');
            this.roomId = null;
            this.members.clear();
            this.typingUsers.clear();
            this.lastReadEventId = null;
            
            // Clear typing timeouts
            this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
            this.typingTimeouts.clear();
            
            this.updateUserList();
            this.elements.topic.textContent = 'Not in a room';
            
        } catch (error) {
            this.addErrorMessage(`Failed to leave: ${error.message}`);
        }
    }
    
    async commandCreate(args) {
        const roomName = args.join(' ');
        
        if (!roomName) {
            this.addErrorMessage('Usage: /create Room Name');
            return;
        }
        
        try {
            this.addSystemMessage(`Creating room "${roomName}"...`);
            const result = await this.client.createRoom({
                name: roomName,
                preset: 'public_chat',
                visibility: 'public'
            });
            
            if (!result || !result.roomId) {
                throw new Error('Server denied room creation');
            }
            
            this.roomId = result.roomId;
            this.members.clear();
            this.typingUsers.clear();
            this.lastReadEventId = null;
            
            // Clear typing timeouts
            this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
            this.typingTimeouts.clear();
            
            this.addSystemMessage(`Created and joined room "${roomName}"`);
            this.elements.topic.textContent = roomName;
            
            // Load members
            await this.loadMembers();
            
        } catch (error) {
            this.addErrorMessage(`Failed to create room: ${error.message}`);
        }
    }
    
    async commandNick(args) {
        if (args.length === 0) {
            this.addErrorMessage('Usage: /nick NewNickname');
            return;
        }
        
        const newNick = args[0];
        
        try {
            const success = await this.client.setDisplayName(newNick);

            if (!success) {
                throw new Error('Failed to set nickname');
            }

            this.nickname = newNick;
            this.addSystemMessage(`Nickname changed to ${newNick}`);

            // Update in member list
            if (this.members.has(this.client.userId)) {
                this.members.get(this.client.userId).displayName = newNick;
                this.updateUserList();
            }
            
        } catch (error) {
            this.addErrorMessage(`Failed to change nickname: ${error.message}`);
        }
    }
    
    async commandInvite(args) {
        if (args.length === 0) {
            this.addErrorMessage('Usage: /invite @user:server.com');
            return;
        }
        
        const userId = args[0];
        
        if (!userId.startsWith('@') || !userId.includes(':')) {
            this.addErrorMessage('Invalid user ID format. Use: @user:server.com');
            return;
        }
        
        try {
            const success = await this.client.inviteUser(this.roomId, userId);
            
            if (!success) {
                throw new Error('Failed to invite user');
            }
            
            this.addSystemMessage(`Invited ${userId} to the room`);
            
        } catch (error) {
            this.addErrorMessage(`Failed to invite: ${error.message}`);
        }
    }
    
    async commandKick(args) {
        if (args.length === 0) {
            this.addErrorMessage('Usage: /kick @user:server.com [reason]');
            return;
        }
        
        const userId = args[0];
        const reason = args.slice(1).join(' ');
        
        if (!userId.startsWith('@') || !userId.includes(':')) {
            this.addErrorMessage('Invalid user ID format. Use: @user:server.com');
            return;
        }
        
        try {
            const success = await this.client.kickUser(this.roomId, userId, reason);
            
            if (!success) {
                throw new Error('Failed to kick user (insufficient permissions?)');
            }
            
            this.addSystemMessage(`Kicked ${userId}${reason ? `: ${reason}` : ''}`);
            
        } catch (error) {
            this.addErrorMessage(`Failed to kick: ${error.message}`);
        }
    }
    
    async commandBan(args) {
        if (args.length === 0) {
            this.addErrorMessage('Usage: /ban @user:server.com [reason]');
            return;
        }
        
        const userId = args[0];
        const reason = args.slice(1).join(' ');
        
        if (!userId.startsWith('@') || !userId.includes(':')) {
            this.addErrorMessage('Invalid user ID format. Use: @user:server.com');
            return;
        }
        
        try {
            const success = await this.client.banUser(this.roomId, userId, reason);
            
            if (!success) {
                throw new Error('Failed to ban user (insufficient permissions?)');
            }
            
            this.addSystemMessage(`Banned ${userId}${reason ? `: ${reason}` : ''}`);
            
        } catch (error) {
            this.addErrorMessage(`Failed to ban: ${error.message}`);
        }
    }
    
    async commandUnban(args) {
        if (args.length === 0) {
            this.addErrorMessage('Usage: /unban @user:server.com');
            return;
        }
        
        const userId = args[0];
        
        if (!userId.startsWith('@') || !userId.includes(':')) {
            this.addErrorMessage('Invalid user ID format. Use: @user:server.com');
            return;
        }
        
        try {
            const success = await this.client.unbanUser(this.roomId, userId);
            
            if (!success) {
                throw new Error('Failed to unban user (insufficient permissions?)');
            }
            
            this.addSystemMessage(`Unbanned ${userId}`);
            
        } catch (error) {
            this.addErrorMessage(`Failed to unban: ${error.message}`);
        }
    }
    
    async commandHistory(args) {
        const limit = args.length > 0 ? parseInt(args[0]) : 20;
        
        if (isNaN(limit) || limit < 1 || limit > 100) {
            this.addErrorMessage('Usage: /history [limit] (1-100)');
            return;
        }
        
        try {
            this.addSystemMessage(`Loading ${limit} messages...`);
            const result = await this.client.getMessages(this.roomId, { limit });
            
            if (!result || !result.messages) {
                throw new Error('Failed to fetch message history');
            }
            
            // Display messages in reverse order (oldest first)
            result.messages.reverse().forEach(event => {
                if (event.type === 'm.room.message' && event.content) {
                    if (event.content.msgtype === 'm.image' && event.content.url) {
                        this.addImageMessage(
                            event.sender,
                            event.content.url,
                            event.content.body || 'Image',
                            event.origin_server_ts || Date.now()
                        );
                    } else if (event.content.body && !event.content['m.relates_to']?.rel_type) {
                        this.addMessage(
                            event.sender,
                            event.content.body,
                            event.origin_server_ts || Date.now()
                        );
                    }
                }
            });
            
            this.addSystemMessage(`Loaded ${result.messages.length} messages`);
            
        } catch (error) {
            this.addErrorMessage(`Failed to load history: ${error.message}`);
        }
    }
    
    async commandEdit(args) {
        if (args.length < 2) {
            this.addErrorMessage('Usage: /edit <eventId> <new message>');
            return;
        }
        
        const eventId = args[0];
        const newMessage = args.slice(1).join(' ');
        
        try {
            const result = await this.client.editMessage(this.roomId, eventId, newMessage);
            
            if (!result || !result.eventId) {
                throw new Error('Failed to edit message');
            }
            
            this.addSystemMessage('Message edited');
            
        } catch (error) {
            this.addErrorMessage(`Failed to edit: ${error.message}`);
        }
    }
    
    async commandDelete(args) {
        if (args.length === 0) {
            this.addErrorMessage('Usage: /delete <eventId> [reason]');
            return;
        }
        
        const eventId = args[0];
        const reason = args.slice(1).join(' ');
        
        try {
            const result = await this.client.redactEvent(this.roomId, eventId, reason);
            
            if (!result || !result.eventId) {
                throw new Error('Failed to delete message');
            }
            
            this.addSystemMessage('Message deleted');
            
        } catch (error) {
            this.addErrorMessage(`Failed to delete: ${error.message}`);
        }
    }
    
    async commandReact(args) {
        if (args.length < 2) {
            this.addErrorMessage('Usage: /react <eventId> <emoji>');
            return;
        }
        
        const eventId = args[0];
        const reaction = args[1];
        
        try {
            const result = await this.client.reactToMessage(this.roomId, eventId, reaction);
            
            if (!result || !result.eventId) {
                throw new Error('Failed to add reaction');
            }
            
            this.addSystemMessage(`Reacted with ${reaction}`);
            
        } catch (error) {
            this.addErrorMessage(`Failed to react: ${error.message}`);
        }
    }
    
    async commandProfile(args) {
        const userId = args.length > 0 ? args[0] : this.client.userId;
        
        try {
            const profile = await this.client.getProfile(userId);
            
            if (!profile) {
                throw new Error('Failed to fetch profile');
            }
            
            this.addSystemMessage(`Profile for ${userId}:`);
            this.addSystemMessage(`  Display Name: ${profile.displayName || '(not set)'}`);
            this.addSystemMessage(`  Avatar URL: ${profile.avatarUrl || '(not set)'}`);
            
        } catch (error) {
            this.addErrorMessage(`Failed to get profile: ${error.message}`);
        }
    }
    
    async commandPassword(args) {
        if (args.length < 2) {
            this.addErrorMessage('Usage: /password <oldPassword> <newPassword>');
            return;
        }
        
        const oldPassword = args[0];
        const newPassword = args[1];
        
        try {
            const success = await this.client.changePassword(oldPassword, newPassword);
            
            if (!success) {
                throw new Error('Failed to change password');
            }
            
            this.password = newPassword;
            this.addSystemMessage('Password changed successfully');
            
        } catch (error) {
            this.addErrorMessage(`Failed to change password: ${error.message}`);
        }
    }
    
    async commandGuest() {
        this.addSystemMessage('To use guest mode, disconnect and use the Guest tab');
    }
    
    async commandResolve(args) {
        if (args.length === 0) {
            this.addErrorMessage('Usage: /resolve #room:server.com');
            return;
        }
        
        const roomAlias = args[0];
        
        try {
            const roomId = await this.client.resolveRoomAlias(roomAlias);
            
            if (!roomId) {
                throw new Error('Room alias not found');
            }
            
            this.addSystemMessage(`${roomAlias} resolves to ${roomId}`);
            
        } catch (error) {
            this.addErrorMessage(`Failed to resolve: ${error.message}`);
        }
    }
    
    commandHelp() {
        this.addSystemMessage('Available commands:');
        this.addSystemMessage('Room commands:');
        this.addSystemMessage('  /join #room:server or /j - Join a room');
        this.addSystemMessage('  /leave or /part - Leave current room');
        this.addSystemMessage('  /create Room Name - Create a new room');
        this.addSystemMessage('  /resolve #room:server - Resolve room alias to ID');
        this.addSystemMessage('User commands:');
        this.addSystemMessage('  /nick NewName - Change your nickname');
        this.addSystemMessage('  /profile [@user:server] - View profile (yours or others)');
        this.addSystemMessage('  /password oldpass newpass - Change password');
        this.addSystemMessage('Moderation commands:');
        this.addSystemMessage('  /invite @user:server - Invite user to room');
        this.addSystemMessage('  /kick @user:server [reason] - Kick user from room');
        this.addSystemMessage('  /ban @user:server [reason] - Ban user from room');
        this.addSystemMessage('  /unban @user:server - Unban user from room');
        this.addSystemMessage('Message commands:');
        this.addSystemMessage('  /history [limit] - Load message history (default 20)');
        this.addSystemMessage('  /edit <eventId> <message> - Edit a message');
        this.addSystemMessage('  /delete <eventId> [reason] - Delete a message');
        this.addSystemMessage('  /react <eventId> <emoji> - React to a message');
        this.addSystemMessage('Other:');
        this.addSystemMessage('  /quit - Disconnect (deactivates account if registered this session)');
        this.addSystemMessage('  /help - Show this help');
        this.addSystemMessage('Use the 📎 button to upload images');
        this.addSystemMessage('Automatic: Typing indicators, read receipts, join/part notifications');
    }
}

// Initialize chat client
const chat = new ChatClient();
