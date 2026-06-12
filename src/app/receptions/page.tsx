'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BonReception, SousTraitant } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ReceptionsPage() {
  const [bons, setBons] = useState<BonReception[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data } = await supabase.from('bons_reception').select('*, sous_traitant:sous_traitants(*)').order('created_at', { ascending: false })
    if (data) setBons(data)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>

  return (
    <div>
      <PageHeader title="Bons de réception" action={
        <Link href="/receptions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Nouveau</Link>
      } />
      {bons.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
          Aucun bon de réception. <Link href="/receptions/new" className="text-blue-600 hover:underline">Créer le premier</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {bons.map((b) => (
            <Link key={b.id} href={`/receptions/${b.id}`} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{b.numero}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-block"
                    style={{ backgroundColor: (b.sous_traitant as SousTraitant)?.couleur + '20', color: (b.sous_traitant as SousTraitant)?.couleur }}>
                    {(b.sous_traitant as SousTraitant)?.nom}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{b.distributeur} — BL: {b.bl_fournisseur}</p>
                <p className="text-xs text-gray-400 mt-0.5">{b.receptionne_par}</p>
              </div>
              <div className="text-right text-xs text-gray-400">
                {b.date_reception ? format(new Date(b.date_reception), 'dd/MM/yyyy', { locale: fr }) : format(new Date(b.created_at), 'dd/MM/yyyy', { locale: fr })}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
