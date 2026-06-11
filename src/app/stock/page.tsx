'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SousTraitant, Produit, StockItem } from '@/lib/types'
import PageHeader from '@/components/PageHeader'

interface StockRow {
  produit: Produit
  bySubcontractor: Record<string, number>
  total: number
}

export default function StockPage() {
  const [rows, setRows] = useState<StockRow[]>([])
  const [sousTraitants, setSousTraitants] = useState<SousTraitant[]>([])
  const [filterCategorie, setFilterCategorie] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: sts } = await supabase.from('sous_traitants').select('*').order('nom')
    const { data: produits } = await supabase.from('produits').select('*').order('reference')
    const { data: items } = await supabase
      .from('stock_items')
      .select('*')
      .eq('statut', 'en_stock')

    if (sts) setSousTraitants(sts)

    if (produits && items && sts) {
      const rowData: StockRow[] = produits.map((p) => {
        const bySubcontractor: Record<string, number> = {}
        for (const st of sts) {
          bySubcontractor[st.id] = items.filter(
            (i: StockItem) => i.produit_id === p.id && i.sous_traitant_id === st.id
          ).length
        }
        const total = items.filter((i: StockItem) => i.produit_id === p.id).length
        return { produit: p, bySubcontractor, total }
      })
      setRows(rowData)
    }
    setLoading(false)
  }

  const categories = ['PAC_AIR_EAU', 'SSC', 'BALLON_ELEC', 'KIT_OUTILLAGE', 'ACCESSOIRE']
  const filteredRows = filterCategorie
    ? rows.filter((r) => r.produit.categorie === filterCategorie)
    : rows

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>

  return (
    <div>
      <PageHeader title="Stock global" subtitle="Vue d'ensemble par sous-traitant" />

      <div className="mb-4">
        <select
          value={filterCategorie}
          onChange={(e) => setFilterCategorie(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Référence</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Produit</th>
              {sousTraitants.map((st) => (
                <th key={st.id} className="text-center px-4 py-3 font-semibold" style={{ color: st.couleur }}>
                  {st.nom}
                </th>
              ))}
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Total</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">Seuil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.map((row) => {
              const belowThreshold = row.total <= row.produit.seuil_min
              return (
                <tr key={row.produit.id} className={belowThreshold ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.produit.reference}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {row.produit.nom}
                    {belowThreshold && <span className="ml-2 text-yellow-500 text-xs">⚠ Stock bas</span>}
                  </td>
                  {sousTraitants.map((st) => (
                    <td key={st.id} className="px-4 py-3 text-center">
                      <Link
                        href={`/stock/${st.id}`}
                        className="text-gray-900 hover:text-blue-600 font-medium"
                      >
                        {row.bySubcontractor[st.id] || 0}
                      </Link>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{row.total}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{row.produit.seuil_min}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
