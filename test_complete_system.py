#!/usr/bin/env python3
"""
Test Completo del Sistema Carnes Premium
Prueba TODAS las funcionalidades del sistema end-to-end
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time

# Configuración
BASE_URL = "http://localhost:3002/api"
ADMIN_EMAIL = "admin@carnes.com"
ADMIN_PASSWORD = "admin123"

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_section(title: str):
    """Imprime un título de sección"""
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}{Colors.RESET}\n")

def print_test(test_name: str, status: str, details: str = ""):
    """Imprime resultado de un test"""
    status_color = Colors.GREEN if status == "✓" else Colors.RED
    print(f"{status_color}{status}{Colors.RESET} {test_name}")
    if details:
        print(f"  {Colors.YELLOW}{details}{Colors.RESET}")

class SystemTester:
    def __init__(self):
        self.admin_token = None
        self.user_token = None
        self.user_id = None
        self.test_results = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'skipped': 0
        }
        self.test_data = {}
        
    def run_all_tests(self):
        """Ejecuta todos los tests del sistema"""
        print(f"\n{Colors.BOLD}{Colors.MAGENTA}")
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║  SISTEMA DE PRUEBAS COMPLETO - CARNES PREMIUM                 ║")
        print("║  Testing ALL modules and functionalities                       ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print(f"{Colors.RESET}")
        
        start_time = time.time()
        
        try:
            # 1. AUTENTICACIÓN
            self.test_authentication()
            
            # 2. CATEGORÍAS Y PRODUCTOS
            self.test_categories()
            self.test_products()
            
            # 3. CARRITO
            self.test_cart()
            
            # 4. WISHLIST
            self.test_wishlist()
            
            # 5. ÓRDENES
            self.test_orders()
            
            # 6. REVIEWS
            self.test_reviews()
            
            # 7. CUPONES
            self.test_coupons()
            
            # 8. NOTIFICACIONES
            self.test_notifications()
            
            # 9. GAMIFICACIÓN
            self.test_gamification()
            
            # 10. LEALTAD
            self.test_loyalty()
            
            # 11. REFERIDOS
            self.test_referrals()
            
            # 12. MEMBRESÍAS
            self.test_memberships()
            
            # 13. SUSCRIPCIONES
            self.test_subscriptions()
            
            # 14. RECOMENDACIONES
            self.test_recommendations()
            
            # 15. INVENTARIO
            self.test_inventory()
            
            # 16. ANALYTICS Y REPORTES
            self.test_analytics()
            
        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}Test interrumpido por el usuario{Colors.RESET}")
        except Exception as e:
            print(f"\n{Colors.RED}Error fatal: {e}{Colors.RESET}")
            import traceback
            traceback.print_exc()
        
        # Resumen final
        elapsed_time = time.time() - start_time
        self.print_final_report(elapsed_time)
        
        # Guardar resultados
        self.save_results()
        
    def test_authentication(self):
        """Tests de autenticación"""
        print_section("1. AUTENTICACIÓN Y USUARIOS")
        
        # Login admin
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            if response.status_code == 200:
                self.admin_token = response.json()['data']['token']
                print_test("Login Admin", "✓", f"Token: {self.admin_token[:20]}...")
                self.test_results['passed'] += 1
            else:
                print_test("Login Admin", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Login Admin", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Crear usuario de prueba
        try:
            test_email = f"test_{int(time.time())}@test.com"
            response = requests.post(f"{BASE_URL}/auth/register", json={
                "email": test_email,
                "password": "Test123!",
                "name": "Test User",
                "phone": "5551234567"  # Formato válido: 10 dígitos
            })
            if response.status_code in [200, 201]:
                data = response.json()
                self.user_token = data.get('data', {}).get('token')
                self.user_id = data.get('data', {}).get('user', {}).get('id')
                print_test("Registro Usuario", "✓", f"User ID: {self.user_id}")
                self.test_data['test_email'] = test_email
                self.test_results['passed'] += 1
            else:
                print_test("Registro Usuario", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Registro Usuario", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Get profile
        try:
            if self.user_token:
                headers = {"Authorization": f"Bearer {self.user_token}"}
                response = requests.get(f"{BASE_URL}/auth/profile", headers=headers)
                if response.status_code == 200:
                    print_test("Get Profile", "✓")
                    self.test_results['passed'] += 1
                else:
                    print_test("Get Profile", "✗", f"Status: {response.status_code}")
                    self.test_results['failed'] += 1
            else:
                print_test("Get Profile", "⊘", "Sin token de usuario")
                self.test_results['skipped'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Get Profile", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_categories(self):
        """Tests de categorías"""
        print_section("2. CATEGORÍAS")
        
        # Listar categorías
        try:
            response = requests.get(f"{BASE_URL}/categories")
            if response.status_code == 200:
                categories = response.json()['data']
                print_test("Listar Categorías", "✓", f"{len(categories)} categorías encontradas")
                if categories:
                    self.test_data['category_id'] = categories[0]['id']
                self.test_results['passed'] += 1
            else:
                print_test("Listar Categorías", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Listar Categorías", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Crear categoría (admin)
        try:
            if self.admin_token:
                headers = {"Authorization": f"Bearer {self.admin_token}"}
                response = requests.post(f"{BASE_URL}/categories", 
                    headers=headers,
                    json={
                        "name": f"Test Category {int(time.time())}",
                        "slug": f"test-category-{int(time.time())}",
                        "description": "Test category",
                        "isActive": True
                    })
                if response.status_code in [200, 201]:
                    print_test("Crear Categoría", "✓")
                    self.test_results['passed'] += 1
                else:
                    print_test("Crear Categoría", "✗", f"Status: {response.status_code}")
                    self.test_results['failed'] += 1
            else:
                print_test("Crear Categoría", "⊘", "Sin token admin")
                self.test_results['skipped'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Crear Categoría", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_products(self):
        """Tests de productos"""
        print_section("3. PRODUCTOS")
        
        # Listar productos
        try:
            response = requests.get(f"{BASE_URL}/products")
            if response.status_code == 200:
                data = response.json()['data']
                products = data.get('products', data if isinstance(data, list) else [])
                print_test("Listar Productos", "✓", f"{len(products)} productos encontrados")
                if products:
                    self.test_data['product_id'] = products[0]['id']
                    if products[0].get('variants'):
                        self.test_data['variant_id'] = products[0]['variants'][0]['id']
                self.test_results['passed'] += 1
            else:
                print_test("Listar Productos", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Listar Productos", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Buscar productos
        try:
            response = requests.get(f"{BASE_URL}/products/search?q=carne")
            if response.status_code == 200:
                print_test("Buscar Productos", "✓")
                self.test_results['passed'] += 1
            else:
                print_test("Buscar Productos", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Buscar Productos", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Obtener producto por ID
        try:
            if self.test_data.get('product_id'):
                response = requests.get(f"{BASE_URL}/products/{self.test_data['product_id']}")
                if response.status_code == 200:
                    print_test("Get Producto por ID", "✓")
                    self.test_results['passed'] += 1
                else:
                    print_test("Get Producto por ID", "✗", f"Status: {response.status_code}")
                    self.test_results['failed'] += 1
            else:
                print_test("Get Producto por ID", "⊘", "Sin ID de producto")
                self.test_results['skipped'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Get Producto por ID", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_cart(self):
        """Tests de carrito"""
        print_section("4. CARRITO DE COMPRAS")
        
        if not self.user_token or not self.test_data.get('product_id'):
            print_test("Tests de Carrito", "⊘", "Requiere token y producto")
            self.test_results['skipped'] += 3
            self.test_results['total'] += 3
            return
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Agregar al carrito
        try:
            response = requests.post(f"{BASE_URL}/cart", 
                headers=headers,
                json={
                    "productId": self.test_data['product_id'],
                    "variantId": self.test_data.get('variant_id'),
                    "quantity": 2
                })
            if response.status_code in [200, 201]:
                print_test("Agregar al Carrito", "✓")
                self.test_results['passed'] += 1
            else:
                print_test("Agregar al Carrito", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Agregar al Carrito", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Ver carrito
        try:
            response = requests.get(f"{BASE_URL}/cart", headers=headers)
            if response.status_code == 200:
                cart = response.json()['data']
                print_test("Ver Carrito", "✓", f"{len(cart.get('items', []))} items")
                if cart.get('items'):
                    self.test_data['cart_item_id'] = cart['items'][0]['id']
                self.test_results['passed'] += 1
            else:
                print_test("Ver Carrito", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Ver Carrito", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Actualizar cantidad
        try:
            if self.test_data.get('cart_item_id'):
                response = requests.put(f"{BASE_URL}/cart/{self.test_data['cart_item_id']}", 
                    headers=headers,
                    json={"quantity": 3})
                if response.status_code == 200:
                    print_test("Actualizar Cantidad", "✓")
                    self.test_results['passed'] += 1
                else:
                    print_test("Actualizar Cantidad", "✗", f"Status: {response.status_code}")
                    self.test_results['failed'] += 1
            else:
                print_test("Actualizar Cantidad", "⊘", "Sin item en carrito")
                self.test_results['skipped'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Actualizar Cantidad", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_wishlist(self):
        """Tests de wishlist"""
        print_section("5. LISTA DE DESEOS (WISHLIST)")
        
        if not self.user_token or not self.test_data.get('product_id'):
            print_test("Tests de Wishlist", "⊘", "Requiere token y producto")
            self.test_results['skipped'] += 3
            self.test_results['total'] += 3
            return
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Agregar a wishlist
        try:
            response = requests.post(f"{BASE_URL}/wishlist", 
                headers=headers,
                json={"productId": self.test_data['product_id']})
            if response.status_code in [200, 201]:
                print_test("Agregar a Wishlist", "✓")
                self.test_results['passed'] += 1
            else:
                print_test("Agregar a Wishlist", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Agregar a Wishlist", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Ver wishlist
        try:
            response = requests.get(f"{BASE_URL}/wishlist", headers=headers)
            if response.status_code == 200:
                wishlist = response.json()['data']
                print_test("Ver Wishlist", "✓", f"{len(wishlist)} items")
                self.test_results['passed'] += 1
            else:
                print_test("Ver Wishlist", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Ver Wishlist", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Eliminar de wishlist
        try:
            response = requests.delete(f"{BASE_URL}/wishlist/{self.test_data['product_id']}", 
                headers=headers)
            if response.status_code in [200, 204]:
                print_test("Eliminar de Wishlist", "✓")
                self.test_results['passed'] += 1
            else:
                print_test("Eliminar de Wishlist", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Eliminar de Wishlist", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_orders(self):
        """Tests de órdenes"""
        print_section("6. ÓRDENES Y CHECKOUT")
        
        if not self.user_token:
            print_test("Tests de Órdenes", "⊘", "Requiere token")
            self.test_results['skipped'] += 2
            self.test_results['total'] += 2
            return
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Listar órdenes
        try:
            response = requests.get(f"{BASE_URL}/orders", headers=headers)
            if response.status_code == 200:
                orders = response.json()['data']
                print_test("Listar Órdenes", "✓", f"{len(orders)} órdenes")
                self.test_results['passed'] += 1
            else:
                print_test("Listar Órdenes", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Listar Órdenes", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_reviews(self):
        """Tests de reviews"""
        print_section("7. RESEÑAS Y REVIEWS")
        
        if not self.test_data.get('product_id'):
            print_test("Tests de Reviews", "⊘", "Requiere producto")
            self.test_results['skipped'] += 1
            self.test_results['total'] += 1
            return
            
        # Listar reviews de producto
        try:
            response = requests.get(f"{BASE_URL}/products/{self.test_data['product_id']}/reviews")
            if response.status_code == 200:
                reviews = response.json()['data']
                print_test("Listar Reviews", "✓", f"{len(reviews)} reviews")
                self.test_results['passed'] += 1
            else:
                print_test("Listar Reviews", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Listar Reviews", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_coupons(self):
        """Tests de cupones"""
        print_section("8. CUPONES Y DESCUENTOS")
        
        # Validar cupón
        try:
            response = requests.post(f"{BASE_URL}/coupons/validate", json={
                "code": "TEST10"
            })
            # Puede ser 200 o 404, ambos son válidos
            if response.status_code in [200, 404]:
                print_test("Validar Cupón", "✓")
                self.test_results['passed'] += 1
            else:
                print_test("Validar Cupón", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Validar Cupón", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_notifications(self):
        """Tests de notificaciones"""
        print_section("9. NOTIFICACIONES")
        
        if not self.user_token:
            print_test("Tests de Notificaciones", "⊘", "Requiere token")
            self.test_results['skipped'] += 2
            self.test_results['total'] += 2
            return
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Listar notificaciones
        try:
            response = requests.get(f"{BASE_URL}/notifications", headers=headers)
            if response.status_code == 200:
                notifs = response.json()['data']
                print_test("Listar Notificaciones", "✓", f"{len(notifs)} notificaciones")
                self.test_results['passed'] += 1
            else:
                print_test("Listar Notificaciones", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Listar Notificaciones", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Preferencias de notificaciones
        try:
            response = requests.get(f"{BASE_URL}/notifications/preferences", headers=headers)
            if response.status_code == 200:
                print_test("Get Preferencias", "✓")
                self.test_results['passed'] += 1
            else:
                print_test("Get Preferencias", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Get Preferencias", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_gamification(self):
        """Tests de gamificación"""
        print_section("10. GAMIFICACIÓN COMPLETA")
        
        if not self.user_token:
            print_test("Tests de Gamificación", "⊘", "Requiere token")
            self.test_results['skipped'] += 8
            self.test_results['total'] += 8
            return
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Badges
        tests = [
            ("Listar Badges", "GET", f"{BASE_URL}/gamification/badges"),
            ("Mis Badges", "GET", f"{BASE_URL}/gamification/badges/earned"),
            ("Listar Challenges", "GET", f"{BASE_URL}/gamification/challenges"),
            ("Mis Challenges", "GET", f"{BASE_URL}/gamification/challenges/mine"),
            ("Listar Rewards", "GET", f"{BASE_URL}/gamification/rewards"),
            ("Mis Redemptions", "GET", f"{BASE_URL}/gamification/rewards/redemptions"),
            ("Leaderboards", "GET", f"{BASE_URL}/gamification/leaderboard"),
            ("Stats Gamification", "GET", f"{BASE_URL}/gamification/stats")
        ]
        
        for test_name, method, url in tests:
            try:
                if method == "GET":
                    response = requests.get(url, headers=headers)
                else:
                    response = requests.post(url, headers=headers, json={})
                    
                if response.status_code == 200:
                    data = response.json()['data']
                    count = len(data) if isinstance(data, list) else 'N/A'
                    print_test(test_name, "✓", f"{count} items" if isinstance(count, int) else "")
                    self.test_results['passed'] += 1
                else:
                    print_test(test_name, "✗", f"Status: {response.status_code}")
                    self.test_results['failed'] += 1
                self.test_results['total'] += 1
            except Exception as e:
                print_test(test_name, "✗", str(e))
                self.test_results['failed'] += 1
                self.test_results['total'] += 1
    
    def test_loyalty(self):
        """Tests de sistema de lealtad"""
        print_section("11. SISTEMA DE LEALTAD")
        
        if not self.user_token:
            print_test("Tests de Lealtad", "⊘", "Requiere token")
            self.test_results['skipped'] += 3
            self.test_results['total'] += 3
            return
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Get loyalty profile
        try:
            response = requests.get(f"{BASE_URL}/gamification/loyalty", headers=headers)
            if response.status_code == 200:
                loyalty = response.json()['data']
                print_test("Get Loyalty Profile", "✓", 
                    f"Tier: {loyalty.get('tier')}, Points: {loyalty.get('currentPoints')}")
                self.test_results['passed'] += 1
            else:
                print_test("Get Loyalty Profile", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Get Loyalty Profile", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Transactions history
        try:
            response = requests.get(f"{BASE_URL}/gamification/loyalty/transactions", headers=headers)
            if response.status_code == 200:
                transactions = response.json()['data']
                print_test("Loyalty Transactions", "✓", f"{len(transactions)} transacciones")
                self.test_results['passed'] += 1
            else:
                print_test("Loyalty Transactions", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Loyalty Transactions", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Tiers info
        try:
            response = requests.get(f"{BASE_URL}/gamification/loyalty/tiers", headers=headers)
            if response.status_code == 200:
                tiers = response.json()['data']
                print_test("Get Tiers Info", "✓", f"{len(tiers)} tiers")
                self.test_results['passed'] += 1
            else:
                print_test("Get Tiers Info", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Get Tiers Info", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_referrals(self):
        """Tests de sistema de referidos"""
        print_section("12. SISTEMA DE REFERIDOS")
        
        if not self.user_token:
            print_test("Tests de Referidos", "⊘", "Requiere token")
            self.test_results['skipped'] += 2
            self.test_results['total'] += 2
            return
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Get referral code
        try:
            response = requests.get(f"{BASE_URL}/gamification/referrals/code", headers=headers)
            if response.status_code == 200:
                data = response.json()['data']
                print_test("Get Referral Code", "✓", f"Code: {data.get('code', 'N/A')}")
                self.test_results['passed'] += 1
            else:
                print_test("Get Referral Code", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Get Referral Code", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Get referrals stats
        try:
            response = requests.get(f"{BASE_URL}/gamification/referrals", headers=headers)
            if response.status_code == 200:
                data = response.json()['data']
                print_test("Get Referrals Stats", "✓")
                self.test_results['passed'] += 1
            else:
                print_test("Get Referrals Stats", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Get Referrals Stats", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_memberships(self):
        """Tests de membresías"""
        print_section("13. MEMBRESÍAS")
        
        # Listar planes
        try:
            response = requests.get(f"{BASE_URL}/memberships/plans")
            if response.status_code == 200:
                plans = response.json()['data']
                print_test("Listar Planes", "✓", f"{len(plans)} planes")
                self.test_results['passed'] += 1
            else:
                print_test("Listar Planes", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Listar Planes", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_subscriptions(self):
        """Tests de suscripciones"""
        print_section("14. SUSCRIPCIONES")
        
        # Listar planes de suscripción
        try:
            response = requests.get(f"{BASE_URL}/subscriptions/plans")
            if response.status_code == 200:
                plans = response.json()['data']
                print_test("Listar Planes Suscripción", "✓", f"{len(plans)} planes")
                self.test_results['passed'] += 1
            else:
                print_test("Listar Planes Suscripción", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Listar Planes Suscripción", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_recommendations(self):
        """Tests de recomendaciones"""
        print_section("15. RECOMENDACIONES")
        
        if not self.user_token:
            print_test("Tests de Recomendaciones", "⊘", "Requiere token")
            self.test_results['skipped'] += 2
            self.test_results['total'] += 2
            return
            
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Recomendaciones personalizadas
        try:
            response = requests.get(f"{BASE_URL}/recommendations/personalized", headers=headers)
            if response.status_code == 200:
                recs = response.json()['data']
                print_test("Recomendaciones Personalizadas", "✓", f"{len(recs)} productos")
                self.test_results['passed'] += 1
            else:
                print_test("Recomendaciones Personalizadas", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Recomendaciones Personalizadas", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
            
        # Productos trending
        try:
            response = requests.get(f"{BASE_URL}/recommendations/trending", headers=headers)
            if response.status_code == 200:
                trending = response.json()['data']
                print_test("Productos Trending", "✓", f"{len(trending)} productos")
                self.test_results['passed'] += 1
            else:
                print_test("Productos Trending", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Productos Trending", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_inventory(self):
        """Tests de inventario"""
        print_section("16. INVENTARIO Y STOCK")
        
        if not self.admin_token:
            print_test("Tests de Inventario", "⊘", "Requiere token admin")
            self.test_results['skipped'] += 1
            self.test_results['total'] += 1
            return
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Alertas de stock
        try:
            response = requests.get(f"{BASE_URL}/inventory/alerts", headers=headers)
            if response.status_code == 200:
                alerts = response.json()['data']
                print_test("Alertas de Stock", "✓", f"{len(alerts)} alertas")
                self.test_results['passed'] += 1
            else:
                print_test("Alertas de Stock", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Alertas de Stock", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def test_analytics(self):
        """Tests de analytics"""
        print_section("17. ANALYTICS Y REPORTES")
        
        if not self.admin_token:
            print_test("Tests de Analytics", "⊘", "Requiere token admin")
            self.test_results['skipped'] += 1
            self.test_results['total'] += 1
            return
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Dashboard stats
        try:
            response = requests.get(f"{BASE_URL}/analytics/dashboard", headers=headers)
            if response.status_code == 200:
                stats = response.json()['data']
                print_test("Dashboard Stats", "✓")
                self.test_results['passed'] += 1
            else:
                print_test("Dashboard Stats", "✗", f"Status: {response.status_code}")
                self.test_results['failed'] += 1
            self.test_results['total'] += 1
        except Exception as e:
            print_test("Dashboard Stats", "✗", str(e))
            self.test_results['failed'] += 1
            self.test_results['total'] += 1
    
    def print_final_report(self, elapsed_time: float):
        """Imprime el reporte final"""
        print(f"\n{Colors.BOLD}{Colors.MAGENTA}")
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║                    REPORTE FINAL DE PRUEBAS                    ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        print(f"{Colors.RESET}")
        
        success_rate = (self.test_results['passed'] / self.test_results['total'] * 100) if self.test_results['total'] > 0 else 0
        
        print(f"\n{Colors.BOLD}RESULTADOS:{Colors.RESET}")
        print(f"  Total de pruebas:      {self.test_results['total']}")
        print(f"  {Colors.GREEN}✓ Exitosas:            {self.test_results['passed']}{Colors.RESET}")
        print(f"  {Colors.RED}✗ Fallidas:            {self.test_results['failed']}{Colors.RESET}")
        print(f"  {Colors.YELLOW}⊘ Omitidas:            {self.test_results['skipped']}{Colors.RESET}")
        print(f"  {Colors.CYAN}Tasa de éxito:         {success_rate:.1f}%{Colors.RESET}")
        print(f"  {Colors.BLUE}Tiempo transcurrido:   {elapsed_time:.2f}s{Colors.RESET}")
        
        # Status general
        if success_rate >= 90:
            status = f"{Colors.GREEN}EXCELENTE ✓{Colors.RESET}"
        elif success_rate >= 70:
            status = f"{Colors.YELLOW}BUENO ⚠{Colors.RESET}"
        else:
            status = f"{Colors.RED}NECESITA ATENCIÓN ✗{Colors.RESET}"
        
        print(f"\n{Colors.BOLD}ESTADO GENERAL: {status}{Colors.RESET}\n")
        
    def save_results(self):
        """Guarda los resultados en un archivo JSON"""
        results = {
            'timestamp': datetime.now().isoformat(),
            'summary': self.test_results,
            'test_data': self.test_data
        }
        
        filename = f"/workspace/test_results_{int(time.time())}.json"
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"{Colors.CYAN}📄 Resultados guardados en: {filename}{Colors.RESET}\n")

def main():
    tester = SystemTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
