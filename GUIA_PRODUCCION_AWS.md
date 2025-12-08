# ☁️ Guía Completa de Producción - AWS

## 📋 Tabla de Contenidos

1. [Arquitectura AWS Recomendada](#arquitectura-aws-recomendada)
2. [Costos Estimados](#costos-estimados)
3. [Configuración Inicial de AWS](#configuración-inicial-de-aws)
4. [VPC y Networking](#vpc-y-networking)
5. [RDS - Base de Datos](#rds---base-de-datos)
6. [ElastiCache - Redis](#elasticache---redis)
7. [EC2 - Servidor de Aplicación](#ec2---servidor-de-aplicación)
8. [Application Load Balancer](#application-load-balancer)
9. [Auto Scaling](#auto-scaling)
10. [S3 - Almacenamiento de Archivos](#s3---almacenamiento-de-archivos)
11. [CloudFront - CDN](#cloudfront---cdn)
12. [Route 53 - DNS](#route-53---dns)
13. [Certificate Manager - SSL/TLS](#certificate-manager---ssltls)
14. [CloudWatch - Monitoreo](#cloudwatch---monitoreo)
15. [Secrets Manager](#secrets-manager)
16. [CI/CD con CodePipeline](#cicd-con-codepipeline)
17. [Backup y Disaster Recovery](#backup-y-disaster-recovery)
18. [Seguridad y Compliance](#seguridad-y-compliance)
19. [Optimización de Costos](#optimización-de-costos)

---

## 🏗️ Arquitectura AWS Recomendada

```
┌──────────────────────────────────────────────────────────────┐
│                      INTERNET                                 │
└──────────────────┬───────────────────────────────────────────┘
                   │
         ┌─────────▼─────────┐
         │   Route 53 (DNS)  │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │   CloudFront CDN  │
         │   (Static Assets)  │
         └─────────┬─────────┘
                   │
         ┌─────────▼──────────┐
         │  ACM Certificate   │
         │    (SSL/TLS)       │
         └─────────┬──────────┘
                   │
    ┌──────────────▼──────────────┐
    │  Application Load Balancer  │
    │      (Multi-AZ)             │
    └──────┬─────────────┬────────┘
           │             │
    ┌──────▼──────┐ ┌───▼─────────┐
    │   EC2 AZ-A  │ │  EC2 AZ-B   │
    │   (Node.js) │ │  (Node.js)  │
    └──────┬──────┘ └───┬─────────┘
           │            │
    ┌──────▼────────────▼─────────┐
    │    VPC (10.0.0.0/16)        │
    │                              │
    │  ┌─────────────────────┐    │
    │  │  Private Subnet AZ-A │    │
    │  │  ┌───────────────┐  │    │
    │  │  │ RDS Primary   │  │    │
    │  │  │ (PostgreSQL)  │  │    │
    │  │  └───────┬───────┘  │    │
    │  └──────────┼──────────┘    │
    │             │                │
    │  ┌──────────▼──────────┐    │
    │  │  Private Subnet AZ-B │    │
    │  │  ┌───────────────┐  │    │
    │  │  │ RDS Standby   │  │    │
    │  │  │ (Replica)     │  │    │
    │  │  └───────────────┘  │    │
    │  └─────────────────────┘    │
    │                              │
    │  ┌─────────────────────┐    │
    │  │  ElastiCache Redis  │    │
    │  │    (Multi-AZ)       │    │
    │  └─────────────────────┘    │
    │                              │
    └──────────────────────────────┘
           │
    ┌──────▼──────┐
    │  S3 Bucket  │
    │  (Uploads)  │
    └─────────────┘
```

### Componentes Principales

1. **Route 53**: DNS management
2. **CloudFront**: CDN para assets estáticos
3. **ALB**: Load balancer con SSL termination
4. **EC2**: Instancias con Auto Scaling
5. **RDS**: PostgreSQL con Multi-AZ
6. **ElastiCache**: Redis para caching
7. **S3**: Almacenamiento de archivos
8. **CloudWatch**: Monitoreo y logging
9. **Secrets Manager**: Gestión de secretos

---

## 💰 Costos Estimados

### Escenario 1: Startup (Bajo Tráfico - ~1000 req/día)

| Servicio | Especificación | Costo Mensual |
|----------|---------------|---------------|
| EC2 | 1x t3.small (2 vCPU, 2GB RAM) | $15 |
| RDS | db.t3.micro PostgreSQL | $15 |
| ElastiCache | cache.t3.micro Redis | $12 |
| ALB | Application Load Balancer | $22 |
| S3 | 10 GB storage + transfer | $3 |
| CloudFront | 50 GB transfer | $5 |
| Route 53 | 1 hosted zone | $0.50 |
| **TOTAL** | | **~$72.50/mes** |

### Escenario 2: Crecimiento (Tráfico Medio - ~50k req/día)

| Servicio | Especificación | Costo Mensual |
|----------|---------------|---------------|
| EC2 | 2x t3.medium (2 vCPU, 4GB RAM) | $60 |
| RDS | db.t3.small Multi-AZ | $50 |
| ElastiCache | cache.t3.small Redis | $36 |
| ALB | + data transfer | $25 |
| S3 | 100 GB + transfer | $10 |
| CloudFront | 500 GB transfer | $25 |
| CloudWatch | Logs + metrics | $10 |
| **TOTAL** | | **~$216/mes** |

### Escenario 3: Producción (Alto Tráfico - ~500k req/día)

| Servicio | Especificación | Costo Mensual |
|----------|---------------|---------------|
| EC2 | 4x t3.large (2 vCPU, 8GB RAM) | $240 |
| RDS | db.r5.large Multi-AZ | $320 |
| ElastiCache | cache.r5.large cluster | $180 |
| ALB | + high data transfer | $35 |
| S3 | 1 TB + transfer | $30 |
| CloudFront | 5 TB transfer | $150 |
| CloudWatch | Advanced monitoring | $30 |
| **TOTAL** | | **~$985/mes** |

---

## 🚀 Configuración Inicial de AWS

### 1. Crear Cuenta AWS

1. Ir a [aws.amazon.com](https://aws.amazon.com)
2. Click en "Create an AWS Account"
3. Completar información
4. Configurar método de pago
5. Verificar identidad

### 2. Configurar AWS CLI

```bash
# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verificar instalación
aws --version

# Configurar credenciales
aws configure
# AWS Access Key ID: TU_ACCESS_KEY
# AWS Secret Access Key: TU_SECRET_KEY
# Default region name: us-east-1
# Default output format: json
```

### 3. Crear Usuario IAM para Deployment

```bash
# Via AWS CLI
aws iam create-user --user-name carnespremium-deploy

# Attach políticas necesarias
aws iam attach-user-policy --user-name carnespremium-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2FullAccess

aws iam attach-user-policy --user-name carnespremium-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonRDSFullAccess

aws iam attach-user-policy --user-name carnespremium-deploy \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Crear access key
aws iam create-access-key --user-name carnespremium-deploy
```

---

## 🌐 VPC y Networking

### 1. Crear VPC

```bash
# Via AWS CLI
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=carnespremium-vpc}]'

# Anotar VPC ID: vpc-xxxxxxxxx
```

### 2. Crear Subnets

```bash
# Public Subnet AZ-A (us-east-1a)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=carnespremium-public-1a}]'

# Public Subnet AZ-B (us-east-1b)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=carnespremium-public-1b}]'

# Private Subnet AZ-A
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=carnespremium-private-1a}]'

# Private Subnet AZ-B
aws ec2 create-subnet \
  --vpc-id vpc-xxxxxxxxx \
  --cidr-block 10.0.12.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=carnespremium-private-1b}]'
```

### 3. Crear Internet Gateway

```bash
# Crear IGW
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=carnespremium-igw}]'

# Attach a VPC
aws ec2 attach-internet-gateway \
  --vpc-id vpc-xxxxxxxxx \
  --internet-gateway-id igw-xxxxxxxxx
```

### 4. Configurar Route Tables

```bash
# Route table para subnets públicas
aws ec2 create-route-table \
  --vpc-id vpc-xxxxxxxxx \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=carnespremium-public-rt}]'

# Añadir ruta a IGW
aws ec2 create-route \
  --route-table-id rtb-xxxxxxxxx \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-xxxxxxxxx

# Asociar subnets públicas
aws ec2 associate-route-table \
  --subnet-id subnet-xxxxxxxxx \
  --route-table-id rtb-xxxxxxxxx
```

### 5. Crear Security Groups

#### Security Group para ALB

```bash
aws ec2 create-security-group \
  --group-name carnespremium-alb-sg \
  --description "Security group for ALB" \
  --vpc-id vpc-xxxxxxxxx

# Permitir HTTP
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Permitir HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

#### Security Group para EC2

```bash
aws ec2 create-security-group \
  --group-name carnespremium-ec2-sg \
  --description "Security group for EC2 instances" \
  --vpc-id vpc-xxxxxxxxx

# Permitir tráfico desde ALB
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 3002 \
  --source-group sg-alb-xxxxxxxxx

# Permitir SSH (solo desde tu IP)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr TU_IP/32
```

#### Security Group para RDS

```bash
aws ec2 create-security-group \
  --group-name carnespremium-rds-sg \
  --description "Security group for RDS" \
  --vpc-id vpc-xxxxxxxxx

# Permitir PostgreSQL desde EC2
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-ec2-xxxxxxxxx
```

#### Security Group para ElastiCache

```bash
aws ec2 create-security-group \
  --group-name carnespremium-redis-sg \
  --description "Security group for ElastiCache" \
  --vpc-id vpc-xxxxxxxxx

# Permitir Redis desde EC2
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 6379 \
  --source-group sg-ec2-xxxxxxxxx
```

---

## 🗄️ RDS - Base de Datos

### 1. Crear DB Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name carnespremium-db-subnet \
  --db-subnet-group-description "Subnet group for RDS" \
  --subnet-ids subnet-private-1a subnet-private-1b \
  --tags Key=Name,Value=carnespremium-db-subnet
```

### 2. Crear RDS Instance (PostgreSQL)

```bash
aws rds create-db-instance \
  --db-instance-identifier carnespremium-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 14.7 \
  --master-username carnespremium_admin \
  --master-user-password 'TuPasswordSuperSeguro2024!' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids sg-rds-xxxxxxxxx \
  --db-subnet-group-name carnespremium-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --publicly-accessible false \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --tags Key=Name,Value=carnespremium-db
```

### 3. Esperar a que esté disponible

```bash
aws rds wait db-instance-available \
  --db-instance-identifier carnespremium-db

# Obtener endpoint
aws rds describe-db-instances \
  --db-instance-identifier carnespremium-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Endpoint: carnespremium-db.xxxxxxxxx.us-east-1.rds.amazonaws.com
```

### 4. Crear Base de Datos y Usuario

```bash
# Desde una EC2 en la misma VPC
psql -h carnespremium-db.xxxxxxxxx.us-east-1.rds.amazonaws.com \
     -U carnespremium_admin \
     -d postgres

-- Crear database
CREATE DATABASE carnespremium;

-- Crear usuario para la app
CREATE USER carnespremium_app WITH ENCRYPTED PASSWORD 'AppPassword2024!';
GRANT ALL PRIVILEGES ON DATABASE carnespremium TO carnespremium_app;

\c carnespremium
GRANT ALL ON SCHEMA public TO carnespremium_app;
```

---

## 🔴 ElastiCache - Redis

### 1. Crear Cache Subnet Group

```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name carnespremium-redis-subnet \
  --cache-subnet-group-description "Subnet group for Redis" \
  --subnet-ids subnet-private-1a subnet-private-1b
```

### 2. Crear Redis Cluster

```bash
aws elasticache create-replication-group \
  --replication-group-id carnespremium-redis \
  --replication-group-description "Redis for carnespremium API" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.micro \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --multi-az-enabled \
  --cache-subnet-group-name carnespremium-redis-subnet \
  --security-group-ids sg-redis-xxxxxxxxx \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token 'TuTokenRedisSeguro2024!' \
  --snapshot-retention-limit 5 \
  --snapshot-window "02:00-03:00" \
  --preferred-maintenance-window "sun:05:00-sun:06:00" \
  --tags Key=Name,Value=carnespremium-redis
```

### 3. Obtener Endpoint

```bash
aws elasticache describe-replication-groups \
  --replication-group-id carnespremium-redis \
  --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.Address' \
  --output text

# Endpoint: carnespremium-redis.xxxxxx.ng.0001.use1.cache.amazonaws.com
```

---

## 💻 EC2 - Servidor de Aplicación

### 1. Crear Key Pair para SSH

```bash
aws ec2 create-key-pair \
  --key-name carnespremium-key \
  --query 'KeyMaterial' \
  --output text > carnespremium-key.pem

chmod 400 carnespremium-key.pem
```

### 2. Crear Launch Template

Primero, crear un script de User Data:

```bash
cat > user-data.sh << 'EOF'
#!/bin/bash

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb

# Create app user
useradd -m -s /bin/bash carnespremium

# Create directories
mkdir -p /var/www/carnespremium/{app,logs}
chown -R carnespremium:carnespremium /var/www/carnespremium

# Clone repository (o descargar desde S3)
cd /var/www/carnespremium/app
git clone https://github.com/tuusuario/carnespremium-api.git .

# Install dependencies
cd backend
npm ci --only=production

# Get secrets from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id carnespremium/env \
  --query SecretString \
  --output text > .env.production

# Run migrations
npx prisma generate
npx prisma migrate deploy

# Start with PM2
su - carnespremium -c "cd /var/www/carnespremium/app/backend && pm2 start ecosystem.config.js"
su - carnespremium -c "pm2 save"
su - carnespremium -c "pm2 startup systemd -u carnespremium --hp /home/carnespremium"

# Configure PM2 startup
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u carnespremium --hp /home/carnespremium

echo "EC2 setup completed"
EOF
```

Crear Launch Template:

```bash
aws ec2 create-launch-template \
  --launch-template-name carnespremium-template \
  --version-description "v1" \
  --launch-template-data '{
    "ImageId": "ami-0c55b159cbfafe1f0",
    "InstanceType": "t3.small",
    "KeyName": "carnespremium-key",
    "SecurityGroupIds": ["sg-ec2-xxxxxxxxx"],
    "IamInstanceProfile": {
      "Name": "carnespremium-ec2-role"
    },
    "UserData": "'$(base64 -w 0 user-data.sh)'",
    "TagSpecifications": [{
      "ResourceType": "instance",
      "Tags": [
        {"Key": "Name", "Value": "carnespremium-api"},
        {"Key": "Environment", "Value": "production"}
      ]
    }],
    "Monitoring": {
      "Enabled": true
    }
  }'
```

### 3. Crear IAM Role para EC2

```bash
# Crear trust policy
cat > ec2-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Crear role
aws iam create-role \
  --role-name carnespremium-ec2-role \
  --assume-role-policy-document file://ec2-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name carnespremium-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

aws iam attach-role-policy \
  --role-name carnespremium-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

aws iam attach-role-policy \
  --role-name carnespremium-ec2-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Crear instance profile
aws iam create-instance-profile \
  --instance-profile-name carnespremium-ec2-role

aws iam add-role-to-instance-profile \
  --instance-profile-name carnespremium-ec2-role \
  --role-name carnespremium-ec2-role
```

---

## ⚖️ Application Load Balancer

### 1. Crear Target Group

```bash
aws elbv2 create-target-group \
  --name carnespremium-tg \
  --protocol HTTP \
  --port 3002 \
  --vpc-id vpc-xxxxxxxxx \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200 \
  --target-type instance
```

### 2. Crear Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name carnespremium-alb \
  --subnets subnet-public-1a subnet-public-1b \
  --security-groups sg-alb-xxxxxxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4 \
  --tags Key=Name,Value=carnespremium-alb
```

### 3. Crear Listeners

```bash
# HTTP Listener (redirect a HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:xxxx:loadbalancer/app/carnespremium-alb/xxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}'

# HTTPS Listener (después de configurar certificado)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:xxxx:loadbalancer/app/carnespremium-alb/xxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:xxxx:certificate/xxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxxx:targetgroup/carnespremium-tg/xxx
```

---

## 📈 Auto Scaling

### 1. Crear Auto Scaling Group

```bash
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name carnespremium-asg \
  --launch-template LaunchTemplateName=carnespremium-template,Version='$Latest' \
  --min-size 2 \
  --max-size 6 \
  --desired-capacity 2 \
  --default-cooldown 300 \
  --health-check-type ELB \
  --health-check-grace-period 300 \
  --vpc-zone-identifier "subnet-public-1a,subnet-public-1b" \
  --target-group-arns arn:aws:elasticloadbalancing:us-east-1:xxxx:targetgroup/carnespremium-tg/xxx \
  --tags Key=Name,Value=carnespremium-api,PropagateAtLaunch=true
```

### 2. Configurar Scaling Policies

#### CPU-based scaling

```bash
# Scale UP cuando CPU > 70%
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name carnespremium-asg \
  --policy-name carnespremium-scale-up \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "TargetValue": 70.0
  }'

# Scale DOWN cuando CPU < 30%
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name carnespremium-asg \
  --policy-name carnespremium-scale-down \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    },
    "TargetValue": 30.0
  }'
```

#### Request-based scaling

```bash
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name carnespremium-asg \
  --policy-name carnespremium-request-count-scale \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget",
      "ResourceLabel": "app/carnespremium-alb/xxx/targetgroup/carnespremium-tg/xxx"
    },
    "TargetValue": 1000.0
  }'
```

---

## 📦 S3 - Almacenamiento de Archivos

### 1. Crear Bucket

```bash
aws s3api create-bucket \
  --bucket carnespremium-uploads \
  --region us-east-1

# Habilitar versionado
aws s3api put-bucket-versioning \
  --bucket carnespremium-uploads \
  --versioning-configuration Status=Enabled

# Habilitar encryption
aws s3api put-bucket-encryption \
  --bucket carnespremium-uploads \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 2. Configurar Lifecycle Policy

```bash
cat > lifecycle-policy.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    },
    {
      "Id": "MoveToIA",
      "Status": "Enabled",
      "Transitions": [{
        "Days": 90,
        "StorageClass": "STANDARD_IA"
      }]
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket carnespremium-uploads \
  --lifecycle-configuration file://lifecycle-policy.json
```

### 3. Configurar CORS

```bash
cat > cors-config.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://tudominio.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket carnespremium-uploads \
  --cors-configuration file://cors-config.json
```

### 4. Configurar Bucket Policy

```bash
cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2ReadAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/carnespremium-ec2-role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::carnespremium-uploads/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket carnespremium-uploads \
  --policy file://bucket-policy.json
```

---

## 🌎 CloudFront - CDN

### 1. Crear Distribution

```bash
cat > cloudfront-config.json << EOF
{
  "CallerReference": "carnespremium-$(date +%s)",
  "Comment": "CDN for carnespremium uploads",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-carnespremium-uploads",
        "DomainName": "carnespremium-uploads.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-carnespremium-uploads",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
EOF

aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

---

## 🌐 Route 53 - DNS

### 1. Crear Hosted Zone

```bash
aws route53 create-hosted-zone \
  --name carnespremium.com \
  --caller-reference $(date +%s)
```

### 2. Crear Record Sets

```bash
# Obtener Hosted Zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='carnespremium.com.'].Id" \
  --output text)

# Crear A record para ALB
cat > route53-alb.json << EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.carnespremium.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "carnespremium-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": true
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://route53-alb.json
```

---

## 🔒 Certificate Manager - SSL/TLS

### 1. Solicitar Certificado

```bash
aws acm request-certificate \
  --domain-name api.carnespremium.com \
  --subject-alternative-names '*.carnespremium.com' \
  --validation-method DNS \
  --region us-east-1
```

### 2. Validar Certificado

```bash
# Obtener detalles de validación
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:xxxx:certificate/xxx

# Crear record en Route 53 para validación
# (AWS Console lo hace automáticamente)
```

---

## 📊 CloudWatch - Monitoreo

### 1. Crear Dashboard

```bash
cat > dashboard.json << EOF
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
          [".", "RequestCount", {"stat": "Sum"}],
          [".", "HTTPCode_Target_4XX_Count", {"stat": "Sum"}],
          [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ALB Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/EC2", "CPUUtilization", {"stat": "Average"}],
          [".", "NetworkIn", {"stat": "Sum"}],
          [".", "NetworkOut", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "EC2 Metrics"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name carnespremium-dashboard \
  --dashboard-body file://dashboard.json
```

### 2. Crear Alarmas

```bash
# Alarma de CPU alta
aws cloudwatch put-metric-alarm \
  --alarm-name carnespremium-high-cpu \
  --alarm-description "CPU above 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Alarma de errores 5xx
aws cloudwatch put-metric-alarm \
  --alarm-name carnespremium-5xx-errors \
  --alarm-description "Too many 5xx errors" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## 🔐 Secrets Manager

### 1. Crear Secret para Variables de Entorno

```bash
cat > env-secrets.json << EOF
{
  "NODE_ENV": "production",
  "PORT": "3002",
  "DATABASE_URL": "postgresql://carnespremium_app:AppPassword2024!@carnespremium-db.xxxxxxxxx.us-east-1.rds.amazonaws.com:5432/carnespremium",
  "REDIS_HOST": "carnespremium-redis.xxxxxx.ng.0001.use1.cache.amazonaws.com",
  "REDIS_PORT": "6379",
  "REDIS_PASSWORD": "TuTokenRedisSeguro2024!",
  "JWT_SECRET": "tu-jwt-secret-generado",
  "API_KEY": "tu-api-key-generada",
  "CORS_ORIGIN": "https://carnespremium.com"
}
EOF

aws secretsmanager create-secret \
  --name carnespremium/env \
  --description "Environment variables for carnespremium API" \
  --secret-string file://env-secrets.json

# Eliminar archivo temporal
rm env-secrets.json
```

### 2. Acceder a Secrets desde EC2

```bash
# En User Data o en la app
aws secretsmanager get-secret-value \
  --secret-id carnespremium/env \
  --query SecretString \
  --output text > .env.production
```

---

## 🚀 CI/CD con CodePipeline

### 1. Crear CodeCommit Repository

```bash
aws codecommit create-repository \
  --repository-name carnespremium-api \
  --repository-description "API Repository"
```

### 2. Crear CodeBuild Project

```bash
cat > buildspec.yml << EOF
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - cd backend
      - npm ci
  build:
    commands:
      - echo "Running tests..."
      - npm test
      - echo "Running Prisma migrations..."
      - npx prisma generate
  post_build:
    commands:
      - echo "Build completed"

artifacts:
  files:
    - '**/*'
  base-directory: backend
EOF

# Subir a repositorio
git add buildspec.yml
git commit -m "Add buildspec"
git push
```

### 3. Crear CodeDeploy Application

```bash
aws deploy create-application \
  --application-name carnespremium-api \
  --compute-platform Server
```

### 4. Crear CodePipeline

```bash
# Via AWS Console es más fácil:
# 1. Source: CodeCommit
# 2. Build: CodeBuild
# 3. Deploy: CodeDeploy to Auto Scaling Group
```

---

## 💾 Backup y Disaster Recovery

### 1. RDS Automated Backups

Ya configurado con `--backup-retention-period 7`

### 2. Manual Snapshots

```bash
# Crear snapshot manual
aws rds create-db-snapshot \
  --db-instance-identifier carnespremium-db \
  --db-snapshot-identifier carnespremium-db-snapshot-$(date +%Y%m%d)

# Listar snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier carnespremium-db
```

### 3. S3 Versioning

Ya configurado en la sección de S3.

### 4. Disaster Recovery Plan

```bash
# Restaurar RDS desde snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier carnespremium-db-restore \
  --db-snapshot-identifier carnespremium-db-snapshot-20250121

# Actualizar endpoint en Secrets Manager
aws secretsmanager update-secret \
  --secret-id carnespremium/env \
  --secret-string '{"DATABASE_URL": "nuevo-endpoint"}'
```

---

## 🛡️ Seguridad y Compliance

### 1. Enable AWS Config

```bash
aws configservice put-configuration-recorder \
  --configuration-recorder name=default,roleARN=arn:aws:iam::xxxx:role/aws-config-role \
  --recording-group allSupported=true,includeGlobalResourceTypes=true
```

### 2. Enable GuardDuty

```bash
aws guardduty create-detector --enable
```

### 3. Enable AWS WAF (para ALB)

```bash
# Crear Web ACL
aws wafv2 create-web-acl \
  --name carnespremium-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=carnespremiumWAF

# Asociar con ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:us-east-1:xxxx:regional/webacl/carnespremium-waf/xxx \
  --resource-arn arn:aws:elasticloadbalancing:us-east-1:xxxx:loadbalancer/app/carnespremium-alb/xxx
```

---

## 💰 Optimización de Costos

### 1. Reserved Instances

```bash
# Comprar RDS Reserved Instance (1 año, ahorro ~40%)
aws rds purchase-reserved-db-instances-offering \
  --reserved-db-instances-offering-id offering-id \
  --reserved-db-instance-id carnespremium-db-ri

# Comprar EC2 Reserved Instance
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id offering-id \
  --instance-count 2
```

### 2. Savings Plans

Activar desde AWS Console > Savings Plans

### 3. S3 Intelligent-Tiering

```bash
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket carnespremium-uploads \
  --id EntireBucket \
  --intelligent-tiering-configuration file://s3-tiering.json
```

### 4. Scheduled Scaling

```bash
# Escalar hacia abajo en horas de bajo tráfico
aws autoscaling put-scheduled-update-group-action \
  --auto-scaling-group-name carnespremium-asg \
  --scheduled-action-name scale-down-night \
  --recurrence "0 22 * * *" \
  --min-size 1 \
  --max-size 2 \
  --desired-capacity 1

# Escalar hacia arriba en horas pico
aws autoscaling put-scheduled-update-group-action \
  --auto-scaling-group-name carnespremium-asg \
  --scheduled-action-name scale-up-morning \
  --recurrence "0 8 * * *" \
  --min-size 2 \
  --max-size 6 \
  --desired-capacity 2
```

---

## ✅ Checklist de Deployment AWS

### Networking
- [ ] VPC creada con CIDR 10.0.0.0/16
- [ ] 2 subnets públicas (Multi-AZ)
- [ ] 2 subnets privadas (Multi-AZ)
- [ ] Internet Gateway configurado
- [ ] Route tables configuradas
- [ ] Security Groups creados (ALB, EC2, RDS, Redis)

### Database
- [ ] RDS PostgreSQL creado
- [ ] Multi-AZ habilitado
- [ ] Backups automáticos configurados (7 días)
- [ ] Encryption at rest habilitado
- [ ] Database y usuario creados

### Cache
- [ ] ElastiCache Redis creado
- [ ] Multi-AZ habilitado
- [ ] Encryption habilitado
- [ ] Auth token configurado

### Compute
- [ ] IAM Role para EC2 creado
- [ ] Launch Template creado
- [ ] User Data script configurado
- [ ] Key Pair creado
- [ ] Auto Scaling Group configurado (min 2, max 6)
- [ ] Scaling policies configuradas

### Load Balancing
- [ ] Application Load Balancer creado
- [ ] Target Group creado
- [ ] Health checks configurados
- [ ] Listeners configurados (HTTP → HTTPS redirect)

### Storage
- [ ] S3 bucket creado
- [ ] Versioning habilitado
- [ ] Encryption habilitado
- [ ] Lifecycle policies configuradas
- [ ] CORS configurado

### CDN
- [ ] CloudFront distribution creada
- [ ] Origin configurado (S3)
- [ ] Cache behaviors configurados

### DNS & SSL
- [ ] Route 53 Hosted Zone creada
- [ ] A record para API creado
- [ ] ACM Certificate solicitado
- [ ] Certificate validado
- [ ] Certificate asociado a ALB

### Secrets
- [ ] Secrets Manager configurado
- [ ] Variables de entorno guardadas
- [ ] Permisos de EC2 configurados

### Monitoring
- [ ] CloudWatch Dashboard creado
- [ ] Alarmas configuradas (CPU, 5xx, etc)
- [ ] Logs centralizados

### CI/CD
- [ ] CodeCommit repository creado
- [ ] CodeBuild project configurado
- [ ] CodeDeploy application creada
- [ ] CodePipeline configurado

### Security
- [ ] AWS Config habilitado
- [ ] GuardDuty habilitado
- [ ] WAF configurado (opcional)
- [ ] Security Groups restrictivos

### Backup
- [ ] RDS automated backups habilitados
- [ ] Manual snapshot schedule creado
- [ ] S3 versioning habilitado
- [ ] Disaster recovery plan documentado

---

## 🎉 ¡Deployment Completo!

Tu API está ahora corriendo en AWS con arquitectura de producción:

✅ **Alta Disponibilidad**: Multi-AZ en todos los servicios críticos  
✅ **Escalabilidad**: Auto Scaling basado en métricas  
✅ **Seguridad**: Encryption, WAF, Security Groups  
✅ **Performance**: Redis cache, CloudFront CDN  
✅ **Monitoreo**: CloudWatch con alarmas  
✅ **Backup**: Snapshots automáticos y versionado  
✅ **CI/CD**: Pipeline automatizado  

**Para verificar:**

```bash
# Health check
curl https://api.carnespremium.com/api/health

# Test endpoint
curl https://api.carnespremium.com/api/products

# Ver métricas
aws cloudwatch get-dashboard \
  --dashboard-name carnespremium-dashboard
```

---

**Fecha:** 2025-11-21  
**Versión:** 1.0.0  
**Autor:** MiniMax Agent  
**Costo Mensual Estimado:** $72 - $985 (según escenario)
