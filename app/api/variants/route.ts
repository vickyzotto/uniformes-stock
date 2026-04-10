import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  const body = await req.json()
  const { data: variant, error } = await supabase
    .from('variants')
    .insert({ product_id: body.product_id, size: body.size, color: body.color, cost: body.cost, price: body.price })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Inicializar stock en 0 para todos los depósitos
  const { data: warehouses } = await supabase.from('warehouses').select('id')
  if (warehouses) {
    await supabase.from('stock').insert(
      warehouses.map(w => ({ variant_id: variant.id, warehouse_id: w.id, quantity: 0 }))
    )
  }

  return NextResponse.json(variant)
}
