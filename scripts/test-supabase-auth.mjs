/**
 * Quick Supabase auth check. Run: node scripts/test-supabase-auth.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = 'https://pdiekeuwsnwokagorshl.supabase.co';
const key = 'sb_publishable_XAQVgGhyyYuPSTFVJJU9Kw_QRZ-dvjk';
const supabase = createClient(url, key);

const anon = await supabase.auth.signInAnonymously();
console.log('Anonymous:', anon.error?.message ?? `ok (${anon.data.user?.id})`);

const email = `stylove.test+${Date.now()}@example.com`;
const password = 'TestPass123!';
const signUp = await supabase.auth.signUp({ email, password });
console.log('Sign up:', signUp.error?.message ?? `user ${signUp.data.user?.id}, session ${!!signUp.data.session}`);

if (signUp.data.session) {
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  console.log('Sign in:', signIn.error?.message ?? `ok (${signIn.data.user?.email})`);
} else {
  console.log('No session after sign-up — enable "Confirm email" off in Supabase Auth settings for dev testing.');
}

console.log('\nTest account (if email confirmation is off):');
console.log('  email:', email);
console.log('  password:', password);
