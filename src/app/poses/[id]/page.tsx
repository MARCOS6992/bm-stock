'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BonPose, LignePose, SousTraitant } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function PoseDetailPage({ params }: { params: { id: string } }) {
  const [pose, setPose] = useState<BonPose | null>(null)
  const [lignes, setLignes] = useState<LignePose[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [params.id])

  async function loadData() {
    const { data: p } = await supabase.from('bons_pose').select('*, sous_traitant:sous_traitants(*)').eq('id', params.id).single()
    if (p) setPose(p)
    const { data: ls } = await supabase.from('lignes_pose').select('*').eq('bon_pose_id', params.id)
    if (ls) setLignes(ls)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>
  if (!pose) return <div className="text-center text-gray-500">Bon de pose introuvable</div>

  const st = pose.sous_traitant as SousTraitant

  return (
    <div>
      <PageHeader title={pose.numero} backHref="/poses" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Informations chantier</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Client</dt><dd className="font-medium">{pose.client}</dd></div>
            <div><dt className="text-gray-500 mb-1">Adresse</dt><dd className="text-gray-800">{pose.adresse_chantier}</dd></div>
            {pose.code_cee && <div className="flex justify-between"><dt className="text-gray-500">Code CEE</dt><dd className="font-medium">{pose.code_cee}</dd></div>}
            {pose.numero_dossier && <div className="flex justify-between"><dt className="text-gray-500">N° Dossier</dt><dd className="font-medium">{pose.numero_dossier}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-500">Sous-traitant</dt><dd className="font-medium" style={{ color: st?.couleur }}>{st?.nom}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Technicien</dt><dd className="font-medium">{pose.technicion}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Date</dt><dd className="font-medium">{format(new Date(pose.created_at), 'dd/MM/yyyy', { locale: fr })}</dd></div>
            {pose.notes && <div><dt className="text-gray-500 mb-1">Notes</dt><dd className="text-gray-800">{pose.notes}</dd></div>}
          </dl>
        </div>
        {pose.signature_url && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">Signature</h3>
            <img src={pose.signature_url} alt="Signature" className="border border-gray-200 rounded-lg max-h-32" />
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Articles posés ({lignes.length})</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {lignes.map((ligne) => (
            <div key={ligne.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-gray-900">{ligne.designation}</span>
                <span className="ml-2 text-xs text-gray-500 font-mono">{ligne.ref}</span>
              </div>
              {ligne.numero_serie && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">{ligne.numero_serie}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
