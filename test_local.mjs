import { createClient } from '@supabase/supabase-js';

async function testLocal() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.auth.signInWithPassword({
      phone: '92102556',
      password: 'Lucien2026'
    });

    if (error) throw error;
    
    // We need to set cookies like the browser does:
    // sb-<project>-auth-token
    const projectId = supabaseUrl.split('//')[1].split('.')[0];
    const cookieName = `sb-${projectId}-auth-token`;
    const sessionStr = JSON.stringify([
      data.session.access_token,
      data.session.refresh_token,
      null, null, null
    ]);
    const cookieVal = encodeURIComponent(sessionStr);

    const res2 = await fetch('http://localhost:3000/enseignant', {
      method: 'GET',
      headers: {
        'Cookie': `${cookieName}=${cookieVal}`
      }
    });
    
    console.log("Enseignant Status:", res2.status);
    console.log("Enseignant Redirected to:", res2.url);
    const text = await res2.text();
    if (res2.status !== 200) {
      console.log("Error body:", text.substring(0, 2000));
    } else {
      console.log("Success body length:", text.length);
    }
  } catch(e) {
    console.error(e);
  }
}
testLocal();
