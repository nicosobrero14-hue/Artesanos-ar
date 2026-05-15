# Artesanos.ar

Marketplace para artesanos argentinos. Catálogo público de piezas, chat directo entre clientes y artesanos, sistema de reseñas, calendario de ferias, moderación admin, plan freemium con cupones y piezas destacadas.

**Stack**: Spring Boot 3.5 + MySQL · React 19 (Vite) · Cloudinary (imágenes/video) · Gmail SMTP · JWT auth.

## Setup local en 5 minutos

```bash
# Backend
cd blogArtesanos
cp .env.example .env
# editá .env con tus credenciales (DB, Cloudinary, Gmail App Password)

mvn clean install
mvn spring-boot:run
# levanta en http://localhost:8080

# Frontend (en otra terminal)
cd ../blog-artesanos-front
npm install
npm run dev
# levanta en http://localhost:5173
```

## Variables de entorno

Todas en `.env.example`. Las críticas:

| Variable | Qué es |
|---|---|
| `DB_PASSWORD` | password MySQL |
| `JWT_SECRET` | secreto random fuerte (mínimo 32 chars). `openssl rand -base64 48` |
| `CL_NAME`, `CL_API_KEY`, `CL_SECRET` | credenciales de Cloudinary |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Gmail + App Password (no la password real) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | bootstrap del admin al primer arranque |
| `CORS_ORIGINS` | dominios permitidos, separados por coma |

## Documentos de la app

- **`DEPLOY.md`** — guía completa de deploy (Docker, Render, backup, monitoreo, checklist pre-prod)
- **`.env.example`** — todas las variables documentadas
- **`Dockerfile`** — multi-stage build listo para containers

## Endpoints útiles

- `GET /actuator/health` — health check para hosting providers
- `GET /sitemap.xml` — sitemap generado dinámicamente para SEO
- `GET /api/auth/...` — login, register, verify, recovery (todos rate-limited)
- `GET /api/artesanos/...`, `/api/piezas/...` — catálogo público

## Features

- 🛒 **Catálogo público** con filtros por oficio (cuchillería, joyería, cuero, etc.)
- 💬 **Chat directo** cliente↔artesano con polling
- ⭐ **Reseñas y likes** sobre artesanos y piezas
- 🎟 **Cupones de descuento** que aplican a piezas específicas o globalmente
- 📅 **Calendario de ferias** con moderación admin
- 🏆 **Ranking semanal/mensual** con premio configurable
- 🛡 **Panel admin completo**: moderación de piezas, reportes, feedback, auditoría
- 💌 **Sistema de feedback** público con respaldo por email al admin
- 🔔 **Notificaciones in-app** con campanita y badge
- 🎨 **Plan Premium**: piezas ilimitadas, 15 fotos + 1 video por pieza, destacadas, posición prioritaria

## Seguridad

- JWT con secret en env var
- Rate limiting (`/api/auth/login` 5/5min, registro/recovery 3/h, feedback 5/h)
- CORS configurable por env var
- Headers de seguridad: HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- BCrypt para passwords
- Roles: USER / ADMIN
- Auditoría de acciones admin
- Sanitización de contenido user-generated

## Tests

```bash
mvn test
```

Tests unitarios de:
- `PlanService` (lógica de freemium)
- `RateLimitFilter` (que el throttle funcione)

## Licencia

Proyecto personal. Todos los derechos reservados.
