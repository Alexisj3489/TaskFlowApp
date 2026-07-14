# 📋 TaskFlow - Gestor de Tareas en la Nube

Proyecto final de DevOps - Despliegue completo de una aplicación web en VPS con Docker, Kubernetes-like orchestration, y CI/CD automático.

## 🎯 Características

✅ **Autenticación segura** con JWT  
✅ **CRUD completo** de tareas  
✅ **Base de datos PostgreSQL** privada  
✅ **Frontend React + Vite** responsivo  
✅ **Backend FastAPI** con documentación automática  
✅ **Proxy inverso Traefik** con HTTPS automático  
✅ **CI/CD con GitHub Actions** - Despliegue automático  
✅ **Interfaz web Portainer** para administración  
✅ **pgAdmin** para gestión de base de datos  

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Usuario / Navegador                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  DNS byronrm.com       │
        └────────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Traefik (Reverse Proxy)                         │
│         Puertos 80/443 - Let's Encrypt HTTPS                │
└─┬──────────────────┬──────────────────┬────────────────────┬┘
  │                  │                  │                    │
  ▼                  ▼                  ▼                    ▼
Frontend          Backend            pgAdmin            Portainer
React+Vite        FastAPI            (BD)               (Docker UI)
:80                :8000              :80                :9000
coronel.          backalexis.         pgpacheco.        portainai.
byronrm.com       byronrm.com        byronrm.com       byronrm.com
  │                  │                  │
  │                  └──────┬───────────┘
  │                         │
  │        ┌────────────────┘
  │        │
  └────┬───┴──────────────────┐
       │                      │
       ▼                      ▼
   Red Proxy           Red Backend
  (pública)           (privada)
                          │
                          ▼
                   PostgreSQL
                   (5432)
                   (Sin acceso externo)
```

---

## 🚀 Despliegue Rápido

### Requisitos Previos
- VPS Debian 12 (Contabo o similar)
- Dominio con subdominios configurados
- Cuenta GitHub

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/TaskFlowApp.git
   cd TaskFlowApp
   ```

2. **Conectar al VPS**
   ```bash
   ssh root@<tu-ip-vps>
   ```

3. **Ejecutar el script de despliegue**
   ```bash
   bash deploy.sh
   ```

4. **Configurar GitHub Secrets** (ver DEPLOYMENT_GUIDE.md)

5. **Hacer push a main**
   ```bash
   git push origin main
   ```

---

## 📁 Estructura del Proyecto

```
TaskFlowApp/
├── backend/
│   ├── main.py           # API FastAPI
│   ├── requirements.txt  # Dependencias Python
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth.jsx         # Login/Registro
│   │   │   ├── TaskList.jsx     # CRUD de tareas
│   │   │   ├── Auth.css
│   │   │   └── TaskList.css
│   │   ├── api.js               # Cliente HTTP
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .env.production
├── docker/
│   ├── docker-compose.traefik.yml
│   ├── docker-compose.backend.yml
│   ├── docker-compose.frontend.yml
│   ├── docker-compose.database.yml
│   ├── docker-compose.portainer.yml
│   └── traefik.yml
├── .github/workflows/
│   └── deploy.yml        # GitHub Actions CI/CD
├── DEPLOYMENT_GUIDE.md   # Guía completa
├── README.md
└── .gitignore
```

---

## 🔑 URLs y Credenciales

| Servicio | URL | Usuario | Contraseña |
|---|---|---|---|
| **Frontend** | https://coronel.byronrm.com | - | - |
| **Backend API** | https://backalexis.byronrm.com | - | - |
| **API Docs** | https://backalexis.byronrm.com/docs | - | - |
| **pgAdmin** | https://pgpacheco.byronrm.com | admin@example.com | admin123 |
| **Portainer** | https://portainai.byronrm.com | admin | admin123 |
| **PostgreSQL** | Privado (red backend) | taskflow | taskflow123 |

> ⚠️ **IMPORTANTE:** Cambia las contraseñas por defecto en producción

---

## 📚 Documentación

### Backend API
- **Endpoint:** https://backalexis.byronrm.com
- **Documentación interactiva:** https://backalexis.byronrm.com/docs
- **Esquema OpenAPI:** https://backalexis.byronrm.com/openapi.json

### Despliegue
Ver `DEPLOYMENT_GUIDE.md` para instrucciones paso a paso.

---

## 🔧 Desarrollo Local

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Abierto en: http://localhost:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Abierto en: http://localhost:5173

---

## 🐳 Docker

### Build Local

```bash
# Backend
cd backend
docker build -t taskflow-api:local .
docker run -p 8000:8000 taskflow-api:local

# Frontend
cd frontend
docker build -t taskflow-web:local .
docker run -p 80:80 taskflow-web:local
```

### Docker Compose

```bash
cd docker
docker compose -f docker-compose.traefik.yml up -d
docker compose -f docker-compose.database.yml up -d
docker compose -f docker-compose.portainer.yml up -d
docker compose -f docker-compose.backend.yml up -d
docker compose -f docker-compose.frontend.yml up -d
```

---

## 🔄 CI/CD Pipeline

El proyecto incluye GitHub Actions para:

1. **Build automático** de imágenes Docker
2. **Push a GitHub Container Registry** (GHCR)
3. **Despliegue automático** en el VPS vía SSH
4. **Reinicio de contenedores** con las nuevas imágenes

**Triggerador:** Push a la rama `main`

---

## 🧪 Testing

### Registrar usuario

```bash
curl -X POST https://backalexis.byronrm.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Crear tarea

```bash
curl -X POST https://backalexis.byronrm.com/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primera tarea",
    "description": "Descripción detallada"
  }'
```

---

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Tokens JWT con expiración
- ✅ CORS restringido al dominio del frontend
- ✅ HTTPS con certificados Let's Encrypt
- ✅ PostgreSQL sin exposición pública
- ✅ Variables de entorno sensibles en `.env` (no en Git)

---

## 📊 Matriz de Componentes

| Componente | Imagen | Puerto | Red | Estado |
|---|---|---|---|---|
| Traefik | traefik:v3.6.1 | 80, 443 | proxy | ✅ |
| Frontend | ghcr.io/.../taskflow-web | 80 | proxy | ✅ |
| Backend | ghcr.io/.../taskflow-api | 8000 | proxy, backend | ✅ |
| PostgreSQL | postgres:16-alpine | 5432 | backend | ✅ |
| pgAdmin | dpage/pgadmin4 | 80 | proxy, backend | ✅ |
| Portainer | portainer/portainer-ce | 9000 | proxy | ✅ |

---

## 🚨 Troubleshooting

### El dominio no abre
```bash
dig coronel.byronrm.com
# Debe devolver la IP del VPS
```

### Backend devuelve 502
```bash
docker logs taskflow-api
docker exec taskflow-api curl http://localhost:8000/health
```

### Frontend no conecta a API
```bash
# F12 en el navegador → Console
# Revisar VITE_API_URL y CORS_ORIGINS
```

### PostgreSQL sin conexión
```bash
docker exec taskflow-postgres psql -U taskflow -d taskflow -c "\dt"
```

---

## 👨‍💻 Autores

- **Alexis Coronel** - Backend & Infraestructura
- **Isaac Pacheco** - Frontend & Base de Datos

---

## 📄 Licencia

Este proyecto es parte del curso de DevOps - Proyecto Final

---

## 🎓 Defensa del Proyecto

### Puntos a cubrir:
1. Arquitectura completa y diagrama
2. Configuración de Traefik y HTTPS
3. Seguridad: JWT, bcrypt, CORS
4. CI/CD con GitHub Actions
5. Docker y orquestación
6. Base de datos y migraciones
7. Demostración en vivo (registrar, crear tarea, verificar en BD)

---

**¡Proyecto finalizado y listo para producción! 🚀**
