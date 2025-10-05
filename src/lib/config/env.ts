/**
 * Environment variable validation for Supabase configuration
 * Provides meaningful error messages when required variables are missing
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  config: SupabaseConfig | null;
}

/**
 * Validates required Supabase environment variables for client-side usage
 */
export function validateClientEnv(): ValidationResult {
  const errors: string[] = [];
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    errors.push(
      'NEXT_PUBLIC_SUPABASE_URL is missing. Please add your Supabase project URL to your environment variables.'
    );
  } else if (!isValidUrl(url)) {
    errors.push(
      'NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Expected format: https://your-project.supabase.co'
    );
  }

  if (!anonKey) {
    errors.push(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Please add your Supabase anon key to your environment variables.'
    );
  } else if (!isValidSupabaseKey(anonKey)) {
    errors.push(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid. Expected a long JWT-like string.'
    );
  }

  const isValid = errors.length === 0;
  const config = isValid && url && anonKey ? { url, anonKey } : null;

  return { isValid, errors, config };
}

/**
 * Validates required Supabase environment variables for server-side usage
 */
export function validateServerEnv(): ValidationResult {
  const errors: string[] = [];
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate public variables first
  const clientValidation = validateClientEnv();
  errors.push(...clientValidation.errors);

  // Validate service role key
  if (!serviceRoleKey) {
    errors.push(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Please add your Supabase service role key to your environment variables.'
    );
  } else if (!isValidSupabaseKey(serviceRoleKey)) {
    errors.push(
      'SUPABASE_SERVICE_ROLE_KEY appears to be invalid. Expected a long JWT-like string.'
    );
  }

  const isValid = errors.length === 0;
  const config = isValid && url && anonKey && serviceRoleKey 
    ? { url, anonKey, serviceRoleKey } 
    : null;

  return { isValid, errors, config };
}

/**
 * Gets validated Supabase client configuration
 * Throws an error with helpful message if validation fails
 */
export function getSupabaseClientConfig(): SupabaseConfig {
  const validation = validateClientEnv();
  
  if (!validation.isValid) {
    const errorMessage = [
      '🔴 Supabase Configuration Error:',
      '',
      ...validation.errors.map(error => `  • ${error}`),
      '',
      '💡 To fix this:',
      '  1. Create a .env.local file in your project root',
      '  2. Add the missing environment variables',
      '  3. Restart your development server',
      '',
      '📖 See SUPABASE_SETUP.md for detailed instructions'
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  return validation.config!;
}

/**
 * Gets validated Supabase server configuration
 * Throws an error with helpful message if validation fails
 */
export function getSupabaseServerConfig(): Required<SupabaseConfig> {
  const validation = validateServerEnv();
  
  if (!validation.isValid) {
    const errorMessage = [
      '🔴 Supabase Server Configuration Error:',
      '',
      ...validation.errors.map(error => `  • ${error}`),
      '',
      '💡 To fix this:',
      '  1. Create a .env.local file in your project root',
      '  2. Add the missing environment variables',
      '  3. Restart your development server',
      '',
      '📖 See SUPABASE_SETUP.md for detailed instructions'
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  return validation.config as Required<SupabaseConfig>;
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.includes('supabase');
  } catch {
    return false;
  }
}

/**
 * Basic Supabase key validation (checks if it looks like a JWT)
 */
function isValidSupabaseKey(key: string): boolean {
  // Supabase keys are JWT tokens with 3 parts separated by dots
  return key.split('.').length === 3 && key.length > 100;
}