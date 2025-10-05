#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=$(grep -m1 '^project_id' supabase/config.toml | sed 's/.*= "\(.*\)"/\1/')
CONTAINER_NAME="supabase_db_${PROJECT_ID}"
TEST_FILE="supabase/tests/public_profile_access.test.sql"

if [ ! -f "$TEST_FILE" ]; then
  echo "Test file $TEST_FILE is missing" >&2
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is required to run these checks" >&2
  exit 1
fi

# Make sure the local stack is running; this is idempotent if already up.
supabase start --ignore-health-check >/dev/null 2>&1 || true

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Supabase Postgres container ${CONTAINER_NAME} is not running" >&2
  exit 1
fi

# Ensure the baseline schema is present before running the tests.
HAS_USERS=$(docker exec -i "$CONTAINER_NAME" psql -U postgres -d postgres -tA -c "select to_regclass('public.users') is not null")
if [ "$HAS_USERS" != "t" ]; then
  cat <<'MSG' >&2
public.users is missing in the local database.
Apply db/schema.sql (and related seed files) before running this check:
  cat db/schema.sql | docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres
  cat db/views_and_rpcs.sql | docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres
MSG
  exit 1
fi

echo "Running public profile access checks..."
if cat "$TEST_FILE" | docker exec -i "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres -d postgres >/tmp/public_profile_access_test.log 2>&1; then
  echo "✅ Public profile checks passed"
  rm -f /tmp/public_profile_access_test.log
else
  echo "❌ Check failure. See /tmp/public_profile_access_test.log for details" >&2
  cat /tmp/public_profile_access_test.log >&2
  exit 1
fi
