import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*VITE_SUPABASE_URL\s*=\s*(.*?)\s*$/);
      if (match) supabaseUrl = match[1].trim().replace(/['"]/g, '');
      const matchKey = line.match(/^\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.*?)\s*$/);
      if (matchKey) supabaseAnonKey = matchKey[1].trim().replace(/['"]/g, '');
    }
  }
} catch (e) {
  console.error('Error reading env file:', e);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProbes() {
  const dummyId = '00000000-0000-0000-0000-000000000001';
  
  console.log('Probing insert with name and metadata fields...');
  const res1 = await supabase
    .from('profiles')
    .insert({
      id: dummyId,
      name: 'Test Name',
      role: 'student',
      metadata: { bio: 'Test Bio' }
    });
  
  console.log('Result 1 (name/metadata):', JSON.stringify(res1, null, 2));

  console.log('Probing insert with full_name, bio, phone, avatar_url fields...');
  const res2 = await supabase
    .from('profiles')
    .insert({
      id: dummyId,
      full_name: 'Test Full Name',
      role: 'student',
      bio: 'Test Bio',
      phone: '1234567890',
      avatar_url: 'http://test.com/avatar.png'
    });
  
  console.log('Result 2 (full_name/bio/phone/avatar_url):', JSON.stringify(res2, null, 2));
}

testProbes();
