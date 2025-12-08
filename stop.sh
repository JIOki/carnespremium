#!/bin/bash

echo "🛑 Deteniendo Carnes Premium..."
echo ""

# Leer PIDs guardados
if [ -f /tmp/carnes-premium-backend.pid ]; then
    BACKEND_PID=$(cat /tmp/carnes-premium-backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "✅ Backend detenido (PID: $BACKEND_PID)"
    fi
    rm /tmp/carnes-premium-backend.pid
fi

if [ -f /tmp/carnes-premium-frontend.pid ]; then
    FRONTEND_PID=$(cat /tmp/carnes-premium-frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "✅ Frontend detenido (PID: $FRONTEND_PID)"
    fi
    rm /tmp/carnes-premium-frontend.pid
fi

# Matar cualquier proceso de Node que pueda estar corriendo
pkill -f "next dev" 2>/dev/null
pkill -f "node.*backend" 2>/dev/null

echo ""
echo "✅ Todos los servicios detenidos"
