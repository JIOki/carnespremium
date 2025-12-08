'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShareIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  EyeIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import wishlistService, { SharedWishlist } from '@/services/wishlistService';

export default function ShareWishlistPage() {
  const router = useRouter();
  const [myShares, setMyShares] = useState<SharedWishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Formulario de creación
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    allowCopy: true,
    expiresIn: ''
  });

  useEffect(() => {
    loadMyShares();
  }, []);

  const loadMyShares = async () => {
    try {
      setLoading(true);
      const response = await wishlistService.getMyShares();
      if (response.success) {
        setMyShares(response.data);
      }
    } catch (error: any) {
      console.error('Error loading shares:', error);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await wishlistService.shareWishlist({
        ...formData,
        expiresIn: formData.expiresIn ? parseInt(formData.expiresIn) : undefined
      });

      if (response.success) {
        // Copiar URL al portapapeles
        await copyToClipboard(response.data.shareUrl);
        alert('¡Enlace creado y copiado al portapapeles!');
        
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          isPublic: false,
          allowCopy: true,
          expiresIn: ''
        });
        
        await loadMyShares();
      }
    } catch (error) {
      console.error('Error creating share:', error);
      alert('Error al crear el enlace');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (shareId: string) => {
    if (!confirm('¿Estás seguro de eliminar este enlace compartido?')) {
      return;
    }

    try {
      const response = await wishlistService.deleteShare(shareId);
      if (response.success) {
        await loadMyShares();
      }
    } catch (error) {
      console.error('Error deleting share:', error);
      alert('Error al eliminar el enlace');
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  };

  const handleCopyLink = async (url: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      alert('Enlace copiado al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShareIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Compartir Wishlist
              </h1>
            </div>

            <button
              onClick={() => router.push('/wishlist')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Volver a wishlist
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-400">
            Crea enlaces para compartir tu lista de deseos con amigos o familiares
          </p>
        </div>

        {/* Create Button */}
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full mb-6 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-5 h-5" />
            Crear nuevo enlace
          </button>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Crear enlace para compartir
            </h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Mi lista de regalos"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Productos que me gustaría recibir..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiración (opcional)
                </label>
                <select
                  value={formData.expiresIn}
                  onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Sin expiración</option>
                  <option value="1">1 día</option>
                  <option value="7">7 días</option>
                  <option value="30">30 días</option>
                  <option value="90">90 días</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Lista pública (visible en búsquedas)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowCopy}
                    onChange={(e) => setFormData({ ...formData, allowCopy: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Permitir copiar productos
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear enlace'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Shared Links List */}
        {myShares.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sin enlaces compartidos
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Crea tu primer enlace para compartir tu wishlist
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mis enlaces ({myShares.length})
            </h3>

            {myShares.map((share) => (
              <div
                key={share.id}
                className={`bg-white dark:bg-gray-800 rounded-lg p-6 border ${
                  share.isExpired 
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {share.title || 'Mi Lista de Deseos'}
                      </h4>
                      {share.isExpired && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs">
                          Expirado
                        </span>
                      )}
                    </div>
                    {share.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {share.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(share.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Link */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <LinkIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                    {share.shareUrl}
                  </span>
                  <button
                    onClick={() => handleCopyLink(share.shareUrl || '')}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors flex-shrink-0"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Stats and Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4" />
                    <span>{share.viewCount} vistas</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {share.isPublic ? (
                      <>
                        <GlobeAltIcon className="w-4 h-4" />
                        <span>Pública</span>
                      </>
                    ) : (
                      <>
                        <LockClosedIcon className="w-4 h-4" />
                        <span>Privada</span>
                      </>
                    )}
                  </div>

                  {share.expiresAt && (
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      <span>
                        {share.isExpired
                          ? 'Expirado'
                          : `Expira: ${new Date(share.expiresAt).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <span>Creado: {new Date(share.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
