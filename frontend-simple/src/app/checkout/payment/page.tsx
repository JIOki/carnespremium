'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import paymentService from '@/services/paymentService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Inicializar Stripe (reemplazar con tu clave pública)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy');

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
  status: string;
  paymentStatus: string;
}

function CheckoutForm({ order, onSuccess }: { order: Order; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear Payment Intent
      const { payment } = await paymentService.createStripePaymentIntent(
        order.id,
        order.total,
        order.currency.toLowerCase()
      );

      // Confirmar el pago
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        payment.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Error al procesar el pago');
      } else if (paymentIntent?.status === 'succeeded') {
        // Confirmar en nuestro backend
        await paymentService.confirmStripePayment(paymentIntent.id);
        onSuccess();
      }

    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleStripePayment} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Información de la Tarjeta
        </label>
        <div className="border border-gray-300 rounded-lg p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Procesando...' : `Pagar ${paymentService.formatCurrency(order.total, order.currency)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Pago seguro procesado por Stripe. Tu información está protegida con encriptación SSL.
      </p>
    </form>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'mercadopago'>('stripe');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      // En un caso real, cargarías la orden desde tu API
      // Por ahora, simulamos una orden
      setOrder({
        id: orderId,
        orderNumber: `ORD-${orderId.substring(0, 8).toUpperCase()}`,
        total: 15000,
        currency: 'USD',
        status: 'PENDING',
        paymentStatus: 'PENDING'
      });
      setLoading(false);
    } else {
      setError('No se especificó una orden');
      setLoading(false);
    }
  }, [orderId]);

  const handleMercadoPagoPayment = async () => {
    if (!order) return;

    setLoading(true);
    setError(null);

    try {
      const { payment } = await paymentService.createMercadoPagoPreference(order.id);

      // Redirigir a MercadoPago
      const initPoint = process.env.NODE_ENV === 'production'
        ? payment.initPoint
        : payment.sandboxInitPoint;

      window.location.href = initPoint;

    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear la preferencia de pago');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    router.push(`/checkout/success?orderId=${order?.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 text-5xl mb-4 text-center">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error || 'Orden no encontrada'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Compra</h1>
          <p className="text-gray-600">
            Orden #{order.orderNumber}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Método de Pago</h2>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'stripe'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💳</div>
                    <div className="font-semibold text-gray-900">Tarjeta</div>
                    <div className="text-xs text-gray-500">Stripe</div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('mercadopago')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'mercadopago'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔵</div>
                    <div className="font-semibold text-gray-900">MercadoPago</div>
                    <div className="text-xs text-gray-500">Múltiples métodos</div>
                  </div>
                </button>
              </div>

              {/* Payment Forms */}
              {paymentMethod === 'stripe' ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm order={order} onSuccess={handlePaymentSuccess} />
                </Elements>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Serás redirigido a MercadoPago para completar el pago de forma segura.
                      Podrás elegir entre tarjeta de crédito, débito, efectivo y más opciones.
                    </p>
                  </div>

                  <button
                    onClick={handleMercadoPagoPayment}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Procesando...' : 'Continuar con MercadoPago'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    Pago seguro procesado por MercadoPago
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen del Pedido</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{paymentService.formatCurrency(order.total * 0.9, order.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>{paymentService.formatCurrency(order.total * 0.1, order.currency)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{paymentService.formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Pago seguro y encriptado
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Badges */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Pagos procesados de forma segura por:</p>
          <div className="flex justify-center items-center space-x-8">
            <div className="text-gray-400">
              <div className="h-8 flex items-center justify-center">
                <span className="text-2xl font-bold">Stripe</span>
              </div>
              <p className="text-xs mt-1">Seguridad SSL</p>
            </div>
            <div className="text-gray-400">
              <div className="h-8 flex items-center justify-center">
                <span className="text-2xl font-bold">MP</span>
              </div>
              <p className="text-xs mt-1">MercadoPago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
