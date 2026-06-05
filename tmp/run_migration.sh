#!/bin/sh
# Install psql temporarily, run migration, then uninstall
apk add --no-cache postgresql-client > /dev/null 2>&1
psql "$DATABASE_URL" -f /tmp/026.sql
apk del postgresql-client > /dev/null 2>&1
