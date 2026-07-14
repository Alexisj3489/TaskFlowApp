# 🔧 Configuración de GitHub Actions

## Paso 1: Generar clave SSH en el VPS

Conectate al VPS y ejecuta:

```bash
ssh root@<tu-ip-vps>

ssh-keygen -t ed25519 -f /root/deploy_key -C "github-actions" -N ""
```

Esto genera dos archivos:
- `/root/deploy_key` (privada - secreto)
- `/root/deploy_key.pub` (pública - autorizada)

Agrega la clave pública a los authorized_keys:

```bash
cat /root/deploy_key.pub >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

Muestra la clave privada:

```bash
cat /root/deploy_key
```

**Copia todo el contenido incluyendo `-----BEGIN OPENSSH PRIVATE KEY-----` y `-----END OPENSSH PRIVATE KEY-----`**

---

## Paso 2: Agregar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (engranaje)
3. En el menú izquierdo: **Secrets and variables** → **Actions**
4. Click en **New repository secret**

Agrega estos 3 secrets:

### Secret 1: VPS_HOST

**Name:** `VPS_HOST`  
**Value:** Tu IP del VPS (ej: `164.68.127.68`)

Click **Add secret**

---

### Secret 2: VPS_USER

**Name:** `VPS_USER`  
**Value:** `root`

Click **Add secret**

---

### Secret 3: VPS_SSH_KEY

**Name:** `VPS_SSH_KEY`  
**Value:** Pega todo el contenido de `/root/deploy_key`

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUtbm9uZS1ub25lAA...
... (contenido largo)
-----END OPENSSH PRIVATE KEY-----
```

Click **Add secret**

---

### Secret 4 (Opcional): VPS_PORT

**Name:** `VPS_PORT`  
**Value:** `22`

Click **Add secret**

---

## Paso 3: Verificar GitHub Container Registry (GHCR)

El workflow necesita permisos para subir imágenes a GHCR:

1. Ve a **Settings** → **Developer settings** → **Personal access tokens**
2. Click en **Tokens (classic)**
3. Click en **Generate new token**
4. Dale un nombre: `GHCR_TOKEN`
5. Selecciona los permisos:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`
6. Click en **Generate token**
7. Copia el token
8. Ve a tu repo → **Settings** → **Secrets and variables** → **Actions**
9. Click en **New repository secret**
   - Name: `GHCR_TOKEN`
   - Value: Pega el token
10. Click **Add secret**

---

## Paso 4: Configurar el Workflow

El workflow ya está en `.github/workflows/deploy.yml`

Revisa que tenga:

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    # ... build Docker images ...

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd /opt/apps/taskflow-api
            docker compose pull
            docker compose up -d --force-recreate
            ...
```

---

## Paso 5: Hacer Push a main

Cuando hagas `git push origin main`, GitHub Actions:

1. ✅ Clona el código
2. ✅ Build imagen del backend
3. ✅ Build imagen del frontend
4. ✅ Push a GHCR
5. ✅ Conecta al VPS vía SSH
6. ✅ Hace `docker compose pull` (descarga nuevas imágenes)
7. ✅ Hace `docker compose up -d --force-recreate` (reinicia servicios)
8. ✅ Limpia imágenes antiguas

---

## Verificar Despliegue

1. Ve a tu repositorio
2. Click en **Actions**
3. Verás el workflow ejecutándose
4. Espera a que termine (verde ✅)
5. Revisa los logs
6. Verifica en el VPS:

```bash
docker logs taskflow-api -f
docker logs taskflow-web -f
docker ps
```

---

## Solución de Problemas

### El workflow falla en "Deploy to VPS"

1. Verifica que `VPS_HOST`, `VPS_USER` y `VPS_SSH_KEY` sean correctos
2. Prueba la conexión SSH manualmente:
   ```bash
   ssh -i deploy_key root@<tu-ip>
   ```
3. Verifica que la clave privada tenga permisos correctos:
   ```bash
   chmod 600 /root/deploy_key
   ```

### Las imágenes no se suben a GHCR

1. Verifica el `GHCR_TOKEN` sea válido
2. En el workflow, revisa que esté usando `GITHUB_TOKEN` (automático)
3. Verifica los permisos en el repositorio

### El backend/frontend no se actualiza

1. Verifica que Docker compose esté en `/opt/apps/taskflow-api` y `/opt/apps/taskflow-web`
2. Revisa los logs del workflow
3. Conecta al VPS y ejecuta manualmente:
   ```bash
   cd /opt/apps/taskflow-api
   docker compose pull
   docker compose up -d
   docker logs --tail 50 taskflow-api
   ```

---

## Archivos Checklist

Asegúrate de tener estos archivos en tu repositorio:

- ✅ `.github/workflows/deploy.yml`
- ✅ `backend/Dockerfile`
- ✅ `backend/requirements.txt`
- ✅ `backend/main.py`
- ✅ `frontend/Dockerfile`
- ✅ `frontend/package.json`
- ✅ `docker/docker-compose.*.yml`
- ✅ `.gitignore` (con .env)

---

## Flujo Completo

```
1. Desarrollas localmente
   git add .
   git commit -m "Update features"
   git push origin main

2. GitHub Actions inicia automáticamente
   (ver Actions en el repo)

3. Build:
   - Docker build backend
   - Docker build frontend
   - Push a GHCR

4. Deploy:
   - SSH al VPS
   - docker compose pull
   - docker compose up -d

5. Verificar:
   - https://coronel.byronrm.com (frontend)
   - https://backalexis.byronrm.com/docs (API)
```

---

## Notas Importantes

⚠️ **Seguridad:**
- La clave SSH es privada, nunca la compartas
- Los secrets en GitHub están encriptados
- El workflow solo se ejecuta en pushes a `main`

⚠️ **Primeros despliegues:**
- El build puede tardar 5-10 minutos
- La primera vez tendrás que configurar pgAdmin
- Traefik necesita generar certificados (puede tardar)

✅ **Después de cada despliegue:**
```bash
# En el VPS
docker ps
docker logs traefik | tail -20
curl -I https://coronel.byronrm.com
curl -I https://backalexis.byronrm.com/health
```

---

**¡Listo para despliegues automáticos! 🚀**
