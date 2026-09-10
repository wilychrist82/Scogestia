import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking user_devices...");
  const { data, error } = await supabase.from('user_devices').select('*');
  if (error) console.error("Error:", error);
  else console.log("Devices:", data);
}
check();
