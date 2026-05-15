# Guía de Deploy — Artesanos.ar

## Pre-requisitos

- JDK 21
- Maven 3.9+
- MySQL 8+
- Cuenta en Cloudinary (free tier alcanza para empezar)
- Email SMTP (Gmail con App Password, o SendGrid/Mailgun en producción seria)

## Variables de entorno

Ver `.env.example`. **Antes de arrancar la app en cualquier ambiente** hay que setear las variables. Hay tres formas según el hosting:

1. **Local**: archivo `.env` en la raíz del proyecto (no commitearlo nunca)
2. **Docker**: `docker run --env-file .env ...`
3. **Cloud (Render/Railway/Fly.io)**: panel de Environment Variables del servicio

## Arrancar localmente

```bash
# Setear variables
cp .env.example .env
# Editar .env con tus valores

# Compilar y arrancar
mvn clean install
mvn spring-boot:run
```

La app queda en `http://localhost:8080`.

## Build de producción

```bash
mvn clean package -DskipTests
# Genera target/blogArtesanos-0.0.1-SNAPSHOT.jar
java -jar target/blogArtesanos-0.0.1-SNAPSHOT.jar
```

## Deploy con Docker

```bash
docker build -t artesanos-backend .
docker run -p 8080:8080 --env-file .env artesanos-backend
```

## Deploy en Render (recomendado para empezar)

1. Conectá tu repo de GitHub
2. **New > Web Service** → selecciona el repo
3. Environment: **Docker** (detecta el Dockerfile)
4. Plan: **Free** para arrancar, **Starter** ($7/mes) para prod real
5. En **Environment Variables** copiá todo lo de tu `.env`
6. Para la DB: **New > PostgreSQL/MySQL** o usa PlanetScale free tier
7. Setá `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` apuntando a la DB nueva

## Deploy del frontend

El frontend (React + Vite) se puede hostear en:
- **Vercel** (gratis, deploy automático desde GitHub)
- **Netlify** (igual)
- **Render Static Site** (gratis)

Variables del frontend:
- `VITE_API_URL=https://api.artesanos.ar` (la URL de tu backend desplegado)

## Backup de la base de datos

### Manual (lo más simple para empezar)

```bash
# Dump completo
mysqldump -u root -p blogartesanos > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p blogartesanos < backup_20250114.sql
```

### Automatizado con cron (Linux/Mac)

Editá tu crontab:

```bash
crontab -e
```

Agregá una línea para backup diario a las 3 AM:

```
0 3 * * * mysqldump -u root -p'TU_PASSWORD' blogartesanos > /var/backups/artesanos_$(date +\%Y\%m\%d).sql
```

Y otro cron para limpiar backups viejos (mantener 30 días):

```
0 4 * * * find /var/backups -name "artesanos_*.sql" -mtime +30 -delete
```

### Hosting managed (Render/Railway)

La mayoría de los providers managed hacen backup automático:
- Render Postgres/MySQL: backup diario incluido en plan pago
- Railway: backup point-in-time incluido
- PlanetScale: branching/restore por revisión

Revisar en el panel del provider y **habilitar backups antes de salir a producción**.

## Setup inicial de la base

```sql
CREATE DATABASE blogartesanos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'artesanos'@'%' IDENTIFIED BY 'TU_PASSWORD_FUERTE';
GRANT ALL PRIVILEGES ON blogartesanos.* TO 'artesanos'@'%';
FLUSH PRIVILEGES;
```

En el primer arranque, Spring Boot crea las tablas (con `DDL_AUTO=update`).
**En prod, después del primer deploy** cambiá a `DDL_AUTO=validate` y manejá
los cambios de schema con migraciones manuales o Flyway.

## Health check

```bash
curl http://localhost:8080/actuator/health
# {"status":"UP"}
```

Los servicios de hosting usan este endpoint para saber si la app está viva
y reiniciarla si se cae.

## Monitoreo recomendado (gratis)

- **UptimeRobot** (https://uptimerobot.com): ping cada 5min a `/actuator/health`,
  te avisa por email si se cae.
- **Sentry** (https://sentry.io): tracking de errores. Free tier 5k eventos/mes.
  Agregar dependencia `io.sentry:sentry-spring-boot-starter-jakarta` y setear `SENTRY_DSN`.
- **Logs**: en Render/Railway los ves desde el panel. Para análisis avanzado, exportarlos a
  Logtail o Better Stack (free tier).

## Checklist pre-producción

- [ ] Cambiar `ADMIN_PASSWORD` a algo fuerte (NO `admin1234`)
- [ ] Generar `JWT_SECRET` random fuerte: `openssl rand -base64 48`
- [ ] Setear `CORS_ORIGINS` a tu dominio real, NO `*`
- [ ] `DDL_AUTO=validate` después del primer deploy
- [ ] `SHOW_SQL=false`
- [ ] Email SMTP con app password (no la password real)
- [ ] HTTPS configurado (Let's Encrypt vía Nginx, Cloudflare, o el provider)
- [ ] Backup automático configurado y testeado (¡restaurá uno para confirmar!)
- [ ] Monitoreo (UptimeRobot mínimo)
- [ ] Logs persistentes (no en memoria del container)
- [ ] Rate limiting verificado (probar `/api/auth/login` 6 veces y ver 429)
- [ ] `app.frontend-url` apuntando al dominio del frontend
- [ ] Validar que no hay credenciales hardcodeadas (`grep -r "password=" src/` debería dar solo placeholders)

## Rollback de emergencia

Si un deploy rompe algo:

```bash
# Con Docker: volver a tag previo
docker pull artesanos-backend:previous
docker stop artesanos-backend
docker run -d artesanos-backend:previous

# Con Render/Railway: panel → Deploys → click en el deploy anterior → "Rollback"
```

## Contacto

Para incidentes de seguridad: gestioncomplejodeportivo@gmail.com
