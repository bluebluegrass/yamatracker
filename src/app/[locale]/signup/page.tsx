'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { generateUniqueSlug } from '@/lib/utils/slugUtils';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Starting signup process...');
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('Auth response:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        setError(authError.message);
        return;
      }

      if (authData.user) {
        console.log('User created:', authData.user.id);
        
        // Check if email confirmation is required
        if (authData.user.email_confirmed_at === null) {
          setError('Please check your email and click the confirmation link to complete your account setup.');
          return;
        }

        // Generate a unique slug for the user
        const slug = generateUniqueSlug(username, []); // In a real app, you'd check existing slugs
        console.log('Generated slug:', slug);

        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Refresh the session to ensure authentication is complete
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Session data:', sessionData);
        
        if (sessionData.session) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              username,
              slug,
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
            setError(`Profile setup failed: ${profileError.message}. Please try logging in manually.`);
          } else {
            console.log('Profile created successfully');
            router.push('/dashboard');
          }
        } else {
          console.error('No session found after signup');
          setError('Authentication failed. Please try logging in manually.');
        }
      } else {
        console.error('No user data returned');
        setError('Account creation failed. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}



