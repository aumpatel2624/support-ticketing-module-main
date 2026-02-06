#!/bin/bash
# =============================================================
# EC2 Deployment Setup Script for Ticketing System
# Run this on a fresh Ubuntu 22.04/24.04 EC2 instance
# Usage: chmod +x setup-ec2.sh && sudo ./setup-ec2.sh
# =============================================================

set -e

echo "========================================="
echo "  Ticketing System - EC2 Setup Script"
echo "========================================="

# Update system
echo "[1/7] Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20 LTS
echo "[2/7] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify
node -v
npm -v

# Install Nginx
echo "[3/7] Installing Nginx..."
apt install -y nginx

# Install PM2 globally
echo "[4/7] Installing PM2..."
npm install -g pm2

# Install Puppeteer dependencies (for PDF generation)
echo "[5/7] Installing Chromium dependencies for Puppeteer..."
apt install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2t64 \
  libatk-bridge2.0-0t64 \
  libatk1.0-0t64 \
  libcups2t64 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0t64 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  git

# Install Chromium as system package (avoids Puppeteer downloading its own)
apt install -y chromium-browser || apt install -y chromium

# Create app directory
echo "[6/7] Creating application directory..."
mkdir -p /var/www/ticketing-system
chown -R $SUDO_USER:$SUDO_USER /var/www/ticketing-system

# Create uploads directory for local file storage fallback
mkdir -p /var/www/ticketing-system/backend/uploads
chown -R $SUDO_USER:$SUDO_USER /var/www/ticketing-system/backend/uploads

echo "[7/7] Setup complete!"
echo ""
echo "========================================="
echo "  Next steps:"
echo "  1. Clone your repo into /var/www/ticketing-system"
echo "  2. Copy and edit the .env files"
echo "  3. Run the deploy script: ./deploy/deploy.sh"
echo "========================================="
