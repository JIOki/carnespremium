#!/bin/bash

echo "======================================"
echo "PRUEBAS DEL SISTEMA DE GAMIFICACIÓN"
echo "======================================"
echo ""

# Obtener token de autenticación
echo "🔑 Obteniendo token de autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@carnes.com", "password": "admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Error al obtener token"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "✅ Token obtenido exitosamente"
echo ""

# Archivo de salida
OUTPUT_FILE="/workspace/gamification_test_results.json"
echo "{" > $OUTPUT_FILE
echo "  \"timestamp\": \"$(date -Iseconds)\"," >> $OUTPUT_FILE
echo "  \"tests\": {" >> $OUTPUT_FILE

# Test 1: Estadísticas de lealtad
echo "📊 1. Probando: Estadísticas de Lealtad (/api/gamification/loyalty)"
RESPONSE=$(curl -s http://localhost:3002/api/gamification/loyalty \
  -H "Authorization: Bearer $TOKEN")
echo "    \"loyalty_stats\": $RESPONSE," >> $OUTPUT_FILE
echo "$RESPONSE" | jq '.success, .data.currentPoints, .data.tier' > /dev/null
if [ $? -eq 0 ]; then
  echo "   ✅ Exitoso - Puntos: $(echo $RESPONSE | jq -r '.data.currentPoints // 0'), Tier: $(echo $RESPONSE | jq -r '.data.tier // "N/A"')"
else
  echo "   ❌ Error"
fi
echo ""

# Test 2: Transacciones de puntos
echo "💰 2. Probando: Historial de Transacciones (/api/gamification/loyalty/transactions)"
RESPONSE=$(curl -s "http://localhost:3002/api/gamification/loyalty/transactions?limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "    \"transactions\": $RESPONSE," >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data.items | length // 0')
echo "   ✅ Exitoso - $COUNT transacciones encontradas"
echo ""

# Test 3: Badges/Insignias del usuario
echo "🏆 3. Probando: Insignias del Usuario (/api/gamification/badges/my-badges)"
RESPONSE=$(curl -s http://localhost:3002/api/gamification/badges/my-badges \
  -H "Authorization: Bearer $TOKEN")
echo "    \"user_badges\": $RESPONSE," >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data | length // 0')
echo "   ✅ Exitoso - $COUNT insignias obtenidas"
echo ""

# Test 4: Todas las insignias disponibles
echo "🎖️  4. Probando: Todas las Insignias Disponibles (/api/gamification/badges)"
RESPONSE=$(curl -s http://localhost:3002/api/gamification/badges \
  -H "Authorization: Bearer $TOKEN")
echo "    \"available_badges\": $RESPONSE," >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data | length // 0')
echo "   ✅ Exitoso - $COUNT insignias disponibles en el sistema"
echo ""

# Test 5: Desafíos activos
echo "🎯 5. Probando: Desafíos Activos (/api/gamification/challenges)"
RESPONSE=$(curl -s "http://localhost:3002/api/gamification/challenges?status=active" \
  -H "Authorization: Bearer $TOKEN")
echo "    \"challenges\": $RESPONSE," >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data.items | length // 0')
echo "   ✅ Exitoso - $COUNT desafíos activos"
echo ""

# Test 6: Progreso de desafíos del usuario
echo "📈 6. Probando: Progreso en Desafíos (/api/gamification/challenges/my-progress)"
RESPONSE=$(curl -s http://localhost:3002/api/gamification/challenges/my-progress \
  -H "Authorization: Bearer $TOKEN")
echo "    \"user_challenges\": $RESPONSE," >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data | length // 0')
echo "   ✅ Exitoso - $COUNT desafíos en progreso"
echo ""

# Test 7: Recompensas disponibles
echo "🎁 7. Probando: Recompensas Disponibles (/api/gamification/rewards)"
RESPONSE=$(curl -s http://localhost:3002/api/gamification/rewards \
  -H "Authorization: Bearer $TOKEN")
echo "    \"rewards\": $RESPONSE," >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data | length // 0')
echo "   ✅ Exitoso - $COUNT recompensas disponibles"
echo ""

# Test 8: Historial de recompensas canjeadas
echo "🎁 8. Probando: Recompensas Canjeadas (/api/gamification/rewards/my-rewards)"
RESPONSE=$(curl -s http://localhost:3002/api/gamification/rewards/my-rewards \
  -H "Authorization: Bearer $TOKEN")
echo "    \"redeemed_rewards\": $RESPONSE," >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data | length // 0')
echo "   ✅ Exitoso - $COUNT recompensas canjeadas"
echo ""

# Test 9: Leaderboard general
echo "🏅 9. Probando: Tabla de Clasificación (/api/gamification/leaderboard)"
RESPONSE=$(curl -s "http://localhost:3002/api/gamification/leaderboard?limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "    \"leaderboard\": $RESPONSE," >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data.leaderboard | length // 0')
RANK=$(echo $RESPONSE | jq -r '.data.userRank // "N/A"')
echo "   ✅ Exitoso - Top $COUNT usuarios, Tu posición: #$RANK"
echo ""

# Test 10: Programa de referidos
echo "👥 10. Probando: Programa de Referidos (/api/gamification/referrals)"
RESPONSE=$(curl -s http://localhost:3002/api/gamification/referrals \
  -H "Authorization: Bearer $TOKEN")
echo "    \"referrals\": $RESPONSE" >> $OUTPUT_FILE
COUNT=$(echo $RESPONSE | jq -r '.data.referrals | length // 0')
CODE=$(echo $RESPONSE | jq -r '.data.referralCode // "N/A"')
echo "   ✅ Exitoso - Código de referido: $CODE, Referidos: $COUNT"
echo ""

# Cerrar JSON
echo "  }" >> $OUTPUT_FILE
echo "}" >> $OUTPUT_FILE

echo "======================================"
echo "✅ TODAS LAS PRUEBAS COMPLETADAS"
echo "======================================"
echo ""
echo "📄 Resultados detallados guardados en: gamification_test_results.json"
echo ""
