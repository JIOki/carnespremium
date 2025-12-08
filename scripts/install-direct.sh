#!/bin/bash

echo "🥩 Instalación DIRECTA de Carnes Premium"
echo "========================================"

# Cambiar al backend e instalar dependencias directamente
echo "[1/4] Instalando backend..."
cd /workspace/backend

# Limpiar cualquier configuración de workspace
rm -f package-lock.json node_modules 2>/dev/null || true

# Instalar dependencias directamente
npm install express cors helmet morgan dotenv @prisma/client bcryptjs jsonwebtoken joi multer nodemailer stripe axios redis socket.io compression express-rate-limit express-slow-down --save

# Dev dependencies
npm install nodemon jest supertest eslint prisma --save-dev

echo "✅ Backend dependencies installed"

echo "[2/4] Configurando base de datos..."
# Configurar la base de datos
cp .env.dev .env
cp prisma/schema.dev.prisma prisma/schema.prisma

# Generar Prisma client
npx prisma generate
echo "✅ Prisma client generated"

# Crear la base de datos
npx prisma db push
echo "✅ Database created"

echo "[3/4] Instalando frontend..."
cd /workspace/frontend
rm -f package-lock.json node_modules 2>/dev/null || true

# Instalar dependencias del frontend directamente
npm install next react react-dom typescript tailwindcss axios --save

# Dev dependencies
npm install @types/node @types/react @types/react-dom postcss autoprefixer eslint eslint-config-next --save-dev

echo "✅ Frontend dependencies installed"

echo "[4/4] Seedeando datos de prueba..."
cd /workspace/backend
node src/database/seed.js
echo "✅ Test data seeded"

echo ""
echo "🎉 INSTALACIÓN COMPLETADA!"
echo "========================="
echo "Para iniciar:"
echo "  Backend:  cd backend && npx nodemon src/server.js"
echo "  Frontend: cd frontend && npx next dev"