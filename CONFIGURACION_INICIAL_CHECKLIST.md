# ✅ CHECKLIST DE CONFIGURACIÓN INICIAL - CARNES PREMIUM

Este documento te guiará paso a paso para configurar todos los elementos necesarios del proyecto.

---

## 🎯 OBJETIVO

Configurar todas las variables de entorno y servicios externos necesarios para que el proyecto funcione completamente.

---

## 📋 CHECKLIST GENERAL

### Estado Actual
- [x] Backend instalado y configurado
- [x] Frontend instalado y configurado
- [x] Base de datos creada (SQLite)
- [x] Schema de Prisma completo
- [ ] **Variables de entorno configuradas** ⬅️ HACER ESTO
- [ ] **Servicios externos configurados** ⬅️ HACER ESTO

---

## 🔧 PASO 1: CONFIGURAR VARIABLES DE ENTORNO DEL BACKEND

### 1.1 Editar archivo .env del backend

```bash
cd /workspace/backend
nano .env  # o usa tu editor favorito
```

### 1.2 Variables YA CONFIGURADAS ✅

```bash
# Estas ya están configuradas, NO las cambies
DATABASE_URL="file:./dev.db"
JWT_SECRET="carnes-premium-super-secret-jwt-key-2024"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3002
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

### 1.3 Variables PENDIENTES - AGREGAR ESTAS ⚠️

#### A) Configurar Stripe (Sistema de Pagos)

**¿Dónde obtener las claves?**
1. Ve a: https://dashboard.stripe.com/register
2. Crea una cuenta o inicia sesión
3. Ve a: Developers → API Keys
4. Copia las claves de TEST (para desarrollo)

**Agregar al .env:**
```bash
# Stripe - Claves de TEST (desarrollo)
STRIPE_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXX"
STRIPE_WEBHOOK_SECRET="whsec_XXXXXXXXXXXXXXXXXXXXX"
```

**Para configurar el Webhook Secret:**
1. En Stripe Dashboard: Developers → Webhooks
2. Click en "Add endpoint"
3. URL: `http://localhost:3002/api/webhooks/stripe`
4. Selecciona eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copia el "Signing secret" que te da Stripe
6. Pégalo como `STRIPE_WEBHOOK_SECRET`

---

#### B) Configurar MercadoPago (Sistema de Pagos - Opcional)

**¿Dónde obtener la clave?**
1. Ve a: https://www.mercadopago.com/developers
2. Crea una cuenta o inicia sesión
3. Ve a: Tus aplicaciones → Crear aplicación
4. Copia el "Access Token" de TEST

**Agregar al .env:**
```bash
# MercadoPago - Token de TEST (desarrollo)
MERCADOPAGO_ACCESS_TOKEN="TEST-XXXXXXXXXXXXX-XXXXXX-XXXXXXXX-XXXXXXXX"
```

---

#### C) Configurar Firebase (Notificaciones Push)

**¿Dónde obtener las claves?**
1. Ve a: https://console.firebase.google.com/
2. Crea un nuevo proyecto o usa uno existente
3. Nombre del proyecto: "Carnes Premium" (o el que prefieras)
4. Habilita Google Analytics (opcional)

**Paso C.1 - Configuración Web:**
1. En el proyecto, click en "Web" (icono </>) para agregar una app web
2. Nombre: "Carnes Premium Web"
3. Copia las credenciales que te muestra

**Paso C.2 - Habilitar Cloud Messaging:**
1. En el menú lateral: Build → Cloud Messaging
2. Ve a: Project Settings (⚙️) → Cloud Messaging
3. En la pestaña "Cloud Messaging API (Legacy)", habilita la API
4. Copia el "Server Key"

**Paso C.3 - Obtener VAPID Key:**
1. En Cloud Messaging settings
2. Ve a "Web Push certificates"
3. Click en "Generate key pair"
4. Copia el key pair (empieza con "BIPQ...")

**Paso C.4 - Descargar Service Account:**
1. Ve a: Project Settings (⚙️) → Service accounts
2. Click en "Generate new private key"
3. Descarga el archivo JSON
4. Copia TODO el contenido del JSON

**Agregar al .env:**
```bash
# Firebase Cloud Messaging
FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
FIREBASE_PROJECT_ID="carnes-premium-xxxxx"
FIREBASE_MESSAGING_SENDER_ID="123456789012"
FIREBASE_APP_ID="1:123456789012:web:xxxxxxxxxxxxxxx"
FIREBASE_VAPID_KEY="BIPQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Service Account (JSON completo en UNA línea)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"carnes-premium-xxxxx","private_key_id":"xxxxx","private_key":"-----BEGIN PRIVATE KEY-----\nXXXXX\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@carnes-premium-xxxxx.iam.gserviceaccount.com","client_id":"123456789012","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40carnes-premium-xxxxx.iam.gserviceaccount.com"}'
```

**⚠️ IMPORTANTE:** El FIREBASE_SERVICE_ACCOUNT debe estar todo en UNA SOLA LÍNEA, sin saltos de línea dentro del JSON.

---

#### D) Configurar Email (Notificaciones por correo)

**Opción 1 - Gmail (Recomendado para desarrollo):**

1. Ve a tu cuenta de Gmail
2. Habilita la verificación en 2 pasos
3. Ve a: https://myaccount.google.com/apppasswords
4. Genera una "Contraseña de aplicación"
5. Selecciona: "Correo" y "Otro" (nombre: Carnes Premium)
6. Copia la contraseña generada (16 caracteres)

**Agregar al .env:**
```bash
# Email - Gmail
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="xxxx xxxx xxxx xxxx"  # La contraseña de aplicación
```

**Opción 2 - Otro proveedor SMTP:**
```bash
# Email - Otro proveedor
EMAIL_HOST="smtp.tu-proveedor.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@dominio.com"
EMAIL_PASS="tu-contraseña"
```

---

### 1.4 Archivo .env COMPLETO del Backend

Después de agregar todo, tu archivo `.env` debería verse así:

```bash
# ==================== CONFIGURACIÓN BASE ====================
DATABASE_URL="file:./dev.db"
JWT_SECRET="carnes-premium-super-secret-jwt-key-2024"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
API_KEY="carnes-premium-api-key-2024"
CORS_ORIGIN="http://localhost:3000"
PORT=3002
NODE_ENV="development"

# ==================== REDIS (OPCIONAL) ====================
REDIS_URL=""
REDIS_HOST=""
REDIS_PORT=""

# ==================== PAGOS ====================
# Stripe
STRIPE_SECRET_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXX"
STRIPE_WEBHOOK_SECRET="whsec_XXXXXXXXXXXXXXXXXXXXX"

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN="TEST-XXXXXXXXXXXXX-XXXXXX-XXXXXXXX-XXXXXXXX"

# ==================== FIREBASE (NOTIFICACIONES) ====================
FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
FIREBASE_PROJECT_ID="carnes-premium-xxxxx"
FIREBASE_MESSAGING_SENDER_ID="123456789012"
FIREBASE_APP_ID="1:123456789012:web:xxxxxxxxxxxxxxx"
FIREBASE_VAPID_KEY="BIPQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# ==================== EMAIL ====================
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASS="xxxx xxxx xxxx xxxx"

# ==================== OTROS ====================
UPLOAD_MAX_SIZE=10485760
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
LOG_LEVEL="debug"
```

---

## 🎨 PASO 2: CONFIGURAR VARIABLES DE ENTORNO DEL FRONTEND

### 2.1 Crear archivo .env.local

```bash
cd /workspace/frontend-simple
touch .env.local
```

### 2.2 Agregar contenido al .env.local

**Edita el archivo:**
```bash
nano .env.local  # o usa tu editor favorito
```

**Contenido completo:**
```bash
# ==================== API URLs ====================
NEXT_PUBLIC_API_URL=http://localhost:3002/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3002

# ==================== STRIPE (Clave Pública) ====================
# Obtener de: https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXX

# ==================== MAPBOX (Mapas) ====================
# Obtener de: https://account.mapbox.com/
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2.3 Obtener Token de Mapbox

**¿Dónde obtenerlo?**
1. Ve a: https://account.mapbox.com/
2. Crea una cuenta o inicia sesión (GRATIS para 50,000 requests/mes)
3. Ve a: https://account.mapbox.com/access-tokens/
4. Copia el "Default public token" (empieza con `pk.eyJ1...`)
5. O crea un nuevo token con scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`

**Pegar en .env.local:**
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🚀 PASO 3: INICIALIZAR EL PROYECTO

### 3.1 Verificar e Instalar Dependencias

```bash
# Backend
cd /workspace/backend
npm install

# Frontend
cd /workspace/frontend-simple
npm install
```

### 3.2 Generar Cliente de Prisma

```bash
cd /workspace/backend
npx prisma generate
```

### 3.3 Verificar Base de Datos

```bash
cd /workspace/backend
npx prisma db push
```

**Resultado esperado:**
```
✅ The database is already in sync with the Prisma schema.
```

---

## 🎬 PASO 4: INICIAR LOS SERVICIOS

### 4.1 Iniciar Backend (Terminal 1)

```bash
cd /workspace/backend
npm run dev
```

**Salida esperada:**
```
✅ Base de datos conectada
⚠️ Redis no configurado - funcionando sin cache
✅ Socket.IO configurado
🚀 Servidor ejecutándose en puerto 3002
🌍 Ambiente: development
📊 Health check: http://localhost:3002/health
```

### 4.2 Iniciar Frontend (Terminal 2)

```bash
cd /workspace/frontend-simple
npm run dev
```

**Salida esperada:**
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

### 4.3 Verificar que TODO funciona

**Test 1 - Health Check del Backend:**
```bash
curl http://localhost:3002/health
```

**Resultado esperado:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-20T03:11:03.000Z",
  "uptime": 5.123,
  "environment": "development"
}
```

**Test 2 - Abrir Frontend:**
```
http://localhost:3000
```

Deberías ver la página principal de Carnes Premium.

---

## 📊 PASO 5: VERIFICAR FUNCIONALIDADES

### 5.1 Verificar Autenticación

1. Abre: http://localhost:3000/auth/register
2. Crea una cuenta de prueba
3. Inicia sesión
4. Verifica que puedas acceder al dashboard

### 5.2 Verificar Productos

1. Ve a: http://localhost:3000/productos
2. Deberías ver productos (si hay seed data)
3. Click en un producto para ver detalles

### 5.3 Verificar Panel Admin

1. Crea un usuario admin manualmente en la base de datos (o usa el seed)
2. Inicia sesión con ese usuario
3. Ve a: http://localhost:3000/admin
4. Verifica que puedas acceder

### 5.4 Verificar Stripe (Pagos)

1. Ve a: http://localhost:3000/checkout (con items en el carrito)
2. En el formulario de pago, usa tarjeta de prueba:
   - Número: `4242 4242 4242 4242`
   - Fecha: Cualquier fecha futura
   - CVC: Cualquier 3 dígitos
3. Verifica que el pago se procese correctamente

### 5.5 Verificar Mapbox (Tracking)

1. Crea un pedido
2. Ve a: http://localhost:3000/track?order=ORDER_ID
3. Verifica que el mapa se cargue correctamente

### 5.6 Verificar Socket.IO (Real-time)

1. Abre dos navegadores
2. En uno, actualiza el estado de un pedido (como admin)
3. En el otro, verifica que se actualice en tiempo real

---

## 🔍 PASO 6: TROUBLESHOOTING

### Problema 1: Backend no inicia

**Error:** `Cannot find module '@prisma/client'`

**Solución:**
```bash
cd /workspace/backend
npx prisma generate
npm install
```

---

### Problema 2: Frontend no conecta con Backend

**Error en consola:** `Failed to fetch` o `Network Error`

**Solución:**
1. Verifica que el backend esté corriendo en puerto 3002
2. Verifica que `.env.local` exista en el frontend
3. Verifica que `NEXT_PUBLIC_API_URL` esté configurado correctamente

---

### Problema 3: Mapa no carga

**Error:** Map failed to load

**Solución:**
1. Verifica que `NEXT_PUBLIC_MAPBOX_TOKEN` esté en `.env.local`
2. Verifica que el token sea válido en: https://account.mapbox.com/
3. Reinicia el servidor del frontend después de agregar el token

---

### Problema 4: Pagos con Stripe no funcionan

**Error:** Invalid API Key

**Solución:**
1. Verifica que `STRIPE_SECRET_KEY` esté en backend `.env`
2. Verifica que `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` esté en frontend `.env.local`
3. Verifica que las claves coincidan (test con test, live con live)
4. Reinicia ambos servidores

---

### Problema 5: Notificaciones Push no funcionan

**Error:** Firebase not configured

**Solución:**
1. Verifica que TODAS las variables FIREBASE_* estén configuradas
2. Verifica que el JSON de Service Account esté en UNA SOLA LÍNEA
3. Verifica que el proyecto de Firebase tenga Cloud Messaging habilitado
4. Reinicia el backend

---

### Problema 6: Emails no se envían

**Error:** Authentication failed

**Solución para Gmail:**
1. Verifica que tengas verificación en 2 pasos habilitada
2. Usa una "Contraseña de aplicación", NO tu contraseña normal
3. Genera nueva contraseña en: https://myaccount.google.com/apppasswords

---

## ✅ CHECKLIST FINAL DE VERIFICACIÓN

### Backend
- [ ] Archivo `.env` existe
- [ ] `STRIPE_SECRET_KEY` configurado
- [ ] `STRIPE_WEBHOOK_SECRET` configurado
- [ ] `MERCADOPAGO_ACCESS_TOKEN` configurado (opcional)
- [ ] Todas las variables `FIREBASE_*` configuradas
- [ ] `EMAIL_USER` y `EMAIL_PASS` configurados
- [ ] Backend inicia sin errores
- [ ] Health check responde OK
- [ ] Base de datos conectada

### Frontend
- [ ] Archivo `.env.local` existe y está en la raíz de frontend-simple
- [ ] `NEXT_PUBLIC_API_URL` configurado
- [ ] `NEXT_PUBLIC_SOCKET_URL` configurado
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurado
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` configurado
- [ ] Frontend inicia sin errores
- [ ] Se puede acceder a http://localhost:3000
- [ ] No hay errores en la consola del navegador

### Funcionalidades
- [ ] Autenticación funciona (login/register)
- [ ] Productos se cargan correctamente
- [ ] Carrito funciona
- [ ] Checkout funciona
- [ ] Pagos con Stripe funcionan (tarjeta de prueba)
- [ ] Mapa de tracking se carga
- [ ] Socket.IO conecta (sin errores en consola)
- [ ] Panel admin accesible

---

## 📚 RECURSOS ADICIONALES

### Documentación de Servicios Externos

- **Stripe Docs:** https://stripe.com/docs
- **MercadoPago Docs:** https://www.mercadopago.com/developers/es/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **Mapbox Docs:** https://docs.mapbox.com/

### Tarjetas de Prueba de Stripe

```
# Pago exitoso
4242 4242 4242 4242

# Pago rechazado
4000 0000 0000 0002

# Requiere autenticación 3D Secure
4000 0027 6000 3184

# Más tarjetas: https://stripe.com/docs/testing
```

### Comandos Útiles

```bash
# Ver logs del backend
cd /workspace/backend
npm run dev

# Ver logs de Prisma
cd /workspace/backend
npx prisma studio  # Abre interfaz visual de la DB

# Resetear base de datos
cd /workspace/backend
rm prisma/dev.db
npx prisma db push

# Ver build del frontend
cd /workspace/frontend-simple
npm run build

# Ver información de Next.js
cd /workspace/frontend-simple
npx next info
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

Una vez que TODO esté configurado y funcionando:

1. **Testing:**
   - Crear usuarios de prueba
   - Crear productos de prueba
   - Probar flujo completo de compra
   - Probar notificaciones
   - Probar sistema de inventario

2. **Seed Data:**
   - Crear script de seed con datos de ejemplo
   - Popular base de datos con productos reales
   - Crear categorías del negocio

3. **Personalización:**
   - Cambiar colores y branding
   - Agregar logo del negocio
   - Personalizar emails
   - Ajustar textos y traducciones

4. **Optimización:**
   - Configurar Redis para cache
   - Optimizar imágenes
   - Configurar CDN
   - Habilitar compresión

5. **Siguiente Punto:**
   - Punto 9: Sistema de Reportes y Analytics
   - Punto 10: Sistema de Notificaciones Real-time
   - Punto 11: Sistema de Chat/Mensajería

---

## ✨ ¡LISTO PARA PRODUCCIÓN!

Una vez completado este checklist, tu proyecto estará:

✅ **100% funcional** para desarrollo
✅ **Listo para pruebas** con usuarios reales
✅ **Preparado para despliegue** a producción (con ajustes)

**¿Dudas o problemas?** Revisa el archivo `AUDITORIA_GENERAL_PROYECTO.md` para información detallada de cada componente.

---

**Última actualización:** 20 de Noviembre de 2025
**Versión:** 1.0.0
