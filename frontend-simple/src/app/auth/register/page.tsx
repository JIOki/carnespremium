'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { User, Mail, Lock, Phone, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    phone?: string
    password?: string
    confirmPassword?: string
    general?: string
  }>({})
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Limpiar errores cuando el usuario escribe
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined, general: undefined }))
    }
  }

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    
    // Nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres'
    }
    
    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    
    // Teléfono (opcional pero validar formato si se ingresa)
    if (formData.phone && !/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono inválido'
    }
    
    // Contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe contener mayúsculas, minúsculas y números'
    }
    
    // Confirmar Contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }
    
    // Términos y condiciones
    if (!acceptedTerms) {
      newErrors.general = 'Debes aceptar los términos y condiciones'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      await register(
        formData.name,
        formData.email,
        formData.password,
        formData.phone || undefined
      )
      
      // Redirigir a la página principal
      router.push('/')
      
    } catch (error: any) {
      setErrors({
        general: error.message || 'Error al registrarse. El email ya podría estar en uso.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Indicador de fortaleza de contraseña
  const getPasswordStrength = () => {
    const { password } = formData
    if (!password) return 0
    
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
    if (/\d/.test(password)) strength += 25
    
    return strength
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-2xl font-serif">C</span>
            </div>
          </Link>
          
          <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
            Crear Cuenta
          </h2>
          <p className="text-neutral-600">
            Únete a Carnes Premium y disfruta de los mejores cortes
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                           ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                  placeholder="Juan Pérez"
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                           ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                Teléfono (Opcional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                           ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                  placeholder="+52 555 123 4567"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 
                           ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    <div className={`h-1 flex-1 rounded ${passwordStrength >= 25 ? 'bg-red-500' : 'bg-neutral-200'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordStrength >= 50 ? 'bg-yellow-500' : 'bg-neutral-200'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordStrength >= 75 ? 'bg-green-400' : 'bg-neutral-200'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordStrength === 100 ? 'bg-green-600' : 'bg-neutral-200'}`} />
                  </div>
                  <p className="text-xs text-neutral-600">
                    {passwordStrength < 50 && 'Contraseña débil'}
                    {passwordStrength >= 50 && passwordStrength < 75 && 'Contraseña media'}
                    {passwordStrength >= 75 && passwordStrength < 100 && 'Contraseña fuerte'}
                    {passwordStrength === 100 && 'Contraseña muy fuerte'}
                  </p>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 
                           ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="mt-1 flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Las contraseñas coinciden
                </div>
              )}
              
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Términos y Condiciones */}
            <div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked)
                    if (e.target.checked && errors.general) {
                      setErrors(prev => ({ ...prev, general: undefined }))
                    }
                  }}
                  className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 mt-1"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-neutral-700">
                  Acepto los{' '}
                  <Link href="#" className="text-primary-500 hover:text-primary-600 font-medium">
                    Términos y Condiciones
                  </Link>
                  {' '}y la{' '}
                  <Link href="#" className="text-primary-500 hover:text-primary-600 font-medium">
                    Política de Privacidad
                  </Link>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full px-6 py-3 bg-primary-500 text-white font-medium rounded-lg 
                       hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 
                       focus:ring-offset-2 transition-colors disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting || isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-600">
                ¿Ya tienes cuenta?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-600 hover:text-neutral-900"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
