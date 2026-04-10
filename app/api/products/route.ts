import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, category, variants(id, size, color, cost, price)')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabase
    .from('products')
    .insert({ name: body.name, category: body.category || '' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
