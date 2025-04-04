// scripts/test-direct-auth.js
const fetch = require('node-fetch');

async function testDirectAuth() {
  try {
    // 1. Get CSRF token
    console.log('Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.token;
    console.log('CSRF Token:', csrfToken);

    // 2. Get cookies from the response
    const cookies = csrfResponse.headers.raw()['set-cookie'] || [];
    const cookieString = cookies.join('; ');
    console.log('Cookies:', cookieString);

    // 3. Attempt sign in
    console.log('\nAttempting sign in...');
    const signInResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify({
        csrfToken,
        email: 'test@example.com',
        password: 'password123',
        callbackUrl: 'http://localhost:3000/chat',
        json: true
      }),
      redirect: 'manual'
    });

    console.log('Status:', signInResponse.status);
    console.log('Headers:', Object.fromEntries(signInResponse.headers.entries()));
    
    try {
      const data = await signInResponse.json();
      console.log('Response data:', data);
    } catch (e) {
      console.log('No JSON response (this might be a redirect, which is good)');
      console.log('Response text:', await signInResponse.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirectAuth();