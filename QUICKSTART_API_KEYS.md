# 🚀 Guía Rápida: Obtener API Keys

## 📋 Resumen

Esta guía te lleva paso a paso para obtener TODAS las API keys necesarias para las integraciones del sistema.

---

## 1️⃣ OpenAI (Chat Inteligente)

### ⏱️ Tiempo: 5 minutos
### 💰 Costo: Pay-as-you-go (~$10-50/mes)

**Pasos:**

1. **Ir a:** https://platform.openai.com/
2. **Crear cuenta** o iniciar sesión
3. Click en tu perfil (arriba derecha) → **"View API keys"**
4. Click en **"Create new secret key"**
5. Dale un nombre: `carnespremium-api`
6. **COPIAR LA KEY** (solo se muestra una vez!)
   - Formato: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
7. Guardar en tu .env:
   ```env
   OPENAI_API_KEY=sk-proj-tu-key-aqui
   ```

**Configurar Billing:**
1. Ir a **Settings** → **Billing**
2. Añadir método de pago (tarjeta de crédito)
3. Establecer límite mensual (recomendado: $50)
4. Activar alertas de uso

**Modelos Recomendados:**
- `gpt-3.5-turbo` → Más económico ($0.0005/1K tokens)
- `gpt-4-turbo-preview` → Más inteligente ($0.01/1K tokens)

**Test rápido:**
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hola!"}]
  }'
```

---

## 2️⃣ Mercado Pago

### ⏱️ Tiempo: 10 minutos
### 💰 Costo: Sin costo de integración (comisión por venta: ~3.5%)

**Pasos:**

### A. Crear Aplicación

1. **Ir a:** https://www.mercadopago.com.ar/developers (o .mx, .cl según país)
2. **Iniciar sesión** con tu cuenta de Mercado Pago
3. Ir a **"Tus aplicaciones"**
4. Click en **"Crear aplicación"**
5. Llenar formulario:
   - Nombre: `Carnes Premium API`
   - Descripción: `API e-commerce`
   - Click en **"Crear aplicación"**

### B. Obtener Credenciales de PRODUCCIÓN

1. Dentro de tu aplicación, ir a **"Credenciales de producción"**
2. **Activar credenciales de producción** (requiere validación de identidad)
3. Copiar:
   - **Access Token:** `APP_USR-xxxxxxxxxxxxxxxxxxxxx`
   - **Public Key:** `APP_USR-xxxxxxxxxxxxxxxxxxxxx`
4. Guardar en .env:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-tu-access-token
   MERCADOPAGO_PUBLIC_KEY=APP_USR-tu-public-key
   MERCADOPAGO_SANDBOX=false
   ```

### C. Obtener Credenciales de TEST (para desarrollo)

1. En la misma aplicación, ir a **"Credenciales de prueba"**
2. Copiar:
   - **Access Token:** `TEST-xxxxxxxxxxxxxxxxxxxxx`
   - **Public Key:** `TEST-xxxxxxxxxxxxxxxxxxxxx`
3. Guardar en .env:
   ```env
   MERCADOPAGO_TEST_ACCESS_TOKEN=TEST-tu-test-token
   MERCADOPAGO_TEST_PUBLIC_KEY=TEST-tu-test-public-key
   ```

### D. Configurar Webhook

1. En tu aplicación, ir a **"Webhooks"**
2. Click en **"Configurar notificaciones"**
3. URL de notificación: `https://api.tudominio.com/api/payments/webhook`
4. Seleccionar eventos:
   - ✅ Pagos
   - ✅ Órdenes de comercio
5. Click en **"Guardar"**
6. Copiar el **Secret de webhook**
7. Guardar en .env:
   ```env
   MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret
   ```

**Usuarios de prueba (para testing):**
1. Ir a **"Cuentas de prueba"**
2. Crear vendedor y comprador de prueba
3. Usar estas cuentas para probar el flujo completo

**Tarjetas de prueba:**
```
Aprobado:
  Número: 5031 7557 3453 0604
  CVV: 123
  Fecha: 11/25

Rechazado:
  Número: 5031 4332 1540 6351
  CVV: 123
  Fecha: 11/25
```

**Test rápido:**
```bash
curl -X POST \
  https://api.mercadopago.com/v1/payments \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_amount": 100,
    "description": "Test",
    "payment_method_id": "master",
    "payer": {
      "email": "test@test.com"
    }
  }'
```

---

## 3️⃣ SendGrid (Email)

### ⏱️ Tiempo: 10 minutos
### 💰 Costo: Gratis hasta 100 emails/día

**Pasos:**

1. **Ir a:** https://sendgrid.com/
2. **Sign Up** (plan gratuito disponible)
3. Completar verificación de email
4. Ir a **Settings** → **API Keys**
5. Click en **"Create API Key"**
6. Nombre: `carnespremium-api`
7. Permisos: **Full Access** o **Mail Send** (mínimo)
8. Click en **"Create & View"**
9. **COPIAR LA KEY** (solo se muestra una vez!)
   - Formato: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
10. Guardar en .env:
    ```env
    SENDGRID_API_KEY=SG.tu-key-aqui
    SENDGRID_FROM_EMAIL=noreply@carnespremium.com
    ```

**Verificar Dominio (obligatorio para producción):**
1. Ir a **Settings** → **Sender Authentication**
2. Click en **"Verify a Single Sender"** (rápido) o **"Authenticate Your Domain"** (recomendado)
3. Seguir instrucciones para añadir DNS records

**Test rápido:**
```bash
curl --request POST \
  --url https://api.sendgrid.com/v3/mail/send \
  --header 'Authorization: Bearer TU_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "personalizations": [{
      "to": [{"email": "test@test.com"}]
    }],
    "from": {"email": "noreply@carnespremium.com"},
    "subject": "Test",
    "content": [{
      "type": "text/plain",
      "value": "Test email"
    }]
  }'
```

---

## 4️⃣ AWS S3 (Almacenamiento)

### ⏱️ Tiempo: 15 minutos
### 💰 Costo: ~$0.023 por GB/mes

**Pasos:**

1. **Ir a:** https://aws.amazon.com/console/
2. **Iniciar sesión** o crear cuenta AWS
3. Ir a **IAM** (Identity and Access Management)
4. Click en **"Users"** → **"Add user"**
5. Nombre: `carnespremium-s3-user`
6. Access type: ✅ **Programmatic access**
7. Click **"Next: Permissions"**
8. Click **"Attach existing policies directly"**
9. Buscar y seleccionar: **AmazonS3FullAccess**
10. Click **"Next"** → **"Create user"**
11. **COPIAR CREDENCIALES:**
    - Access Key ID: `AKIAXXXXXXXXXXXXX`
    - Secret Access Key: `xxxxxxxxxxxxxxxxxxxxxxxx`
12. Guardar en .env:
    ```env
    AWS_S3_ACCESS_KEY=AKIAXXXXXXXXXXXXX
    AWS_S3_SECRET_KEY=tu-secret-key
    AWS_S3_REGION=us-east-1
    ```

**Crear Bucket:**
1. Ir a **S3** service
2. Click **"Create bucket"**
3. Nombre: `carnespremium-uploads` (debe ser único globalmente)
4. Region: `us-east-1`
5. Desmarcar **"Block all public access"** (si quieres acceso público)
6. Click **"Create bucket"**
7. Guardar en .env:
   ```env
   AWS_S3_BUCKET=carnespremium-uploads
   ```

---

## 5️⃣ Alternativa: MiniMax AI (Chat)

### ⏱️ Tiempo: 10 minutos
### 💰 Costo: Variable según plan

**Pasos:**

1. **Ir a:** https://www.minimaxi.com/
2. **Registrarse** con email
3. Verificar cuenta
4. Ir a **Dashboard** → **API Keys**
5. Click en **"Create API Key"**
6. Copiar:
   - API Key
   - Group ID
7. Guardar en .env:
   ```env
   CHAT_PROVIDER=minimax
   MINIMAX_API_KEY=tu-key-aqui
   MINIMAX_GROUP_ID=tu-group-id
   ```

---

## 6️⃣ Claude AI (Alternativa Chat)

### ⏱️ Tiempo: 5 minutos
### 💰 Costo: Pay-as-you-go

**Pasos:**

1. **Ir a:** https://console.anthropic.com/
2. **Sign Up**
3. Ir a **API Keys**
4. Click **"Create Key"**
5. Copiar key (formato: `sk-ant-xxxxxxxx`)
6. Guardar en .env:
   ```env
   CHAT_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-tu-key
   ```

---

## 7️⃣ Twilio (SMS - Opcional)

### ⏱️ Tiempo: 15 minutos
### 💰 Costo: $1/mes + $0.0075 por SMS

**Pasos:**

1. **Ir a:** https://www.twilio.com/
2. **Sign Up** (trial incluye $15 gratis)
3. Verificar teléfono
4. En **Console Dashboard**, copiar:
   - Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxx`
   - Auth Token: (click en "Show" para ver)
5. Ir a **Phone Numbers** → **Buy a number**
6. Comprar un número (o usar trial)
7. Guardar en .env:
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
   TWILIO_AUTH_TOKEN=tu-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

---

## 📝 Checklist Completo

### Obligatorias ✅
- [ ] OpenAI API Key (o MiniMax/Claude)
- [ ] Mercado Pago Access Token (producción)
- [ ] Mercado Pago Public Key (producción)
- [ ] Mercado Pago Test Tokens (desarrollo)
- [ ] JWT Secret (generado)
- [ ] API Key (generado)
- [ ] Session Secret (generado)

### Recomendadas 🟡
- [ ] SendGrid API Key
- [ ] AWS S3 Credentials
- [ ] Webhook Secret (Mercado Pago)
- [ ] Redis Password

### Opcionales ⚪
- [ ] Twilio Credentials
- [ ] Sentry DSN
- [ ] Google Analytics ID
- [ ] Datadog Keys

---

## 🔐 Generar Secrets Locales

```bash
# Generar JWT Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar API Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar Session Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar Webhook Secret (16 bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generar Redis Password
node -e "console.log(require('crypto').randomBytes(20).toString('base64'))"
```

---

## 🧪 Verificar Configuración

### Script de Test

```bash
# Crear script de verificación
cat > test-config.js << 'EOF'
require('dotenv').config({ path: '.env.production' });

const checks = {
  'OpenAI': process.env.OPENAI_API_KEY?.startsWith('sk-'),
  'Mercado Pago': process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('APP_USR-'),
  'JWT Secret': process.env.JWT_SECRET?.length >= 64,
  'API Key': process.env.API_KEY?.length >= 32,
  'Database': !!process.env.DATABASE_URL,
  'Redis': !!process.env.REDIS_PASSWORD,
};

console.log('\n🔍 Configuration Check:\n');
Object.entries(checks).forEach(([name, valid]) => {
  console.log(`${valid ? '✅' : '❌'} ${name}`);
});
console.log('');
EOF

node test-config.js
```

---

## 💡 Tips de Seguridad

1. **Nunca compartas tus API keys**
2. **Usa diferentes keys para dev/staging/prod**
3. **Rota secrets cada 90 días**
4. **Establece límites de gasto** en APIs de pago
5. **Monitorea uso** regularmente
6. **Elimina keys** que no uses
7. **Usa Secrets Manager** en AWS
8. **Nunca commitees** .env a Git

---

## 🚨 En Caso de Compromiso

Si crees que una API key fue expuesta:

1. **Revocar inmediatamente** en el dashboard del servicio
2. **Generar nueva key**
3. **Actualizar .env** o Secrets Manager
4. **Reiniciar aplicación**
5. **Revisar logs** de uso sospechoso
6. **Cambiar otros secrets** relacionados

---

## 📞 Soporte

### OpenAI
- Docs: https://platform.openai.com/docs
- Status: https://status.openai.com/

### Mercado Pago
- Docs: https://www.mercadopago.com/developers/es/docs
- Soporte: https://www.mercadopago.com/developers/panel/support

### SendGrid
- Docs: https://docs.sendgrid.com/
- Status: https://status.sendgrid.com/

### AWS
- Docs: https://docs.aws.amazon.com/
- Status: https://status.aws.amazon.com/

---

**¡Listo!** Con estas keys configuradas, tu sistema tendrá todas las integraciones funcionando. 🚀
