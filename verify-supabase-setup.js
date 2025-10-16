/**
 * Supabase Setup Verification Script
 * 
 * This script checks if your Supabase instance is properly configured
 * for the Access Metadata Explorer application.
 * 
 * Usage:
 *   node verify-supabase-setup.js
 * 
 * Prerequisites:
 *   - Node.js installed
 *   - Environment variables set (or .env file created)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
let supabaseUrl, supabaseKey;

try {
  // Try to load from apps/web/.env
  const envContent = readFileSync('./apps/web/.env', 'utf-8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read apps/web/.env file');
  console.log('\n📝 Create apps/web/.env with:');
  console.log('VITE_SUPABASE_URL=https://qexnxhojzciwdzlwttcd.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your_anon_key_here');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Verifying Supabase Setup');
console.log('============================\n');

let allChecksPassed = true;
const results = {
  connection: false,
  tables: {},
  storage: false,
  auth: false,
  rls: false
};

// Test 1: Connection
console.log('1️⃣  Testing Connection...');
try {
  const { data, error } = await supabase.from('projects').select('count').limit(0);
  
  if (error && error.code === '42P01') {
    console.log('   ⚠️  Connected, but tables not found');
    console.log('   → You need to run the SQL schema files');
    results.connection = true;
  } else if (error) {
    console.log(`   ❌ Connection error: ${error.message}`);
    allChecksPassed = false;
  } else {
    console.log('   ✅ Connection successful');
    results.connection = true;
  }
} catch (error) {
  console.log(`   ❌ Connection failed: ${error.message}`);
  allChecksPassed = false;
}

// Test 2: Tables
if (results.connection) {
  console.log('\n2️⃣  Checking Database Tables...');
  
  const tables = ['projects', 'import_jobs', 'queries', 'vba_modules'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(0);
      
      if (error && error.code === '42P01') {
        console.log(`   ❌ Table '${table}' does not exist`);
        results.tables[table] = false;
        allChecksPassed = false;
      } else if (error) {
        console.log(`   ⚠️  Table '${table}' - ${error.message}`);
        results.tables[table] = 'unknown';
      } else {
        console.log(`   ✅ Table '${table}' exists`);
        results.tables[table] = true;
      }
    } catch (error) {
      console.log(`   ❌ Error checking '${table}': ${error.message}`);
      results.tables[table] = false;
      allChecksPassed = false;
    }
  }
}

// Test 3: Storage Bucket
console.log('\n3️⃣  Checking Storage Bucket...');
try {
  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log(`   ❌ Could not list buckets: ${error.message}`);
    allChecksPassed = false;
  } else {
    const accessFilesBucket = data.find(b => b.id === 'access-files');
    if (accessFilesBucket) {
      console.log('   ✅ Bucket "access-files" exists');
      console.log(`      Public: ${accessFilesBucket.public}`);
      results.storage = true;
    } else {
      console.log('   ❌ Bucket "access-files" not found');
      console.log('   → Run supabase/sql/003_storage_policies.sql');
      allChecksPassed = false;
    }
  }
} catch (error) {
  console.log(`   ❌ Storage check failed: ${error.message}`);
  allChecksPassed = false;
}

// Test 4: Authentication
console.log('\n4️⃣  Checking Authentication...');
try {
  // Try to get session (should be null, but auth should be available)
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.log(`   ⚠️  Auth check: ${error.message}`);
  } else {
    console.log('   ✅ Authentication is configured');
    console.log('   → Verify Email provider is enabled in dashboard');
    results.auth = true;
  }
} catch (error) {
  console.log(`   ❌ Auth check failed: ${error.message}`);
  allChecksPassed = false;
}

// Test 5: Row Level Security (attempt to verify)
console.log('\n5️⃣  Checking Row Level Security...');
console.log('   ℹ️  RLS can only be fully tested by creating a user');
console.log('   → Policies should be applied via 002_policies.sql');

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50) + '\n');

console.log(`Connection:       ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Tables:           ${Object.values(results.tables).every(v => v === true) ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Storage Bucket:   ${results.storage ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Authentication:   ${results.auth ? '✅ PASS' : '⚠️  CHECK DASHBOARD'}`);

if (allChecksPassed && results.storage && Object.values(results.tables).every(v => v === true)) {
  console.log('\n✅ All checks passed! Your Supabase setup is ready.');
  console.log('\n📝 Next Steps:');
  console.log('   1. Verify Email provider is enabled in Supabase Auth settings');
  console.log('   2. Create worker .env file with SERVICE_ROLE_KEY');
  console.log('   3. Start the frontend: cd apps/web && npm run dev');
  console.log('   4. Start the worker: cd apps/worker && dotnet run');
} else {
  console.log('\n❌ Setup incomplete. See issues above.');
  console.log('\n📝 Action Items:');
  
  if (!results.connection) {
    console.log('   • Check your SUPABASE_URL and SUPABASE_ANON_KEY');
  }
  
  if (!Object.values(results.tables).every(v => v === true)) {
    console.log('   • Run SQL files in order:');
    console.log('     1. supabase/sql/001_schema.sql');
    console.log('     2. supabase/sql/002_policies.sql');
    console.log('     3. supabase/sql/003_storage_policies.sql');
  }
  
  if (!results.storage) {
    console.log('   • Create storage bucket or run 003_storage_policies.sql');
  }
  
  console.log('\n   🔗 Supabase Dashboard: https://supabase.com/dashboard/project/qexnxhojzciwdzlwttcd');
}

console.log('');

