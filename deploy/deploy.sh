#!/bin/bash
# =============================================================
# Deployment Script - Run after setup-ec2.sh
# Usage: chmod +x deploy.sh && ./deploy.sh
# =============================================================

set -e

APP_DIR="/var/www/ticketing-system"

echo "========================================="
echo "  Deploying Ticketing System"
echo "========================================="

# Navigate to app directory
cd "$APP_DIR"

# Install backend dependencies
echo "[1/5] Installing backend dependencies..."
cd "$APP_DIR/backend"
npm ci --production

# Install frontend dependencies and build
echo "[2/5] Installing frontend dependencies and building..."
cd "$APP_DIR/frontend"
npm ci
npm run build

# Set Puppeteer to use system Chromium
export PUPPETEER_EXECUTABLE_PATH=$(which chromium-browser 2>/dev/null || which chromium 2>/dev/null)

# Start/Restart backend with PM2
echo "[3/5] Starting backend with PM2..."
cd "$APP_DIR/backend"
pm2 delete ticketing-backend 2>/dev/null || true
pm2 start src/index.js --name ticketing-backend \
  --env production \
  --max-memory-restart 512M \
  --time

# Save PM2 process list and setup startup
echo "[4/5] Setting up PM2 startup..."
pm2 save
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

# Restart Nginx
echo "[5/5] Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "========================================="
echo "  Deployment complete!"
echo "  Backend: PM2 process 'ticketing-backend'"
echo "  Frontend: Served by Nginx from $APP_DIR/frontend/out"
echo "  Run 'pm2 logs ticketing-backend' to check backend logs"
echo "========================================="
