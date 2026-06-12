'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BonReception, LigneReception, SousTraitant, Produit } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ReceptionDetailPage({ params }: { params: { id: string } }) {
  const [bon, setBon] = useState<BonReception | null>(null)
  const [lignes, setLignes] = useState<LigneReception[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [params.id])

  async function loadData() {
    const { data: b } = await supabase
      .from('bons_reception')
      .select('*, sous_traitant:sous_traitants(*)')
      .eq('id', params.id)
      .single()
    if (b) setBon(b)

    const { data: ls } = await supabase
      .from('lignes_reception')
      .select('*, produit:produits(*)')
      .eq('bon_reception_id', params.id)
    if (ls) setLignes(ls)

    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
  if (!bon) return <div className="text-center text-gray-500">Bon de réception introuvable</div>

  const st = bon.sous_traitant as SousTraitant

  return (
    <div>
      <PageHeader title={bon.numero} backHref="/receptions" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Informations</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Distributeur</dt>
              <dd className="font-medium">{bon.distributeur}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">N° BL</dt>
              <dd className="font-medium font-mono">{bon.bl_fournisseur}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date réception</dt>
              <dd className="font-medium">
                {bon.date_reception
                  ? format(new Date(bon.date_reception), 'dd/MM/yyyy', { locale: fr })
                  : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Réceptionné par</dt>
              <dd className="font-medium">{bon.receptionne_par}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Sous-traitant</dt>
              <dd className="font-medium" style={{ color: st?.couleur }}>{st?.nom}</dd>
            </div>
            {bon.notes && (
              <div>
                <dt className="text-gray-500 mb-1">Notes</dt>
                <dd className="text-gray-800">{bon.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {bon.signature_url && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">Signature</h3>
            <img src={bon.signature_url} alt="Signature" className="border border-gray-200 rounded-lg max-h-32" />
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Articles reçus ({lignes.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {lignes.map((ligne) => {
            const produit = ligne.produit as Produit
            return (
              <div key={ligne.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{produit?.designation}</span>
                    <span className="ml-2 text-xs text-gray-400 font-mono">{produit?.ref}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">× {ligne.qte}</span>
                </div>
                {ligne.series && ligne.series.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ligne.series.map((s, i) => (
                      <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">{s}</span>
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
