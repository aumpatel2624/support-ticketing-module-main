#!/bin/bash
# ==============================================================================
# Ticketing System - Complete EC2 Server Setup Script
# ==============================================================================
# Usage:
#   1. SSH into your fresh Ubuntu EC2 instance
#   2. Copy this script:  nano setup-server.sh  (paste content, save)
#   3. Run:  chmod +x setup-server.sh && sudo ./setup-server.sh
#
# Prerequisites:
#   - Fresh Ubuntu 22.04 / 24.04 EC2 instance (t3.small or bigger, 2GB+ RAM)
#   - Security Group: ports 22 (SSH) and 80 (HTTP) open
#   - Your MongoDB, Redis, AWS S3 credentials ready
# ==============================================================================

set -e

# ── Colors for output ────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_step() { echo -e "\n${CYAN}[$1/$TOTAL_STEPS]${NC} ${GREEN}$2${NC}"; }
print_warn() { echo -e "${YELLOW}WARNING: $1${NC}"; }
print_done() { echo -e "${GREEN}$1${NC}"; }

TOTAL_STEPS=10

# ── Validate running as root ─────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run with sudo: sudo ./setup-server.sh${NC}"
  exit 1
fi

# ── Detect the actual user (not root) ────────────────────────────────────────
ACTUAL_USER="${SUDO_USER:-ubuntu}"
ACTUAL_HOME=$(eval echo "~$ACTUAL_USER")

# ── Configuration ────────────────────────────────────────────────────────────
APP_DIR="/var/www/ticketing-system"
REPO_URL="https://github.com/aumpatel2624/support-ticketing-module-main.git"

echo ""
echo "=============================================="
echo "  Ticketing System - EC2 Server Setup"
echo "=============================================="
echo ""

# ── Get the server's public IP ───────────────────────────────────────────────
SERVER_IP=$(curl -s --connect-timeout 5 http://checkip.amazonaws.com || curl -s --connect-timeout 5 http://ifconfig.me || echo "")
if [ -z "$SERVER_IP" ]; then
  echo -e "${YELLOW}Could not auto-detect public IP.${NC}"
  read -p "Enter your EC2 public IP address: " SERVER_IP
fi
echo -e "Detected server IP: ${GREEN}$SERVER_IP${NC}"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 1: System Update
# ══════════════════════════════════════════════════════════════════════════════
print_step 1 "Updating system packages..."
apt update && apt upgrade -y

# ══════════════════════════════════════════════════════════════════════════════
# STEP 2: Install Node.js 20 LTS
# ══════════════════════════════════════════════════════════════════════════════
print_step 2 "Installing Node.js 20 LTS..."
if command -v node &> /dev/null && [[ "$(node -v)" == v20* ]]; then
  echo "Node.js 20 already installed: $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
echo "Node: $(node -v) | npm: $(npm -v)"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 3: Install Nginx
# ══════════════════════════════════════════════════════════════════════════════
print_step 3 "Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# ══════════════════════════════════════════════════════════════════════════════
# STEP 4: Install PM2
# ══════════════════════════════════════════════════════════════════════════════
print_step 4 "Installing PM2 (process manager)..."
npm install -g pm2

# ══════════════════════════════════════════════════════════════════════════════
# STEP 5: Install Puppeteer / Chromium dependencies (for PDF export)
# ══════════════════════════════════════════════════════════════════════════════
print_step 5 "Installing Chromium and dependencies (for PDF generation)..."
apt install -y git wget ca-certificates fonts-liberation \
  libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libcups2t64 \
  libdbus-1-3 libdrm2 libgbm1 libgtk-3-0t64 libnspr4 libnss3 \
  libxcomposite1 libxdamage1 libxrandr2 xdg-utils 2>/dev/null \
  || apt install -y git wget ca-certificates fonts-liberation \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 \
  libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 \
  libxcomposite1 libxdamage1 libxrandr2 xdg-utils 2>/dev/null

# Install Chromium (package name varies by distro)
apt install -y chromium-browser 2>/dev/null || apt install -y chromium 2>/dev/null || true
CHROMIUM_PATH=$(which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo "/usr/bin/chromium-browser")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 6: Clone the repository
# ══════════════════════════════════════════════════════════════════════════════
print_step 6 "Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
  echo "Repository already exists. Pulling latest changes..."
  cd "$APP_DIR"
  sudo -u "$ACTUAL_USER" git pull origin main
else
  rm -rf "$APP_DIR"
  mkdir -p "$APP_DIR"
  chown "$ACTUAL_USER:$ACTUAL_USER" "$APP_DIR"
  sudo -u "$ACTUAL_USER" git clone "$REPO_URL" "$APP_DIR"
fi
mkdir -p "$APP_DIR/backend/uploads"
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$APP_DIR"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 7: Collect environment variables interactively
# ══════════════════════════════════════════════════════════════════════════════
print_step 7 "Configuring environment variables..."

# Generate JWT secrets automatically
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

echo ""
echo -e "${YELLOW}--- Enter your credentials (press Enter to skip optional ones) ---${NC}"
echo ""

# MongoDB
read -p "MongoDB URI (mongodb+srv://...): " MONGODB_URI
while [ -z "$MONGODB_URI" ]; do
  echo -e "${RED}MongoDB URI is required!${NC}"
  read -p "MongoDB URI: " MONGODB_URI
done

# Redis
read -p "Redis URI [press Enter to skip - will use local fallback]: " REDIS_URI

# AWS S3
echo ""
echo -e "${YELLOW}AWS S3 (for file uploads - press Enter to skip, will use local storage):${NC}"
read -p "  AWS Region [ap-south-1]: " AWS_REGION
AWS_REGION=${AWS_REGION:-ap-south-1}
read -p "  AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -p "  AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
read -p "  S3 Bucket Name: " S3_BUCKET_NAME
read -p "  S3 Folder Prefix [prod/tickets/]: " S3_FOLDER_PREFIX
S3_FOLDER_PREFIX=${S3_FOLDER_PREFIX:-prod/tickets/}

# ── Write backend .env ───────────────────────────────────────────────────────
cat > "$APP_DIR/backend/.env" << ENVEOF
# Server
PORT=5000
NODE_ENV=production
BACKEND_URL=http://$SERVER_IP

# MongoDB
MONGODB_URI=$MONGODB_URI

# JWT (auto-generated secure secrets)
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=30m
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRE=7d

# CORS - Frontend URL
FRONTEND_URL=http://$SERVER_IP

# AWS S3
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
S3_BUCKET_NAME=$S3_BUCKET_NAME
S3_FOLDER_PREFIX=$S3_FOLDER_PREFIX
PRESIGNED_URL_EXPIRY=3600

# Redis
REDIS_URI=${REDIS_URI:-redis://localhost:6379}

# Puppeteer
PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH

# Email (configure later if needed)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@example.com
FROM_NAME=Ticketing System
ENVEOF

chown "$ACTUAL_USER:$ACTUAL_USER" "$APP_DIR/backend/.env"
print_done "Backend .env created."

# ── Write frontend .env.local ────────────────────────────────────────────────
cat > "$APP_DIR/frontend/.env.local" << ENVEOF
NEXT_PUBLIC_API_URL=http://$SERVER_IP/api
ENVEOF

chown "$ACTUAL_USER:$ACTUAL_USER" "$APP_DIR/frontend/.env.local"
print_done "Frontend .env.local created."

# ══════════════════════════════════════════════════════════════════════════════
# STEP 8: Install dependencies and build
# ══════════════════════════════════════════════════════════════════════════════
print_step 8 "Installing dependencies and building..."

# Backend
echo "Installing backend dependencies..."
cd "$APP_DIR/backend"
sudo -u "$ACTUAL_USER" npm ci --production

# Frontend
echo "Installing frontend dependencies and building static site..."
cd "$APP_DIR/frontend"
sudo -u "$ACTUAL_USER" npm ci
sudo -u "$ACTUAL_USER" npm run build

if [ ! -d "$APP_DIR/frontend/out" ]; then
  echo -e "${RED}Frontend build failed! Check errors above.${NC}"
  exit 1
fi
print_done "Frontend built successfully -> $APP_DIR/frontend/out/"

# ══════════════════════════════════════════════════════════════════════════════
# STEP 9: Configure Nginx
# ══════════════════════════════════════════════════════════════════════════════
print_step 9 "Configuring Nginx..."

cat > /etc/nginx/sites-available/ticketing-system << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Frontend static files
    root /var/www/ticketing-system/frontend/out;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 50M;
    }

    # Socket.io proxy (WebSocket)
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Swagger docs proxy
    location /api-docs {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Local file uploads proxy
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }

    # Frontend SPA fallback
    location / {
        try_files $uri $uri/ $uri/index.html /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

# Enable site, remove default
ln -sf /etc/nginx/sites-available/ticketing-system /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

print_done "Nginx configured and running."

# ══════════════════════════════════════════════════════════════════════════════
# STEP 10: Start backend with PM2
# ══════════════════════════════════════════════════════════════════════════════
print_step 10 "Starting backend with PM2..."

cd "$APP_DIR/backend"

# Stop existing if any
sudo -u "$ACTUAL_USER" pm2 delete ticketing-backend 2>/dev/null || true

# Start backend
sudo -u "$ACTUAL_USER" bash -c "
  cd $APP_DIR/backend && \
  pm2 start src/index.js \
    --name ticketing-backend \
    --max-memory-restart 512M \
    --time
"

# Save PM2 list and enable startup on reboot
sudo -u "$ACTUAL_USER" pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u "$ACTUAL_USER" --hp "$ACTUAL_HOME" 2>/dev/null || true
systemctl enable pm2-"$ACTUAL_USER" 2>/dev/null || true

# ══════════════════════════════════════════════════════════════════════════════
# Done
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=============================================="
echo -e "  ${GREEN}SETUP COMPLETE!${NC}"
echo "=============================================="
echo ""
echo "  Your app is live at:"
echo -e "    ${CYAN}http://$SERVER_IP${NC}"
echo ""
echo "  Health check:"
echo -e "    ${CYAN}http://$SERVER_IP/api/health${NC}"
echo ""
echo "  API Docs:"
echo -e "    ${CYAN}http://$SERVER_IP/api-docs${NC}"
echo ""
echo "  ── First-time setup ──"
echo "  Seed the super admin account:"
echo -e "    ${YELLOW}cd $APP_DIR/backend && npm run seed:super${NC}"
echo ""
echo "  ── Useful commands ──"
echo "    pm2 status                    # check process status"
echo "    pm2 logs ticketing-backend    # view logs"
echo "    pm2 restart ticketing-backend # restart backend"
echo "    pm2 monit                     # real-time monitor"
echo ""
echo "  ── To redeploy after code changes ──"
echo "    cd $APP_DIR"
echo "    git pull origin main"
echo "    cd backend && npm ci --production"
echo "    cd ../frontend && npm ci && npm run build"
echo "    pm2 restart ticketing-backend"
echo ""
echo "=============================================="
