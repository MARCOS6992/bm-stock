'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SousTraitant, Produit, StockUnit } from '@/lib/types'
import dynamic from 'next/dynamic'

const SignatureCanvas = dynamic(() => import('@/components/SignatureCanvas'), { ssr: false })

interface StockGroup { produit: Produit; items: StockUnit[] }
interface SelectedItem { unit: StockUnit; produit: Produit }

export default function NewPosePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sousTraitants, setSousTraitants] = useState<SousTraitant[]>([])
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStock, setLoadingStock] = useState(false)

  const [client, setClient] = useState('')
  const [adresseChantier, setAdresseChantier] = useState('')
  const [codeCee, setCodeCee] = useState('')
  const [numeroDossier, setNumeroDossier] = useState('')
  const [technicion, setTechnicion] = useState('')
  const [sousTraitantId, setSousTraitantId] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [signature, setSignature] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('sous_traitants').select('*').order('nom').then(({ data }) => { if (data) setSousTraitants(data) })
  }, [])

  async function loadStock(stId: string) {
    setLoadingStock(true)
    const { data: units } = await supabase.from('unites').select('*, produit:produits(*)').eq('sous_traitant_id', stId)
    const { data: posedItems } = await supabase.from('lignes_pose').select('unite_id')
    if (!units) { setLoadingStock(false); return }
    const posedIds = new Set((posedItems || []).map((lp: any) => lp.unite_id))
    const available = (units as any[]).filter((u) => !posedIds.has(u.id))
    const groupMap: Record<string, StockGroup> = {}
    for (const u of available) {
      if (!u.produit) continue
      if (!groupMap[u.reference_id]) groupMap[u.reference_id] = { produit: u.produit, items: [] }
      groupMap[u.reference_id].items.push(u)
    }
    setStockGroups(Object.values(groupMap))
    setLoadingStock(false)
  }

  function handleSousTraitantChange(stId: string) {
    setSousTraitantId(stId); setSelectedItems([])
    if (stId) loadStock(stId)
  }

  function toggleItem(unit: StockUnit, produit: Produit) {
    setSelectedItems((prev) => {
      const exists = prev.find((si) => si.unit.id === unit.id)
      return exists ? prev.filter((si) => si.unit.id !== unit.id) : [...prev, { unit, produit }]
    })
  }

  async function submit() {
    if (!signature) { alert('Signature obligatoire'); return }
    setLoading(true)
    try {
      const blob = await fetch(signature).then((r) => r.blob())
      const filename = `bp-${Date.now()}.png`
      let signatureUrl: string | null = null
      const { data: uploadData } = await supabase.storage.from('signatures').upload(filename, blob)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(filename)
        signatureUrl = urlData.publicUrl
      }

      const { data: lastBp } = await supabase.from('bons_pose').select('numero').order('numero', { ascending: false }).limit(1)
      let seq = 1
      if (lastBp && lastBp.length > 0) { const match = lastBp[0].numero.match(/(\d+)$/); if (match) seq = parseInt(match[1]) + 1 }
      const numero = `BP-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`

      const { data: bp, error } = await supabase.from('bons_pose').insert({
        numero, client, adresse_chantier: adresseChantier, code_cee: codeCee || null,
        numero_dossier: numeroDossier || null, technicion, sous_traitant_id: sousTraitantId, notes: notes || null, signature_url: signatureUrl,
      }).select().single()

      if (error || !bp) throw error

      for (const { unit, produit } of selectedItems) {
        await supabase.from('lignes_pose').insert({
          bon_pose_id: bp.id, unite_id: unit.id, ref: produit.ref, designation: produit.designation,
          numero_serie: unit.numero_serie, fournisseur: unit.fournisseur, bl_fournisseur: null,
        })
      }
      router.push('/poses')
    } catch (err) {
      console.error(err); alert('Erreur lors de la création')
    } finally { setLoading(false) }
  }

  const step1Valid = client && adresseChantier && technicion && sousTraitantId
  const step2Valid = selectedItems.length > 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/poses" className="text-gray-400 hover:text-gray-600 text-sm">← Retour</Link>
        <h1 className="text-xl font-bold text-gray-900">Nouveau bon de pose</h1>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{s}</div>
            {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-green-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <div className="ml-2 text-sm text-gray-500">{step === 1 ? 'Informations chantier' : step === 2 ? 'Articles posés' : 'Signature'}</div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nom du client"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse du chantier *</label>
            <input value={adresseChantier} onChange={(e) => setAdresseChantier(e.target.value)} placeholder="Adresse complète"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code CEE</label>
              <input value={codeCee} onChange={(e) => setCodeCee(e.target.value)} placeholder="ex: CEE-2026-001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° dossier</label>
              <input value={numeroDossier} onChange={(e) => setNumeroDossier(e.target.value)} placeholder="ex: DOS-2026-001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technicien *</label>
            <input value={technicion} onChange={(e) => setTechnicion(e.target.value)} placeholder="Nom du technicien"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sous-traitant *</label>
            <select value={sousTraitantId} onChange={(e) => handleSousTraitantChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">Sélectionner...</option>
              {sousTraitants.map((st) => <option key={st.id} value={st.id}>{st.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-green-700">Suivant →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {loadingStock ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">Chargement du stock...</div>
          ) : stockGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">Aucun article disponible pour ce sous-traitant</div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Sélectionnez les articles à poser ({selectedItems.length} sélectionné{selectedItems.length !== 1 ? 's' : ''})</p>
              {stockGroups.map((group) => (
                <div key={group.produit.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="font-medium text-gray-900 text-sm">{group.produit.designation}</p>
                    <p className="text-xs text-gray-400">{group.produit.ref}</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {group.items.map((item) => {
                      const isSelected = !!selectedItems.find((si) => si.unit.id === item.id)
                      return (
                        <label key={item.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50' : ''}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleItem(item, group.produit)} className="w-4 h-4 text-green-600 rounded" />
                          <div className="flex-1 text-sm">
                            {item.numero_serie ? <span className="font-mono text-gray-700">N° {item.numero_serie}</span> : <span className="text-gray-400 italic">Sans numéro de série</span>}
                          </div>
                          {item.fournisseur && <span className="text-xs text-gray-400">{item.fournisseur}</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">← Retour</button>
            <button onClick={() => setStep(3)} disabled={!step2Valid} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-green-700">Suivant →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Récapitulatif</h3>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p><strong>Client:</strong> {client}</p>
              <p><strong>Chantier:</strong> {adresseChantier}</p>
              {codeCee && <p><strong>Code CEE:</strong> {codeCee}</p>}
              {numeroDossier && <p><strong>Dossier:</strong> {numeroDossier}</p>}
              <p><strong>Technicien:</strong> {technicion}</p>
              <p><strong>Sous-traitant:</strong> {sousTraitants.find((s) => s.id === sousTraitantId)?.nom}</p>
              <p className="mt-2 font-medium">{selectedItems.length} article{selectedItems.length !== 1 ? 's' : ''} à poser:</p>
              {selectedItems.map(({ unit, produit }) => (
                <p key={unit.id} className="pl-2 text-xs">• {produit.designation}{unit.numero_serie && <span className="ml-2 font-mono text-gray-400">#{unit.numero_serie}</span>}</p>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Signature du technicien *</p>
              <SignatureCanvas onSave={setSignature} onClear={() => setSignature(null)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">← Retour</button>
            <button onClick={submit} disabled={!signature || loading} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-green-700">
              {loading ? 'Enregistrement...' : 'Valider le bon de pose'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
