'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StockUnit, Produit, SousTraitant } from '@/lib/types'
import PageHeader from '@/components/PageHeader'

export default function StockDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [unit, setUnit] = useState<StockUnit | null>(null)
  const [loading, setLoading] = useState(true)
  const [posedIn, setPosedIn] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [params.id])

  async function loadData() {
    const { data } = await supabase
      .from('stock')
      .select('*, produit:produits(*), sous_traitant:sous_traitants(*)')
      .eq('id', params.id)
      .single()
    if (data) setUnit(data)

    // Check if posed
    const { data: lp } = await supabase
      .from('lignes_pose')
      .select('bon_pose_id, bon_pose:bons_pose(numero)')
      .eq('unite_id', params.id)
      .maybeSingle()
    if (lp) setPosedIn((lp as any).bon_pose?.numero || 'Oui')

    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
  if (!unit) return <div className="text-center text-gray-500">Unité introuvable</div>

  const produit = unit.produit as Produit
  const st = unit.sous_traitant as SousTraitant

  return (
    <div>
      <PageHeader
        title={produit?.designation || 'Unité de stock'}
        subtitle={produit?.ref}
        backHref="/stock"
      />

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Référence</dt>
            <dd className="font-mono font-medium">{produit?.ref}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Désignation</dt>
            <dd className="font-medium">{produit?.designation}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Catégorie</dt>
            <dd>{produit?.categorie}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Sous-traitant</dt>
            <dd>
              <span className="px-2 py-0.5 rounded text-white text-xs font-medium" style={{ backgroundColor: st?.couleur }}>
                {st?.nom}
              </span>
            </dd>
          </div>
          {unit.numero_serie && (
            <div className="flex justify-between">
              <dt className="text-gray-500">N° série</dt>
              <dd className="font-mono">{unit.numero_serie}</dd>
            </div>
          )}
          {unit.fournisseur && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Fournisseur</dt>
              <dd>{unit.fournisseur}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Statut</dt>
            <dd>
              {posedIn ? (
                <span className="text-orange-600 font-medium">Posé — {posedIn}</span>
              ) : (
                <span className="text-green-600 font-medium">En stock</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
