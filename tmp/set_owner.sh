#!/bin/sh
curl -s -X PATCH 'https://wbiicoasyknowhbrnpvb.supabase.co/rest/v1/profiles?email=eq.murat.anaj@gmail.com' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaWljb2FzeWtub3doYnJucHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2OTA4NywiZXhwIjoyMDg2MzQ1MDg3fQ.wmNOdYrSp3XeuJKZgXD1cvjNEp3eePWXrLb0YFR5bvU' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiaWljb2FzeWtub3doYnJucHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc2OTA4NywiZXhwIjoyMDg2MzQ1MDg3fQ.wmNOdYrSp3XeuJKZgXD1cvjNEp3eePWXrLb0YFR5bvU' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=representation' \
  -d '{"role": "owner"}'
