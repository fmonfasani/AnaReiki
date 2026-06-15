#!/bin/bash
# Leer DATABASE_URL literal (raw) del .env
RAW=$(grep DATABASE_URL /infra/projects/0008-anareiki/.env.production | cut -d= -f2- | tr -d '"')
# Extraer partes con bash parameter expansion (sin sed)
PASS="${RAW#*://postgres:}"
PASS="${PASS%@*}"
HOST="${RAW#*@}"
HOST="${HOST%:*}"
PORT="${RAW##*:}"
PORT="${PORT%/postgres*}"
PGPASSWORD="$PASS" psql -h "$HOST" -p "$PORT" -U postgres -d postgres -f /tmp/047_sunday_availability.sql
echo "Migration 047 executed. Exit code: $?"
