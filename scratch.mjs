const https = require('https');

async function testVercel() {
  try {
    const res = await fetch('https://scogestia.vercel.app/enseignant', {
      method: 'GET',
      headers: {
        // Need a valid cookie. But even without cookie, we should get 307 redirect, NOT 500!
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log("Status for /enseignant:", res.status);
    console.log("Redirected:", res.redirected);
    console.log("URL:", res.url);
    
    const rootRes = await fetch('https://scogestia.vercel.app/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log("Status for /:", rootRes.status);
    console.log("Redirected:", rootRes.redirected);
    console.log("URL:", rootRes.url);

  } catch(e) {
    console.error(e);
  }
}
testVercel();
