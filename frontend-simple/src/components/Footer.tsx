import Link from 'next/link'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl font-serif">C</span>
              </div>
              <span className="font-serif font-semibold text-xl">Carnes Premium</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              Los mejores cortes de carne, seleccionados cuidadosamente y entregados 
              directamente en tu hogar con la calidad que mereces.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="p-2 bg-neutral-800 rounded-lg hover:bg-primary-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 bg-neutral-800 rounded-lg hover:bg-primary-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="p-2 bg-neutral-800 rounded-lg hover:bg-primary-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-6">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/busqueda" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Todos los Productos
                </Link>
              </li>
              <li>
                <Link 
                  href="/busqueda" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Categorías
                </Link>
              </li>
              <li>
                <Link 
                  href="/busqueda" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Ofertas Especiales
                </Link>
              </li>
              <li>
                <Link 
                  href="/gamification" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link 
                  href="/" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-6">Atención al Cliente</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/notifications"
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link 
                  href="/my-orders"
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Devoluciones
                </Link>
              </li>
              <li>
                <Link 
                  href="/" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Envíos
                </Link>
              </li>
              <li>
                <Link 
                  href="/track" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Seguir Pedido
                </Link>
              </li>
              <li>
                <Link 
                  href="/track" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-6">Contacto</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-accent-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-neutral-300 text-sm">
                    Av. Principal 123<br />
                    Ciudad de México, CDMX<br />
                    México, C.P. 01000
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-accent-500 flex-shrink-0" />
                <a 
                  href="tel:+525551234567" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors text-sm"
                >
                  +52 55 1234 5678
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-accent-500 flex-shrink-0" />
                <a 
                  href="mailto:info@carnespremium.com" 
                  className="text-neutral-300 hover:text-accent-500 transition-colors text-sm"
                >
                  info@carnespremium.com
                </a>
              </div>
            </div>

            {/* Business Hours */}
            <div className="mt-6">
              <h4 className="font-medium text-white mb-3">Horarios de Atención</h4>
              <div className="text-neutral-300 text-sm space-y-1">
                <p>Lunes a Viernes: 8:00 AM - 8:00 PM</p>
                <p>Sábados: 9:00 AM - 6:00 PM</p>
                <p>Domingos: 10:00 AM - 4:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-700">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-neutral-400 text-sm">
              © 2025 Carnes Premium. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 text-neutral-400 text-sm">
              <Link 
                href="#"  
                className="hover:text-accent-500 transition-colors"
              >
                Política de Privacidad
              </Link>
              <Link 
                href="#" 
                className="hover:text-accent-500 transition-colors"
              >
                Términos de Uso
              </Link>
              <Link 
                href="#" 
                className="hover:text-accent-500 transition-colors"
              >
                Política de Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}