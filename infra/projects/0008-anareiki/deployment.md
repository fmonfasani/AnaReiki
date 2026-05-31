# 0008-anareiki — Deployment Guide

## Prerequisites

- Docker & Docker Compose installed on VPS
- Domain `anamurat.online` pointing to VPS IP (89.167.96.239)
- Git repo with the project code

## Environment

Create `.env.production.local` on the VPS with all secrets:
```bash
cp .env.production .env.production.local
# Edit with: nano .env.production.local
# Fill in: SUPABASE_SERVICE_ROLE_KEY, MERCADO_PAGO_ACCESS_TOKEN, etc.
```

## First Deployment

```bash
# 1. Clone the repo
cd /infra/projects
git clone <repo-url> 0008-anareiki
cd 0008-anareiki

# 2. Set up environment
cp .env.production .env.production.local
nano .env.production.local
# Fill in all secrets

# 3. Start nginx without SSL to get certbot challenge
docker compose up -d nginx

# 4. Get SSL certificate
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d anamurat.online -d www.anamurat.online \
  --email ana@anamurat.com --agree-tos --no-eff-email

# 5. Stop nginx, start everything
docker compose down
docker compose up -d

# 6. Verify
curl https://anamurat.online/api/health
```

## Subsequent Deployments (after code changes)

```bash
cd /infra/projects/0008-anareiki
git pull
docker compose build web
docker compose up -d --no-deps web
```

## Rolling Back

```bash
docker compose down web
docker compose logs web
# Restore previous image tag if needed
