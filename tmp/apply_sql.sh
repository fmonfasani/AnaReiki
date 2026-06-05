#!/bin/sh
docker exec --user root anareiki-web sh -c 'cp /tmp/026.sql /app/026.sql; cp /tmp/run_migration.mjs /app/run_migration.mjs; chown nextjs:nodejs /app/026.sql /app/run_migration.mjs'
docker exec anareiki-web sh -c 'cd /app && node run_migration.mjs 026.sql'
