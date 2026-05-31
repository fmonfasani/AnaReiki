#!/bin/bash
set -e

echo "≡≡≡  WebsHooks VPS Setup  ≡≡≡"
echo "Project: 0008-anareiki — anamurat.online"
echo ""

# ─── 1. System update ──────────────────────────────────────────────────────────
echo "◆ Updating system..."
apt update && apt upgrade -y

# ─── 2. Install Docker ─────────────────────────────────────────────────────────
echo "◆ Installing Docker..."
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi

# ─── 3. Install Docker Compose ─────────────────────────────────────────────────
echo "◆ Installing Docker Compose..."
if ! command -v docker compose &> /dev/null; then
  apt install -y docker-compose-plugin
fi

# ─── 4. Create infra directory structure ───────────────────────────────────────
echo "◆ Creating /infra structure..."
mkdir -p /infra/{core,scripts,proxy/{nginx,traefik},monitoring/{grafana,prometheus,uptime-kuma},projects}

# ─── 5. Create ports.json ──────────────────────────────────────────────────────
cat > /infra/core/ports.json << 'PORTS'
{
  "ports": {
    "frontend": { "range": "31000-31999" },
    "api":       { "range": "32000-32999" },
    "database":  { "range": "33000-33999" },
    "workers":   { "range": "34000-34999" },
    "auxiliary": { "range": "35000-35999" }
  },
  "allocated": {
    "0008-anareiki": { "web": 31008 }
  }
}
PORTS

# ─── 6. Create networks.yaml ────────────────────────────────────────────────
cat > /infra/core/networks.yaml << 'NET'
networks:
  anareiki-network:
    driver: bridge
    scope: project
NET

# ─── 7. Clone project ──────────────────────────────────────────────────────────
echo ""
echo "◆ Next steps (manual):"
echo "   cd /infra/projects"
echo "   git clone <tu-repo-url> 0008-anareiki"
echo "   cd 0008-anareiki"
echo "   cp .env.production .env.production.local"
echo "   nano .env.production.local  # Fill in secrets"
echo "   docker compose up -d nginx"
echo "   # Then run certbot to get SSL (see deployment.md)"
echo ""
echo "≡≡≡  VPS base setup complete  ≡≡≡"
