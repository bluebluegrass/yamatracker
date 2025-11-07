#!/bin/bash
echo "Testing Supabase Configuration..."
echo

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Source the environment file
set -a
source .env.local
set +a

# Check URL
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is missing"
else
    echo "✅ SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
fi

# Check anon key length
if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
else
    key_length=${#NEXT_PUBLIC_SUPABASE_ANON_KEY}
    if [ $key_length -lt 100 ]; then
        echo "❌ ANON_KEY too short: $key_length characters (need 100+)"
    else
        echo "✅ ANON_KEY length: $key_length characters"
    fi
fi

# Check service role key length
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is missing"
else
    key_length=${#SUPABASE_SERVICE_ROLE_KEY}
    if [ $key_length -lt 100 ]; then
        echo "❌ SERVICE_ROLE_KEY too short: $key_length characters (need 100+)"
    else
        echo "✅ SERVICE_ROLE_KEY length: $key_length characters"
    fi
fi

echo
echo "If all checks pass ✅, your configuration should work!"
echo "If any checks fail ❌, please update your .env.local file."