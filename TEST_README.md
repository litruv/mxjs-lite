# mxjs-lite Tests

This directory contains test suites for mxjs-lite.

## Test Files

### 1. Browser Tests (`test.html`)

Interactive browser-based test suite with a visual UI.

**How to run:**
1. Open `test.html` in a web browser
2. Configure the homeserver URL (default: `https://chat.ruv.wtf`)
3. Optionally configure a test room alias
4. Click "Run All Tests"

**Features:**
- Visual test results with color-coded status
- Real-time test execution
- Detailed output for each test
- Test summary statistics

### 2. Node.js Tests (`test.js`)

Automated command-line test suite.

**How to run:**
```bash
npm test
```

**With authentication token:**
```powershell
# PowerShell
$env:TEST_TOKEN="your_access_token"
$env:TEST_USER="@user:chat.ruv.wtf"
npm test
```

```bash
# Linux/Mac
TEST_TOKEN="your_access_token" TEST_USER="@user:chat.ruv.wtf" npm test
```

## Test Coverage

The test suite covers:

- ✅ Library initialization
- ✅ Guest registration
- ✅ Setting display names
- ✅ Room alias resolution
- ✅ Joining rooms
- ✅ Sending messages
- ✅ Syncing messages
- ✅ Getting room members
- ✅ Time formatting utilities
- ✅ API error handling
- ✅ Direct API calls

## Configuration

### Homeserver
Default: `https://chat.ruv.wtf`

Update in:
- Browser: Edit the input field in `test.html`
- Node.js: Edit `CONFIG.homeserver` in `test.js`

### Authentication

Some tests require authentication:
- **Browser**: Tests will attempt guest registration automatically
- **Node.js**: Set `TEST_TOKEN` and `TEST_USER` environment variables, or allow guest registration on your homeserver

### Test Room

Optional room for testing room operations:
- **Browser**: Edit the "Test Room Alias" field
- **Node.js**: Edit `CONFIG.testRoom` in `test.js`

## Expected Behavior

### Without Authentication
- Basic tests (initialization, time formatting, error handling) will pass
- Tests requiring authentication will be skipped
- Exit code: 1 (due to guest registration failure)

### With Authentication
- Most tests should pass
- Room-related tests require a valid test room
- Exit code: 0 (if all tests pass)

### Guest Registration Disabled
If your homeserver has guest registration disabled:
- Set `TEST_TOKEN` and `TEST_USER` environment variables
- Or use the browser tests with manual authentication

## Troubleshooting

### "Guest access is disabled"
Your homeserver doesn't allow guest registration. Use a pre-configured access token:
```powershell
$env:TEST_TOKEN="your_token"
npm test
```

### "Failed to resolve room alias"
The test room doesn't exist or isn't accessible. Either:
- Create the room on your homeserver
- Update `CONFIG.testRoom` to an existing room
- Leave it empty to skip room tests

### CORS errors (browser)
Your homeserver must allow CORS requests from your testing domain. This is typically not an issue when testing locally.

## CI/CD Integration

To integrate tests in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
  env:
    TEST_TOKEN: ${{ secrets.MATRIX_TOKEN }}
    TEST_USER: ${{ secrets.MATRIX_USER }}
```

## Development

When adding new features to mxjs-lite:
1. Add corresponding tests to both `test.html` and `test.js`
2. Run tests to ensure functionality works
3. Update this README if new configuration is needed
