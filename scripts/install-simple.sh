#!/bin/bash

echo "🥩 Instalación simplificada de Carnes Premium"
echo "=============================================="

# Variables
BACKEND_DIR="/workspace/backend"
FRONTEND_DIR="/workspace/frontend"

# Función para mostrar errores
show_error() {
    echo "❌ ERROR: $1"
    exit 1
}

# Función para mostrar éxito
show_success() {
    echo "✅ SUCCESS: $1"
}

echo ""
echo "[1/4] Instalando dependencias del backend..."
cd "$BACKEND_DIR" || show_error "No se puede acceder al directorio backend"

# Limpiar cache npm
npm cache clean --force

# Instalar dependencias
npm install --no-package-lock --no-save-dev || show_error "Fallo al instalar dependencias del backend"
show_success "Dependencias del backend instaladas"

echo ""
echo "[2/4] Configurando base de datos SQLite..."
# Copiar archivo de configuración de desarrollo
cp .env.dev .env || show_error "No se pudo copiar la configuración"
show_success "Configuración copiada"

# Generar cliente Prisma con schema simplificado
cp prisma/schema.dev.prisma prisma/schema.prisma || show_error "No se pudo copiar el schema"
npx prisma generate || show_error "Fallo al generar cliente Prisma"
show_success "Cliente Prisma generado"

# Crear y migrar base de datos
npx prisma db push || show_error "Fallo al crear la base de datos"
show_success "Base de datos SQLite creada"

echo ""
echo "[3/4] Instalando dependencias del frontend..."
cd "$FRONTEND_DIR" || show_error "No se puede acceder al directorio frontend"
npm install --no-package-lock || show_error "Fallo al instalar dependencias del frontend"
show_success "Dependencias del frontend instaladas"

echo ""
echo "[4/4] Inicializando datos de prueba..."
cd "$BACKEND_DIR"
node src/database/seed.js || show_error "Fallo al cargar datos de prueba"
show_success "Datos de prueba cargados"

echo ""
echo "🎉 ¡INSTALACIÓN COMPLETADA!"
echo "=============================="
echo "Para iniciar el sistema:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "URLs del sistema:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo ""
echo "Usuarios de prueba:"
echo "  Admin:    admin@carnes.com / admin123"
echo "  Cliente:  cliente@test.com / cliente123"
echo "  Driver:   driver@carnes.com / driver123"