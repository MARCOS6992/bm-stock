'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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

interface UnitRow {
  id: string
  numero_serie: string | null
  fournisseur: string | null
  bl_fournisseur: string | null
  date_entree: string | null
  produit: Produit
  isPosed: boolean
}

function StockContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const stFilter = searchParams.get('st')

  const [rows, setRows] = useState<StockRow[]>([])
  const [units, setUnits] = useState<UnitRow[]>([])
  const [sousTraitant, setSousTraitant] = useState<SousTraitant | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { stFilter ? loadFiltered(stFilter) : loadAll() }, [stFilter])

  async function loadAll() {
    setLoading(true)
    const { data: unitsData } = await supabase.from('unites').select('*, produit:produits(*), sous_traitant:sous_traitants(*)')
    const { data: posedItems } = await supabase.from('lignes_pose').select('unite_id')
    if (!unitsData) { setLoading(false); return }
    const posedIds = new Set((posedItems || []).map((lp: any) => lp.unite_id))
    const groupMap: Record<string, StockRow> = {}
    for (const u of unitsData as any[]) {
      if (!u.produit || !u.sous_traitant) continue
      const key = `${u.reference_id}-${u.sous_traitant_id}`
      if (!groupMap[key]) groupMap[key] = { produit: u.produit, sousTraitant: u.sous_traitant, total: 0, disponible: 0, pose: 0 }
      groupMap[key].total++
      if (posedIds.has(u.id)) groupMap[key].pose++
      else groupMap[key].disponible++
    }
    setRows(Object.values(groupMap).sort((a, b) => a.produit.designation.localeCompare(b.produit.designation)))
    setLoading(false)
  }

  async function loadFiltered(stId: string) {
    setLoading(true)
    const [{ data: st }, { data: unitsData }, { data: posedItems }] = await Promise.all([
      supabase.from('sous_traitants').select('*').eq('id', stId).single(),
      supabase.from('unites').select('*, produit:produits(*)').eq('sous_traitant_id', stId),
      supabase.from('lignes_pose').select('unite_id'),
    ])
    if (st) setSousTraitant(st as SousTraitant)
    if (unitsData) {
      const posedIds = new Set((posedItems || []).map((lp: any) => lp.unite_id))
      setUnits(
        (unitsData as any[]).filter((u) => u.produit).map((u) => ({
          id: u.id,
          numero_serie: u.numero_serie,
          fournisseur: u.fournisseur,
          bl_fournisseur: u.bl_fournisseur,
          date_entree: u.date_entree,
          produit: u.produit,
          isPosed: posedIds.has(u.id),
        })).sort((a, b) => a.produit.designation.localeCompare(b.produit.designation))
      )
    }
    setLoading(false)
  }

  async function deleteUnit(id: string) {
    if (!confirm('Supprimer cette unité de stock ?')) return
    setDeleting(id)
    await supabase.from('unites').delete().eq('id', id)
    setUnits((prev) => prev.filter((u) => u.id !== id))
    setDeleting(null)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>

  if (stFilter && sousTraitant) {
    const dispo = units.filter((u) => !u.isPosed)
    const posed = units.filter((u) => u.isPosed)
    return (
      <div>
        <PageHeader
          title={sousTraitant.nom}
          subtitle={`${dispo.length} disponible${dispo.length !== 1 ? 's' : ''} · ${posed.length} posé${posed.length !== 1 ? 's' : ''}`}
          backHref="/stock"
        />
        {units.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">Aucune unité</div>
        ) : (
          <div className="space-y-2">
            {units.map((u) => (
              <div key={u.id} className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-3 ${
                u.isPosed ? 'border-orange-100 opacity-60' : 'border-gray-100'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{u.produit.designation}</div>
                  <div className="text-xs text-gray-400 font-mono">{u.produit.ref}</div>
                  {u.numero_serie && (
                    <div className="text-xs text-gray-500 mt-1">N° série: <span className="font-mono">{u.numero_serie}</span></div>
                  )}
                  {u.fournisseur && (
                    <div className="text-xs text-gray-400">{u.fournisseur}{u.bl_fournisseur ? ` — BL ${u.bl_fournisseur}` : ''}</div>
                  )}
                  {u.date_entree && (
                    <div className="text-xs text-gray-400">Entrée: {new Date(u.date_entree).toLocaleDateString('fr-FR')}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.isPosed ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'
                  }`}>
                    {u.isPosed ? 'Posé' : 'Dispo'}
                  </span>
                  {!u.isPosed && (
                    <button
                      onClick={() => deleteUnit(u.id)}
                      disabled={deleting === u.id}
                      className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40 border border-red-200">
                      {deleting === u.id ? '...' : 'Supprimer'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

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
                <th className="px-4 py-3 text-left font-semibold">Poseur</th>
                <th className="px-4 py-3 text-center font-semibold">Total</th>
                <th className="px-4 py-3 text-center font-semibold">Dispo</th>
                <th className="px-4 py-3 text-center font-semibold">Posé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/stock?st=${row.sousTraitant.id}`)}>
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
          <p className="text-xs text-gray-400 text-center py-2">Cliquez sur une ligne pour voir le détail</p>
        </div>
      )}
    </div>
  )
}

export default function StockPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>}>
      <StockContent />
    </Suspense>
  )
}
