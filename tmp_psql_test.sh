#!/bin/bash
# Extraer DATABASE_URL literal sin expansion
RAW=$(grep DATABASE_URL /infra/projects/0008-anareiki/.env.production | cut -d= -f2- | tr -d '"')
# Reemplazar $$ por literal (evitar expansion)
RAW="${RAW//\$\$/$}"
psql "$RAW" -c "SELECT 1 AS test" 2>&1
echo "Exit: $?"
