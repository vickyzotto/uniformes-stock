'use client'
import { useEffect, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft, Tag, Filter } from 'lucide-react'

interface Movement {
  id: string
  type: string
  product_name: string
  size: string
  color: string
  quantity: number
  old_cost: number
  new_cost: number
  old_price: number
  new_price: number
  from_warehouse: string
  to_warehouse: string
  notes: string
  created_at: string
}

const BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  entry: { label: 'Ingreso', className: 'badge-entry', icon: ArrowDownCircle },
  exit: { label: 'Egreso', className: 'badge-exit', icon: ArrowUpCircle },
  transfer: { label: 'Transferencia', className: 'badge-transfer', icon: ArrowRightLeft },
  price_update: { label: 'Actualiz. precio', className: 'badge-price', icon: Tag },
}

export default function Historial() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetch('/api/movements')
      .then(r => r.json())
      .then(data => { setMovements(data); setLoading(false) })
  }, [])

  const filtered = movements.filter(m => {
    const search = filter.toLowerCase()
    const matchText = !filter || [m.product_name, m.size, m.color, m.notes, m.from_warehouse, m.to_warehouse]
      .filter(Boolean).some(s => s?.toLowerCase().includes(search))
    const matchType = !typeFilter || m.type === typeFilter
    return matchText && matchType
  })

  const formatPeso = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Historial de movimientos</h1>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter size={16} />
        </div>
        <input
          className="input flex-1"
          placeholder="Buscar por producto, talle, color, notas..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <select className="input sm:w-48" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="entry">Ingresos</option>
          <option value="exit">Egresos</option>
          <option value="transfer">Transferencias</option>
          <option value="price_update">Actualizaciones precio</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No hay movimientos{filter || typeFilter ? ' con esos filtros' : ' registrados'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Talle / Color</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                  <th className="px-4 py-3 text-left">Desde</th>
                  <th className="px-4 py-3 text-left">Hacia</th>
                  <th className="px-4 py-3 text-left">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(m => {
                  const badge = BADGE[m.type] || BADGE.entry
                  const Icon = badge.icon
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-2.5">
                        <span className={badge.className + ' flex items-center gap-1 w-fit'}>
                          <Icon size={11} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-gray-800">{m.product_name || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{m.size && m.color ? `${m.size} / ${m.color}` : '—'}</td>
                      <td className="px-4 py-2.5 text-right font-medium">
                        {m.type === 'price_update' ? (
                          <span className="text-yellow-600 text-xs">
                            {formatPeso(m.old_cost)} → {formatPeso(m.new_cost)}
                          </span>
                        ) : m.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{m.from_warehouse || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{m.to_warehouse || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{m.notes || ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-right">{filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  )
}
