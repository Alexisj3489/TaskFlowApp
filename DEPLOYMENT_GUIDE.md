# 🚀 Guía de Despliegue - TaskFlow en VPS

## 📋 Información del Proyecto

**Autor:** Alexis Coronel & Isaac Pacheco  
**Dominio:** `byronrm.com`  
**VPS:** Contabo (Debian 12)  
**IP:** Tu IP del VPS  

---

## 📍 URLs de los Servicios

| Servicio | URL | Usuario/Contraseña |
|---|---|---|
| **Frontend** | https://coronel.byronrm.com | - |
| **Backend API** | https://backalexis.byronrm.com | - |
| **API Docs** | https://backalexis.byronrm.com/docs | Swagger interactivo |
| **pgAdmin** | https://pgpacheco.byronrm.com | admin@example.com / admin123 |
| **Portainer** | https://portainai.byronrm.com | admin / admin123 |

---

## ⚙️ PASO 1: Preparar el VPS

```bash
# Conexión SSH
ssh root@<tu-ip-vps>

# Actualizar sistema
apt update && apt upgrade -y && apt autoremove -y && apt autoclean

# Instalar herramientas
apt install -y \
  curl wget git nano vim htop tree unzip zip \
  ca-certificates gnupg lsb-release \
  software-properties-common dnsutils net-tools ufw apache2-utils

# Crear usuario (opcional)
adduser taskflow
usermod -aG sudo taskflow

# Configurar Firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status verbose

# Crear estructura de carpetas
mkdir -p /opt/apps/{taskflow-api,taskflow-web}
mkdir -p /opt/traefik/{dynamic,certs}
mkdir -p /opt/portainer
cd /opt
tree
```

---

## 🐳 PASO 2: Instalar Docker

```bash
# Instalar Docker Engine
apt install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Habilitar Docker
systemctl enable docker
systemctl start docker

# Verificar instalación
docker version
docker compose version
docker run --rm hello-world
```

---

## 🌐 PASO 3: Crear Redes Docker

```bash
docker network create proxy
docker network create backend
docker network ls
```

---

## 🔧 PASO 4: Desplegar Traefik (Reverse Proxy)

```bash
cd /opt/traefik

# Crear archivo de configuración
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

# Crear archivo de certificados
touch acme.json
chmod 600 acme.json

# Crear docker-compose
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

# Desplegar
docker compose up -d
docker logs --tail 50 traefik
ss -tulpn | grep -E ':80|:443'
```

---

## 📦 PASO 5: Desplegar Base de Datos (PostgreSQL + pgAdmin)

```bash
cd /opt/apps
mkdir -p postgres
cd postgres

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  taskflow-postgres:
    image: postgres:16-alpine
    container_name: taskflow-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow123
      POSTGRES_DB: taskflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  taskflow-pgadmin:
    image: dpage/pgadmin4:latest
    container_name: taskflow-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    networks:
      - proxy
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.taskflow-pgadmin.rule=Host(\`pgpacheco.byronrm.com\`)"
      - "traefik.http.routers.taskflow-pgadmin.entrypoints=websecure"
      - "traefik.http.routers.taskflow-pgadmin.tls=true"
      - "traefik.http.routers.taskflow-pgadmin.tls.certresolver=letsencrypt"
      - "traefik.http.services.taskflow-pgadmin.loadbalancer.server.port=80"
    depends_on:
      - taskflow-postgres

volumes:
  postgres_data:

networks:
  proxy:
    external: true
  backend:
    external: true
EOF

docker compose up -d
docker logs taskflow-postgres
```

---

## 🖥️ PASO 6: Desplegar Portainer

```bash
cd /opt/portainer

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    restart: unless-stopped
    command: -H unix:///var/run/docker.sock
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.portainer.rule=Host(\`portainai.byronrm.com\`)"
      - "traefik.http.routers.portainer.entrypoints=websecure"
      - "traefik.http.routers.portainer.tls=true"
      - "traefik.http.routers.portainer.tls.certresolver=letsencrypt"
      - "traefik.http.services.portainer.loadbalancer.server.port=9000"

volumes:
  portainer_data:

networks:
  proxy:
    external: true
EOF

docker compose up -d
```

---

## 🚀 PASO 7: Desplegar Backend (FastAPI)

```bash
cd /opt/apps/taskflow-api

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  taskflow-api:
    image: ghcr.io/alexiscoronel/taskflow-api:latest
    container_name: taskflow-api
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://taskflow:taskflow123@taskflow-postgres:5432/taskflow
      SECRET_KEY: your-secret-key-change-in-production
      CORS_ORIGINS: https://coronel.byronrm.com
    networks:
      - proxy
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.taskflow-api.rule=Host(\`backalexis.byronrm.com\`)"
      - "traefik.http.routers.taskflow-api.entrypoints=websecure"
      - "traefik.http.routers.taskflow-api.tls=true"
      - "traefik.http.routers.taskflow-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.taskflow-api.loadbalancer.server.port=8000"
    depends_on:
      - taskflow-postgres

networks:
  proxy:
    external: true
  backend:
    external: true
EOF

docker compose pull
docker compose up -d
docker logs --tail 50 taskflow-api

# Verificar
curl -I https://backalexis.byronrm.com/health
```

---

## 🎨 PASO 8: Desplegar Frontend (React + Vite)

```bash
cd /opt/apps/taskflow-web

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  taskflow-web:
    image: ghcr.io/alexiscoronel/taskflow-web:latest
    container_name: taskflow-web
    restart: unless-stopped
    networks:
      - proxy
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy"
      - "traefik.http.routers.taskflow-web.rule=Host(\`coronel.byronrm.com\`)"
      - "traefik.http.routers.taskflow-web.entrypoints=websecure"
      - "traefik.http.routers.taskflow-web.tls=true"
      - "traefik.http.routers.taskflow-web.tls.certresolver=letsencrypt"
      - "traefik.http.services.taskflow-web.loadbalancer.server.port=80"

networks:
  proxy:
    external: true
EOF

docker compose pull
docker compose up -d
docker logs --tail 50 taskflow-web

# Verificar
curl -I https://coronel.byronrm.com
```

---

## 🔐 PASO 9: Configurar GitHub Actions (CI/CD)

### 9.1 Generar SSH Key

```bash
ssh-keygen -t ed25519 -f /root/deploy_key -C "github-actions" -N ""
cat /root/deploy_key.pub >> /root/.ssh/authorized_keys
cat /root/deploy_key
# Copiar el contenido (privada, incluyendo BEGIN/END)
```

### 9.2 Agregar Secrets en GitHub

Ve a: `https://github.com/tu-usuario/tu-repo/settings/secrets/actions`

Agrega estos secrets:

```
VPS_HOST = 164.68.127.68
VPS_USER = root
VPS_SSH_KEY = <pega la clave privada>
VPS_PORT = 22
```

---

## ✅ PASO 10: Verificar Despliegue Completo

```bash
# Ver todos los contenedores
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Networks}}'

# Debe mostrar:
# traefik
# portainer
# taskflow-postgres
# taskflow-pgadmin
# taskflow-api
# taskflow-web

# Revisar logs de cada uno
docker logs traefik
docker logs taskflow-api
docker logs taskflow-web

# Verificar redes
docker network inspect proxy
docker network inspect backend

# Test de URLs
curl -I https://coronel.byronrm.com
curl -I https://backalexis.byronrm.com/health
curl -I https://backalexis.byronrm.com/docs
curl -I https://pgpacheco.byronrm.com
curl -I https://portainai.byronrm.com
```

---

## 📊 Matriz de Verificación

| Ítem | Comando | Resultado Esperado |
|---|---|---|
| Docker | `docker version` | Cliente y servidor OK |
| Red proxy | `docker network inspect proxy` | Servicios conectados |
| Red backend | `docker network inspect backend` | PostgreSQL, API y pgAdmin |
| Traefik | `docker logs traefik` | Sin errores |
| PostgreSQL | `docker exec taskflow-postgres pg_isready -U taskflow` | accepting connections |
| Backend API | `curl https://backalexis.byronrm.com/health` | {"status": "ok"} |
| Frontend | `curl https://coronel.byronrm.com` | HTML con React |
| Certificados | `curl -I https://coronel.byronrm.com` | Certificate verified |

---

## 🧪 Pruebas Funcionales

1. **Accede al frontend:** https://coronel.byronrm.com
2. **Registrate** con un email y contraseña
3. **Inicia sesión**
4. **Crea una tarea**
5. **Marca como completada**
6. **Edita la tarea**
7. **Elimina la tarea**
8. **Abre la API Docs:** https://backalexis.byronrm.com/docs
9. **Ingresa a pgAdmin:** https://pgpacheco.byronrm.com
   - Email: `admin@example.com`
   - Contraseña: `admin123`
10. **Verifica en pgAdmin:**
    - Conéctate a PostgreSQL
    - Ve las tablas: `users` y `tasks`
    - Verifica los datos guardados

---

## 🚨 Solución de Problemas

**El dominio no abre:**
```bash
dig coronel.byronrm.com  # Debe devolver tu IP del VPS
```

**Traefik devuelve Bad Gateway:**
```bash
docker logs traefik | grep -i error
# Verificar que el puerto interno sea correcto (backend: 8000, frontend: 80)
```

**El frontend no consume la API:**
```bash
# Ver consola del navegador (F12)
# Verificar CORS_ORIGINS en el backend
# Verificar VITE_API_URL en el frontend
```

**PostgreSQL no conecta:**
```bash
docker exec taskflow-api env | grep DATABASE_URL
docker exec taskflow-postgres psql -U taskflow -d taskflow -c "\dt"
```

---

## 📚 Documentación de Endpoints

### Autenticación

```bash
# Registro
curl -X POST https://backalexis.byronrm.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Login
curl -X POST https://backalexis.byronrm.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### CRUD de Tareas

```bash
# Obtener todas las tareas
curl -H "Authorization: Bearer <token>" \
  https://backalexis.byronrm.com/tasks

# Crear tarea
curl -X POST https://backalexis.byronrm.com/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Mi tarea", "description": "Descripción"}'

# Actualizar tarea
curl -X PUT https://backalexis.byronrm.com/tasks/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Eliminar tarea
curl -X DELETE https://backalexis.byronrm.com/tasks/1 \
  -H "Authorization: Bearer <token>"
```

---

## 🎯 Próximos Pasos

1. ✅ Actualizar `SECRET_KEY` en el backend
2. ✅ Cambiar contraseñas por defecto de pgAdmin
3. ✅ Configurar DNS en Byron (profesor)
4. ✅ Configurar GitHub Actions
5. ✅ Hacer `git push` y verificar despliegue automático
6. ✅ Revisar logs en Portainer

---

**¡Tu aplicación TaskFlow está lista para producción!** 🎉
