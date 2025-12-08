#!/usr/bin/env python3
"""
Script de prueba para el Sistema de Gamificación
Prueba todos los endpoints principales de gamificación
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:3002"
API_URL = f"{BASE_URL}/api"

def print_separator():
    print("=" * 70)

def print_test_header(number, name):
    print(f"\n{number}. {name}")
    print("-" * 70)

def main():
    print_separator()
    print("PRUEBAS DEL SISTEMA DE GAMIFICACIÓN")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_separator()
    
    # 1. Autenticación
    print_test_header("🔑", "AUTENTICACIÓN")
    login_response = requests.post(
        f"{API_URL}/auth/login",
        json={"email": "admin@carnes.com", "password": "admin123"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Error al autenticar: {login_response.status_code}")
        print(login_response.text)
        return
    
    login_data = login_response.json()
    token = login_data['data']['token']
    user = login_data['data']['user']
    
    print(f"✅ Autenticación exitosa")
    print(f"   Usuario: {user['name']} ({user['email']})")
    print(f"   Role: {user['role']}")
    print(f"   Token: {token[:50]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    results = {"timestamp": datetime.now().isoformat(), "tests": {}}
    
    # 2. Estadísticas de Lealtad
    print_test_header("📊", "ESTADÍSTICAS DE LEALTAD")
    try:
        response = requests.get(f"{API_URL}/gamification/loyalty", headers=headers)
        data = response.json()
        results['tests']['loyalty_stats'] = data
        
        if response.status_code == 200 and data.get('success'):
            stats = data['data']
            print(f"✅ Exitoso (200 OK)")
            print(f"   Puntos Actuales: {stats.get('currentPoints', 0)}")
            print(f"   Total Ganado: {stats.get('totalEarned', 0)}")
            print(f"   Tier: {stats.get('tier', 'N/A')}")
            print(f"   Total Badges: {stats.get('totalBadges', 0)}")
            print(f"   Racha Actual: {stats.get('currentStreak', 0)} días")
        else:
            print(f"⚠️  Status: {response.status_code}")
            print(f"   {data}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['loyalty_stats'] = {"error": str(e)}
    
    # 3. Transacciones de Puntos
    print_test_header("💰", "HISTORIAL DE TRANSACCIONES")
    try:
        response = requests.get(
            f"{API_URL}/gamification/loyalty/transactions?limit=10",
            headers=headers
        )
        data = response.json()
        results['tests']['transactions'] = data
        
        if response.status_code == 200 and data.get('success'):
            items = data['data'].get('items', [])
            print(f"✅ Exitoso (200 OK)")
            print(f"   Total de transacciones: {len(items)}")
            if items:
                print(f"   Última transacción: {items[0].get('type')} - {items[0].get('points')} puntos")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['transactions'] = {"error": str(e)}
    
    # 4. Insignias del Usuario
    print_test_header("🏆", "INSIGNIAS DEL USUARIO")
    try:
        response = requests.get(
            f"{API_URL}/gamification/badges/my-badges",
            headers=headers
        )
        data = response.json()
        results['tests']['user_badges'] = data
        
        if response.status_code == 200 and data.get('success'):
            badges = data.get('data', [])
            print(f"✅ Exitoso (200 OK)")
            print(f"   Insignias obtenidas: {len(badges)}")
            for badge in badges[:3]:
                print(f"   - {badge.get('badge', {}).get('name', 'N/A')}")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['user_badges'] = {"error": str(e)}
    
    # 5. Todas las Insignias Disponibles
    print_test_header("🎖️ ", "INSIGNIAS DISPONIBLES")
    try:
        response = requests.get(f"{API_URL}/gamification/badges", headers=headers)
        data = response.json()
        results['tests']['available_badges'] = data
        
        if response.status_code == 200 and data.get('success'):
            badges = data.get('data', [])
            print(f"✅ Exitoso (200 OK)")
            print(f"   Total de insignias en el sistema: {len(badges)}")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['available_badges'] = {"error": str(e)}
    
    # 6. Desafíos Activos
    print_test_header("🎯", "DESAFÍOS ACTIVOS")
    try:
        response = requests.get(
            f"{API_URL}/gamification/challenges?status=active",
            headers=headers
        )
        data = response.json()
        results['tests']['challenges'] = data
        
        if response.status_code == 200 and data.get('success'):
            items = data['data'].get('items', [])
            print(f"✅ Exitoso (200 OK)")
            print(f"   Desafíos activos: {len(items)}")
            for challenge in items[:3]:
                print(f"   - {challenge.get('title', 'N/A')}")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['challenges'] = {"error": str(e)}
    
    # 7. Progreso en Desafíos
    print_test_header("📈", "PROGRESO EN DESAFÍOS")
    try:
        response = requests.get(
            f"{API_URL}/gamification/challenges/my-progress",
            headers=headers
        )
        data = response.json()
        results['tests']['user_challenges'] = data
        
        if response.status_code == 200 and data.get('success'):
            challenges = data.get('data', [])
            print(f"✅ Exitoso (200 OK)")
            print(f"   Desafíos en progreso: {len(challenges)}")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['user_challenges'] = {"error": str(e)}
    
    # 8. Recompensas Disponibles
    print_test_header("🎁", "RECOMPENSAS DISPONIBLES")
    try:
        response = requests.get(f"{API_URL}/gamification/rewards", headers=headers)
        data = response.json()
        results['tests']['rewards'] = data
        
        if response.status_code == 200 and data.get('success'):
            rewards = data.get('data', [])
            print(f"✅ Exitoso (200 OK)")
            print(f"   Recompensas disponibles: {len(rewards)}")
            for reward in rewards[:3]:
                print(f"   - {reward.get('name', 'N/A')} ({reward.get('pointCost', 0)} puntos)")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['rewards'] = {"error": str(e)}
    
    # 9. Recompensas Canjeadas
    print_test_header("🎁", "RECOMPENSAS CANJEADAS")
    try:
        response = requests.get(
            f"{API_URL}/gamification/rewards/my-rewards",
            headers=headers
        )
        data = response.json()
        results['tests']['redeemed_rewards'] = data
        
        if response.status_code == 200 and data.get('success'):
            rewards = data.get('data', [])
            print(f"✅ Exitoso (200 OK)")
            print(f"   Recompensas canjeadas: {len(rewards)}")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['redeemed_rewards'] = {"error": str(e)}
    
    # 10. Tabla de Clasificación (Leaderboard)
    print_test_header("🏅", "TABLA DE CLASIFICACIÓN")
    try:
        response = requests.get(
            f"{API_URL}/gamification/leaderboard?limit=10",
            headers=headers
        )
        data = response.json()
        results['tests']['leaderboard'] = data
        
        if response.status_code == 200 and data.get('success'):
            leaderboard = data['data'].get('leaderboard', [])
            user_rank = data['data'].get('userRank', 'N/A')
            print(f"✅ Exitoso (200 OK)")
            print(f"   Top {len(leaderboard)} usuarios")
            print(f"   Tu posición: #{user_rank}")
            print("\n   Top 5:")
            for i, entry in enumerate(leaderboard[:5], 1):
                print(f"   #{i} {entry.get('name', 'N/A')} - {entry.get('totalPoints', 0)} puntos ({entry.get('tier', 'N/A')})")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['leaderboard'] = {"error": str(e)}
    
    # 11. Programa de Referidos
    print_test_header("👥", "PROGRAMA DE REFERIDOS")
    try:
        response = requests.get(f"{API_URL}/gamification/referrals", headers=headers)
        data = response.json()
        results['tests']['referrals'] = data
        
        if response.status_code == 200 and data.get('success'):
            referral_data = data.get('data', {})
            print(f"✅ Exitoso (200 OK)")
            print(f"   Código de referido: {referral_data.get('referralCode', 'N/A')}")
            print(f"   Total de referidos: {len(referral_data.get('referrals', []))}")
            print(f"   Puntos ganados por referidos: {referral_data.get('stats', {}).get('totalPointsEarned', 0)}")
        else:
            print(f"⚠️  Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        results['tests']['referrals'] = {"error": str(e)}
    
    # Guardar resultados
    print("\n")
    print_separator()
    output_file = "/workspace/gamification_test_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"✅ TODAS LAS PRUEBAS COMPLETADAS")
    print(f"📄 Resultados guardados en: {output_file}")
    print_separator()
    print("\n")
    
    # Resumen
    total_tests = len(results['tests'])
    successful_tests = sum(1 for test in results['tests'].values() 
                          if isinstance(test, dict) and test.get('success'))
    
    print(f"📊 RESUMEN:")
    print(f"   Total de pruebas: {total_tests}")
    print(f"   Exitosas: {successful_tests}")
    print(f"   Con errores: {total_tests - successful_tests}")
    print()

if __name__ == "__main__":
    main()
