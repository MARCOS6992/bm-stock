'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface PoseurStock { id: string; nom: string; couleur: string; disponible: number }

export default function HomePage() {
  const [poseurs, setPoseurs] = useState<PoseurStock[]>([])
  const [totalDispo, setTotalDispo] = useState(0)
  const [receptions, setReceptions] = useState(0)
  const [poses, setPoses] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    const [{ data: units }, { data: posedItems }, { count: recCount }, { count: poseCount }, { data: sts }] = await Promise.all([
      supabase.from('unites').select('id, sous_traitant_id'),
      supabase.from('lignes_pose').select('unite_id'),
      supabase.from('bons_reception').select('*', { count: 'exact', head: true }),
      supabase.from('bons_pose').select('*', { count: 'exact', head: true }),
      supabase.from('sous_traitants').select('*').order('nom'),
    ])

    const posedIds = new Set((posedItems || []).map((lp: any) => lp.unite_id))
    const dispoMap: Record<string, number> = {}
    for (const u of (units || []) as any[]) {
      if (!posedIds.has(u.id)) dispoMap[u.sous_traitant_id] = (dispoMap[u.sous_traitant_id] || 0) + 1
    }

    const poseurList: PoseurStock[] = (sts || []).map((st: any) => ({
      id: st.id, nom: st.nom, couleur: st.couleur, disponible: dispoMap[st.id] || 0,
    }))

    setPoseurs(poseurList)
    setTotalDispo(Object.values(dispoMap).reduce((a, b) => a + b, 0))
    setReceptions(recCount || 0)
    setPoses(poseCount || 0)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">BM Stock — Gestion du matériel</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-1">
          <div className="text-2xl font-bold text-blue-600">{loading ? '…' : totalDispo}</div>
          <div className="text-xs text-gray-500 mt-1">Unités disponibles</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">{loading ? '…' : poses}</div>
          <div className="text-xs text-gray-500 mt-1">Bons de pose</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-purple-600">{loading ? '…' : receptions}</div>
          <div className="text-xs text-gray-500 mt-1">Réceptions</div>
        </div>
      </div>

      {!loading && poseurs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Stock disponible par poseur</h2>
          <div className="grid grid-cols-2 gap-3">
            {poseurs.map((p) => (
              <Link key={p.id} href={`/stock?st=${p.id}`}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3">
                <div className="w-2 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: p.couleur }} />
                <div>
                  <div className={`text-2xl font-bold ${p.disponible === 0 ? 'text-gray-300' : 'text-gray-900'}`}>{p.disponible}</div>
                  <div className="text-xs text-gray-500 leading-tight">{p.nom}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
          <div><div className="font-semibold text-gray-900">Voir tout le stock</div><div className="text-gray-400 text-sm">État des unités par sous-traitant</div></div>
          <span className="text-2xl">📊</span>
        </Link>
      </div>
    </div>
  )
}
