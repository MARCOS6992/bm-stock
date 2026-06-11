'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BonPose, SousTraitant } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function PosesPage() {
  const [poses, setPoses] = useState<BonPose[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data } = await supabase
      .from('bons_pose')
      .select('*, sous_traitant:sous_traitants(*)')
      .order('created_at', { ascending: false })
    if (data) setPoses(data)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>

  return (
    <div>
      <PageHeader
        title="Bons de pose"
        action={
          <Link
            href="/poses/new"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            + Nouveau
          </Link>
        }
      />

      {poses.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
          Aucun bon de pose. <Link href="/poses/new" className="text-green-600 hover:underline">Créer le premier</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {poses.map((p) => (
            <Link
              key={p.id}
              href={`/poses/${p.id}`}
              className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{p.numero}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    p.statut === 'finalise' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {p.statut === 'finalise' ? 'Finalisé' : 'Brouillon'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {p.client} — {(p.sous_traitant as SousTraitant)?.nom}
                </p>
                {p.adresse_chantier && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{p.adresse_chantier}</p>
                )}
              </div>
              <div className="text-right text-xs text-gray-400">
                <div>{format(new Date(p.created_at), 'dd/MM/yyyy', { locale: fr })}</div>
                {p.code_cee && <div className="mt-1">CEE: {p.code_cee}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
