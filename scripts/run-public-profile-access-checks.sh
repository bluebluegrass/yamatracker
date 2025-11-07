#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=$(grep -m1 '^project_id' supabase/config.toml | sed 's/.*= "\(.*\)"/\1/')
CONTAINER_NAME="supabase_db_${PROJECT_ID}"
TEST_DIR="supabase/tests"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI is required to run these checks" >&2
  exit 1
fi

if [ ! -d "$TEST_DIR" ]; then
  echo "Test directory $TEST_DIR is missing" >&2
  exit 1
fi

TEST_FILES=()
while IFS= read -r file; do
  TEST_FILES+=("$file")
done < <(find "$TEST_DIR" -maxdepth 1 -name '*.test.sql' -type f | sort)

if [ "${#TEST_FILES[@]}" -eq 0 ]; then
  echo "No SQL tests found in $TEST_DIR" >&2
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

for test_file in "${TEST_FILES[@]}"; do
  log_file=$(mktemp)
  echo "Running $(basename "$test_file")..."
  if cat "$test_file" | docker exec -i "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres -d postgres >"$log_file" 2>&1; then
    echo "  ✅ Passed"
    rm -f "$log_file"
  else
    echo "  ❌ Failed. See $log_file for details" >&2
    cat "$log_file" >&2
    exit 1
  fi
done

echo "✅ All Supabase SQL checks passed"
