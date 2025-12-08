'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import notificationService, { NotificationStats } from '@/services/notificationService';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'broadcast' | 'stats'>('send');

  // Formulario de envío individual
  const [sendForm, setSendForm] = useState({
    userId: '',
    type: 'SYSTEM',
    title: '',
    message: '',
    actionUrl: '',
    priority: 'NORMAL',
    sendPush: true
  });

  // Formulario de envío masivo
  const [broadcastForm, setBroadcastForm] = useState({
    targetAudience: 'ALL',
    userIds: '',
    type: 'PROMO',
    title: '',
    message: '',
    actionUrl: '',
    priority: 'NORMAL',
    sendPush: true
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      if (!['ADMIN', 'SUPER_ADMIN'].includes(parsedUser.role)) {
        router.push('/');
        return;
      }
    } else {
      router.push('/auth/login');
      return;
    }

    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const statsData = await notificationService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendIndividual = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sendForm.userId || !sendForm.title || !sendForm.message) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setSending(true);
    try {
      await notificationService.sendNotification(sendForm);
      alert('✅ Notificación enviada correctamente');
      
      // Limpiar formulario
      setSendForm({
        userId: '',
        type: 'SYSTEM',
        title: '',
        message: '',
        actionUrl: '',
        priority: 'NORMAL',
        sendPush: true
      });

      loadStats();
    } catch (error: any) {
      console.error('Error enviando notificación:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!broadcastForm.title || !broadcastForm.message) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (broadcastForm.targetAudience === 'SEGMENT' && !broadcastForm.userIds) {
      alert('Por favor proporciona los IDs de usuarios para el segmento');
      return;
    }

    const confirmed = confirm(
      `¿Estás seguro de enviar esta notificación a ${
        broadcastForm.targetAudience === 'ALL' ? 'TODOS LOS USUARIOS' :
        broadcastForm.targetAudience === 'CUSTOMERS' ? 'TODOS LOS CLIENTES' :
        broadcastForm.targetAudience === 'DRIVERS' ? 'TODOS LOS REPARTIDORES' :
        'el segmento seleccionado'
      }?`
    );

    if (!confirmed) return;

    setSending(true);
    try {
      const payload: any = {
        targetAudience: broadcastForm.targetAudience,
        type: broadcastForm.type,
        title: broadcastForm.title,
        message: broadcastForm.message,
        actionUrl: broadcastForm.actionUrl || undefined,
        priority: broadcastForm.priority,
        sendPush: broadcastForm.sendPush
      };

      if (broadcastForm.targetAudience === 'SEGMENT' && broadcastForm.userIds) {
        payload.userIds = broadcastForm.userIds.split(',').map(id => id.trim());
      }

      const result = await notificationService.broadcastNotification(payload);
      
      alert(`✅ Notificaciones enviadas:\n- Total: ${result.results.total}\n- Exitosas: ${result.results.sent}\n- Fallidas: ${result.results.failed}`);
      
      // Limpiar formulario
      setBroadcastForm({
        targetAudience: 'ALL',
        userIds: '',
        type: 'PROMO',
        title: '',
        message: '',
        actionUrl: '',
        priority: 'NORMAL',
        sendPush: true
      });

      loadStats();
    } catch (error: any) {
      console.error('Error en broadcast:', error);
      alert('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al Panel Admin
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Notificaciones</h1>
          <p className="mt-2 text-gray-600">Envía notificaciones individuales o masivas a tus usuarios</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('send')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'send'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Envío Individual
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'broadcast'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Envío Masivo
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Estadísticas
            </button>
          </nav>
        </div>

        {/* Contenido de tabs */}
        {activeTab === 'send' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Enviar Notificación Individual</h2>
            
            <form onSubmit={handleSendIndividual} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID del Usuario *
                </label>
                <input
                  type="text"
                  value={sendForm.userId}
                  onChange={(e) => setSendForm({ ...sendForm, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: clk1234567890"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Notificación *
                </label>
                <select
                  value={sendForm.type}
                  onChange={(e) => setSendForm({ ...sendForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ORDER">Pedidos</option>
                  <option value="DELIVERY">Entregas</option>
                  <option value="PROMO">Promociones</option>
                  <option value="REVIEW">Reseñas</option>
                  <option value="WISHLIST">Lista de Deseos</option>
                  <option value="SYSTEM">Sistema</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título de la notificación"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contenido de la notificación"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Acción (opcional)
                </label>
                <input
                  type="text"
                  value={sendForm.actionUrl}
                  onChange={(e) => setSendForm({ ...sendForm, actionUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/orders/12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={sendForm.priority}
                  onChange={(e) => setSendForm({ ...sendForm, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendPush"
                  checked={sendForm.sendPush}
                  onChange={(e) => setSendForm({ ...sendForm, sendPush: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="sendPush" className="text-sm text-gray-700">
                  Enviar notificación push al dispositivo
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? 'Enviando...' : 'Enviar Notificación'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Envío Masivo de Notificaciones</h2>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800">Advertencia</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esta acción enviará notificaciones a múltiples usuarios. Por favor, revisa cuidadosamente antes de enviar.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audiencia Objetivo *
                </label>
                <select
                  value={broadcastForm.targetAudience}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetAudience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todos los Usuarios</option>
                  <option value="CUSTOMERS">Solo Clientes</option>
                  <option value="DRIVERS">Solo Repartidores</option>
                  <option value="SEGMENT">Segmento Personalizado</option>
                </select>
              </div>

              {broadcastForm.targetAudience === 'SEGMENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IDs de Usuarios (separados por comas) *
                  </label>
                  <textarea
                    value={broadcastForm.userIds}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, userIds: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user1, user2, user3"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Notificación *
                </label>
                <select
                  value={broadcastForm.type}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ORDER">Pedidos</option>
                  <option value="DELIVERY">Entregas</option>
                  <option value="PROMO">Promociones</option>
                  <option value="REVIEW">Reseñas</option>
                  <option value="WISHLIST">Lista de Deseos</option>
                  <option value="SYSTEM">Sistema</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título de la notificación"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contenido de la notificación"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Acción (opcional)
                </label>
                <input
                  type="text"
                  value={broadcastForm.actionUrl}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, actionUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/products/promo-especial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={broadcastForm.priority}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Baja</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="broadcastPush"
                  checked={broadcastForm.sendPush}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, sendPush: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <label htmlFor="broadcastPush" className="text-sm text-gray-700">
                  Enviar notificaciones push a los dispositivos
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? 'Enviando...' : 'Enviar Broadcast'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Tarjetas de estadísticas generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Notificaciones</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">No Leídas</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{stats.unread.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Lectura</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.readRate}%</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Últimas 24h</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{stats.last24Hours.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribución por tipo */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Tipo</h3>
              <div className="space-y-3">
                {stats.byType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-gray-700">{item.type}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(item.count / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium w-16 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución por prioridad */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Prioridad</h3>
              <div className="space-y-3">
                {stats.byPriority.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between">
                    <span className="text-gray-700">{item.priority}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.priority === 'URGENT' ? 'bg-red-600' :
                            item.priority === 'HIGH' ? 'bg-orange-600' :
                            item.priority === 'NORMAL' ? 'bg-blue-600' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${(item.count / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium w-16 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
