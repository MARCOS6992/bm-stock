'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface HistoriqueRow {
  id: string
  client: string
  reference_produit: string
  nom_produit: string
  numero_serie: string | null
  technicien: string
  sous_traitant: string
  couleur_st: string
  numero_bon_pose: string
  fournisseur: string | null
  numero_bl_fournisseur: string | null
  code_cee: string | null
  date_pose: string | null
}

export default function HistoriquePage() {
  const [rows, setRows] = useState<HistoriqueRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data, error } = await supabase
      .from('bons_pose_items')
      .select(`
        id,
        numero_serie,
        bon_pose:bons_pose(
          numero,
          client,
          code_cee,
          technicien,
          date_pose,
          sous_traitant:sous_traitants(nom, couleur)
        ),
        produit:produits(reference, nom),
        stock_item:stock_items(fournisseur, numero_bl_fournisseur)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    if (data) {
      const mapped: HistoriqueRow[] = data.map((item: any) => ({
        id: item.id,
        client: item.bon_pose?.client || '',
        reference_produit: item.produit?.reference || '',
        nom_produit: item.produit?.nom || '',
        numero_serie: item.numero_serie,
        technicien: item.bon_pose?.technicien || '',
        sous_traitant: item.bon_pose?.sous_traitant?.nom || '',
        couleur_st: item.bon_pose?.sous_traitant?.couleur || '#6b7280',
        numero_bon_pose: item.bon_pose?.numero || '',
        fournisseur: item.stock_item?.fournisseur || null,
        numero_bl_fournisseur: item.stock_item?.numero_bl_fournisseur || null,
        code_cee: item.bon_pose?.code_cee || null,
        date_pose: item.bon_pose?.date_pose || null,
      }))
      setRows(mapped)
    }
    setLoading(false)
  }

  const filteredRows = search
    ? rows.filter((r) => {
        const q = search.toLowerCase()
        return (
          r.client.toLowerCase().includes(q) ||
          r.reference_produit.toLowerCase().includes(q) ||
          r.nom_produit.toLowerCase().includes(q) ||
          (r.numero_serie || '').toLowerCase().includes(q) ||
          r.technicien.toLowerCase().includes(q) ||
          r.sous_traitant.toLowerCase().includes(q) ||
          r.numero_bon_pose.toLowerCase().includes(q) ||
          (r.fournisseur || '').toLowerCase().includes(q) ||
          (r.numero_bl_fournisseur || '').toLowerCase().includes(q) ||
          (r.code_cee || '').toLowerCase().includes(q)
        )
      })
    : rows

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Chargement...
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Historique des poses"
        subtitle={`${rows.length} article${rows.length !== 1 ? 's' : ''} posé${rows.length !== 1 ? 's' : ''}`}
      />

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par client, produit, numéro de série, technicien..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <p className="text-xs text-gray-400 mt-1">
            {filteredRows.length} résultat{filteredRows.length !== 1 ? 's' : ''} pour "{search}"
          </p>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
          {search ? 'Aucun résultat trouvé' : 'Aucune pose enregistrée'}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left font-semibold">Bon de pose</th>
                <th className="px-4 py-3 text-left font-semibold">Client</th>
                <th className="px-4 py-3 text-left font-semibold">Produit</th>
                <th className="px-4 py-3 text-left font-semibold">N° série</th>
                <th className="px-4 py-3 text-left font-semibold">Technicien</th>
                <th className="px-4 py-3 text-left font-semibold">Sous-traitant</th>
                <th className="px-4 py-3 text-left font-semibold">Fournisseur</th>
                <th className="px-4 py-3 text-left font-semibold">N° BL</th>
                <th className="px-4 py-3 text-left font-semibold">Code CEE</th>
                <th className="px-4 py-3 text-left font-semibold">Date pose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{row.numero_bon_pose}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.client}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-xs">{row.nom_produit}</div>
                    <div className="text-gray-400 font-mono text-xs">{row.reference_produit}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {row.numero_serie || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.technicien}</td>
                  <td className="px-4 py-3">
                    {row.sous_traitant && (
                      <span
                        className="inline-block px-2 py-0.5 rounded text-white text-xs font-medium"
                        style={{ backgroundColor: row.couleur_st }}
                      >
                        {row.sous_traitant}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {row.fournisseur || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {row.numero_bl_fournisseur || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {row.code_cee || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {row.date_pose
                      ? format(new Date(row.date_pose), 'dd/MM/yyyy', { locale: fr })
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
