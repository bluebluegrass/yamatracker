'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [mountainsCount, setMountainsCount] = useState<number | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test basic connection
        const { data, error } = await supabase
          .from('mountains')
          .select('count', { count: 'exact', head: true });

        if (error) {
          setConnectionStatus(`Error: ${error.message}`);
        } else {
          setConnectionStatus('✅ Connected successfully!');
          setMountainsCount(data?.length || 0);
        }
      } catch (err) {
        setConnectionStatus(`Connection failed: ${err}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          Supabase Connection Test
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className="text-lg">{connectionStatus}</p>
          
          {mountainsCount !== null && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Database Info</h3>
              <p>Mountains in database: {mountainsCount}</p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            Setup Required
          </h3>
          <p className="text-yellow-700">
            To test the connection, you need to:
          </p>
          <ol className="list-decimal list-inside mt-2 text-yellow-700">
            <li>Create a Supabase project at <a href="https://supabase.com" className="underline">supabase.com</a></li>
            <li>Create a <code>.env.local</code> file with your Supabase credentials</li>
            <li>Run the SQL schema from <code>SUPABASE_SETUP.md</code></li>
            <li>Seed the mountains table with data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}



