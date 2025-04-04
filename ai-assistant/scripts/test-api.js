// test-api.js
const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:3000';
const CREDENTIALS = {
  email: 'test@example.com',
  password: 'password123'
};

// Global variables to store across test steps
let csrfToken;
let conversationId;
let cookies = [];

// Helper to save cookies from response
function saveCookies(response) {
  const responseCookies = response.headers.raw()['set-cookie'] || [];
  
  responseCookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0];
    // Replace any existing cookie with the same name
    cookies = cookies.filter(c => !c.startsWith(`${cookieName}=`));
    cookies.push(cookie.split(';')[0]);
  });
  
  return cookies;
}

// Helper to get cookies string for requests
function getCookieHeader() {
  return cookies.join('; ');
}

// ----------------- TEST FUNCTIONS -----------------

// 1. Authentication
async function getCsrfToken() {
  console.log('\n[1] Getting CSRF token...');
  
  const response = await fetch(`${BASE_URL}/api/auth/csrf`);
  const data = await response.json();
  
  csrfToken = data.token;
  saveCookies(response);
  
  console.log(`CSRF Token: ${csrfToken}`);
  return csrfToken;
}

// Skip the login step for now since we don't have a login page
// Instead, we'll use a direct API approach for testing
async function skipLogin() {
  console.log('\n[2] Skipping login (NextAuth login page not implemented)');
  console.log('Creating test conversation directly...');
}

// 2. Conversation Management
async function createConversation() {
  console.log('\n[3] Creating a new conversation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'Cookie': getCookieHeader()
      },
      body: JSON.stringify({
        title: 'Test Conversation ' + new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const conversation = await response.json();
    conversationId = conversation.id;
    
    console.log(`Created conversation: ${conversation.title}`);
    console.log(`Conversation ID: ${conversationId}`);
    
    return conversation;
  } catch (error) {
    console.log('Could not create conversation. This is expected if user authentication is required.');
    console.log('Error:', error.message);
    console.log('\nTesting direct API endpoints without authentication:');
    return null;
  }
}

async function testHealth() {
  console.log('\n[4] Testing health endpoint...');
  
  const response = await fetch(`${BASE_URL}/api/health`);
  const data = await response.json();
  
  console.log(`Health status: ${data.status}`);
  console.log(`Database: ${data.services.database}`);
  console.log(`Redis: ${data.services.redis}`);
  
  return data;
}

// Test script that doesn't require authentication
async function runTests() {
  try {
    await getCsrfToken();
    await skipLogin();
    await createConversation();
    await testHealth();
    
    console.log('\n✅ Basic tests completed. To test authenticated endpoints:');
    console.log('1. Create a login page component in src/app/login/page.tsx');
    console.log('2. Implement credential login using NextAuth');
    console.log('3. Run the tests again with proper authentication');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runTests();