'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/PageHeader'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface HistoriqueRow {
  id: string
  client: string
  ref: string
  designation: string
  numero_serie: string | null
  technicion: string
  sous_traitant: string
  couleur_st: string
  numero_bon_pose: string
  fournisseur: string | null
  bl_fournisseur: string | null
  code_cee: string | null
  date: string
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
      .from('lignes_pose')
      .select(`
        id,
        ref,
        designation,
        numero_serie,
        fournisseur,
        bl_fournisseur,
        bon_pose:bons_pose(
          numero,
          client,
          code_cee,
          technicion,
          created_at,
          sous_traitant:sous_traitants(nom, couleur)
        )
      `)
      .order('id', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    if (data) {
      const mapped: HistoriqueRow[] = data.map((item: any) => ({
        id: item.id,
        client: item.bon_pose?.client || '',
        ref: item.ref || '',
        designation: item.designation || '',
        numero_serie: item.numero_serie,
        technicion: item.bon_pose?.technicion || '',
        sous_traitant: item.bon_pose?.sous_traitant?.nom || '',
        couleur_st: item.bon_pose?.sous_traitant?.couleur || '#6b7280',
        numero_bon_pose: item.bon_pose?.numero || '',
        fournisseur: item.fournisseur || null,
        bl_fournisseur: item.bl_fournisseur || null,
        code_cee: item.bon_pose?.code_cee || null,
        date: item.bon_pose?.created_at || '',
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
          r.ref.toLowerCase().includes(q) ||
          r.designation.toLowerCase().includes(q) ||
          (r.numero_serie || '').toLowerCase().includes(q) ||
          r.technicion.toLowerCase().includes(q) ||
          r.sous_traitant.toLowerCase().includes(q) ||
          r.numero_bon_pose.toLowerCase().includes(q) ||
          (r.fournisseur || '').toLowerCase().includes(q) ||
          (r.code_cee || '').toLowerCase().includes(q)
        )
      })
    : rows

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>

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
                <th className="px-4 py-3 text-left font-semibold">Code CEE</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{row.numero_bon_pose}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.client}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-xs">{row.designation}</div>
                    <div className="text-gray-400 font-mono text-xs">{row.ref}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {row.numero_serie || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.technicion}</td>
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
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {row.code_cee || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {row.date
                      ? format(new Date(row.date), 'dd/MM/yyyy', { locale: fr })
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
