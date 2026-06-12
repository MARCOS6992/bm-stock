'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SousTraitant, Produit } from '@/lib/types'
import dynamic from 'next/dynamic'

const SignatureCanvas = dynamic(() => import('@/components/SignatureCanvas'), { ssr: false })

interface LigneForm {
  produit: Produit
  qte: number
  series: string[]
}

export default function NewReceptionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sousTraitants, setSousTraitants] = useState<SousTraitant[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(false)

  const [distributeur, setDistributeur] = useState('')
  const [blFournisseur, setBlFournisseur] = useState('')
  const [dateReception, setDateReception] = useState(new Date().toISOString().split('T')[0])
  const [receptionnePar, setReceptionnePar] = useState('')
  const [sousTraitantId, setSousTraitantId] = useState('')
  const [notes, setNotes] = useState('')

  const [lignes, setLignes] = useState<LigneForm[]>([])
  const [selectedProduitId, setSelectedProduitId] = useState('')
  const [qteInput, setQteInput] = useState('1')

  const [signature, setSignature] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('sous_traitants').select('*').order('nom'),
      supabase.from('produits').select('*').order('designation'),
    ]).then(([{ data: sts }, { data: prods }]) => {
      if (sts) setSousTraitants(sts)
      if (prods) setProduits(prods)
    })
  }, [])

  function addLigne() {
    const produit = produits.find((p) => p.id === selectedProduitId)
    if (!produit) return
    const qte = parseInt(qteInput) || 1
    setLignes((prev) => [...prev, { produit, qte, series: produit.necessite_serie ? Array(qte).fill('') : [] }])
    setSelectedProduitId('')
    setQteInput('1')
  }

  function removeLigne(i: number) { setLignes((prev) => prev.filter((_, idx) => idx !== i)) }

  function updateSerie(ligneIdx: number, serieIdx: number, val: string) {
    setLignes((prev) => prev.map((l, i) => {
      if (i !== ligneIdx) return l
      const s = [...l.series]; s[serieIdx] = val
      return { ...l, series: s }
    }))
  }

  function updateQte(ligneIdx: number, newQte: number) {
    setLignes((prev) => prev.map((l, i) => {
      if (i !== ligneIdx) return l
      const series = l.produit.necessite_serie ? Array(newQte).fill('').map((_, idx) => l.series[idx] || '') : []
      return { ...l, qte: newQte, series }
    }))
  }

  async function submit() {
    if (!signature) { alert('Signature obligatoire'); return }
    setLoading(true)
    try {
      const blob = await fetch(signature).then((r) => r.blob())
      const filename = `br-${Date.now()}.png`
      let signatureUrl: string | null = null
      const { data: uploadData } = await supabase.storage.from('signatures').upload(filename, blob)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(filename)
        signatureUrl = urlData.publicUrl
      }

      const { data: lastBr } = await supabase.from('bons_reception').select('numero').order('numero', { ascending: false }).limit(1)
      let seq = 1
      if (lastBr && lastBr.length > 0) { const match = lastBr[0].numero.match(/(\d+)$/); if (match) seq = parseInt(match[1]) + 1 }
      const numero = `BR-${new Date().getFullYear()}-${String(seq).padStart(4, '0')}`

      const { data: br, error } = await supabase.from('bons_reception').insert({
        numero, distributeur, bl_fournisseur: blFournisseur, date_reception: dateReception,
        receptionne_par: receptionnePar, sous_traitant_id: sousTraitantId, notes: notes || null, signature_url: signatureUrl,
      }).select().single()

      if (error || !br) throw error

      for (const ligne of lignes) {
        await supabase.from('lignes_reception').insert({
          bon_reception_id: br.id, reference_id: ligne.produit.id, qte: ligne.qte, series: ligne.series.filter(Boolean),
        })
        if (ligne.produit.necessite_serie) {
          for (const serie of ligne.series) {
            if (!serie) continue
            await supabase.from('unites').insert({ reference_id: ligne.produit.id, sous_traitant_id: sousTraitantId, numero_serie: serie, fournisseur: distributeur })
          }
        } else {
          for (let j = 0; j < ligne.qte; j++) {
            await supabase.from('unites').insert({ reference_id: ligne.produit.id, sous_traitant_id: sousTraitantId, numero_serie: null, fournisseur: distributeur })
          }
        }
      }
      router.push('/receptions')
    } catch (err) {
      console.error(err); alert('Erreur lors de la création')
    } finally { setLoading(false) }
  }

  const step1Valid = distributeur && blFournisseur && dateReception && receptionnePar && sousTraitantId
  const step2Valid = lignes.length > 0
  const seriesComplete = lignes.every((l) => !l.produit.necessite_serie || l.series.every((s) => s.trim() !== ''))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/receptions" className="text-gray-400 hover:text-gray-600 text-sm">← Retour</Link>
        <h1 className="text-xl font-bold text-gray-900">Nouveau bon de réception</h1>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{s}</div>
            {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <div className="ml-2 text-sm text-gray-500">{step === 1 ? 'Informations BL' : step === 2 ? 'Articles reçus' : 'Signature'}</div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distributeur *</label>
              <input value={distributeur} onChange={(e) => setDistributeur(e.target.value)} placeholder="Nom du distributeur"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° BL fournisseur *</label>
              <input value={blFournisseur} onChange={(e) => setBlFournisseur(e.target.value)} placeholder="ex: BL-2026-001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date réception *</label>
              <input type="date" value={dateReception} onChange={(e) => setDateReception(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Réceptionné par *</label>
              <input value={receptionnePar} onChange={(e) => setReceptionnePar(e.target.value)} placeholder="Nom du technicien"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sous-traitant *</label>
            <select value={sousTraitantId} onChange={(e) => setSousTraitantId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner...</option>
              {sousTraitants.map((st) => <option key={st.id} value={st.id}>{st.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700">Suivant →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Ajouter un article</p>
            <div className="flex gap-2">
              <select value={selectedProduitId} onChange={(e) => setSelectedProduitId(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Choisir un produit...</option>
                {produits.map((p) => <option key={p.id} value={p.id}>{p.designation} ({p.ref})</option>)}
              </select>
              <input type="number" value={qteInput} onChange={(e) => setQteInput(e.target.value)} min="1" placeholder="Qté"
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addLigne} disabled={!selectedProduitId}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700">Ajouter</button>
            </div>
          </div>
          {lignes.length > 0 && (
            <div className="space-y-3">
              {lignes.map((ligne, ligneIdx) => (
                <div key={ligneIdx} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm text-gray-900">{ligne.produit.designation}</span>
                      <span className="ml-2 text-xs text-gray-400 font-mono">{ligne.produit.ref}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={ligne.qte} onChange={(e) => updateQte(ligneIdx, parseInt(e.target.value) || 1)} min="1"
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center" />
                      <button onClick={() => removeLigne(ligneIdx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </div>
                  </div>
                  {ligne.produit.necessite_serie && (
                    <div className="space-y-1 mt-2">
                      <p className="text-xs text-gray-500">Numéros de série :</p>
                      {ligne.series.map((s, si) => (
                        <input key={si} value={s} onChange={(e) => updateSerie(ligneIdx, si, e.target.value)} placeholder={`N° série ${si + 1}`}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">← Retour</button>
            <button onClick={() => setStep(3)} disabled={!step2Valid || !seriesComplete}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700">Suivant →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Récapitulatif</h3>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p><strong>Distributeur:</strong> {distributeur}</p>
              <p><strong>N° BL:</strong> {blFournisseur}</p>
              <p><strong>Date:</strong> {dateReception}</p>
              <p><strong>Réceptionné par:</strong> {receptionnePar}</p>
              <p><strong>Sous-traitant:</strong> {sousTraitants.find((s) => s.id === sousTraitantId)?.nom}</p>
              <p className="mt-2 font-medium">{lignes.length} ligne{lignes.length !== 1 ? 's' : ''} :</p>
              {lignes.map((l, i) => <p key={i} className="pl-2 text-xs">• {l.produit.designation} × {l.qte}</p>)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Signature *</p>
              <SignatureCanvas onSave={setSignature} onClear={() => setSignature(null)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">← Retour</button>
            <button onClick={submit} disabled={!signature || loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700">
              {loading ? 'Enregistrement...' : 'Valider la réception'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
