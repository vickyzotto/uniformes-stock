'use client'
import { useEffect, useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Trash2, Edit2, Check, X } from 'lucide-react'

interface Variant {
  id: string
  size: string
  color: string
  cost: number
  price: number
}

interface Product {
  id: string
  name: string
  category: string
  variants: Variant[]
}

export default function Productos() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', category: '' })
  const [newVariant, setNewVariant] = useState<{ [productId: string]: { size: string; color: string; cost: string; price: string } }>({})
  const [editingProduct, setEditingProduct] = useState<{ id: string; name: string; category: string } | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const createProduct = async () => {
    if (!newProduct.name.trim()) return
    setSaving(true)
    await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct) })
    setNewProduct({ name: '', category: '' })
    setShowNewProduct(false)
    setSaving(false)
    load()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar el producto y todas sus variantes?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    load()
  }

  const saveProductEdit = async () => {
    if (!editingProduct) return
    await fetch(`/api/products/${editingProduct.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingProduct.name, category: editingProduct.category })
    })
    setEditingProduct(null)
    load()
  }

  const addVariant = async (productId: string) => {
    const v = newVariant[productId]
    if (!v?.size || !v?.color) return
    await fetch('/api/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        size: v.size,
        color: v.color,
        cost: parseFloat(v.cost) || 0,
        price: parseFloat(v.price) || 0,
      })
    })
    setNewVariant(prev => ({ ...prev, [productId]: { size: '', color: '', cost: '', price: '' } }))
    load()
  }

  const deleteVariant = async (id: string) => {
    if (!confirm('¿Eliminar esta variante?')) return
    await fetch(`/api/variants/${id}`, { method: 'DELETE' })
    load()
  }

  const formatPeso = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowNewProduct(true)}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {showNewProduct && (
        <div className="card p-4 border-blue-200 bg-blue-50">
          <h3 className="font-semibold text-blue-800 mb-3">Nuevo producto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" placeholder="Ej: Remera polo" value={newProduct.name}
                onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && createProduct()} />
            </div>
            <div>
              <label className="label">Categoría</label>
              <input className="input" placeholder="Ej: Remeras, Pantalones..." value={newProduct.category}
                onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={createProduct} disabled={saving}>Guardar</button>
            <button className="btn-secondary" onClick={() => setShowNewProduct(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-lg font-medium">No hay productos</p>
          <p className="text-sm mt-1">Hacé clic en "Nuevo producto" para empezar</p>
        </div>
      )}

      {products.map(product => (
        <div key={product.id} className="card overflow-hidden">
          <div
            className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleExpand(product.id)}
          >
            {expanded.has(product.id) ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            {editingProduct?.id === product.id ? (
              <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                <input className="input" value={editingProduct.name}
                  onChange={e => setEditingProduct(p => p ? { ...p, name: e.target.value } : p)} />
                <input className="input" placeholder="Categoría" value={editingProduct.category}
                  onChange={e => setEditingProduct(p => p ? { ...p, category: e.target.value } : p)} />
                <button onClick={saveProductEdit} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <span className="font-semibold text-gray-800">{product.name}</span>
                {product.category && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{product.category}</span>
                )}
                <span className="text-sm text-gray-400 ml-auto">{product.variants.length} variante{product.variants.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={e => { e.stopPropagation(); setEditingProduct({ id: product.id, name: product.name, category: product.category }) }}
                  className="text-gray-400 hover:text-blue-600 p-1"
                ><Edit2 size={14} /></button>
                <button
                  onClick={e => { e.stopPropagation(); deleteProduct(product.id) }}
                  className="text-gray-400 hover:text-red-600 p-1"
                ><Trash2 size={14} /></button>
              </div>
            )}
          </div>

          {expanded.has(product.id) && (
            <div className="border-t border-gray-100">
              {product.variants.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">Talle</th>
                      <th className="px-4 py-2 text-left">Color</th>
                      <th className="px-4 py-2 text-right">Costo</th>
                      <th className="px-4 py-2 text-right">Precio venta</th>
                      <th className="px-4 py-2 text-right">Margen</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {product.variants.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">{v.size}</td>
                        <td className="px-4 py-2.5">{v.color}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatPeso(v.cost)}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-green-600">{formatPeso(v.price)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400 text-xs">
                          {v.cost > 0 ? `${Math.round((v.price - v.cost) / v.cost * 100)}%` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => deleteVariant(v.id)} className="text-gray-300 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Agregar variante</p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    className="input w-24" placeholder="Talle"
                    value={newVariant[product.id]?.size || ''}
                    onChange={e => setNewVariant(prev => ({ ...prev, [product.id]: { ...prev[product.id] || { size: '', color: '', cost: '', price: '' }, size: e.target.value } }))}
                  />
                  <input
                    className="input w-28" placeholder="Color"
                    value={newVariant[product.id]?.color || ''}
                    onChange={e => setNewVariant(prev => ({ ...prev, [product.id]: { ...prev[product.id] || { size: '', color: '', cost: '', price: '' }, color: e.target.value } }))}
                  />
                  <input
                    className="input w-32" placeholder="Costo $"
                    type="number" min="0"
                    value={newVariant[product.id]?.cost || ''}
                    onChange={e => setNewVariant(prev => ({ ...prev, [product.id]: { ...prev[product.id] || { size: '', color: '', cost: '', price: '' }, cost: e.target.value } }))}
                  />
                  <input
                    className="input w-32" placeholder="Precio venta $"
                    type="number" min="0"
                    value={newVariant[product.id]?.price || ''}
                    onChange={e => setNewVariant(prev => ({ ...prev, [product.id]: { ...prev[product.id] || { size: '', color: '', cost: '', price: '' }, price: e.target.value } }))}
                  />
                  <button className="btn-primary" onClick={() => addVariant(product.id)}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
