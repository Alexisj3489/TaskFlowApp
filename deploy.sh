#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TaskFlow - VPS Deployment Script     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Este script debe ejecutarse como root${NC}"
   exit 1
fi

# Step 1: Update system
echo -e "${YELLOW}[1/8]${NC} Actualizando sistema..."
apt update && apt upgrade -y && apt autoremove -y && apt autoclean -y
if [ $? -ne 0 ]; then
    echo -e "${RED}Error actualizando sistema${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Sistema actualizado${NC}\n"

# Step 2: Install dependencies
echo -e "${YELLOW}[2/8]${NC} Instalando herramientas necesarias..."
apt install -y \
  curl wget git nano vim htop tree unzip zip \
  ca-certificates gnupg lsb-release \
  software-properties-common dnsutils net-tools ufw apache2-utils
echo -e "${GREEN}✓ Herramientas instaladas${NC}\n"

# Step 3: Install Docker
echo -e "${YELLOW}[3/8]${NC} Instalando Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

if docker --version &> /dev/null; then
    echo -e "${GREEN}✓ Docker instalado${NC}\n"
else
    echo -e "${RED}Error instalando Docker${NC}"
    exit 1
fi

# Step 4: Create directories
echo -e "${YELLOW}[4/8]${NC} Creando estructura de carpetas..."
mkdir -p /opt/apps/{taskflow-api,taskflow-web}
mkdir -p /opt/traefik/{dynamic,certs}
mkdir -p /opt/portainer

if [ -d "/opt/apps" ]; then
    echo -e "${GREEN}✓ Carpetas creadas${NC}\n"
else
    echo -e "${RED}Error creando carpetas${NC}"
    exit 1
fi

# Step 5: Create Docker networks
echo -e "${YELLOW}[5/8]${NC} Creando redes Docker..."
docker network create proxy 2>/dev/null || true
docker network create backend 2>/dev/null || true
echo -e "${GREEN}✓ Redes creadas${NC}\n"

# Step 6: Setup Firewall
echo -e "${YELLOW}[6/8]${NC} Configurando firewall..."
ufw allow OpenSSH 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true
echo -e "${GREEN}✓ Firewall configurado${NC}\n"

# Step 7: Deploy Traefik
echo -e "${YELLOW}[7/8]${NC} Desplegando Traefik..."
cd /opt/traefik

# Copy traefik.yml
cat > traefik.yml << 'EOF'
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          regex: "^http://(.*)$"
          replacement: "https://$1"
          permanent: true
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false
    network: proxy

certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@byronrm.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

api:
  dashboard: false
  debug: false

log:
  level: INFO

accessLog: {}
EOF

# Create acme.json
touch acme.json
chmod 600 acme.json

# Create docker-compose
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  traefik:
    image: traefik:v3.6.1
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./acme.json:/letsencrypt/acme.json
      - ./dynamic:/etc/traefik/dynamic:ro
    networks:
      - proxy

networks:
  proxy:
    external: true
EOF

docker compose up -d
sleep 3

if [ "$(docker ps -q -f name=traefik)" ]; then
    echo -e "${GREEN}✓ Traefik desplegado${NC}\n"
else
    echo -e "${RED}Traefik no está corriendo${NC}"
fi

# Step 8: Summary
echo -e "${YELLOW}[8/8]${NC} Resumen del despliegue..."
echo -e "${GREEN}✓ Despliegue inicial completado${NC}\n"

echo -e "${BLUE}═════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Instalación completada exitosamente${NC}"
echo -e "${BLUE}═════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Copiar archivos docker-compose a /opt/apps"
echo "2. Configurar DNS en Byron (profesor)"
echo "3. Configurar GitHub Secrets"
echo "4. Hacer git push a main"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "docker ps              # Ver contenedores activos"
echo "docker logs traefik    # Ver logs de Traefik"
echo "docker network ls      # Ver redes Docker"
echo ""
echo -e "${YELLOW}URLs después de configurar DNS:${NC}"
echo "Frontend:  https://coronel.byronrm.com"
echo "Backend:   https://backalexis.byronrm.com"
echo "pgAdmin:   https://pgpacheco.byronrm.com"
echo "Portainer: https://portainai.byronrm.com"
echo ""

exit 0
