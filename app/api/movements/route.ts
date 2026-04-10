import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('movements_view')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { type, variant_id, warehouse_id, quantity, notes } = body

  let from_warehouse_id = body.from_warehouse_id || null
  let to_warehouse_id = body.to_warehouse_id || null

  if (type === 'entry') {
    to_warehouse_id = warehouse_id
  } else if (type === 'exit') {
    from_warehouse_id = warehouse_id
  }

  if (type === 'entry') {
    const { data: existing } = await supabase
      .from('stock')
      .select('id, quantity')
      .eq('variant_id', variant_id)
      .eq('warehouse_id', to_warehouse_id)
      .maybeSingle()

    if (existing) {
      await supabase.from('stock').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
    } else {
      await supabase.from('stock').insert({ variant_id, warehouse_id: to_warehouse_id, quantity })
    }
  } else if (type === 'exit') {
    const { data: existing } = await supabase
      .from('stock')
      .select('id, quantity')
      .eq('variant_id', variant_id)
      .eq('warehouse_id', from_warehouse_id)
      .maybeSingle()
    if (existing) {
      await supabase.from('stock').update({ quantity: Math.max(0, existing.quantity - quantity) }).eq('id', existing.id)
    }
  } else if (type === 'transfer') {
    const { data: origin } = await supabase
      .from('stock')
      .select('id, quantity')
      .eq('variant_id', variant_id)
      .eq('warehouse_id', from_warehouse_id)
      .maybeSingle()
    if (origin) {
      await supabase.from('stock').update({ quantity: Math.max(0, origin.quantity - quantity) }).eq('id', origin.id)
    }
    const { data: dest } = await supabase
      .from('stock')
      .select('id, quantity')
      .eq('variant_id', variant_id)
      .eq('warehouse_id', to_warehouse_id)
      .maybeSingle()
    if (dest) {
      await supabase.from('stock').update({ quantity: dest.quantity + quantity }).eq('id', dest.id)
    } else {
      await supabase.from('stock').insert({ variant_id, warehouse_id: to_warehouse_id, quantity })
    }
  }

  const { error } = await supabase.from('movements').insert({
    type,
    variant_id,
    from_warehouse_id,
    to_warehouse_id,
    quantity,
    notes: notes || '',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
