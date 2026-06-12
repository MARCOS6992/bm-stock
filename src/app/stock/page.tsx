'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Produit, SousTraitant } from '@/lib/types'
import PageHeader from '@/components/PageHeader'

interface StockRow {
  produit: Produit
  sousTraitant: SousTraitant
  total: number
  disponible: number
  pose: number
}

export default function StockPage() {
  const [rows, setRows] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: units } = await supabase
      .from('unites')
      .select('*, produit:produits(*), sous_traitant:sous_traitants(*)')

    const { data: posedItems } = await supabase.from('lignes_pose').select('unite_id')

    if (!units) { setLoading(false); return }

    const posedIds = new Set((posedItems || []).map((lp: any) => lp.unite_id))
    const groupMap: Record<string, StockRow> = {}

    for (const u of units as any[]) {
      if (!u.produit || !u.sous_traitant) continue
      const key = `${u.reference_id}-${u.sous_traitant_id}`
      if (!groupMap[key]) {
        groupMap[key] = { produit: u.produit, sousTraitant: u.sous_traitant, total: 0, disponible: 0, pose: 0 }
      }
      groupMap[key].total++
      if (posedIds.has(u.id)) groupMap[key].pose++
      else groupMap[key].disponible++
    }

    setRows(Object.values(groupMap).sort((a, b) => a.produit.designation.localeCompare(b.produit.designation)))
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>

  return (
    <div>
      <PageHeader title="Stock" subtitle={`${rows.length} ligne${rows.length !== 1 ? 's' : ''}`} />
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">Aucun article en stock</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left font-semibold">Produit</th>
                <th className="px-4 py-3 text-left font-semibold">Sous-traitant</th>
                <th className="px-4 py-3 text-center font-semibold">Total</th>
                <th className="px-4 py-3 text-center font-semibold">Disponible</th>
                <th className="px-4 py-3 text-center font-semibold">Posé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{row.produit.designation}</div>
                    <div className="text-xs text-gray-400 font-mono">{row.produit.ref}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded text-white text-xs font-medium" style={{ backgroundColor: row.sousTraitant.couleur }}>
                      {row.sousTraitant.nom}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{row.total}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${
                      row.disponible === 0 ? 'text-red-500' :
                      row.disponible <= row.produit.seuil_min ? 'text-orange-500' : 'text-green-600'
                    }`}>{row.disponible}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">{row.pose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
