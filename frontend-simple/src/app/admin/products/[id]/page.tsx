'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  weight?: number;
  isDefault: boolean;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  categoryId: string;
  imageUrl?: string;
  isActive: boolean;
  isFeatured: boolean;
  unit: string;
  variants: Variant[];
  category?: { name: string };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Estado para el gestor de variantes
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [variantForm, setVariantForm] = useState({
    name: '',
    sku: '',
    price: '',
    comparePrice: '',
    stock: '',
    weight: '',
    isDefault: false,
    isActive: true
  });
  const [savingVariant, setSavingVariant] = useState(false);

  const fetchProduct = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/products/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProduct(data.data);
      }
    } catch (err) {
      console.error('Error fetching product:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/products/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/categories`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (!productRes.ok) throw new Error('No se pudo cargar el producto');

        const productData = await productRes.json();
        setProduct(productData.data);

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.data || categoriesData || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchData();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product) return;

    setSaving(true);
    setError(null);

    const token = localStorage.getItem('token');
    const formData = new FormData(e.currentTarget);

    try {
      const productData = {
        name: formData.get('name') as string,
        slug: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
        description: formData.get('description') as string,
        sku: formData.get('sku') as string,
        categoryId: formData.get('categoryId') as string,
        imageUrl: formData.get('imageUrl') as string,
        isActive: formData.get('isActive') === 'on',
        isFeatured: formData.get('isFeatured') === 'on',
        unit: formData.get('unit') as string,
      };

      const response = await fetch(`${API_URL}/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al actualizar');
      }

      alert('Producto actualizado exitosamente');
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  // Funciones para gestionar variantes
  const openAddVariant = () => {
    setEditingVariant(null);
    setVariantForm({
      name: '',
      sku: product ? `${product.sku}-VAR-${Date.now().toString().slice(-4)}` : '',
      price: '',
      comparePrice: '',
      stock: '0',
      weight: '',
      isDefault: false,
      isActive: true
    });
    setShowVariantModal(true);
  };

  const openEditVariant = (variant: Variant) => {
    setEditingVariant(variant);
    setVariantForm({
      name: variant.name,
      sku: variant.sku,
      price: variant.price.toString(),
      comparePrice: variant.comparePrice?.toString() || '',
      stock: variant.stock.toString(),
      weight: variant.weight?.toString() || '',
      isDefault: variant.isDefault,
      isActive: variant.isActive
    });
    setShowVariantModal(true);
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSavingVariant(true);
    const token = localStorage.getItem('token');

    try {
      const data: any = {
        name: variantForm.name,
        sku: variantForm.sku,
        price: parseFloat(variantForm.price),
        stock: parseInt(variantForm.stock),
        isActive: variantForm.isActive
      };
      
      if (variantForm.comparePrice) {
        data.comparePrice = parseFloat(variantForm.comparePrice);
      }
      if (variantForm.weight) {
        data.weight = parseFloat(variantForm.weight);
      }

      const url = editingVariant
        ? `${API_URL}/admin/products/${product.id}/variants/${editingVariant.id}`
        : `${API_URL}/admin/products/${product.id}/variants`;

      const response = await fetch(url, {
        method: editingVariant ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al guardar variante');
      }

      await fetchProduct();
      setShowVariantModal(false);
      alert(editingVariant ? 'Variante actualizada' : 'Variante creada');
    } catch (err: any) {
      alert(err.message || 'Error al guardar variante');
    } finally {
      setSavingVariant(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!product) return;
    if (!confirm('¿Estás seguro de eliminar esta variante?')) return;

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(
        `${API_URL}/admin/products/${product.id}/variants/${variantId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Error al eliminar variante');

      await fetchProduct();
      alert('Variante eliminada');
    } catch (err: any) {
      alert(err.message || 'Error al eliminar variante');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Producto no encontrado'}</p>
        <Link href="/admin/products" className="text-red-600 hover:underline">
          Volver a productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-gray-600 hover:text-red-600 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a productos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
        <p className="mt-1 text-sm text-gray-500">Modifica la informacion del producto</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Nombre del Producto *</label>
            <input
              type="text"
              name="name"
              defaultValue={product.name}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">SKU *</label>
            <input
              type="text"
              name="sku"
              defaultValue={product.sku}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Categoria *</label>
            <select
              name="categoryId"
              defaultValue={product.categoryId}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Seleccionar categoria...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripcion</label>
            <textarea
              name="description"
              defaultValue={product.description || ''}
              rows={4}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">URL de Imagen</label>
            <input
              type="url"
              name="imageUrl"
              defaultValue={product.imageUrl || ''}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Unidad</label>
            <select
              name="unit"
              defaultValue={product.unit}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="kg">Kilogramo</option>
              <option value="g">Gramo</option>
              <option value="lb">Libra</option>
              <option value="unit">Unidad</option>
            </select>
          </div>
        </div>

        {/* Gestor de Variantes */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Variantes del Producto</h3>
            <button
              type="button"
              onClick={openAddVariant}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar Variante
            </button>
          </div>

          {product.variants.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay variantes. Agrega al menos una variante con precio y stock.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {product.variants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{variant.name}</span>
                          {variant.isDefault && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Principal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {variant.sku}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">${variant.price.toFixed(2)}</span>
                        {variant.comparePrice && (
                          <span className="ml-2 text-xs text-gray-400 line-through">
                            ${variant.comparePrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-medium ${variant.stock > 10 ? 'text-green-600' : variant.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {variant.stock} uds
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${variant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {variant.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => openEditVariant(variant)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={product.isActive}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Producto activo</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={product.isFeatured}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Producto destacado</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>

      {/* Modal para agregar/editar variante */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {editingVariant ? 'Editar Variante' : 'Nueva Variante'}
              </h3>
              <button
                type="button"
                onClick={() => setShowVariantModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVariantSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  required
                  placeholder="Ej: 500g, Grande, Premium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Anterior</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variantForm.comparePrice}
                    onChange={(e) => setVariantForm({ ...variantForm, comparePrice: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input
                    type="number"
                    value={variantForm.stock}
                    onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={variantForm.weight}
                    onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={variantForm.isDefault}
                    onChange={(e) => setVariantForm({ ...variantForm, isDefault: e.target.checked })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Variante principal</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={variantForm.isActive}
                    onChange={(e) => setVariantForm({ ...variantForm, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Activa</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingVariant}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {savingVariant ? 'Guardando...' : editingVariant ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
