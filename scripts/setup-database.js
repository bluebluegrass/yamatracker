#!/usr/bin/env node

/**
 * Database Setup Script
 * Automatically creates the Supabase database schema
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { supabaseAdmin } from '../src/lib/supabase/server.js';

async function setupDatabase() {
  console.log('🚀 Starting database setup...');

  try {
    // Read the schema file
    const schemaPath = join(process.cwd(), 'db', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    console.log('📖 Read schema.sql successfully');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip pure comment lines
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue;
      }

      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`);

      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Some errors are expected (like table already exists)
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Warning: ${error.message}`);
        } else {
          console.error(`   ❌ Error: ${error.message}`);
          // Continue with other statements
        }
      } else {
        console.log(`   ✅ Success`);
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('\n🔍 Verifying setup...');

    // Verify the setup by checking if tables exist
    const { data: tables, error: tablesError } = await supabaseAdmin
      .rpc('get_table_list');

    if (tablesError) {
      console.log('❌ Could not verify tables, but setup may have succeeded');
    } else {
      console.log('✅ Tables created successfully:');
      const expectedTables = ['users', 'mountains', 'user_mountains'];
      expectedTables.forEach(table => {
        const exists = tables?.some(t => t.table_name === table);
        console.log(`   ${exists ? '✅' : '❌'} ${table}`);
      });
    }

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();