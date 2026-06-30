#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Docker Engine + Compose plugin o'rnatish — Ubuntu 24.04 (noble)
# Rasmiy Docker apt repozitoriyasidan. Serverda sudo bilan ishga tushiring:
#   sudo bash scripts/install-docker-ubuntu.sh
# ──────────────────────────────────────────────────────────────
set -euo pipefail

echo "==> Eski/konfliktli paketlarni olib tashlash"
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  apt-get remove -y "$pkg" 2>/dev/null || true
done

echo "==> Prerequisites"
apt-get update
apt-get install -y ca-certificates curl gnupg

echo "==> Docker GPG kaliti"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "==> Docker apt repozitoriyasi"
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

echo "==> Docker Engine + Compose plugin o'rnatish"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

echo "==> Servisni yoqish"
systemctl enable --now docker

echo "==> Joriy foydalanuvchini docker guruhiga qo'shish (sudosiz ishlatish uchun)"
TARGET_USER="${SUDO_USER:-$USER}"
usermod -aG docker "$TARGET_USER" || true

echo
echo "==> Tekshiruv"
docker --version
docker compose version

echo
echo "✅ Tayyor. '$TARGET_USER' uchun docker guruhi qayta login (yoki: newgrp docker) talab qiladi."
echo "   Keyin loyiha papkasida:"
echo "     cp .env.docker.example .env.docker   # qiymatlarni to'ldiring"
echo "     docker compose -f docker-compose.prod.yml up -d --build"
