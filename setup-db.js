#!/usr/bin/env node

/**
 * Simple Database Setup Script
 * Run this with: node setup-db.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🚀 Starting database setup...');

  // Create Supabase admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Read and execute schema
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    console.log('📖 Read schema.sql successfully');

    // Split into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;

      const description = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
      console.log(`⏳ ${i + 1}/${statements.length}: ${description}`);

      // For this script, we'll use the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ 
          query: statement + ';'
        })
      });

      if (response.ok) {
        console.log(`   ✅ Success`);
      } else {
        const error = await response.text();
        if (error.includes('already exists')) {
          console.log(`   ⚠️  Already exists (skipped)`);
        } else {
          console.log(`   ❌ Error: ${error}`);
        }
      }
    }

    console.log('\n🎉 Database setup completed!');
    
    // Test the setup
    console.log('\n🔍 Testing database connection...');
    const { data, error } = await supabase.from('mountains').select('count').limit(1);
    
    if (error) {
      console.log('⚠️  Could not test mountains table:', error.message);
    } else {
      console.log('✅ Database connection successful!');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();