'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BonReception, BonReceptionItem, SousTraitant, Produit } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ReceptionDetailPage({ params }: { params: { id: string } }) {
  const [reception, setReception] = useState<BonReception | null>(null)
  const [items, setItems] = useState<BonReceptionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [params.id])

  async function loadData() {
    const { data: r } = await supabase
      .from('bons_reception')
      .select('*, sous_traitant:sous_traitants(*)')
      .eq('id', params.id)
      .single()
    if (r) setReception(r)

    const { data: its } = await supabase
      .from('bons_reception_items')
      .select('*, produit:produits(*)')
      .eq('bon_reception_id', params.id)
    if (its) setItems(its)

    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
  if (!reception) return <div className="text-center text-gray-500">Bon de réception introuvable</div>

  const st = reception.sous_traitant as SousTraitant

  return (
    <div>
      <PageHeader
        title={reception.numero}
        subtitle={reception.statut === 'finalise' ? 'Finalisé' : 'Brouillon'}
        backHref="/receptions"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Informations</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Fournisseur</dt>
              <dd className="font-medium">{reception.fournisseur}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">N° BL fournisseur</dt>
              <dd className="font-medium">{reception.numero_bl_fournisseur}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date BL</dt>
              <dd className="font-medium">{format(new Date(reception.date_bl), 'dd/MM/yyyy', { locale: fr })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Sous-traitant</dt>
              <dd className="font-medium" style={{ color: st?.couleur }}>{st?.nom}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Technicien</dt>
              <dd className="font-medium">{reception.technicien}</dd>
            </div>
          </dl>
        </div>

        {reception.signature_url && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">Signature</h3>
            <img src={reception.signature_url} alt="Signature" className="border border-gray-200 rounded-lg max-h-32" />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Articles reçus ({items.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const produit = item.produit as Produit
            return (
              <div key={item.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{produit?.nom}</span>
                    <span className="ml-2 text-xs text-gray-500 font-mono">{produit?.reference}</span>
                  </div>
                  <span className="font-bold text-gray-900">×{item.quantite}</span>
                </div>
                {item.numeros_serie && item.numeros_serie.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.numeros_serie.map((sn, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{sn}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
