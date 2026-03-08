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
            tabLogin: document.getElementById('tabLogin')
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
        
        // Tab switching
        this.elements.tabRegister.addEventListener('click', () => this.setAuthMode('register'));
        this.elements.tabLogin.addEventListener('click', () => this.setAuthMode('login'));
        
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
        this.elements.connectBtn.textContent = mode === 'register' ? 'Register & Connect' : 'Login & Connect';
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
        
        this.elements.userList.innerHTML = `
            <div class="user-count">${userCount} user${userCount !== 1 ? 's' : ''}</div>
            ${users.map(([userId, info]) => `
                <div class="user-item ${userId === this.client?.userId ? 'self' : ''}">
                    ${info.displayName || this.getDisplayName(userId)}
                </div>
            `).join('')}
        `;
    }
    
    scrollToBottom() {
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }
    
    async connect() {
        const homeserver = this.elements.homeserverInput.value.trim();
        const username   = this.elements.usernameInput.value.trim();
        const password   = this.elements.passwordInput.value;
        const roomAlias  = this.elements.roomInput.value.trim();
        
        if (!homeserver || !username || !password || !roomAlias) {
            this.addErrorMessage('Please fill in all fields');
            return;
        }
        
        this.elements.connectBtn.disabled = true;
        this.elements.connectBtn.textContent = 'Connecting...';
        this.setStatus('connecting', 'Connecting...');
        
        try {
            this.client = new MxjsClient({ homeserver });

            let authResult;
            
            if (this.authMode === 'register') {
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
            this.nickname = username;

            // Join room
            this.addSystemMessage(`Joining ${roomAlias}...`);
            const joinResult = await this.client.joinRoom(roomAlias);

            if (!joinResult) throw new Error(`Failed to join room - check alias and server`);

            this.roomId = joinResult.roomId;

            this.addSystemMessage(`Joined ${roomAlias}`);
            this.setStatus('connected', this.client.userId);
            this.elements.topic.textContent = roomAlias;
            
            await this.loadMembers();
            
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
        } else {
            this.addSystemMessage('Disconnected');
        }

        this.password = null;
        this.roomId = null;
        this.syncToken = null;
        this.isNewAccount = false;
        this.members.clear();
        this.updateUserList();
        
        this.setStatus('disconnected', 'Disconnected');
        this.elements.topic.textContent = 'Not connected';
        this.elements.connectionForm.style.display = 'flex';
        this.elements.messageForm.style.display = 'none';
        this.elements.disconnectBtn.style.display = 'none';
        this.elements.connectBtn.disabled = false;
        this.elements.connectBtn.textContent =
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
                        roomData.timeline.events.forEach(event => {
                            if (event.type === 'm.room.message' && event.content && event.content.body) {
                                this.addMessage(
                                    event.sender,
                                    event.content.body,
                                    event.origin_server_ts || Date.now()
                                );
                            } else if (event.type === 'm.room.member') {
                                // Update member info
                                if (event.content && event.content.membership === 'join') {
                                    this.members.set(event.state_key, {
                                        displayName: event.content.displayname
                                    });
                                    this.updateUserList();
                                }
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
    
    commandHelp() {
        this.addSystemMessage('Available commands:');
        this.addSystemMessage('/join #room:server.com or /j - Join a room');
        this.addSystemMessage('/leave or /part - Leave current room');
        this.addSystemMessage('/create Room Name - Create a new room');
        this.addSystemMessage('/nick NewName - Change your nickname');
        this.addSystemMessage('/quit - Disconnect (deactivates account if registered this session)');
        this.addSystemMessage('/help - Show this help');
    }
}

// Initialize chat client
const chat = new ChatClient();
