# mxjs-lite IRC-style Chat Example

A minimal IRC-style chat interface demonstrating the mxjs-lite library.

## Features

- 🎨 Classic IRC-style interface
- 💬 Real-time message synchronization
- 👥 User list with online members
- ⏰ Timestamp display
- 🔌 Easy server and room configuration
- 📱 Responsive design
- 🎮 IRC commands (/join, /leave, /create, /nick, /help)

## Quick Start

1. **Open the example:**
   ```bash
   cd example
   ```
   Then open `index.html` in your web browser (or use a local server).

2. **Configure connection:**
   - Homeserver: `https://chat.ruv.wtf` (or your Matrix server)
   - Room alias: `#test:chat.ruv.wtf` (or any public room)
   - Nickname: (optional) Your display name

3. **Click Connect** and start chatting!

## Using a Local Server

For best results, serve the files with a local web server:

**Python:**
```bash
# From the example directory
python -m http.server 8000
```

**Node.js (http-server):**
```bash
npx http-server -p 8000
```

**PowerShell (simple):**
```powershell
# From the mxjs-lite directory
Start-Process "http://localhost:8000/example" 
python -m http.server 8000
```

Then open: `http://localhost:8000`

## How It Works

### Connection Flow

1. **Initialize** - Configure mxjs-lite with homeserver URL
2. **Register** - Register as a guest user (or use existing credentials)
3. **Set Nickname** - Optional display name
4. **Resolve Room** - Convert room alias to room ID
5. **Join Room** - Join the Matrix room
6. **Sync** - Start long-polling sync loop to receive messages

### IRC Commands

Once connected, you can use IRC-style commands:

- `/join #room:server.com` or `/j #room:server.com` - Join a different room
- `/leave` or `/part` - Leave the current room
- `/create Room Name` - Create a new public room
- `/nick NewNickname` - Change your display name
- `/help` - Show available commands

Simply type the command in the message input and press Enter.

### File Structure

```
example/
├── index.html      # Main HTML structure
├── style.css       # IRC-style theme
├── chat.js         # Chat logic using mxjs-lite
└── README.md       # This file
```

### Key Components

**ChatClient Class** (`chat.js`)
- Handles all Matrix operations
- Manages connection state
- Processes incoming messages
- Maintains user list
- Provides IRC-style formatting

**UI Elements**
- Header: Status indicator and connection info
- Sidebar: User list with member count
- Messages: IRC-style message display with timestamps
- Input: Message composition area

## Customization

### Change Theme Colors

Edit `style.css` to customize colors:

```css
body {
    background: #1e1e1e;  /* Main background */
    color: #d4d4d4;        /* Text color */
}

.message-sender {
    color: #4ec9b0;        /* Username color */
}
```

### Add Commands

Add IRC-style commands in `chat.js`:

```javascript
if (message.startsWith('/')) {
    const [command, ...args] = message.slice(1).split(' ');
    if (command === 'nick') {
        // Handle nickname change
        await this.setNickname(args[0]);
        return;
    }
}
```

### Custom Message Formatting

Modify the `addMessage()` method to add:
- Markdown support
- Emoji rendering
- Link detection
- @mentions highlighting

## Troubleshooting

### "Failed to register guest"
Your homeserver may have guest registration disabled. Solutions:
1. Enable guest access on your homeserver
2. Use a different homeserver that allows guests
3. Modify the code to use username/password authentication

### CORS Errors
If you see CORS errors:
1. Make sure you're using a local web server (not `file://`)
2. Check your homeserver's CORS configuration
3. Try a different homeserver that allows CORS

### Messages Not Appearing
1. Check browser console for errors
2. Verify the room exists and is accessible
3. Ensure guest users have permission to read the room

### Can't Connect
1. Verify the homeserver URL is correct
2. Check network connectivity
3. Look for errors in the browser console

## Advanced Usage

### Use Existing Access Token

Modify `chat.js` to skip registration:

```javascript
// Instead of registerGuest(), use existing token
this.accessToken = 'your_access_token_here';
this.userId = '@user:chat.ruv.wtf';
```

### Load Message History

Add message history loading before sync:

```javascript
const history = await mxjs.api(
    `/rooms/${this.roomId}/messages?dir=b&limit=50`,
    'GET',
    null,
    this.accessToken
);
```

### Add Typing Indicators

```javascript
// Send typing notification
await mxjs.api(
    `/rooms/${this.roomId}/typing/${this.userId}`,
    'PUT',
    { typing: true, timeout: 30000 },
    this.accessToken
);
```

## License

This example is provided as-is for demonstration purposes.

## See Also

- [mxjs-lite Documentation](../README.md)
- [Matrix Client-Server API](https://spec.matrix.org/latest/client-server-api/)
- [Matrix Room Directory](https://matrix.to/)
