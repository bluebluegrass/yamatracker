import { NextResponse } from 'next/server';
import { getSupabaseServerConfig } from '@/lib/config/env';

export async function POST() {
  try {
    console.log('🚀 Starting database setup...');
    
    const config = getSupabaseServerConfig();
    const supabaseUrl = config.url;
    const serviceRoleKey = config.serviceRoleKey;

    // SQL statements from schema.sql  
    const sqlStatements = [
      // Create users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT auth.uid(),
        username TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        locale TEXT DEFAULT 'en',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,

      // Create mountains table
      `CREATE TABLE IF NOT EXISTS mountains (
        id TEXT PRIMARY KEY,
        name_ja TEXT NOT NULL,
        name_en TEXT NOT NULL,
        name_zh TEXT NOT NULL,
        region TEXT NOT NULL,
        prefecture TEXT NOT NULL,
        difficulty TEXT,
        elevation_m INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,

      // Create user_mountains table
      `CREATE TABLE IF NOT EXISTS user_mountains (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        mountain_id TEXT REFERENCES mountains(id) ON DELETE CASCADE,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        source TEXT DEFAULT 'manual',
        PRIMARY KEY (user_id, mountain_id)
      );`,

      // Enable RLS
      `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE mountains ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE user_mountains ENABLE ROW LEVEL SECURITY;`,

      // Create policies (with DROP IF EXISTS first)
      `DROP POLICY IF EXISTS "Users manage their own profile" ON users;`,
      `CREATE POLICY "Users manage their own profile" ON users
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);`,

      `DROP POLICY IF EXISTS "Mountains are publicly readable" ON mountains;`,
      `CREATE POLICY "Mountains are publicly readable" ON mountains
        FOR SELECT USING (true);`,

      `DROP POLICY IF EXISTS "Users manage their own check-ins" ON user_mountains;`,
      `CREATE POLICY "Users manage their own check-ins" ON user_mountains
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_user_mountains_user_id ON user_mountains(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_user_mountains_mountain_id ON user_mountains(mountain_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mountains_region ON mountains(region);`,
      `CREATE INDEX IF NOT EXISTS idx_mountains_difficulty ON mountains(difficulty);`,
      `CREATE INDEX IF NOT EXISTS idx_mountains_elevation_m ON mountains(elevation_m);`
    ];

    const results = [];

    // Execute each SQL statement via REST API
    for (let i = 0; i < sqlStatements.length; i++) {
      const sql = sqlStatements[i].trim();
      if (!sql) continue;

      const description = sql.split('\n')[0].trim().substring(0, 50) + '...';
      
      console.log(`⏳ Executing: ${description}`);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          },
          body: JSON.stringify({ sql })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success: ${description}`);
          results.push({ 
            step: i + 1, 
            description, 
            status: 'success',
            data 
          });
        } else {
          const error = await response.text();
          console.log(`⚠️  Warning for "${description}": ${error}`);
          results.push({ 
            step: i + 1, 
            description, 
            status: 'warning', 
            message: error 
          });
        }
      } catch (error) {
        console.log(`⚠️  Error for "${description}": ${error}`);
        results.push({ 
          step: i + 1, 
          description, 
          status: 'error', 
          message: error instanceof Error ? error.message : String(error) 
        });
      }
    }

    console.log('🎉 Database setup completed!');

    return NextResponse.json({
      success: true,
      message: 'Database schema setup completed',
      results,
      summary: {
        total: sqlStatements.length,
        successful: results.filter(r => r.status === 'success').length,
        warnings: results.filter(r => r.status === 'warning').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}