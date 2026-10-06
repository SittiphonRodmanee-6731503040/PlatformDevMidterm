#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8787}"
TEST_DAY="$(date -u -d '+1 day' +%Y-%m-%d)"
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

request() {
  local expected="$1"; shift
  local status
  status="$(curl -sS -o "$tmp" -w '%{http_code}' "$@")"
  if [[ "$status" != "$expected" ]]; then
    echo "FAIL expected $expected, got $status: $(cat "$tmp")" >&2
    exit 1
  fi
  echo "PASS $status $*"
}

request 200 "$BASE_URL/equipment"
request 201 -H 'Content-Type: application/json' -d "{\"equipmentId\":\"eq-1\",\"borrowerName\":\"Test User\",\"startAt\":\"${TEST_DAY}T09:00:00+07:00\",\"endAt\":\"${TEST_DAY}T11:00:00+07:00\",\"purpose\":\"class\"}" "$BASE_URL/bookings"
id="$(node -e 'const fs=require("fs"); const x=JSON.parse(fs.readFileSync(process.argv[1])); process.stdout.write(x.id)' "$tmp")"
request 200 "$BASE_URL/bookings/$id"
request 409 -H 'Content-Type: application/json' -d "{\"equipmentId\":\"eq-1\",\"borrowerName\":\"Overlap\",\"startAt\":\"${TEST_DAY}T03:00:00Z\",\"endAt\":\"${TEST_DAY}T05:00:00Z\"}" "$BASE_URL/bookings"
request 201 -H 'Content-Type: application/json' -d "{\"equipmentId\":\"eq-1\",\"borrowerName\":\"Adjacent\",\"startAt\":\"${TEST_DAY}T04:00:00Z\",\"endAt\":\"${TEST_DAY}T05:00:00Z\"}" "$BASE_URL/bookings"
request 400 -H 'Content-Type: application/json' -d '{"equipmentId":"eq-1","borrowerName":"Bad","startAt":"nope","endAt":"2026-10-20T12:00:00Z"}' "$BASE_URL/bookings"
request 404 -H 'Content-Type: application/json' -d '{"equipmentId":"missing","borrowerName":"Bad","startAt":"2026-10-21T09:00:00Z","endAt":"2026-10-21T10:00:00Z"}' "$BASE_URL/bookings"
request 200 -X PATCH -H 'Content-Type: application/json' -d '{"purpose":"updated"}' "$BASE_URL/bookings/$id"
request 204 -X DELETE "$BASE_URL/bookings/$id"
request 404 "$BASE_URL/bookings/$id"
echo "All booking API checks passed."
