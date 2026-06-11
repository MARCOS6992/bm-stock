'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SousTraitant, Produit, StockItem, BonPose } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface GroupedItem {
  produit: Produit
  items: StockItem[]
  expanded: boolean
}

export default function FicheSousTraitant() {
  const { id } = useParams<{ id: string }>()
  const [sousTraitant, setSousTraitant] = useState<SousTraitant | null>(null)
  const [groups, setGroups] = useState<GroupedItem[]>([])
  const [poses, setPoses] = useState<(BonPose & { items: any[] })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    const { data: st } = await supabase.from('sous_traitants').select('*').eq('id', id).single()
    if (!st) { setLoading(false); return }
    setSousTraitant(st)

    const { data: items } = await supabase
      .from('stock_items')
      .select('*, produit:produits(*)')
      .eq('sous_traitant_id', id)
      .eq('statut', 'en_stock')
      .order('date_entree', { ascending: false })

    if (items) {
      const produitMap: Record<string, { produit: Produit; items: StockItem[] }> = {}
      for (const item of items as (StockItem & { produit: Produit })[]) {
        if (!item.produit) continue
        if (!produitMap[item.produit_id]) {
          produitMap[item.produit_id] = { produit: item.produit, items: [] }
        }
        produitMap[item.produit_id].items.push(item)
      }
      setGroups(Object.values(produitMap).map(g => ({ ...g, expanded: false })))
    }

    const { data: bonspose } = await supabase
      .from('bons_pose')
      .select('*')
      .eq('sous_traitant_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (bonspose) {
      const posesWithItems = await Promise.all(bonspose.map(async (bp) => {
        const { data: bpItems } = await supabase
          .from('bons_pose_items')
          .select('*, produit:produits(*)')
          .eq('bon_pose_id', bp.id)
        return { ...bp, items: bpItems || [] }
      }))
      setPoses(posesWithItems)
    }

    setLoading(false)
  }

  function toggleGroup(produitId: string) {
    setGroups(prev => prev.map(g => g.produit.id === produitId ? { ...g, expanded: !g.expanded } : g))
  }

  if (loading) return <div className="text-center py-10 text-gray-500">Chargement...</div>
  if (!sousTraitant) return <div className="text-center py-10 text-gray-500">Sous-traitant introuvable</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/stock" className="text-gray-400 hover:text-gray-600 text-sm">← Stock</Link>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: sousTraitant.couleur }}
          >
            {sousTraitant.nom[0]}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{sousTraitant.nom}</h1>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Stock actuel — {groups.reduce((acc, g) => acc + g.items.length, 0)} articles
        </h2>
        {groups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
            Aucun article en stock
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {groups.map(group => (
              <div key={group.produit.id}>
                <button
                  onClick={() => toggleGroup(group.produit.id)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <span className="font-medium text-gray-900">{group.produit.nom}</span>
                    <span className="ml-2 text-xs text-gray-400">{group.produit.reference}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2.5 py-1 rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: sousTraitant.couleur }}
                    >
                      {group.items.length}
                    </span>
                    <span className="text-gray-400">{group.expanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {group.expanded && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 uppercase">
                          <th className="px-4 py-2 text-left">N° Série</th>
                          <th className="px-4 py-2 text-left">Fournisseur</th>
                          <th className="px-4 py-2 text-left">BL Fournisseur</th>
                          <th className="px-4 py-2 text-left">Date entrée</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {group.items.map(item => (
                          <tr key={item.id} className="hover:bg-white">
                            <td className="px-4 py-2 font-mono text-xs">
                              {item.numero_serie || <span className="text-gray-300">—</span>}
                            </td>
                            <td className="px-4 py-2 text-gray-600">{item.fournisseur || '—'}</td>
                            <td className="px-4 py-2 text-gray-600">{item.numero_bl_fournisseur || '—'}</td>
                            <td className="px-4 py-2 text-gray-500">
                              {item.date_entree
                                ? format(new Date(item.date_entree), 'dd/MM/yyyy', { locale: fr })
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Historique des poses</h2>
        {poses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
            Aucune pose enregistrée
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            {poses.map(pose => (
              <div key={pose.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <Link href={`/poses/${pose.id}`} className="font-medium text-blue-600 hover:underline text-sm">
                    {pose.numero}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {pose.date_pose ? format(new Date(pose.date_pose), 'dd/MM/yyyy', { locale: fr }) : '—'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{pose.client}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  {pose.code_cee && <span>CEE: {pose.code_cee}</span>}
                  {pose.technicien && <span>Tech: {pose.technicien}</span>}
                </div>
                <div className="mt-2 space-y-1">
                  {pose.items.map((item: any) => (
                    <div key={item.id} className="text-xs text-gray-600 flex gap-2">
                      <span>• {item.produit?.nom}</span>
                      {item.numero_serie && <span className="font-mono text-gray-400">#{item.numero_serie}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
