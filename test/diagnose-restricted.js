import { MxjsClient } from '../mxjs-lite.js';

const HOMESERVER = 'https://chat.ruv.wtf';

async function diagnose() {
  console.log('🔍 Diagnosing restricted endpoints...\n');
  
  const client = new MxjsClient({ homeserver: HOMESERVER });
  const timestamp = Date.now();
  const username = `diag_${timestamp}`;
  const password = `DiagPass_${timestamp}_${Math.random().toString(36).slice(2)}`;
  
  console.log(`📝 Registering test user: ${username}`);
  const regResult = await client.register(username, password);
  console.log('Registration result:', regResult);
  
  if (!client.accessToken) {
    console.log('❌ Registration failed - no access token');
    return;
  }
  
  console.log('✅ Registration successful');
  console.log('Access token:', client.accessToken);
  console.log('User ID:', client.userId);
  
  // Wait a moment for registration to fully propagate
  console.log('\n⏳ Waiting 2 seconds for account to activate...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('');
  
  // Try to create a room
  console.log('🏠 Attempting to create a test room...');
  
  // First, let's try calling the API directly to see the full error
  console.log('Test 1: Creating PUBLIC room with name...');
  const test1 = await client.api('/createRoom', 'POST', {
    name: 'Diagnostic Test Room',
    visibility: 'public'
  });
  console.log('Result:', test1);
  
  if (!test1.errcode) {
    console.log('✅ Success! Room ID:', test1.room_id);
  } else {
    console.log('❌ Error:', test1.errcode, '-', test1.error);
    
    // Try with minimal config (defaults to private)
    console.log('\nTest 2: Creating room with minimal config (private)...');
    const test2 = await client.api('/createRoom', 'POST', {});
    console.log('Result:', test2);
    
    if (!test2.errcode) {
      console.log('✅ Success! Room ID:', test2.room_id);
    } else {
      console.log('❌ Error:', test2.errcode, '-', test2.error);
    }
  }
  
  console.log('\n');
  
  // Now try via the wrapper
  console.log('Trying via createRoom wrapper...');
  try {
    const roomResult = await client.createRoom({
      name: 'Diagnostic Test Room',
      visibility: 'private'
    });
    
    console.log('Room creation result:', roomResult);
    console.log('Result type:', typeof roomResult);
    console.log('Has roomId property:', roomResult && 'roomId' in roomResult);
    
    if (roomResult && roomResult.roomId) {
      console.log(`✅ Room created successfully: ${roomResult.roomId}\n`);
      
      // Try to upload media
      console.log('📤 Checking media upload capability...');
      console.log('Upload function exists:', typeof client.uploadMedia === 'function');
      
      // Try a small upload
      try {
        const testData = new Blob(['test'], { type: 'text/plain' });
        const uploadResult = await client.uploadMedia(testData, 'text/plain', 'test.txt');
        console.log('Upload result:', uploadResult);
        
        if (uploadResult && uploadResult.contentUri) {
          console.log(`✅ Media upload successful: ${uploadResult.contentUri}`);
        } else {
          console.log('⚠️  Upload returned but no contentUri:', uploadResult);
        }
      } catch (uploadErr) {
        console.log('❌ Media upload error:', uploadErr.message);
      }
      
      // Cleanup
      await client.leaveRoom(roomResult.roomId);
    } else {
      console.log('⚠️  Room creation returned unexpected result');
    }
  } catch (err) {
    console.log('❌ Room creation error:', err.message);
    console.log('Error details:', err);
  }
  
  // Cleanup account
  try {
    await client.deactivateAccount(password);
    console.log('\n🧹 Test account deactivated');
  } catch (e) {
    console.log('\n⚠️  Could not deactivate test account');
  }
}

diagnose().catch(console.error);
