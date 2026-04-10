'use client'
import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, CheckCircle } from 'lucide-react'

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
  variants: Variant[]
}
interface Warehouse {
  id: string
  name: string
}

type MovType = 'entry' | 'exit' | 'transfer'

const TYPES = [
  { id: 'entry' as MovType, label: 'Ingreso', icon: ArrowDownCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  { id: 'exit' as MovType, label: 'Egreso / Venta', icon: ArrowUpCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  { id: 'transfer' as MovType, label: 'Transferencia', icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
]

export default function Movimientos() {
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const [type, setType] = useState<MovType>('entry')
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/warehouses').then(r => r.json()),
    ]).then(([p, w]) => {
      setProducts(p)
      setWarehouses(w)
      setLoading(false)
    })
  }, [])

  const selectedProduct = products.find(p => p.id === productId)
  const selectedVariant = selectedProduct?.variants.find(v => v.id === variantId)

  const handleSubmit = async () => {
    if (!variantId || !quantity || !warehouseId) return
    if (type === 'transfer' && !toWarehouseId) return
    setSaving(true)
    await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        variant_id: variantId,
        from_warehouse_id: type === 'transfer' ? warehouseId : type === 'exit' ? warehouseId : null,
        to_warehouse_id: type === 'transfer' ? toWarehouseId : type === 'entry' ? warehouseId : null,
        warehouse_id: warehouseId,
        quantity: parseInt(quantity),
        notes,
      })
    })
    setSaving(false)
    setSaved(true)
    setQuantity('')
    setNotes('')
    setTimeout(() => setSaved(false), 3000)
  }

  const formatPeso = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Registrar movimiento</h1>

      <div className="grid grid-cols-3 gap-3">
        {TYPES.map(({ id, label, icon: Icon, color, bg }) => (
          <button
            key={id}
            onClick={() => setType(id)}
            className={`card p-4 flex flex-col items-center gap-2 border-2 transition-all ${type === id ? bg + ' border-current ' + color : 'border-transparent hover:border-gray-200'}`}
          >
            <Icon size={24} className={type === id ? color : 'text-gray-400'} />
            <span className={`text-sm font-medium ${type === id ? color : 'text-gray-500'}`}>{label}</span>
          </button>
        ))}
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Producto *</label>
          <select className="input" value={productId} onChange={e => { setProductId(e.target.value); setVariantId('') }}>
            <option value="">— Seleccionar producto —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div>
            <label className="label">Variante (talle / color) *</label>
            <select className="input" value={variantId} onChange={e => setVariantId(e.target.value)}>
              <option value="">— Seleccionar variante —</option>
              {selectedProduct.variants.map(v => (
                <option key={v.id} value={v.id}>{v.size} / {v.color} — costo {formatPeso(v.cost)} — precio {formatPeso(v.price)}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">
            {type === 'entry' ? 'Depósito destino *' : 'Depósito origen *'}
          </label>
          <select className="input" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
            <option value="">— Seleccionar depósito —</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {type === 'transfer' && (
          <div>
            <label className="label">Depósito destino *</label>
            <select className="input" value={toWarehouseId} onChange={e => setToWarehouseId(e.target.value)}>
              <option value="">— Seleccionar depósito —</option>
              {warehouses.filter(w => w.id !== warehouseId).map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Cantidad *</label>
          <input
            className="input"
            type="number"
            min="1"
            placeholder="0"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
        </div>

        {type === 'entry' && selectedVariant && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            Costo unitario: <strong>{formatPeso(selectedVariant.cost)}</strong> — Precio venta: <strong className="text-green-600">{formatPeso(selectedVariant.price)}</strong>
            <span className="text-xs text-gray-400 ml-2">(Actualizá los precios en la sección Precios)</span>
          </div>
        )}

        <div>
          <label className="label">Notas (opcional)</label>
          <input className="input" placeholder="Ej: Compra proveedor X, venta cliente Y..." value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <button
          className="btn-primary w-full flex items-center justify-center gap-2"
          onClick={handleSubmit}
          disabled={saving || !variantId || !quantity || !warehouseId || (type === 'transfer' && !toWarehouseId)}
        >
          {saving ? 'Guardando...' : `Registrar ${TYPES.find(t => t.id === type)?.label}`}
        </button>

        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle size={16} /> Movimiento registrado correctamente
          </div>
        )}
      </div>
    </div>
  )
}
