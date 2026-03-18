# Despacho Legal — Sistema de Gestión para Abogados

Sistema web completo para gestionar tu despacho jurídico: expedientes, clientes, documentos, actuaciones, cobranza, plazos y más. Funciona desde cualquier dispositivo (iPhone, computadora, tablet) con sincronización en tiempo real.

## Tecnologías

- **Frontend:** React + Vite
- **Backend/Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth (email + contraseña)
- **Hosting recomendado:** Vercel (gratis)

---

## Guía de Instalación Paso a Paso

### Paso 1: Crear cuenta en Supabase (gratis)

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto:
   - Nombre: `despacho-legal`
   - Contraseña de base de datos: **guárdala en un lugar seguro**
   - Región: selecciona la más cercana (ej: `South America (São Paulo)`)
3. Espera 1-2 minutos a que se cree el proyecto

### Paso 2: Crear las tablas en la base de datos

1. En tu proyecto de Supabase, ve a **SQL Editor** (menú lateral izquierdo)
2. Haz clic en **New Query**
3. Copia TODO el contenido del archivo `supabase/schema.sql` y pégalo
4. Haz clic en **Run** (ejecutar)
5. Deberías ver un mensaje de éxito. Esto crea todas las tablas, índices y políticas de seguridad

### Paso 3: Obtener credenciales de Supabase

1. Ve a **Settings** → **API** en tu proyecto de Supabase
2. Copia estos dos valores:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (una cadena larga que empieza con `eyJ...`)

### Paso 4: Configurar el proyecto en tu computadora

Necesitas tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

```bash
# 1. Descomprime el proyecto y entra a la carpeta
cd despacho-legal

# 2. Instala las dependencias
npm install

# 3. Crea el archivo de configuración
cp .env.example .env
```

Abre el archivo `.env` y reemplaza con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 5: Ejecutar en modo desarrollo

```bash
npm run dev
```

Abre tu navegador en `http://localhost:3000`. Verás la pantalla de login.

### Paso 6: Crear tu cuenta de usuario

1. En la pantalla de login, haz clic en "¿No tienes cuenta? Regístrate"
2. Ingresa tu nombre, correo y contraseña
3. Revisa tu correo y confirma tu cuenta (Supabase envía un email de verificación)
4. Inicia sesión

---

## Desplegar en Internet (para acceder desde cualquier dispositivo)

### Opción recomendada: Vercel (gratis)

1. Sube tu proyecto a un repositorio en [GitHub](https://github.com)
2. Ve a [https://vercel.com](https://vercel.com) y conecta tu cuenta de GitHub
3. Importa el repositorio `despacho-legal`
4. En la configuración del proyecto, agrega las **Environment Variables**:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
5. Haz clic en **Deploy**
6. En 1-2 minutos tendrás una URL como `https://despacho-legal.vercel.app`

Ahora puedes acceder desde tu iPhone, computadora o cualquier dispositivo con esa URL.

---

## Estructura del proyecto

```
despacho-legal/
├── index.html              # Página HTML principal
├── package.json            # Dependencias
├── vite.config.js          # Configuración de Vite
├── .env.example            # Variables de entorno (template)
├── supabase/
│   └── schema.sql          # Esquema de base de datos (ejecutar en Supabase)
└── src/
    ├── main.jsx            # Punto de entrada (manejo de sesión)
    ├── lib/
    │   └── supabase.js     # Cliente Supabase + API helpers
    └── pages/
        ├── Auth.jsx        # Pantalla de login/registro
        └── Dashboard.jsx   # Dashboard principal con todos los módulos
```

## Módulos incluidos

| Módulo | Funcionalidad |
|--------|--------------|
| **Dashboard** | Métricas clave, plazos próximos, actividad reciente |
| **Expedientes** | CRUD completo, vinculación padre-hijo (amparo, apelación), estados procesales |
| **Actuaciones** | Línea del tiempo de cada expediente: acuerdos, sentencias, promociones |
| **Clientes** | Perfil completo con documentos, expedientes vinculados y cobros |
| **Documentos** | Base de datos por cliente: contratos, recibos, poderes, identificaciones |
| **Vencimientos** | Vista de plazos vencidos y próximos con alertas visuales |
| **Cobranza** | Control de pagos pendientes, vencidos y cobrados |
| **Buscador** | Búsqueda global en expedientes, clientes y cobros |

## Seguridad

- **Row Level Security (RLS):** Cada usuario solo puede ver y modificar sus propios datos
- **Autenticación:** Email + contraseña con verificación
- **Base de datos:** PostgreSQL con cifrado en Supabase
- **Los datos de tus clientes están protegidos y no son accesibles por otros usuarios**

## Soporte

Si necesitas ayuda con la configuración, puedes preguntarme directamente en Claude.
