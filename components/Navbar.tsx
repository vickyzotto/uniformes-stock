'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ArrowRightLeft, History, Tag, LayoutDashboard } from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/movimientos', label: 'Movimientos', icon: ArrowRightLeft },
  { href: '/historial', label: 'Historial', icon: History },
  { href: '/precios', label: 'Precios', icon: Tag },
]

export default function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-1 h-14">
          <span className="font-bold text-blue-600 text-lg mr-4">👕 Uniformes</span>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
