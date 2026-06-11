'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
const navItems = [
  { href: '/', label: 'Tableau de bord', icon: '📊' },
  { href: '/stock', label: 'Stock', icon: '📦' },
  { href: '/receptions', label: 'Réceptions', icon: '📥' },
  { href: '/poses', label: 'Poses', icon: '🔧' },
  { href: '/historique', label: 'Historique', icon: '📋' },
  { href: '/parametres', label: 'Paramètres', icon: '⚙️' },
]
export default function Navigation() {
  const pathname = usePathname()
  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-gray-900 text-white flex-col z-50">
        <div className="p-6 border-b border-gray-700"><h1 className="text-xl font-bold text-blue-400">BM Stock</h1><p className="text-xs text-gray-400 mt-1">Gestion de stock PAC</p></div>
        <nav className="flex-1 p-4"><ul className="space-y-1">{navItems.map(item => { const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)); return (<li key={item.href}><Link href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}><span>{item.icon}</span><span className="font-medium">{item.label}</span></Link></li>) })}</ul></nav>
      </aside>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <ul className="flex">{navItems.map(item => { const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)); return (<li key={item.href} className="flex-1"><Link href={item.href} className={`flex flex-col items-center justify-center py-2 px-1 text-xs ${active ? 'text-blue-600' : 'text-gray-500'}`}><span className="text-lg">{item.icon}</span><span className="truncate w-full text-center">{item.label.split(' ')[0]}</span></Link></li>) })}</ul>
      </nav>
    </>
  )
}