'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BonReception, SousTraitant } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ReceptionsPage() {
  const [receptions, setReceptions] = useState<BonReception[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data } = await supabase
      .from('bons_reception')
      .select('*, sous_traitant:sous_traitants(*)')
      .order('created_at', { ascending: false })
    if (data) setReceptions(data)
    setLoading(false)
  }

  const statutColor: Record<string, string> = {
    brouillon: 'bg-gray-100 text-gray-700',
    finalise: 'bg-green-100 text-green-700',
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>

  return (
    <div>
      <PageHeader
        title="Bons de réception"
        action={
          <Link
            href="/receptions/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Nouveau
          </Link>
        }
      />

      {receptions.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
          Aucun bon de réception. <Link href="/receptions/new" className="text-blue-600 hover:underline">Créer le premier</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {receptions.map((r) => (
            <Link
              key={r.id}
              href={`/receptions/${r.id}`}
              className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{r.numero}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor[r.statut] || 'bg-gray-100 text-gray-700'}`}>
                    {r.statut === 'finalise' ? 'Finalisé' : 'Brouillon'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {r.fournisseur} → {(r.sous_traitant as SousTraitant)?.nom} — {r.technicien}
                </p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>{format(new Date(r.created_at), 'dd/MM/yyyy', { locale: fr })}</div>
                <div>BL: {r.numero_bl_fournisseur}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
