#!/bin/bash

# 🥩 Carnes Premium - Script de Instalación Automatizada
# Este script configura automáticamente el entorno de desarrollo

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_message() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✅ SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠️  WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[❌ ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}"
    echo "🥩===================================================🥩"
    echo "    CARNES PREMIUM - INSTALACIÓN AUTOMATIZADA"
    echo "====================================================="
    echo -e "${NC}"
}

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Función para verificar versión de Node.js
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_VERSION="18.0.0"
        
        if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
            print_success "Node.js $NODE_VERSION está instalado"
            return 0
        else
            print_error "Node.js versión $NODE_VERSION es muy antigua. Se requiere >= $REQUIRED_VERSION"
            return 1
        fi
    else
        print_error "Node.js no está instalado"
        return 1
    fi
}

# Función para verificar Docker
check_docker() {
    if command_exists docker; then
        if docker --version >/dev/null 2>&1; then
            print_success "Docker está instalado y funcionando"
            return 0
        else
            print_error "Docker está instalado pero no está ejecutándose"
            return 1
        fi
    else
        print_error "Docker no está instalado"
        return 1
    fi
}

# Función para verificar Docker Compose
check_docker_compose() {
    if command_exists docker-compose; then
        print_success "Docker Compose está instalado"
        return 0
    elif docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose (plugin) está disponible"
        return 0
    else
        print_error "Docker Compose no está instalado"
        return 1
    fi
}

# Función para instalar dependencias
install_dependencies() {
    print_message "Instalando dependencias del proyecto..."
    
    # Dependencias raíz
    print_message "Instalando dependencias raíz..."
    npm install || {
        print_error "Error instalando dependencias raíz"
        exit 1
    }
    
    # Dependencias backend
    print_message "Instalando dependencias del backend..."
    cd backend
    npm install || {
        print_error "Error instalando dependencias del backend"
        exit 1
    }
    cd ..
    
    # Dependencias frontend
    print_message "Instalando dependencias del frontend..."
    cd frontend
    npm install || {
        print_error "Error instalando dependencias del frontend"
        exit 1
    }
    cd ..
    
    print_success "Todas las dependencias instaladas correctamente"
}

# Función para configurar variables de ambiente
setup_environment() {
    print_message "Configurando variables de ambiente..."
    
    # Backend .env
    if [ ! -f "backend/.env" ]; then
        print_message "Creando backend/.env desde plantilla..."
        cp backend/.env.example backend/.env
        print_success "backend/.env creado"
    else
        print_warning "backend/.env ya existe, no se sobrescribirá"
    fi
    
    # Frontend .env.local
    if [ ! -f "frontend/.env.local" ]; then
        print_message "Creando frontend/.env.local..."
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key_aqui
EOF
        print_success "frontend/.env.local creado"
    else
        print_warning "frontend/.env.local ya existe, no se sobrescribirá"
    fi
}

# Función para iniciar servicios Docker
start_docker_services() {
    print_message "Iniciando servicios de Docker..."
    
    # Verificar si docker-compose.dev.yml existe
    if [ ! -f "docker-compose.dev.yml" ]; then
        print_error "docker-compose.dev.yml no encontrado"
        exit 1
    fi
    
    # Detener servicios existentes si están corriendo
    docker-compose -f docker-compose.dev.yml down >/dev/null 2>&1 || true
    
    # Iniciar servicios
    docker-compose -f docker-compose.dev.yml up -d || {
        print_error "Error iniciando servicios Docker"
        exit 1
    }
    
    print_success "Servicios Docker iniciados"
    
    # Esperar que los servicios estén listos
    print_message "Esperando que PostgreSQL esté listo..."
    sleep 10
    
    # Verificar que PostgreSQL esté corriendo
    until docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U admin -d carnes_premium >/dev/null 2>&1; do
        print_message "Esperando PostgreSQL..."
        sleep 2
    done
    
    print_success "PostgreSQL está listo"
}

# Función para configurar base de datos
setup_database() {
    print_message "Configurando base de datos..."
    
    cd backend
    
    # Generar cliente Prisma
    print_message "Generando cliente Prisma..."
    npx prisma generate || {
        print_error "Error generando cliente Prisma"
        exit 1
    }
    
    # Ejecutar migraciones
    print_message "Ejecutando migraciones..."
    npx prisma migrate dev --name "init" || {
        print_error "Error ejecutando migraciones"
        exit 1
    }
    
    # Poblar base de datos
    print_message "Poblando base de datos con datos de prueba..."
    npm run db:seed || {
        print_error "Error poblando base de datos"
        exit 1
    }
    
    cd ..
    
    print_success "Base de datos configurada correctamente"
}

# Función para verificar que todo funcione
verify_installation() {
    print_message "Verificando instalación..."
    
    # Verificar que los servicios estén corriendo
    if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_error "Los servicios Docker no están corriendo correctamente"
        return 1
    fi
    
    # Verificar conexión a PostgreSQL
    if ! docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U admin -d carnes_premium >/dev/null 2>&1; then
        print_error "No se puede conectar a PostgreSQL"
        return 1
    fi
    
    # Verificar conexión a Redis
    if ! docker-compose -f docker-compose.dev.yml exec redis redis-cli ping >/dev/null 2>&1; then
        print_error "No se puede conectar a Redis"
        return 1
    fi
    
    print_success "Verificación completada - Todo funciona correctamente"
}

# Función para mostrar información final
show_final_info() {
    echo ""
    echo -e "${GREEN}🎉===================================================🎉"
    echo "          INSTALACIÓN COMPLETADA EXITOSAMENTE"
    echo "====================================================="
    echo -e "${NC}"
    echo ""
    echo -e "${CYAN}📋 INFORMACIÓN DEL PROYECTO:${NC}"
    echo "   • Frontend: http://localhost:3000"
    echo "   • Backend API: http://localhost:3001/api"
    echo "   • Health Check: http://localhost:3001/health"
    echo "   • pgAdmin: http://localhost:5050"
    echo ""
    echo -e "${CYAN}🔑 USUARIOS DE PRUEBA:${NC}"
    echo "   👤 Admin: admin@carnespremiium.com / password123"
    echo "   👤 Cliente: cliente@test.com / password123"  
    echo "   👤 Repartidor: repartidor@test.com / password123"
    echo ""
    echo -e "${CYAN}🚀 COMANDOS ÚTILES:${NC}"
    echo "   • Iniciar desarrollo: npm run dev"
    echo "   • Ver logs Docker: docker-compose -f docker-compose.dev.yml logs -f"
    echo "   • Abrir Prisma Studio: cd backend && npx prisma studio"
    echo "   • Reiniciar servicios: docker-compose -f docker-compose.dev.yml restart"
    echo ""
    echo -e "${YELLOW}⚠️  RECORDATORIOS:${NC}"
    echo "   • Configura tu Google Maps API Key en backend/.env"
    echo "   • Configura tus claves de Stripe en backend/.env"
    echo "   • Revisa los archivos .env para personalizaciones"
    echo ""
    echo -e "${GREEN}¡Todo listo para desarrollar! 🚀${NC}"
}

# Función principal
main() {
    print_header
    
    # Verificar prerrequisitos
    print_message "Verificando prerrequisitos..."
    
    if ! check_node_version; then
        print_error "Por favor instala Node.js 18+ desde https://nodejs.org"
        exit 1
    fi
    
    if ! check_docker; then
        print_error "Por favor instala Docker desde https://docker.com"
        exit 1
    fi
    
    if ! check_docker_compose; then
        print_error "Por favor instala Docker Compose"
        exit 1
    fi
    
    print_success "Prerrequisitos verificados"
    
    # Preguntar al usuario si quiere continuar
    echo ""
    read -p "¿Quieres continuar con la instalación? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_message "Instalación cancelada por el usuario"
        exit 0
    fi
    
    # Ejecutar pasos de instalación
    install_dependencies
    setup_environment
    start_docker_services
    setup_database
    verify_installation
    show_final_info
    
    # Preguntar si quiere iniciar el servidor de desarrollo
    echo ""
    read -p "¿Quieres iniciar el servidor de desarrollo ahora? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "Iniciando servidores de desarrollo..."
        npm run dev
    else
        print_message "Para iniciar el desarrollo ejecuta: npm run dev"
    fi
}

# Manejar interrupciones
trap 'print_error "Instalación interrumpida"; exit 1' INT

# Verificar que estemos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Este script debe ejecutarse desde la raíz del proyecto Carnes Premium"
    exit 1
fi

# Ejecutar función principal
main "$@"