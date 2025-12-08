# 🚀 Guía Completa de Producción - Servidor Local

## 📋 Tabla de Contenidos

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Preparación del Servidor](#preparación-del-servidor)
3. [Instalación de Dependencias](#instalación-de-dependencias)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Configuración de Redis](#configuración-de-redis)
6. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
7. [Build y Deployment](#build-y-deployment)
8. [Configuración de PM2](#configuración-de-pm2)
9. [Configuración de Nginx](#configuración-de-nginx)
10. [SSL/TLS con Let's Encrypt](#ssltls-con-lets-encrypt)
11. [Monitoreo y Logs](#monitoreo-y-logs)
12. [Backup y Recuperación](#backup-y-recuperación)
13. [Troubleshooting](#troubleshooting)

---

## 🖥️ Requisitos del Sistema

### Hardware Mínimo
- **CPU:** 2 cores (4 cores recomendado)
- **RAM:** 4 GB (8 GB recomendado)
- **Disco:** 50 GB SSD (100 GB recomendado)
- **Ancho de banda:** 100 Mbps

### Software
- **SO:** Ubuntu 22.04 LTS / Debian 11+ / CentOS 8+
- **Node.js:** v18.x o superior
- **PostgreSQL:** 14+ o MySQL 8+ (o SQLite para testing)
- **Redis:** 6.x o superior
- **Nginx:** 1.20+
- **Git:** 2.x+

---

## 🔧 Preparación del Servidor

### 1. Actualizar el Sistema

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. Crear Usuario para la Aplicación

```bash
# Crear usuario sin privilegios
sudo adduser --system --group --home /var/www/carnespremium carnespremium

# Crear directorios
sudo mkdir -p /var/www/carnespremium/{app,logs,backups}
sudo chown -R carnespremium:carnespremium /var/www/carnespremium
```

### 3. Configurar Firewall

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 6379/tcp    # Redis (solo localhost)
sudo ufw allow 5432/tcp    # PostgreSQL (solo localhost)
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## 📦 Instalación de Dependencias

### 1. Instalar Node.js (usando nvm)

```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js 18
nvm install 18
nvm use 18
nvm alias default 18

# Verificar instalación
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 2. Instalar PostgreSQL

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib -y

# CentOS/RHEL
sudo dnf install postgresql-server postgresql-contrib -y
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Verificar instalación
sudo -u postgres psql --version
```

### 3. Instalar Redis

```bash
# Ubuntu/Debian
sudo apt install redis-server -y

# CentOS/RHEL
sudo dnf install redis -y

# Iniciar y habilitar
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar instalación
redis-cli ping  # Debe responder: PONG
```

### 4. Instalar Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx -y

# CentOS/RHEL
sudo dnf install nginx -y

# Iniciar y habilitar
sudo systemctl enable nginx
sudo systemctl start nginx

# Verificar instalación
nginx -v
```

### 5. Instalar PM2 Globalmente

```bash
sudo npm install -g pm2

# Verificar instalación
pm2 --version
```

---

## 🗄️ Configuración de Base de Datos

### Opción 1: PostgreSQL (Recomendado para Producción)

#### 1. Crear Base de Datos y Usuario

```bash
# Conectar como postgres
sudo -u postgres psql

-- Dentro de psql:
CREATE DATABASE carnespremium;
CREATE USER carnespremium_user WITH ENCRYPTED PASSWORD 'TuPasswordSegura2024!';
GRANT ALL PRIVILEGES ON DATABASE carnespremium TO carnespremium_user;

-- PostgreSQL 15+
\c carnespremium
GRANT ALL ON SCHEMA public TO carnespremium_user;

\q
```

#### 2. Configurar PostgreSQL para Conexiones Locales

```bash
# Editar pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Añadir línea:
local   carnespremium    carnespremium_user                md5
host    carnespremium    carnespremium_user    127.0.0.1/32    md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

#### 3. Verificar Conexión

```bash
psql -U carnespremium_user -d carnespremium -h localhost -W
```

### Opción 2: MySQL

```bash
# Instalar MySQL
sudo apt install mysql-server -y

# Configurar MySQL
sudo mysql_secure_installation

# Crear base de datos
sudo mysql -u root -p

CREATE DATABASE carnespremium;
CREATE USER 'carnespremium_user'@'localhost' IDENTIFIED BY 'TuPasswordSegura2024!';
GRANT ALL PRIVILEGES ON carnespremium.* TO 'carnespremium_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 🔴 Configuración de Redis

### 1. Configurar Redis para Producción

```bash
# Editar configuración
sudo nano /etc/redis/redis.conf

# Modificar:
bind 127.0.0.1                    # Solo localhost
protected-mode yes                # Modo protegido
requirepass TuPasswordRedis2024!  # Contraseña fuerte
maxmemory 256mb                   # Límite de memoria
maxmemory-policy allkeys-lru      # Política de evicción

# Guardar y reiniciar
sudo systemctl restart redis-server
```

### 2. Verificar Configuración

```bash
redis-cli
AUTH TuPasswordRedis2024!
PING  # Debe responder: PONG
```

---

## 🔐 Configuración de Variables de Entorno

### 1. Crear Archivo .env para Producción

```bash
# Cambiar al directorio de la app
cd /var/www/carnespremium/app

# Crear .env.production
sudo nano .env.production
```

### 2. Contenido de .env.production

```env
# ===================================
# API Carnes Premium - PRODUCCIÓN
# ===================================

# Node Environment
NODE_ENV=production
PORT=3002

# Database (PostgreSQL)
DATABASE_URL="postgresql://carnespremium_user:TuPasswordSegura2024!@localhost:5432/carnespremium?schema=public"

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=TuPasswordRedis2024!

# JWT Configuration
JWT_SECRET=genera-un-secret-aleatorio-muy-largo-y-seguro-2024
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API Security
API_KEY=genera-tu-api-key-super-secreta-2024

# CORS Configuration
CORS_ORIGIN=https://tudominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5000

# Logging
LOG_LEVEL=info
LOG_FILE=/var/www/carnespremium/logs/app.log

# Email Configuration (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuusuario@gmail.com
SMTP_PASSWORD=tupassword

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=/var/www/carnespremium/app/uploads

# Session
SESSION_SECRET=otro-secret-aleatorio-para-sesiones-2024
```

### 3. Generar Secrets Seguros

```bash
# Generar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar API_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generar SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Proteger Archivo .env

```bash
sudo chmod 600 .env.production
sudo chown carnespremium:carnespremium .env.production
```

---

## 🚀 Build y Deployment

### 1. Clonar Repositorio

```bash
# Cambiar a usuario carnespremium
sudo su - carnespremium

# Clonar repo
cd /var/www/carnespremium/app
git clone https://github.com/tuusuario/carnespremium-api.git .

# O subir archivos manualmente
# scp -r /local/path/* carnespremium@servidor:/var/www/carnespremium/app/
```

### 2. Instalar Dependencias

```bash
cd /var/www/carnespremium/app/backend

# Instalar dependencias de producción
npm ci --only=production

# O para incluir dev dependencies (si necesitas compilar):
npm install
```

### 3. Ejecutar Migraciones de Prisma

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Seed inicial (opcional)
npx prisma db seed
```

### 4. Verificar Instalación

```bash
# Test rápido
node -c src/app.js

# Test de conexión a DB
npx prisma db pull
```

---

## ⚙️ Configuración de PM2

### 1. Crear Archivo ecosystem.config.js

```bash
nano /var/www/carnespremium/app/backend/ecosystem.config.js
```

### 2. Contenido de ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'carnespremium-api',
      script: './src/app.js',
      instances: 'max',  // Cluster mode: usa todos los CPUs
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_file: '.env.production',
      
      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/www/carnespremium/logs/pm2-error.log',
      out_file: '/var/www/carnespremium/logs/pm2-out.log',
      merge_logs: true,
      
      // Restart Policy
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      
      // Watch (desactivado en producción)
      watch: false,
      
      // Advanced
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Cluster
      instance_var: 'INSTANCE_ID'
    }
  ]
};
```

### 3. Iniciar Aplicación con PM2

```bash
# Iniciar app
pm2 start ecosystem.config.js

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup systemd -u carnespremium --hp /var/www/carnespremium

# Ejecutar el comando que PM2 te indica
```

### 4. Comandos Útiles de PM2

```bash
# Ver status
pm2 status

# Ver logs en tiempo real
pm2 logs carnespremium-api

# Ver logs de errores
pm2 logs carnespremium-api --err

# Monitoreo en tiempo real
pm2 monit

# Restart app
pm2 restart carnespremium-api

# Reload (sin downtime)
pm2 reload carnespremium-api

# Detener app
pm2 stop carnespremium-api

# Ver información detallada
pm2 info carnespremium-api
```

---

## 🌐 Configuración de Nginx

### 1. Crear Configuración del Sitio

```bash
sudo nano /etc/nginx/sites-available/carnespremium
```

### 2. Contenido de carnespremium

```nginx
# Upstream para PM2 cluster
upstream carnespremium_backend {
    least_conn;
    server 127.0.0.1:3002 max_fails=3 fail_timeout=30s;
    keepalive 64;
}

# Redirigir HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.carnespremium.com;
    
    # ACME challenge para Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuración HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.carnespremium.com;
    
    # SSL Certificates (después de configurar Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.carnespremium.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.carnespremium.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Logging
    access_log /var/www/carnespremium/logs/nginx-access.log;
    error_log /var/www/carnespremium/logs/nginx-error.log warn;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    
    # Client Body Size
    client_max_body_size 10M;
    
    # API Endpoints
    location /api/ {
        proxy_pass http://carnespremium_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Caching (opcional)
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health Check
    location /health {
        proxy_pass http://carnespremium_backend/api/health;
        access_log off;
    }
    
    # Static files (si los tienes)
    location /uploads/ {
        alias /var/www/carnespremium/app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Activar Configuración

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/carnespremium /etc/nginx/sites-enabled/

# Eliminar default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 SSL/TLS con Let's Encrypt

### 1. Instalar Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo dnf install certbot python3-certbot-nginx -y
```

### 2. Obtener Certificado

```bash
# Para Nginx (automático)
sudo certbot --nginx -d api.carnespremium.com

# O manual
sudo certbot certonly --webroot -w /var/www/certbot -d api.carnespremium.com
```

### 3. Renovación Automática

```bash
# Test de renovación
sudo certbot renew --dry-run

# Crear cron job para renovación automática
sudo crontab -e

# Añadir línea:
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 📊 Monitoreo y Logs

### 1. Configurar Logrotate

```bash
sudo nano /etc/logrotate.d/carnespremium
```

```
/var/www/carnespremium/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 carnespremium carnespremium
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Instalar Monitoring (opcional)

```bash
# Instalar PM2 monitoring
pm2 install pm2-logrotate

# Configurar
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 3. Ver Logs

```bash
# Logs de la aplicación
pm2 logs carnespremium-api

# Logs de Nginx
sudo tail -f /var/www/carnespremium/logs/nginx-access.log
sudo tail -f /var/www/carnespremium/logs/nginx-error.log

# Logs del sistema
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
sudo journalctl -u redis-server -f
```

---

## 💾 Backup y Recuperación

### 1. Script de Backup Automático

```bash
sudo nano /usr/local/bin/backup-carnespremium.sh
```

```bash
#!/bin/bash

# Configuración
BACKUP_DIR="/var/www/carnespremium/backups"
DB_NAME="carnespremium"
DB_USER="carnespremium_user"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear directorio
mkdir -p $BACKUP_DIR

# Backup de Base de Datos
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup de archivos subidos
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/carnespremium/app/uploads/

# Backup de .env
cp /var/www/carnespremium/app/backend/.env.production $BACKUP_DIR/env_$DATE

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completado: $DATE"
```

```bash
# Hacer ejecutable
sudo chmod +x /usr/local/bin/backup-carnespremium.sh

# Programar backup diario
sudo crontab -e

# Añadir:
0 2 * * * /usr/local/bin/backup-carnespremium.sh >> /var/log/carnespremium-backup.log 2>&1
```

### 2. Restauración

```bash
# Restaurar base de datos
gunzip -c /var/www/carnespremium/backups/db_20250121_020000.sql.gz | psql -U carnespremium_user carnespremium

# Restaurar archivos
tar -xzf /var/www/carnespremium/backups/uploads_20250121_020000.tar.gz -C /
```

---

## 🔍 Troubleshooting

### Problema: API no responde

```bash
# Verificar si la app está corriendo
pm2 status

# Ver logs
pm2 logs carnespremium-api --lines 100

# Verificar puerto
sudo netstat -tlnp | grep 3002

# Reiniciar app
pm2 restart carnespremium-api
```

### Problema: Error de conexión a base de datos

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar conexión
psql -U carnespremium_user -d carnespremium -h localhost -W

# Ver logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Problema: Error de Redis

```bash
# Verificar Redis
sudo systemctl status redis-server

# Test de conexión
redis-cli -a TuPasswordRedis2024! ping

# Ver logs
sudo tail -f /var/log/redis/redis-server.log
```

### Problema: Nginx 502 Bad Gateway

```bash
# Verificar que la app esté corriendo
pm2 status

# Verificar configuración de Nginx
sudo nginx -t

# Ver logs de Nginx
sudo tail -f /var/www/carnespremium/logs/nginx-error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: Alto uso de memoria

```bash
# Ver uso de memoria
pm2 monit

# Configurar límite de memoria en ecosystem.config.js
# max_memory_restart: '500M'

# Reiniciar con nueva config
pm2 restart carnespremium-api
```

---

## ✅ Checklist de Deployment

- [ ] Servidor actualizado
- [ ] Usuario carnespremium creado
- [ ] Firewall configurado
- [ ] Node.js instalado
- [ ] PostgreSQL instalado y configurado
- [ ] Redis instalado y configurado
- [ ] Nginx instalado
- [ ] PM2 instalado globalmente
- [ ] Base de datos creada
- [ ] Usuario de BD creado con permisos
- [ ] Variables de entorno configuradas
- [ ] Secrets generados de forma segura
- [ ] Código clonado/subido
- [ ] Dependencias instaladas
- [ ] Migraciones ejecutadas
- [ ] PM2 configurado e iniciado
- [ ] Nginx configurado
- [ ] SSL/TLS configurado con Let's Encrypt
- [ ] Logs configurados con logrotate
- [ ] Backups automáticos configurados
- [ ] Monitoreo configurado
- [ ] Tests de endpoints realizados

---

## 🎉 ¡Listo para Producción!

Tu API está ahora corriendo en producción en tu servidor local con:

- ✅ Cluster mode con PM2 para máximo rendimiento
- ✅ Nginx como reverse proxy
- ✅ SSL/TLS habilitado
- ✅ Compresión Gzip
- ✅ Logs rotados automáticamente
- ✅ Backups diarios
- ✅ Monitoreo en tiempo real

**Para verificar:**

```bash
# Test de salud
curl https://api.carnespremium.com/health

# Test de endpoint
curl https://api.carnespremium.com/api/products

# Ver métricas
pm2 monit
```

---

**Fecha:** 2025-11-21  
**Versión:** 1.0.0  
**Autor:** MiniMax Agent
