# 🔐 Guía de Configuración - API Keys de Terceros

## 📋 Tabla de Contenidos

1. [Variables de Entorno para Integraciones](#variables-de-entorno-para-integraciones)
2. [Configuración en Servidor Local](#configuración-en-servidor-local)
3. [Configuración en AWS](#configuración-en-aws)
4. [Implementación en el Código](#implementación-en-el-código)
5. [Seguridad y Mejores Prácticas](#seguridad-y-mejores-prácticas)

---

## 🔑 Variables de Entorno para Integraciones

### 1. Estructura Completa del .env con Integraciones

```env
# ===================================
# API CARNES PREMIUM - PRODUCCIÓN
# ===================================

# ============ CORE CONFIG ============
NODE_ENV=production
PORT=3002

# ============ DATABASE ============
DATABASE_URL="postgresql://carnespremium_user:TuPassword@localhost:5432/carnespremium?schema=public"

# ============ REDIS ============
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=TuPasswordRedis2024!

# ============ JWT & AUTH ============
JWT_SECRET=tu-secret-jwt-super-seguro-64-caracteres
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
API_KEY=tu-api-key-super-secreta

# ============ CORS ============
CORS_ORIGIN=https://tudominio.com

# ============ RATE LIMITING ============
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5000

# ============ CHAT INTELIGENTE ============
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# MiniMax AI (alternativa)
MINIMAX_API_KEY=your-minimax-api-key-here
MINIMAX_GROUP_ID=your-group-id-here
MINIMAX_MODEL=abab5.5-chat

# Claude AI (alternativa)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Configuración del Chat
CHAT_PROVIDER=openai
CHAT_TIMEOUT=30000
CHAT_MAX_HISTORY=10
CHAT_SYSTEM_PROMPT="Eres un asistente experto en carnes premium..."

# ============ MERCADO PAGO ============
# Credenciales de Producción
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Credenciales de Testing (para desarrollo)
MERCADOPAGO_TEST_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MERCADOPAGO_TEST_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Configuración
MERCADOPAGO_SANDBOX=false
MERCADOPAGO_WEBHOOK_SECRET=tu-webhook-secret-generado
MERCADOPAGO_SUCCESS_URL=https://tudominio.com/success
MERCADOPAGO_FAILURE_URL=https://tudominio.com/failure
MERCADOPAGO_PENDING_URL=https://tudominio.com/pending

# ============ EMAIL (SendGrid/AWS SES) ============
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@carnespremium.com
SENDGRID_FROM_NAME=Carnes Premium

# AWS SES (alternativa)
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=AKIAXXXXXXXXXXXXX
AWS_SES_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SES_FROM_EMAIL=noreply@carnespremium.com

# ============ SMS (Twilio) ============
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_PHONE_NUMBER=+1234567890

# ============ STORAGE (AWS S3) ============
AWS_S3_BUCKET=carnespremium-uploads
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=AKIAXXXXXXXXXXXXX
AWS_S3_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_CDN_URL=https://d123456789.cloudfront.net

# ============ ANALYTICS ============
# Google Analytics
GA_TRACKING_ID=G-XXXXXXXXXX

# Segment
SEGMENT_WRITE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============ MONITORING ============
# Sentry
SENTRY_DSN=https://xxxxxxxxxxxxx@sentry.io/1234567

# Datadog
DATADOG_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DATADOG_APP_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============ LOGGING ============
LOG_LEVEL=info
LOG_FILE=/var/www/carnespremium/logs/app.log

# ============ FILE UPLOAD ============
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/var/www/carnespremium/app/uploads

# ============ SESSION ============
SESSION_SECRET=tu-session-secret-aleatorio
```

---

## 💻 Configuración en Servidor Local

### Paso 1: Crear Archivo .env.production

```bash
# Crear archivo en el directorio del backend
cd /var/www/carnespremium/app/backend
nano .env.production
```

### Paso 2: Copiar Configuración Completa

Copia todo el contenido del ejemplo anterior y reemplaza los valores:

```bash
# Para generar secrets seguros:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Paso 3: Obtener API Keys

#### 🤖 **Chat Inteligente (OpenAI)**

1. Ir a https://platform.openai.com/
2. Login o crear cuenta
3. Ir a "API Keys" en el menú
4. Click en "Create new secret key"
5. Copiar la key (empieza con `sk-proj-` o `sk-`)
6. Pegar en `OPENAI_API_KEY`

**Costos OpenAI:**
- GPT-4 Turbo: $0.01/1K tokens input, $0.03/1K output
- GPT-3.5 Turbo: $0.0005/1K tokens input, $0.0015/1K output
- Presupuesto recomendado: $50-200/mes según uso

#### 🤖 **Alternativa: MiniMax AI**

1. Ir a https://www.minimaxi.com/
2. Registrarse y verificar cuenta
3. Obtener API key del dashboard
4. Copiar Group ID
5. Configurar:
   ```env
   CHAT_PROVIDER=minimax
   MINIMAX_API_KEY=tu-key
   MINIMAX_GROUP_ID=tu-group-id
   ```

#### 💳 **Mercado Pago**

1. Ir a https://www.mercadopago.com.ar/developers
2. Login con tu cuenta de Mercado Pago
3. Ir a "Tus aplicaciones"
4. Crear nueva aplicación
5. Obtener credenciales:
   - **Producción:**
     - Access Token: APP_USR-xxxxx
     - Public Key: APP_USR-xxxxx
   - **Testing:**
     - Access Token: TEST-xxxxx
     - Public Key: TEST-xxxxx

6. Configurar webhook:
   - URL: `https://api.tudominio.com/api/payments/webhook`
   - Eventos: `payment`, `merchant_order`

**Costos Mercado Pago:**
- Comisión por venta: ~3.5% + $0.50 (varía por país)
- Sin costo de integración
- Sin mensualidad

### Paso 4: Proteger el Archivo

```bash
# Cambiar permisos (solo lectura para el owner)
chmod 600 .env.production

# Cambiar owner al usuario de la app
chown carnespremium:carnespremium .env.production

# Verificar que no esté en git
echo ".env*" >> .gitignore
```

### Paso 5: Reiniciar Aplicación

```bash
# Reiniciar PM2
pm2 restart carnespremium-api

# Verificar que cargó las variables
pm2 env carnespremium-api
```

---

## ☁️ Configuración en AWS

### Opción 1: AWS Secrets Manager (Recomendado)

#### Paso 1: Crear Secret para Chat Inteligente

```bash
# Crear JSON con las credenciales
cat > chat-secrets.json << EOF
{
  "OPENAI_API_KEY": "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "OPENAI_MODEL": "gpt-4-turbo-preview",
  "OPENAI_MAX_TOKENS": "1000",
  "OPENAI_TEMPERATURE": "0.7",
  "CHAT_PROVIDER": "openai",
  "CHAT_TIMEOUT": "30000",
  "CHAT_MAX_HISTORY": "10",
  "CHAT_SYSTEM_PROMPT": "Eres un asistente experto en carnes premium. Ayuda a los clientes a elegir los mejores cortes, proporciona información sobre preparación y cocción."
}
EOF

# Crear secret en AWS
aws secretsmanager create-secret \
  --name carnespremium/chat \
  --description "Chat AI credentials for carnespremium" \
  --secret-string file://chat-secrets.json \
  --region us-east-1

# Eliminar archivo temporal
rm chat-secrets.json
```

#### Paso 2: Crear Secret para Mercado Pago

```bash
# Crear JSON con credenciales de Mercado Pago
cat > mercadopago-secrets.json << EOF
{
  "MERCADOPAGO_ACCESS_TOKEN": "APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "MERCADOPAGO_PUBLIC_KEY": "APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "MERCADOPAGO_SANDBOX": "false",
  "MERCADOPAGO_WEBHOOK_SECRET": "tu-webhook-secret-generado",
  "MERCADOPAGO_SUCCESS_URL": "https://tudominio.com/success",
  "MERCADOPAGO_FAILURE_URL": "https://tudominio.com/failure",
  "MERCADOPAGO_PENDING_URL": "https://tudominio.com/pending"
}
EOF

# Crear secret en AWS
aws secretsmanager create-secret \
  --name carnespremium/mercadopago \
  --description "Mercado Pago credentials for carnespremium" \
  --secret-string file://mercadopago-secrets.json \
  --region us-east-1

# Eliminar archivo temporal
rm mercadopago-secrets.json
```

#### Paso 3: Actualizar Secret Principal

```bash
# Obtener el secret existente
aws secretsmanager get-secret-value \
  --secret-id carnespremium/env \
  --query SecretString \
  --output text > env-current.json

# Editar y añadir referencias a otros secrets
# O crear uno consolidado con todas las variables
cat > env-complete.json << EOF
{
  "NODE_ENV": "production",
  "PORT": "3002",
  "DATABASE_URL": "postgresql://...",
  "REDIS_HOST": "...",
  "REDIS_PASSWORD": "...",
  "JWT_SECRET": "...",
  "OPENAI_API_KEY": "sk-proj-xxxxx",
  "MERCADOPAGO_ACCESS_TOKEN": "APP_USR-xxxxx",
  "..."
}
EOF

# Actualizar secret
aws secretsmanager update-secret \
  --secret-id carnespremium/env \
  --secret-string file://env-complete.json

# Limpiar
rm env-current.json env-complete.json
```

#### Paso 4: Dar Permisos a EC2 para Leer Secrets

```bash
# Crear política IAM
cat > secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:carnespremium/*"
      ]
    }
  ]
}
EOF

# Crear la política
aws iam create-policy \
  --policy-name CarnespremiumSecretsRead \
  --policy-document file://secrets-policy.json

# Adjuntar al rol de EC2
aws iam attach-role-policy \
  --role-name carnespremium-ec2-role \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/CarnespremiumSecretsRead
```

#### Paso 5: Modificar User Data para Cargar Secrets

```bash
# En el Launch Template, actualizar User Data:
cat > user-data-secrets.sh << 'EOF'
#!/bin/bash

# ... instalaciones previas ...

# Cargar secrets desde Secrets Manager
cd /var/www/carnespremium/app/backend

# Secret principal
aws secretsmanager get-secret-value \
  --secret-id carnespremium/env \
  --region us-east-1 \
  --query SecretString \
  --output text | jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' > .env.production

# Chat AI secrets
aws secretsmanager get-secret-value \
  --secret-id carnespremium/chat \
  --region us-east-1 \
  --query SecretString \
  --output text | jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' >> .env.production

# Mercado Pago secrets
aws secretsmanager get-secret-value \
  --secret-id carnespremium/mercadopago \
  --region us-east-1 \
  --query SecretString \
  --output text | jq -r 'to_entries|map("\(.key)=\(.value|tostring)")|.[]' >> .env.production

# Proteger archivo
chmod 600 .env.production
chown carnespremium:carnespremium .env.production

# ... resto del setup ...
EOF
```

### Opción 2: AWS Systems Manager Parameter Store

```bash
# Alternativa más económica (gratis hasta 10,000 parámetros)

# Crear parámetros
aws ssm put-parameter \
  --name /carnespremium/openai/api-key \
  --value "sk-proj-xxxxx" \
  --type SecureString \
  --region us-east-1

aws ssm put-parameter \
  --name /carnespremium/mercadopago/access-token \
  --value "APP_USR-xxxxx" \
  --type SecureString \
  --region us-east-1

# Cargar en EC2
aws ssm get-parameter \
  --name /carnespremium/openai/api-key \
  --with-decryption \
  --query Parameter.Value \
  --output text
```

---

## 💻 Implementación en el Código

### 1. Crear Archivo de Configuración

```bash
# backend/src/config/integrations.js
nano backend/src/config/integrations.js
```

```javascript
// backend/src/config/integrations.js

require('dotenv').config({ path: '.env.production' });

module.exports = {
  // Chat Inteligente
  chat: {
    provider: process.env.CHAT_PROVIDER || 'openai',
    
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    },
    
    minimax: {
      apiKey: process.env.MINIMAX_API_KEY,
      groupId: process.env.MINIMAX_GROUP_ID,
      model: process.env.MINIMAX_MODEL || 'abab5.5-chat',
    },
    
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    },
    
    timeout: parseInt(process.env.CHAT_TIMEOUT) || 30000,
    maxHistory: parseInt(process.env.CHAT_MAX_HISTORY) || 10,
    systemPrompt: process.env.CHAT_SYSTEM_PROMPT || 'Eres un asistente experto en carnes premium.',
  },
  
  // Mercado Pago
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_SANDBOX === 'true' 
      ? process.env.MERCADOPAGO_TEST_ACCESS_TOKEN 
      : process.env.MERCADOPAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADOPAGO_SANDBOX === 'true'
      ? process.env.MERCADOPAGO_TEST_PUBLIC_KEY
      : process.env.MERCADOPAGO_PUBLIC_KEY,
    sandbox: process.env.MERCADOPAGO_SANDBOX === 'true',
    webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
    urls: {
      success: process.env.MERCADOPAGO_SUCCESS_URL,
      failure: process.env.MERCADOPAGO_FAILURE_URL,
      pending: process.env.MERCADOPAGO_PENDING_URL,
    },
  },
  
  // Email
  email: {
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME,
      },
    },
  },
  
  // Storage
  storage: {
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION,
      accessKeyId: process.env.AWS_S3_ACCESS_KEY,
      secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      cdnUrl: process.env.AWS_S3_CDN_URL,
    },
  },
};

// Validar configuraciones requeridas
const validateConfig = () => {
  const errors = [];
  
  // Validar Chat
  if (module.exports.chat.provider === 'openai' && !module.exports.chat.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required when CHAT_PROVIDER=openai');
  }
  
  // Validar Mercado Pago
  if (!module.exports.mercadopago.accessToken) {
    errors.push('MERCADOPAGO_ACCESS_TOKEN is required');
  }
  
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  
  console.log('✅ Configuration validated successfully');
};

// Ejecutar validación en startup
if (process.env.NODE_ENV === 'production') {
  validateConfig();
}
```

### 2. Servicio de Chat Inteligente

```javascript
// backend/src/services/ChatService.js

const axios = require('axios');
const config = require('../config/integrations');

class ChatService {
  constructor() {
    this.provider = config.chat.provider;
    this.config = config.chat;
  }
  
  async sendMessage(message, conversationHistory = []) {
    try {
      switch (this.provider) {
        case 'openai':
          return await this.sendOpenAI(message, conversationHistory);
        case 'minimax':
          return await this.sendMiniMax(message, conversationHistory);
        case 'anthropic':
          return await this.sendAnthropic(message, conversationHistory);
        default:
          throw new Error(`Unsupported chat provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('ChatService error:', error);
      throw error;
    }
  }
  
  async sendOpenAI(message, history) {
    const messages = [
      { role: 'system', content: this.config.systemPrompt },
      ...history.slice(-this.config.maxHistory),
      { role: 'user', content: message }
    ];
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: this.config.openai.model,
        messages: messages,
        max_tokens: this.config.openai.maxTokens,
        temperature: this.config.openai.temperature,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: this.config.timeout,
      }
    );
    
    return {
      response: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: response.data.model,
    };
  }
  
  async sendMiniMax(message, history) {
    // Implementación para MiniMax
    const response = await axios.post(
      'https://api.minimax.chat/v1/text/chatcompletion',
      {
        model: this.config.minimax.model,
        tokens_to_generate: this.config.openai.maxTokens,
        messages: [
          { role: 'system', content: this.config.systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.minimax.apiKey}`,
          'GroupId': this.config.minimax.groupId,
        },
        timeout: this.config.timeout,
      }
    );
    
    return {
      response: response.data.reply,
      usage: response.data.usage,
      model: this.config.minimax.model,
    };
  }
  
  async sendAnthropic(message, history) {
    // Implementación para Claude
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: this.config.anthropic.model,
        max_tokens: this.config.openai.maxTokens,
        messages: [
          ...history,
          { role: 'user', content: message }
        ],
        system: this.config.systemPrompt,
      },
      {
        headers: {
          'x-api-key': this.config.anthropic.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: this.config.timeout,
      }
    );
    
    return {
      response: response.data.content[0].text,
      usage: response.data.usage,
      model: this.config.anthropic.model,
    };
  }
}

module.exports = new ChatService();
```

### 3. Servicio de Mercado Pago

```javascript
// backend/src/services/MercadoPagoService.js

const mercadopago = require('mercadopago');
const config = require('../config/integrations');

class MercadoPagoService {
  constructor() {
    mercadopago.configure({
      access_token: config.mercadopago.accessToken,
    });
    
    this.config = config.mercadopago;
  }
  
  async createPreference(orderData) {
    try {
      const preference = {
        items: orderData.items.map(item => ({
          title: item.name,
          unit_price: parseFloat(item.price),
          quantity: parseInt(item.quantity),
        })),
        payer: {
          name: orderData.customer.firstName,
          surname: orderData.customer.lastName,
          email: orderData.customer.email,
          phone: {
            number: orderData.customer.phone,
          },
        },
        back_urls: {
          success: this.config.urls.success,
          failure: this.config.urls.failure,
          pending: this.config.urls.pending,
        },
        auto_return: 'approved',
        external_reference: orderData.orderId,
        notification_url: `${process.env.API_URL}/api/payments/webhook`,
        statement_descriptor: 'CARNES PREMIUM',
      };
      
      const response = await mercadopago.preferences.create(preference);
      
      return {
        id: response.body.id,
        init_point: response.body.init_point, // URL para checkout
        sandbox_init_point: response.body.sandbox_init_point,
      };
    } catch (error) {
      console.error('MercadoPago error:', error);
      throw error;
    }
  }
  
  async processWebhook(paymentData) {
    try {
      // Obtener información del pago
      const payment = await mercadopago.payment.get(paymentData.id);
      
      return {
        id: payment.body.id,
        status: payment.body.status,
        status_detail: payment.body.status_detail,
        external_reference: payment.body.external_reference,
        transaction_amount: payment.body.transaction_amount,
        payer: payment.body.payer,
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }
  
  async refundPayment(paymentId, amount = null) {
    try {
      const refund = await mercadopago.refund.create({
        payment_id: paymentId,
        amount: amount, // null = refund total
      });
      
      return refund.body;
    } catch (error) {
      console.error('Refund error:', error);
      throw error;
    }
  }
}

module.exports = new MercadoPagoService();
```

### 4. Rutas de Chat

```javascript
// backend/src/routes/chat.js

const express = require('express');
const router = express.Router();
const ChatService = require('../services/ChatService');
const { authMiddleware } = require('../middleware/auth');

/**
 * POST /api/chat/message
 * Enviar mensaje al chat inteligente
 */
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }
    
    const response = await ChatService.sendMessage(
      message,
      conversationHistory || []
    );
    
    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
    });
  }
});

module.exports = router;
```

### 5. Rutas de Pagos (Mercado Pago)

```javascript
// backend/src/routes/payments.js

const express = require('express');
const router = express.Router();
const MercadoPagoService = require('../services/MercadoPagoService');
const { authMiddleware } = require('../middleware/auth');
const { getPrismaClient } = require('../database/connection');

/**
 * POST /api/payments/create-preference
 * Crear preferencia de pago en Mercado Pago
 */
router.post('/create-preference', authMiddleware, async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const { orderId } = req.body;
    
    // Obtener orden
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        user: true,
      },
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
    
    // Preparar datos para Mercado Pago
    const orderData = {
      orderId: order.id,
      items: order.items.map(item => ({
        name: `${item.variant.product.name} - ${item.variant.name}`,
        price: item.price,
        quantity: item.quantity,
      })),
      customer: {
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
        phone: order.user.phone,
      },
    };
    
    // Crear preferencia
    const preference = await MercadoPagoService.createPreference(orderData);
    
    // Guardar preference ID en la orden
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentPreferenceId: preference.id,
      },
    });
    
    res.json({
      success: true,
      data: {
        preferenceId: preference.id,
        checkoutUrl: preference.init_point,
      },
    });
  } catch (error) {
    console.error('Create preference error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment preference',
    });
  }
});

/**
 * POST /api/payments/webhook
 * Webhook de Mercado Pago
 */
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentInfo = await MercadoPagoService.processWebhook(data);
      
      const prisma = getPrismaClient();
      
      // Actualizar orden según el estado del pago
      await prisma.order.update({
        where: { id: paymentInfo.external_reference },
        data: {
          paymentStatus: paymentInfo.status,
          paymentId: paymentInfo.id.toString(),
          status: paymentInfo.status === 'approved' ? 'PROCESSING' : 'PENDING',
        },
      });
    }
    
    // Mercado Pago requiere respuesta 200
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
```

### 6. Registrar Rutas en app.js

```javascript
// backend/src/app.js

// ... otras rutas ...

const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payments');

app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
```

---

## 🔒 Seguridad y Mejores Prácticas

### 1. Rotación de Secrets

```bash
# Script para rotar secrets (ejecutar mensualmente)
cat > /usr/local/bin/rotate-secrets.sh << 'EOF'
#!/bin/bash

# Rotar JWT Secret
NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Actualizar en AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id carnespremium/env \
  --secret-string "$(aws secretsmanager get-secret-value --secret-id carnespremium/env --query SecretString --output text | jq ".JWT_SECRET=\"$NEW_JWT_SECRET\"")"

# Reiniciar instancias EC2
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name carnespremium-asg

echo "Secrets rotated successfully"
EOF

chmod +x /usr/local/bin/rotate-secrets.sh
```

### 2. Validación de Webhooks

```javascript
// Validar firma de webhook de Mercado Pago
const crypto = require('crypto');

function validateMercadoPagoWebhook(req) {
  const signature = req.headers['x-signature'];
  const requestId = req.headers['x-request-id'];
  
  const hash = crypto
    .createHmac('sha256', config.mercadopago.webhookSecret)
    .update(requestId + JSON.stringify(req.body))
    .digest('hex');
  
  return signature === hash;
}
```

### 3. Rate Limiting por API Key

```javascript
// Límites específicos para chat (evitar costos excesivos)
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 mensajes por minuto por usuario
  message: {
    success: false,
    error: 'Too many chat messages, please try again later',
  },
});

router.post('/message', authMiddleware, chatRateLimiter, async (req, res) => {
  // ...
});
```

### 4. Logging de Uso

```javascript
// Logger para tracking de costos
const logAPIUsage = async (provider, tokens, cost) => {
  await prisma.aPIUsageLog.create({
    data: {
      provider,
      tokens,
      estimatedCost: cost,
      timestamp: new Date(),
    },
  });
};
```

### 5. Checklist de Seguridad

- [x] **Nunca** commitear .env al repositorio
- [x] Usar Secrets Manager en producción
- [x] Rotar secrets cada 90 días
- [x] Validar firmas de webhooks
- [x] Rate limiting en endpoints de IA
- [x] Logging de uso para tracking de costos
- [x] Permisos mínimos en IAM
- [x] Encriptar secrets en tránsito y reposo
- [x] Monitorear costos de APIs
- [x] Alerts de uso inusual

---

## 📊 Monitoreo de Costos

### Script de Reporte de Costos

```javascript
// backend/src/scripts/cost-report.js

const { getPrismaClient } = require('../database/connection');

async function generateCostReport() {
  const prisma = getPrismaClient();
  
  // Últimos 30 días
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const usage = await prisma.aPIUsageLog.groupBy({
    by: ['provider'],
    where: {
      timestamp: {
        gte: startDate,
      },
    },
    _sum: {
      tokens: true,
      estimatedCost: true,
    },
  });
  
  console.log('\n📊 API Cost Report (Last 30 days)\n');
  console.log('Provider         | Tokens    | Estimated Cost');
  console.log('-----------------|-----------|---------------');
  
  let totalCost = 0;
  usage.forEach(item => {
    console.log(
      `${item.provider.padEnd(16)} | ${item._sum.tokens.toString().padEnd(9)} | $${item._sum.estimatedCost.toFixed(2)}`
    );
    totalCost += item._sum.estimatedCost;
  });
  
  console.log('-----------------|-----------|---------------');
  console.log(`TOTAL            |           | $${totalCost.toFixed(2)}\n`);
}

generateCostReport();
```

---

## 🎯 Resumen de Ubicaciones

### Servidor Local
```
/var/www/carnespremium/app/backend/.env.production
```

### AWS Secrets Manager
```
carnespremium/env          → Todas las variables
carnespremium/chat         → OpenAI, MiniMax, Claude
carnespremium/mercadopago  → Credenciales MP
```

### Código
```
backend/src/config/integrations.js  → Configuración centralizada
backend/src/services/ChatService.js → Servicio de chat
backend/src/services/MercadoPagoService.js → Servicio de pagos
backend/src/routes/chat.js          → Endpoints de chat
backend/src/routes/payments.js      → Endpoints de pagos
```

---

**¿Necesitas ayuda con alguna integración específica?** 🚀
