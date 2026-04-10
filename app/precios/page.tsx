'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, TrendingUp } from 'lucide-react'

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

export default function Precios() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, { cost: string; price: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const load = () => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false) })
  }
  useEffect(() => { load() }, [])

  const handleChange = (variantId: string, field: 'cost' | 'price', value: string) => {
    setEdits(prev => ({
      ...prev,
      [variantId]: { ...prev[variantId], [field]: value }
    }))
  }

  const saveVariant = async (variant: Variant) => {
    const edit = edits[variant.id]
    if (!edit) return
    const newCost = edit.cost !== undefined ? parseFloat(edit.cost) : variant.cost
    const newPrice = edit.price !== undefined ? parseFloat(edit.price) : variant.price
    if (isNaN(newCost) || isNaN(newPrice)) return

    setSaving(variant.id)
    await fetch(`/api/variants/${variant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cost: newCost,
        price: newPrice,
        old_cost: variant.cost,
        old_price: variant.price,
      })
    })
    setSaving(null)
    setSaved(variant.id)
    setEdits(prev => { const next = { ...prev }; delete next[variant.id]; return next })
    setTimeout(() => setSaved(null), 2000)
    load()
  }

  const applyMarkup = (variantId: string, currentCost: number, percent: number) => {
    const costStr = edits[variantId]?.cost
    const cost = costStr !== undefined ? parseFloat(costStr) : currentCost
    const newPrice = Math.round(cost * (1 + percent / 100))
    setEdits(prev => ({
      ...prev,
      [variantId]: { cost: prev[variantId]?.cost ?? String(currentCost), price: String(newPrice) }
    }))
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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Precios y costos</h1>
        <span className="text-sm text-gray-400">Editá y guardá por variante</span>
      </div>

      {products.map(product => (
        <div key={product.id} className="card overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp size={15} className="text-gray-400" />
            <span className="font-semibold text-gray-700">{product.name}</span>
            {product.category && <span className="text-xs text-gray-400">· {product.category}</span>}
          </div>
          {product.variants.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-400">Sin variantes cargadas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-400 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Talle</th>
                    <th className="px-4 py-2 text-left">Color</th>
                    <th className="px-4 py-2 text-left">Costo actual</th>
                    <th className="px-4 py-2 text-left">Precio actual</th>
                    <th className="px-4 py-2 text-left w-36">Nuevo costo</th>
                    <th className="px-4 py-2 text-left w-36">Nuevo precio</th>
                    <th className="px-4 py-2 text-left">Markup rápido</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {product.variants.map(v => {
                    const edit = edits[v.id]
                    const hasEdit = edit && (
                      (edit.cost !== undefined && edit.cost !== '' && parseFloat(edit.cost) !== v.cost) ||
                      (edit.price !== undefined && edit.price !== '' && parseFloat(edit.price) !== v.price)
                    )
                    return (
                      <tr key={v.id} className={`hover:bg-gray-50 ${hasEdit ? 'bg-yellow-50' : ''}`}>
                        <td className="px-4 py-2.5">{v.size}</td>
                        <td className="px-4 py-2.5">{v.color}</td>
                        <td className="px-4 py-2.5 text-gray-400">{formatPeso(v.cost)}</td>
                        <td className="px-4 py-2.5 text-gray-400">{formatPeso(v.price)}</td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number" min="0" className="input w-32"
                            placeholder={String(v.cost)}
                            value={edit?.cost ?? ''}
                            onChange={e => handleChange(v.id, 'cost', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="number" min="0" className="input w-32"
                            placeholder={String(v.price)}
                            value={edit?.price ?? ''}
                            onChange={e => handleChange(v.id, 'price', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1">
                            {[50, 80, 100, 150].map(pct => (
                              <button
                                key={pct}
                                onClick={() => applyMarkup(v.id, v.cost, pct)}
                                className="text-xs px-1.5 py-1 bg-gray-100 text-gray-600 rounded hover:bg-blue-100 hover:text-blue-700"
                              >
                                +{pct}%
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          {saved === v.id ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={14} /> Guardado</span>
                          ) : (
                            <button
                              className={`btn-primary text-xs py-1 px-3 ${!hasEdit ? 'opacity-30 cursor-not-allowed' : ''}`}
                              disabled={!hasEdit || saving === v.id}
                              onClick={() => saveVariant(v)}
                            >
                              {saving === v.id ? '...' : 'Guardar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
