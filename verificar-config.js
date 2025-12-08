#!/usr/bin/env node

/**
 * Script de Verificación de Configuración
 * Carnes Premium - E-commerce Platform
 * 
 * Este script verifica que todas las configuraciones necesarias estén presentes
 */

const fs = require('fs');
const path = require('path');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper para imprimir con colores
const print = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`),
};

// Cargar archivo .env
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/^["'](.*)["']$/, '$1');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      }
    });
    
    return envVars;
  } catch (error) {
    return null;
  }
}

// Verificar que una variable no esté vacía
function isConfigured(value) {
  return value && value !== '' && value !== '""' && value !== "''";
}

// Verificar Backend
function checkBackend() {
  print.header('VERIFICACIÓN DEL BACKEND');
  
  const backendPath = path.join(__dirname, 'backend');
  const envPath = path.join(backendPath, '.env');
  
  // Verificar que el directorio existe
  if (!fs.existsSync(backendPath)) {
    print.error('Directorio backend/ no encontrado');
    return { total: 0, configured: 0, missing: [] };
  }
  
  print.success('Directorio backend/ encontrado');
  
  // Verificar archivo .env
  if (!fs.existsSync(envPath)) {
    print.error('Archivo backend/.env no encontrado');
    return { total: 0, configured: 0, missing: [] };
  }
  
  print.success('Archivo backend/.env encontrado');
  
  // Cargar variables
  const env = loadEnvFile(envPath);
  
  if (!env) {
    print.error('No se pudo leer el archivo .env');
    return { total: 0, configured: 0, missing: [] };
  }
  
  // Variables requeridas
  const requiredVars = {
    critical: [
      { key: 'DATABASE_URL', name: 'URL de Base de Datos' },
      { key: 'JWT_SECRET', name: 'Secret JWT' },
      { key: 'PORT', name: 'Puerto del Servidor' },
    ],
    stripe: [
      { key: 'STRIPE_SECRET_KEY', name: 'Stripe Secret Key' },
      { key: 'STRIPE_WEBHOOK_SECRET', name: 'Stripe Webhook Secret' },
    ],
    firebase: [
      { key: 'FIREBASE_API_KEY', name: 'Firebase API Key' },
      { key: 'FIREBASE_PROJECT_ID', name: 'Firebase Project ID' },
      { key: 'FIREBASE_MESSAGING_SENDER_ID', name: 'Firebase Messaging Sender ID' },
      { key: 'FIREBASE_APP_ID', name: 'Firebase App ID' },
      { key: 'FIREBASE_VAPID_KEY', name: 'Firebase VAPID Key' },
      { key: 'FIREBASE_SERVICE_ACCOUNT', name: 'Firebase Service Account' },
    ],
    email: [
      { key: 'EMAIL_USER', name: 'Email User' },
      { key: 'EMAIL_PASS', name: 'Email Password' },
    ],
    optional: [
      { key: 'MERCADOPAGO_ACCESS_TOKEN', name: 'MercadoPago Access Token' },
      { key: 'REDIS_URL', name: 'Redis URL' },
    ],
  };
  
  let stats = {
    critical: { total: 0, configured: 0, missing: [] },
    stripe: { total: 0, configured: 0, missing: [] },
    firebase: { total: 0, configured: 0, missing: [] },
    email: { total: 0, configured: 0, missing: [] },
    optional: { total: 0, configured: 0, missing: [] },
  };
  
  // Verificar cada categoría
  Object.keys(requiredVars).forEach(category => {
    print.info(`\n${category.toUpperCase()}:`);
    
    requiredVars[category].forEach(variable => {
      stats[category].total++;
      
      if (isConfigured(env[variable.key])) {
        stats[category].configured++;
        print.success(`${variable.name} (${variable.key})`);
      } else {
        stats[category].missing.push(variable);
        print.error(`${variable.name} (${variable.key}) - NO CONFIGURADO`);
      }
    });
  });
  
  return stats;
}

// Verificar Frontend
function checkFrontend() {
  print.header('VERIFICACIÓN DEL FRONTEND');
  
  const frontendPath = path.join(__dirname, 'frontend-simple');
  const envPath = path.join(frontendPath, '.env.local');
  
  // Verificar que el directorio existe
  if (!fs.existsSync(frontendPath)) {
    print.error('Directorio frontend-simple/ no encontrado');
    return { total: 0, configured: 0, missing: [] };
  }
  
  print.success('Directorio frontend-simple/ encontrado');
  
  // Verificar archivo .env.local
  if (!fs.existsSync(envPath)) {
    print.error('Archivo frontend-simple/.env.local NO ENCONTRADO');
    print.warning('Debes crear este archivo con las variables necesarias');
    return { 
      total: 4, 
      configured: 0, 
      missing: [
        { key: 'NEXT_PUBLIC_API_URL', name: 'API URL' },
        { key: 'NEXT_PUBLIC_SOCKET_URL', name: 'Socket URL' },
        { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', name: 'Stripe Publishable Key' },
        { key: 'NEXT_PUBLIC_MAPBOX_TOKEN', name: 'Mapbox Token' },
      ]
    };
  }
  
  print.success('Archivo frontend-simple/.env.local encontrado');
  
  // Cargar variables
  const env = loadEnvFile(envPath);
  
  if (!env) {
    print.error('No se pudo leer el archivo .env.local');
    return { total: 0, configured: 0, missing: [] };
  }
  
  // Variables requeridas
  const requiredVars = [
    { key: 'NEXT_PUBLIC_API_URL', name: 'API URL' },
    { key: 'NEXT_PUBLIC_SOCKET_URL', name: 'Socket URL' },
    { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', name: 'Stripe Publishable Key' },
    { key: 'NEXT_PUBLIC_MAPBOX_TOKEN', name: 'Mapbox Token' },
  ];
  
  let stats = { total: 0, configured: 0, missing: [] };
  
  requiredVars.forEach(variable => {
    stats.total++;
    
    if (isConfigured(env[variable.key])) {
      stats.configured++;
      print.success(`${variable.name} (${variable.key})`);
    } else {
      stats.missing.push(variable);
      print.error(`${variable.name} (${variable.key}) - NO CONFIGURADO`);
    }
  });
  
  return stats;
}

// Verificar estructura de archivos
function checkFileStructure() {
  print.header('VERIFICACIÓN DE ESTRUCTURA DE ARCHIVOS');
  
  const criticalFiles = [
    { path: 'backend/src/server.js', name: 'Servidor Backend' },
    { path: 'backend/prisma/schema.prisma', name: 'Schema de Prisma' },
    { path: 'backend/package.json', name: 'Package.json Backend' },
    { path: 'frontend-simple/package.json', name: 'Package.json Frontend' },
    { path: 'frontend-simple/next.config.js', name: 'Configuración Next.js' },
  ];
  
  let allPresent = true;
  
  criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file.path);
    if (fs.existsSync(filePath)) {
      print.success(file.name);
    } else {
      print.error(`${file.name} - NO ENCONTRADO`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// Verificar base de datos
function checkDatabase() {
  print.header('VERIFICACIÓN DE BASE DE DATOS');
  
  const dbPath = path.join(__dirname, 'backend/prisma/dev.db');
  
  if (!fs.existsSync(dbPath)) {
    print.error('Base de datos (dev.db) NO ENCONTRADA');
    print.warning('Ejecuta: cd backend && npx prisma db push');
    return false;
  }
  
  const stats = fs.statSync(dbPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  
  print.success(`Base de datos encontrada (${sizeKB} KB)`);
  
  if (stats.size < 1000) {
    print.warning('La base de datos parece estar vacía');
  }
  
  return true;
}

// Reporte final
function generateReport(backendStats, frontendStats, filesOk, dbOk) {
  print.header('REPORTE FINAL');
  
  console.log(`\n${colors.bright}Backend:${colors.reset}`);
  console.log(`  Críticas:  ${backendStats.critical.configured}/${backendStats.critical.total} configuradas`);
  console.log(`  Stripe:    ${backendStats.stripe.configured}/${backendStats.stripe.total} configuradas`);
  console.log(`  Firebase:  ${backendStats.firebase.configured}/${backendStats.firebase.total} configuradas`);
  console.log(`  Email:     ${backendStats.email.configured}/${backendStats.email.total} configuradas`);
  console.log(`  Opcionales: ${backendStats.optional.configured}/${backendStats.optional.total} configuradas`);
  
  console.log(`\n${colors.bright}Frontend:${colors.reset}`);
  console.log(`  Variables: ${frontendStats.configured}/${frontendStats.total} configuradas`);
  
  console.log(`\n${colors.bright}Otros:${colors.reset}`);
  console.log(`  Archivos críticos: ${filesOk ? 'OK' : 'FALTAN ARCHIVOS'}`);
  console.log(`  Base de datos: ${dbOk ? 'OK' : 'NO ENCONTRADA'}`);
  
  // Calcular porcentaje total
  const totalRequired = 
    backendStats.critical.total + 
    backendStats.stripe.total + 
    backendStats.firebase.total + 
    backendStats.email.total + 
    frontendStats.total;
  
  const totalConfigured = 
    backendStats.critical.configured + 
    backendStats.stripe.configured + 
    backendStats.firebase.configured + 
    backendStats.email.configured + 
    frontendStats.configured;
  
  const percentage = ((totalConfigured / totalRequired) * 100).toFixed(1);
  
  console.log(`\n${colors.bright}Progreso Total:${colors.reset} ${totalConfigured}/${totalRequired} (${percentage}%)`);
  
  // Barra de progreso
  const barLength = 40;
  const filled = Math.round((totalConfigured / totalRequired) * barLength);
  const empty = barLength - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  let barColor = colors.red;
  if (percentage >= 80) barColor = colors.green;
  else if (percentage >= 50) barColor = colors.yellow;
  
  console.log(`${barColor}[${bar}]${colors.reset}`);
  
  // Estado general
  console.log('');
  if (percentage === 100 && filesOk && dbOk) {
    print.success('¡TODO CONFIGURADO! El proyecto está listo para funcionar.');
  } else if (percentage >= 80) {
    print.warning('Casi listo. Revisa las variables faltantes arriba.');
  } else if (percentage >= 50) {
    print.warning('Configuración incompleta. Faltan variables importantes.');
  } else {
    print.error('Muchas configuraciones pendientes. Revisa el checklist.');
  }
  
  // Variables faltantes críticas
  const missingCritical = [
    ...backendStats.critical.missing,
    ...backendStats.stripe.missing,
    ...backendStats.firebase.missing,
    ...backendStats.email.missing,
    ...frontendStats.missing,
  ];
  
  if (missingCritical.length > 0) {
    console.log(`\n${colors.bright}${colors.red}VARIABLES CRÍTICAS FALTANTES:${colors.reset}`);
    missingCritical.forEach(v => {
      console.log(`  • ${v.name} (${v.key})`);
    });
    console.log(`\nRevisa el archivo: ${colors.cyan}CONFIGURACION_INICIAL_CHECKLIST.md${colors.reset}`);
  }
  
  console.log('');
}

// Función principal
function main() {
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔍 VERIFICADOR DE CONFIGURACIÓN - CARNES PREMIUM       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
  `);
  
  const backendStats = checkBackend();
  const frontendStats = checkFrontend();
  const filesOk = checkFileStructure();
  const dbOk = checkDatabase();
  
  generateReport(backendStats, frontendStats, filesOk, dbOk);
  
  console.log(`\n${colors.bright}Para más información:${colors.reset}`);
  console.log(`  • Auditoría completa: ${colors.cyan}AUDITORIA_GENERAL_PROYECTO.md${colors.reset}`);
  console.log(`  • Guía de configuración: ${colors.cyan}CONFIGURACION_INICIAL_CHECKLIST.md${colors.reset}`);
  console.log('');
}

// Ejecutar
main();
