'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Stats { stockTotal: number; stockDisponible: number; receptions: number; poses: number }

export default function HomePage() {
  const [stats, setStats] = useState<Stats>({ stockTotal: 0, stockDisponible: 0, receptions: 0, poses: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [{ count: stockTotal }, { count: posedCount }, { count: receptions }, { count: poses }] = await Promise.all([
      supabase.from('unites').select('*', { count: 'exact', head: true }),
      supabase.from('lignes_pose').select('*', { count: 'exact', head: true }),
      supabase.from('bons_reception').select('*', { count: 'exact', head: true }),
      supabase.from('bons_pose').select('*', { count: 'exact', head: true }),
    ])
    setStats({ stockTotal: stockTotal || 0, stockDisponible: (stockTotal || 0) - (posedCount || 0), receptions: receptions || 0, poses: poses || 0 })
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">BM Stock — Gestion du matériel</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{loading ? '…' : stats.stockDisponible}</div>
          <div className="text-sm text-gray-500 mt-1">Unités disponibles</div>
          <div className="text-xs text-gray-400">{loading ? '' : `/ ${stats.stockTotal} total`}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">{loading ? '…' : stats.poses}</div>
          <div className="text-sm text-gray-500 mt-1">Bons de pose</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-purple-600">{loading ? '…' : stats.receptions}</div>
          <div className="text-sm text-gray-500 mt-1">Bons de réception</div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Link href="/receptions/new" className="bg-blue-600 text-white rounded-xl p-4 flex items-center justify-between hover:bg-blue-700 transition-colors">
          <div><div className="font-semibold">Nouveau bon de réception</div><div className="text-blue-100 text-sm">Enregistrer une livraison</div></div>
          <span className="text-2xl">📦</span>
        </Link>
        <Link href="/poses/new" className="bg-green-600 text-white rounded-xl p-4 flex items-center justify-between hover:bg-green-700 transition-colors">
          <div><div className="font-semibold">Nouveau bon de pose</div><div className="text-green-100 text-sm">Enregistrer une installation</div></div>
          <span className="text-2xl">🔧</span>
        </Link>
        <Link href="/stock" className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div><div className="font-semibold text-gray-900">Voir le stock</div><div className="text-gray-400 text-sm">État des unités par sous-traitant</div></div>
          <span className="text-2xl">📊</span>
        </Link>
      </div>
    </div>
  )
}
