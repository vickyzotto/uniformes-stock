'use client'
import { useEffect, useState } from 'react'
import { Package, TrendingDown, Warehouse, AlertTriangle } from 'lucide-react'

interface StockItem {
  product_name: string
  category: string
  size: string
  color: string
  cost: number
  price: number
  warehouse_name: string
  quantity: number
}

interface WarehouseSummary {
  name: string
  totalItems: number
  totalValue: number
  lowStock: number
}

export default function Dashboard() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stock')
      .then(r => r.json())
      .then(data => { setStock(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const warehouses = ['Depósito 1', 'Depósito 2']
  const summaries: WarehouseSummary[] = warehouses.map(name => {
    const items = stock.filter(s => s.warehouse_name === name)
    return {
      name,
      totalItems: items.reduce((a, b) => a + b.quantity, 0),
      totalValue: items.reduce((a, b) => a + b.quantity * b.cost, 0),
      lowStock: items.filter(s => s.quantity > 0 && s.quantity <= 5).length,
    }
  })

  const lowStockItems = stock.filter(s => s.quantity > 0 && s.quantity <= 5)
  const outOfStock = stock.filter(s => s.quantity === 0)

  const formatPeso = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Resumen depósitos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {summaries.map(s => (
          <div key={s.name} className="card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Warehouse size={20} className="text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-800">{s.name}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.totalItems}</p>
                <p className="text-xs text-gray-500 mt-0.5">unidades</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{formatPeso(s.totalValue)}</p>
                <p className="text-xs text-gray-500 mt-0.5">valor costo</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.lowStock > 0 ? 'text-amber-500' : 'text-gray-400'}`}>{s.lowStock}</p>
                <p className="text-xs text-gray-500 mt-0.5">stock bajo</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {(lowStockItems.length > 0 || outOfStock.length > 0) && (
        <div className="space-y-3">
          {outOfStock.length > 0 && (
            <div className="card p-4 border-red-200 bg-red-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-600" />
                <h3 className="font-semibold text-red-800">Sin stock ({outOfStock.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {outOfStock.slice(0, 10).map((item, i) => (
                  <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    {item.product_name} - {item.size} {item.color} ({item.warehouse_name})
                  </span>
                ))}
                {outOfStock.length > 10 && <span className="text-xs text-red-500">+{outOfStock.length - 10} más</span>}
              </div>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className="card p-4 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown size={16} className="text-amber-600" />
                <h3 className="font-semibold text-amber-800">Stock bajo — 5 o menos ({lowStockItems.length})</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.slice(0, 10).map((item, i) => (
                  <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                    {item.product_name} - {item.size} {item.color}: {item.quantity} u ({item.warehouse_name})
                  </span>
                ))}
                {lowStockItems.length > 10 && <span className="text-xs text-amber-500">+{lowStockItems.length - 10} más</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de stock */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-800">Stock actual</h2>
        </div>
        <div className="overflow-x-auto">
          {stock.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package size={40} className="mx-auto mb-2 opacity-30" />
              <p>No hay stock cargado aún</p>
              <p className="text-sm mt-1">Agregá productos y registrá ingresos para empezar</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Talle</th>
                  <th className="px-4 py-3 text-left">Color</th>
                  <th className="px-4 py-3 text-right">Depósito 1</th>
                  <th className="px-4 py-3 text-right">Depósito 2</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Costo</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupStock(stock).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.product_name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.size}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.color}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-medium ${row.dep1 === 0 ? 'text-red-400' : row.dep1 <= 5 ? 'text-amber-500' : 'text-gray-800'}`}>
                        {row.dep1}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-medium ${row.dep2 === 0 ? 'text-red-400' : row.dep2 <= 5 ? 'text-amber-500' : 'text-gray-800'}`}>
                        {row.dep2}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">{row.dep1 + row.dep2}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{formatPeso(row.cost)}</td>
                    <td className="px-4 py-2.5 text-right text-green-600 font-medium">{formatPeso(row.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function groupStock(stock: StockItem[]) {
  const map = new Map<string, { product_name: string; size: string; color: string; cost: number; price: number; dep1: number; dep2: number }>()
  for (const item of stock) {
    const key = `${item.product_name}|${item.size}|${item.color}`
    if (!map.has(key)) map.set(key, { product_name: item.product_name, size: item.size, color: item.color, cost: item.cost, price: item.price, dep1: 0, dep2: 0 })
    const row = map.get(key)!
    if (item.warehouse_name === 'Depósito 1') row.dep1 = item.quantity
    else row.dep2 = item.quantity
  }
  return Array.from(map.values())
}
