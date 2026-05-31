#!/bin/bash
set -e

# ─── 0008-anareiki — Deploy Script ─────────────────────────────────────────────
PROJECT_DIR="/infra/projects/0008-anareiki"
PROJECT_NAME="anareiki"

echo "🚀 Deploying $PROJECT_NAME..."

cd "$PROJECT_DIR"

# 1. Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# 2. Build fresh image
echo "🏗️  Building Docker image..."
docker compose build web

# 3. Start services
echo "🔄 Starting services..."
docker compose up -d --no-deps web

# 4. Health check
echo "🏥 Running health check..."
sleep 10
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✅ $PROJECT_NAME deployed successfully!"
else
  echo "⚠️  Health check failed — check logs with: docker compose logs web"
fi
