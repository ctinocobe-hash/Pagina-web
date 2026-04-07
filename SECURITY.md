# Plan de Seguridad - Despacho Legal

## Contexto

El sistema de gestion legal "Despacho Legal" maneja datos sensibles (expedientes juridicos, datos personales de clientes, credenciales judiciales, informacion financiera). Se realizo una auditoria de seguridad que identifico vulnerabilidades criticas. Este documento describe las mejoras implementadas y las pendientes.

---

## Estado de Implementacion

### Fase 1: CRITICO - Correcciones al Agent Server [COMPLETADA]

| # | Vulnerabilidad | Archivo | Estado |
|---|---------------|---------|--------|
| 1A | CORS abierto (aceptaba cualquier origen) | `agent/server.js` | Corregido: whitelist via `ALLOWED_ORIGINS` en `.env` |
| 1B | Sin rate limiting en `/sync` | `agent/server.js` | Corregido: `express-rate-limit` (5 req / 5 min) |
| 1C | Sin headers de seguridad | `agent/server.js` | Corregido: `helmet` middleware |
| 1D | Errores internos expuestos al cliente | `agent/server.js` | Corregido: mensaje generico, detalles solo en logs |
| 1E | Inputs de fecha sin validar | `agent/server.js` | Corregido: validacion regex YYYY-MM-DD |
| 1F | Logs con email del usuario | `agent/server.js` | Corregido: solo se loguea user ID |

**Dependencias agregadas:** `express-rate-limit@^7.2.0`, `helmet@^7.1.0`

---

### Fase 2: ALTO - Credenciales y Contrasenas [COMPLETADA]

| # | Vulnerabilidad | Archivo(s) | Estado |
|---|---------------|-----------|--------|
| 2A | Password del portal judicial NO se envia al frontend | `src/lib/supabase.js` | Corregido: `getConfiguracionPortal` no selecciona campo `password` |
| 2A | Password no se pre-popula en formulario | `src/pages/Dashboard.jsx` | Corregido: campo inicia vacio, solo se envia si se cambia |
| 2A | `saveConfiguracionPortal` preserva password existente | `src/lib/supabase.js` | Corregido: no envia password vacio |
| 2B | Password de portal cliente visible indefinidamente en UI | `src/pages/Dashboard.jsx` | Corregido: auto-limpieza a 60 segundos |
| 2C | Registro publico abierto | `src/pages/Auth.jsx` | Corregido: removida opcion de registro |

**PENDIENTE (requiere acceso a Supabase Dashboard):**
- Desactivar "Enable signups" en Authentication > Settings del proyecto Supabase
- Implementar encriptacion con `pgcrypto` para `configuracion_portal.password` (requiere Edge Function o RPC)

---

### Fase 3: MEDIO - RLS y Control de Acceso [COMPLETADA - PENDIENTE EJECUTAR SQL]

**Archivo:** `supabase/migrations/002_security_improvements.sql`

| # | Mejora | Estado |
|---|--------|--------|
| 3A | RLS para `equipo_miembros` y `portal_clientes` | SQL creado - pendiente ejecutar |
| 3B | RLS con soporte de equipo (no solo `user_id`) | SQL creado - pendiente ejecutar |
| 3C | Portal de clientes puede acceder datos via RLS | SQL creado - pendiente ejecutar |
| 3D | Columna `visible_portal` en tabla `cobros` | SQL creado - pendiente ejecutar |
| 3E | Storage bucket con politicas de acceso | SQL creado - pendiente ejecutar |

**ACCION REQUERIDA:** Ejecutar `supabase/migrations/002_security_improvements.sql` en el SQL Editor de Supabase.

---

### Fase 4: BAJO - Hardening Frontend [COMPLETADA]

| # | Mejora | Archivo | Estado |
|---|--------|---------|--------|
| 4A | Regex de sanitizacion expandida | `src/pages/Dashboard.jsx` | Corregido: incluye `()`, `:`, `;`, `#`, `?`, `!`, etc. |
| 4B | Sanitizacion de inputs de email | `src/pages/Dashboard.jsx` | Corregido: `sanitizeEmail()` aplicada |
| 4C | Security headers en hosting | `vercel.json` | Creado: X-Frame-Options, CSP, etc. |
| 4D | Timeout de sesion por inactividad | `src/main.jsx` | Corregido: 30 min de inactividad |

---

## Acciones Pendientes (futuras sesiones)

### Prioridad Alta
1. **Ejecutar migracion SQL** - Correr `supabase/migrations/002_security_improvements.sql` en el SQL Editor de Supabase
2. **Desactivar signups publicos** - En Supabase Dashboard > Authentication > Settings
3. **Encriptacion de credenciales judiciales** - Implementar encriptacion con `pgcrypto` para el campo `password` de `configuracion_portal`:
   - Opcion A: Crear Edge Function que encripte/desencripte con `pgp_sym_encrypt/decrypt`
   - Opcion B: Crear funciones RPC `SECURITY DEFINER` en PostgreSQL
   - Actualizar `agent/server.js` y `agent/sync-actions.js` para usar la funcion de desencriptacion

### Prioridad Media
4. **Configurar `ALLOWED_ORIGINS`** en produccion - Agregar la URL real del dashboard en `agent/.env`
5. **Auditar Edge Function `crear-usuario-portal`** - Verificar que valida permisos correctamente

### Prioridad Baja
6. **CSP mas restrictivo** - Ajustar Content-Security-Policy en `vercel.json` segun las URLs reales usadas
7. **Monitoreo** - Configurar alertas para intentos de login fallidos repetidos

---

## Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `agent/server.js` | CORS restrictivo, helmet, rate limiting, validacion de fechas, errores sanitizados, logs sin PII |
| `agent/package.json` | +`express-rate-limit`, +`helmet` |
| `agent/.env.example` | +`ALLOWED_ORIGINS`, +`PORTAL_ENCRYPTION_KEY` |
| `src/pages/Dashboard.jsx` | `sanitizeText` mejorado, `sanitizeEmail` nuevo, password no pre-populado, auto-limpieza de password temporal |
| `src/pages/Auth.jsx` | Registro publico removido, solo login |
| `src/lib/supabase.js` | `getConfiguracionPortal` no retorna password, `saveConfiguracionPortal` preserva password existente |
| `src/main.jsx` | Timeout de sesion por inactividad (30 min) |
| `vercel.json` | Security headers para el hosting |
| `supabase/migrations/002_security_improvements.sql` | RLS equipo/portal, `visible_portal` cobros, storage policies |

## Verificacion

1. **CORS**: Request desde origen no autorizado al agent debe ser rechazado
2. **Rate limit**: >5 requests a `/sync` en 5 min deben ser bloqueados (status 429)
3. **Errores**: Error en `/sync` retorna mensaje generico, no stack trace
4. **Auth**: No debe existir opcion de registro en la pantalla de login
5. **RLS** (tras ejecutar migracion): Usuarios de portal solo ven sus expedientes/actuaciones/documentos
6. **Password**: El campo password de configuracion del portal no se pre-llena al editar
7. **Timeout**: Sesion se cierra automaticamente tras 30 min de inactividad
8. **Headers**: Verificar con `curl -I` que los headers de seguridad estan presentes en produccion
