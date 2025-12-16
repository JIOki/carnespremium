'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
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

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/products/${params.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('No se pudo cargar el producto');

        const data = await response.json();
        setProduct(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchProduct();
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/admin/products/${product.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error al actualizar');
      }

      // Actualizar variante principal si existe
      if (product.variants[0]) {
        const variantData = {
          name: formData.get('variantName') as string,
          price: parseFloat(formData.get('price') as string),
          stock: parseInt(formData.get('stock') as string),
        };

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/admin/products/${product.id}/variants/${product.variants[0].id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(variantData)
          }
        );
      }

      alert('Producto actualizado exitosamente');
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el producto');
    } finally {
      setSaving(false);
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

  const mainVariant = product.variants[0];

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
            <label className="block text-sm font-medium text-gray-700">Categoria ID *</label>
            <input
              type="text"
              name="categoryId"
              defaultValue={product.categoryId}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            {product.category && (
              <p className="mt-1 text-xs text-gray-500">Actual: {product.category.name}</p>
            )}
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

        {mainVariant && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Variante Principal</h3>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre Variante</label>
                <input
                  type="text"
                  name="variantName"
                  defaultValue={mainVariant.name}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Precio *</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  defaultValue={mainVariant.price}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Stock *</label>
                <input
                  type="number"
                  name="stock"
                  defaultValue={mainVariant.stock}
                  required
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
}