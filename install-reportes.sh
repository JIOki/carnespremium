#!/bin/bash

# Script de instalación para Sistema de Reportes y Analytics
# Carnes Premium - Punto 9

echo "=========================================="
echo "  Sistema de Reportes y Analytics"
echo "  Instalación de Dependencias"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar si estamos en el directorio correcto
if [ ! -d "backend" ] || [ ! -d "frontend-simple" ]; then
    print_error "Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

print_info "Instalando dependencias del Backend..."
echo ""

cd backend

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    print_info "Instalando todas las dependencias del backend..."
    npm install
else
    print_info "Actualizando dependencias del backend..."
fi

# Instalar dependencias específicas de reportes
print_info "Instalando pdfkit para generación de PDFs..."
npm install pdfkit

print_info "Instalando exceljs para generación de Excel..."
npm install exceljs

# Crear directorio de reportes si no existe
print_info "Creando directorio para reportes..."
mkdir -p uploads/reports

print_success "Backend configurado correctamente"
echo ""

# Volver al directorio raíz
cd ..

print_info "Instalando dependencias del Frontend..."
echo ""

cd frontend-simple

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    print_info "Instalando todas las dependencias del frontend..."
    npm install
else
    print_info "Actualizando dependencias del frontend..."
fi

# Instalar dependencias específicas de gráficos
print_info "Instalando Chart.js para gráficos..."
npm install chart.js

print_info "Instalando react-chartjs-2 para componentes React..."
npm install react-chartjs-2

print_info "Instalando date-fns para manejo de fechas..."
npm install date-fns

print_success "Frontend configurado correctamente"
echo ""

# Volver al directorio raíz
cd ..

echo "=========================================="
print_success "¡Instalación completada!"
echo "=========================================="
echo ""

print_info "Próximos pasos:"
echo ""
echo "1. Iniciar el backend:"
echo "   cd backend && npm run dev"
echo ""
echo "2. Iniciar el frontend (en otra terminal):"
echo "   cd frontend-simple && npm run dev"
echo ""
echo "3. Acceder al sistema:"
echo "   http://localhost:3000/admin/reports"
echo ""
echo "4. Endpoints API disponibles:"
echo "   http://localhost:3002/api/reports/dashboard"
echo "   http://localhost:3002/api/reports/sales"
echo "   http://localhost:3002/api/reports/customers"
echo "   http://localhost:3002/api/reports/inventory"
echo ""

print_success "¡Todo listo para usar el Sistema de Reportes y Analytics! 🎉"
echo ""
