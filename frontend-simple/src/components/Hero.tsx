'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative h-[560px] md:h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(28, 28, 28, 0.7) 0%, rgba(28, 28, 28, 0.4) 100%), 
                           url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjMUMxQzFDIi8+CjxyZWN0IHg9IjQ4MCIgeT0iMjcwIiB3aWR0aD0iOTYwIiBoZWlnaHQ9IjU0MCIgcng9IjIwIiBmaWxsPSIjMkEyQTJBIi8+CjxyZWN0IHg9IjU3NiIgeT0iMzY2IiB3aWR0aD0iNzY4IiBoZWlnaHQ9IjM0OCIgcng9IjEyIiBmaWxsPSIjMzMzMzMzIi8+CjxyZWN0IHg9IjY3MiIgeT0iNDYyIiB3aWR0aD0iNTc2IiBoZWlnaHQ9IjE1NiIgcng9IjgiIGZpbGw9IiM0MDQwNDAiLz4KPC9zdmc+Cg==')`
        }}
      >
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 leading-tight">
          El Arte de la Carne,
          <br />
          <span className="text-accent-500">Entregado a tu Puerta</span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          Experimenta el pináculo del sabor con nuestros cortes de origen ético, 
          madurados magistralmente y seleccionados por expertos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/busqueda"
            className="inline-flex items-center px-8 py-4 bg-primary-500 text-white font-medium rounded-lg 
                     hover:bg-primary-600 transition-all duration-300 hover:transform hover:-translate-y-1 
                     shadow-lg hover:shadow-xl group text-lg"
          >
            Explorar Cortes
            <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="/gamification"
            className="inline-flex items-center px-8 py-4 bg-white/10 text-white font-medium rounded-lg 
                     hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 
                     hover:border-white/30 text-lg"
          >
            Nuestra Historia
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/80 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
              <span>Entrega en 24h</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
              <span>Origen garantizado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
              <span>Calidad premium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
              <span>Envío refrigerado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}