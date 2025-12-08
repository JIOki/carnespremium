#!/bin/bash

echo "================================================"
echo "🚀 Carnes Premium - Iniciando Aplicación"
echo "================================================"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detectado: $(node --version)"
echo ""

# Backend
echo "📦 Iniciando Backend (Puerto 3002)..."
cd backend || { echo "❌ Error: Directorio backend no encontrado"; exit 1; }

if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del backend..."
    npm install
fi

# Verificar si el archivo .env existe, si no, crear uno
if [ ! -f ".env.dev" ]; then
    echo "PORT=3002" > .env.dev
    echo "DB_PATH=./dev.db" >> .env.dev
    echo "NODE_ENV=development" >> .env.dev
fi

# Iniciar backend en background
NODE_ENV=development npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend iniciado (PID: $BACKEND_PID)"
echo ""

# Esperar un momento para que el backend inicie
sleep 3

# Frontend
echo "🎨 Iniciando Frontend (Puerto 3000)..."
cd ../frontend-simple || { echo "❌ Error: Directorio frontend-simple no encontrado"; exit 1; }

if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias del frontend..."
    npm install
fi

# Limpiar cache de Next.js
rm -rf .next

# Iniciar frontend en background
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend iniciado (PID: $FRONTEND_PID)"
echo ""

echo "================================================"
echo "✨ Aplicación Lista"
echo "================================================"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:3002"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 Para detener:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "================================================"
echo ""

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar backend
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Backend respondiendo correctamente"
else
    echo "⚠️  Backend no responde - verifica los logs"
fi

# Verificar frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend respondiendo correctamente"
else
    echo "⚠️  Frontend no responde - verifica los logs"
fi

echo ""
echo "🎉 ¡Todo listo! Abre http://localhost:3000 en tu navegador"
echo ""

# Guardar PIDs para poder detener después
echo "$BACKEND_PID" > /tmp/carnes-premium-backend.pid
echo "$FRONTEND_PID" > /tmp/carnes-premium-frontend.pid

# Mantener el script corriendo
echo "Presiona Ctrl+C para detener todos los servicios..."
wait
