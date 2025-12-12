
'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { User, Mail, Phone, MapPin, CreditCard, Calendar, Lock, Plus, Check } from 'lucide-react'

interface CheckoutFormProps {
  onComplete: (orderId: string) => void
}

interface SavedAddress {
  id: string
  address1: string
  address2?: string
  city: string
  state: string
  postalCode: string
  isDefault: boolean
}

interface FormData {
  // Información Personal
  name: string
  email: string
  phone: string
  
  // Dirección de Envío
  address: string
  city: string
  state: string
  zipCode: string
  addressNotes?: string
  
  // Método de Pago
  paymentMethod: 'card' | 'transfer' | 'cash'
  
  // Datos de Tarjeta (si aplica)
  cardNumber?: string
  cardName?: string
  cardExpiry?: string
  cardCvv?: string
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  addressNotes: '',
  paymentMethod: 'card',
  cardNumber: '',
  cardName: '',
  cardExpiry: '',
  cardCvv: '',
}

// Hook seguro para auth que lee de localStorage
function useAuthSafe() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token') || localStorage.getItem('auth-token')
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch {}
    }
  }, [])

  return { user, token, isAuthenticated: !!user && !!token }
}

export default function CheckoutForm({ onComplete }: CheckoutFormProps) {
  const { items, total, clearCart } = useCart()
  const { user, token, isAuthenticated } = useAuthSafe()
  
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  
  // Estados para direcciones guardadas
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [saveNewAddress, setSaveNewAddress] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  // Cargar direcciones guardadas si está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSavedAddresses()
      // Pre-llenar datos del usuario
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }))
    }
  }, [isAuthenticated, user])

  const loadSavedAddresses = async () => {
    if (!user || !token) return
    setLoadingAddresses(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/${user.id}/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSavedAddresses(data.data || [])
        // Seleccionar dirección por defecto
        const defaultAddr = data.data?.find((a: SavedAddress) => a.isDefault)
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id)
          fillAddressFromSaved(defaultAddr)
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const fillAddressFromSaved = (addr: SavedAddress) => {
    setFormData(prev => ({
      ...prev,
      address: addr.address1 + (addr.address2 ? `, ${addr.address2}` : ''),
      city: addr.city,
      state: addr.state,
      zipCode: addr.postalCode
    }))
  }

  const handleSelectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id)
    setShowNewAddressForm(false)
    fillAddressFromSaved(addr)
  }

  const handleNewAddress = () => {
    setSelectedAddressId(null)
    setShowNewAddressForm(true)
    setFormData(prev => ({
      ...prev,
      address: '',
      city: '',
      state: '',
      zipCode: ''
    }))
  }

  const saveAddressToServer = async () => {
    if (!user || !token) return
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/users/${user.id}/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address1: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.zipCode,
          isDefault: savedAddresses.length === 0
        })
      })
    } catch (error) {
      console.error('Error saving address:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateStep1 = (): boolean => {
    const newErrors: Partial<FormData> = {}
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: Partial<FormData> = {}
    
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida'
    if (!formData.city.trim()) newErrors.city = 'La ciudad es requerida'
    if (!formData.state.trim()) newErrors.state = 'El estado/provincia es requerido'
    if (!formData.zipCode.trim()) newErrors.zipCode = 'El código postal es requerido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = (): boolean => {
    const newErrors: Partial<FormData> = {}
    
    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
        newErrors.cardNumber = 'Número de tarjeta inválido'
      }
      if (!formData.cardName?.trim()) {
        newErrors.cardName = 'Nombre en la tarjeta requerido'
      }
      if (!formData.cardExpiry || !/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
        newErrors.cardExpiry = 'Fecha inválida (MM/YY)'
      }
      if (!formData.cardCvv || formData.cardCvv.length !== 3) {
        newErrors.cardCvv = 'CVV inválido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    let isValid = false
    
    if (currentStep === 1) isValid = validateStep1()
    else if (currentStep === 2) isValid = validateStep2()
    
    if (isValid && currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep3()) return

    setIsSubmitting(true)

    try {
      // Guardar dirección si el usuario lo solicitó
      if (isAuthenticated && saveNewAddress && showNewAddressForm) {
        await saveAddressToServer()
      }

      const orderData = {
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          notes: formData.addressNotes,
        },
        paymentMethod: formData.paymentMethod,
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
        total: total,
        createdAt: new Date().toISOString(),
      }

      console.log('Orden a enviar:', orderData)

      await new Promise(resolve => setTimeout(resolve, 2000))

      const orderId = `ORD-${Date.now()}`

      await clearCart()

      onComplete(orderId)

    } catch (error) {
      console.error('Error al procesar el pedido:', error)
      alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setFormData(prev => ({ ...prev, cardNumber: formatted }))
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4)
    }
    setFormData(prev => ({ ...prev, cardExpiry: value }))
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
      <form onSubmit={handleSubmit}>
        {/* Step 1: Información Personal */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-neutral-900 mb-6">
                Información Personal
              </h2>
            </div>

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
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
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
                  placeholder="juan@ejemplo.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-2">
                Teléfono *
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
                />
              </div>
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full px-6 py-3 bg-primary-500 text-white font-medium rounded-lg 
                         hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 
                         focus:ring-offset-2 transition-colors"
              >
                Continuar a Dirección de Envío
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Dirección de Envío */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-neutral-900 mb-6">
                Dirección de Envío
              </h2>
            </div>

            {/* Direcciones Guardadas (solo si está autenticado) */}
            {isAuthenticated && (
              <div className="mb-6">
                {loadingAddresses ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-neutral-500 mt-2">Cargando direcciones...</p>
                  </div>
                ) : savedAddresses.length > 0 ? (
                  <>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Direcciones Guardadas
                    </label>
                    <div className="space-y-2 mb-4">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectAddress(addr)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-start ${
                            selectedAddressId === addr.id && !showNewAddressForm
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-neutral-900">
                              {addr.address1}
                              {addr.address2 && `, ${addr.address2}`}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {addr.city}, {addr.state} {addr.postalCode}
                            </p>
                            {addr.isDefault && (
                              <span className="inline-block mt-1 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                                Predeterminada
                              </span>
                            )}
                          </div>
                          {selectedAddressId === addr.id && !showNewAddressForm && (
                            <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleNewAddress}
                      className={`w-full p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-all ${
                        showNewAddressForm
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Nueva Dirección
                    </button>
                  </>
                ) : (
                  <div className="p-4 bg-neutral-50 rounded-lg text-center">
                    <p className="text-sm text-neutral-600">No tienes direcciones guardadas</p>
                  </div>
                )}
              </div>
            )}

            {/* Formulario de dirección (visible si no hay direcciones o se selecciona nueva) */}
            {(!isAuthenticated || savedAddresses.length === 0 || showNewAddressForm) && (
              <>
                {/* Dirección */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-2">
                    Dirección Completa *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                               ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                      placeholder="Calle, número, colonia"
                    />
                  </div>
                  {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                </div>

                {/* Ciudad y Estado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                               ${errors.city ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                      placeholder="Ciudad de México"
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-neutral-700 mb-2">
                      Estado/Provincia *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                               ${errors.state ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                      placeholder="CDMX"
                    />
                    {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
                  </div>
                </div>

                {/* Código Postal */}
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-neutral-700 mb-2">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                             ${errors.zipCode ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                    placeholder="01000"
                  />
                  {errors.zipCode && <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>}
                </div>

                {/* Opción de guardar dirección (solo si está autenticado) */}
                {isAuthenticated && showNewAddressForm && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveAddress"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="saveAddress" className="text-sm text-neutral-700">
                      Guardar esta dirección para futuras compras
                    </label>
                  </div>
                )}
              </>
            )}

            {/* Notas */}
            <div>
              <label htmlFor="addressNotes" className="block text-sm font-medium text-neutral-700 mb-2">
                Referencias de Entrega (Opcional)
              </label>
              <textarea
                id="addressNotes"
                name="addressNotes"
                value={formData.addressNotes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none 
                         focus:ring-2 focus:ring-primary-500"
                placeholder="Ej: Casa azul, portón negro, tocar timbre..."
              />
            </div>

            {/* Buttons */}
            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 px-6 py-3 bg-white border border-neutral-300 text-neutral-700 
                         font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 px-6 py-3 bg-primary-500 text-white font-medium rounded-lg 
                         hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 
                         focus:ring-offset-2 transition-colors"
              >
                Continuar a Pago
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Método de Pago */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-semibold text-neutral-900 mb-6">
                Método de Pago
              </h2>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <div
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'card' }))}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.paymentMethod === 'card'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <CreditCard className="ml-3 w-5 h-5 text-neutral-600" />
                  <span className="ml-2 font-medium text-neutral-900">Tarjeta de Crédito/Débito</span>
                </div>
              </div>

              <div
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'transfer' }))}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.paymentMethod === 'transfer'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={formData.paymentMethod === 'transfer'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-3 font-medium text-neutral-900">Transferencia Bancaria</span>
                </div>
              </div>

              <div
                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.paymentMethod === 'cash'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="ml-3 font-medium text-neutral-900">Pago Contra Entrega</span>
                </div>
              </div>
            </div>

            {/* Card Details (if card selected) */}
            {formData.paymentMethod === 'card' && (
              <div className="mt-6 space-y-4 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-semibold text-neutral-900 mb-4">Datos de la Tarjeta</h3>
                
                {/* Card Number */}
                <div>
                  <label htmlFor="cardNumber" className="block text-sm font-medium text-neutral-700 mb-2">
                    Número de Tarjeta *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                               ${errors.cardNumber ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  {errors.cardNumber && <p className="mt-1 text-sm text-red-500">{errors.cardNumber}</p>}
                </div>

                {/* Card Name */}
                <div>
                  <label htmlFor="cardName" className="block text-sm font-medium text-neutral-700 mb-2">
                    Nombre en la Tarjeta *
                  </label>
                  <input
                    type="text"
                    id="cardName"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                             ${errors.cardName ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                    placeholder="JUAN PEREZ"
                  />
                  {errors.cardName && <p className="mt-1 text-sm text-red-500">{errors.cardName}</p>}
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cardExpiry" className="block text-sm font-medium text-neutral-700 mb-2">
                      Vencimiento *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        id="cardExpiry"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                                 ${errors.cardExpiry ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                        placeholder="MM/YY"
                      />
                    </div>
                    {errors.cardExpiry && <p className="mt-1 text-sm text-red-500">{errors.cardExpiry}</p>}
                  </div>

                  <div>
                    <label htmlFor="cardCvv" className="block text-sm font-medium text-neutral-700 mb-2">
                      CVV *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="text"
                        id="cardCvv"
                        name="cardCvv"
                        value={formData.cardCvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').substring(0, 3)
                          setFormData(prev => ({ ...prev, cardCvv: value }))
                        }}
                        maxLength={3}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 
                                 ${errors.cardCvv ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 focus:ring-primary-500'}`}
                        placeholder="123"
                      />
                    </div>
                    {errors.cardCvv && <p className="mt-1 text-sm text-red-500">{errors.cardCvv}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Info */}
            {formData.paymentMethod === 'transfer' && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  Al confirmar tu pedido, recibirás un correo con los datos bancarios para realizar la transferencia.
                </p>
              </div>
            )}

            {/* Cash Info */}
            {formData.paymentMethod === 'cash' && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  Podrás pagar en efectivo o con tarjeta al momento de recibir tu pedido.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 px-6 py-3 bg-white border border-neutral-300 text-neutral-700 
                         font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary-500 text-white font-medium rounded-lg 
                         hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 
                         focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>Confirmar Pedido (${total.toFixed(2)})</>
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="pt-4 border-t border-neutral-200">
              <p className="text-xs text-neutral-600 text-center flex items-center justify-center">
                <Lock className="w-3 h-3 mr-1" />
                Tus datos están seguros y encriptados
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
