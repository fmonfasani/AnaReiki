#!/bin/sh
CRON_SECRET=$(grep CRON_SECRET /infra/projects/0008-anareiki/.env.production | cut -d= -f2)
curl -s -X POST https://anamurat.online/api/run-sql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"email":"sap"}'
