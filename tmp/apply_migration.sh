#!/bin/bash
# Apply migration 026 from within the container
docker exec anareiki-web sh -c 'psql "$DATABASE_URL" -f /tmp/026.sql'
