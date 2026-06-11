'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SousTraitant, Produit } from '@/lib/types'
import dynamic from 'next/dynamic'

const SignatureCanvas = dynamic(() => import('@/components/SignatureCanvas'), { ssr: false })

const FOURNISSEURS = ['Axtis', 'Econegoce', 'Clygroup', 'SFTE', 'ACR', 'Browseenegoce']
const NEED_SERIAL_CATS = ['PAC Air/Eau', 'SSC', 'Ballon Électrique']

interface LineItem {
  produit: Produit
  quantite: number
  serials: string[]
}

export default function NewReceptionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sousTraitants, setSousTraitants] = useState<SousTraitant[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [loading, setLoading] = useState(false)

  const [fournisseur, setFournisseur] = useState('')
  const [numeroBL, setNumeroBL] = useState('')
  const [dateBL, setDateBL] = useState(new Date().toISOString().split('T')[0])
  const [sousTraitantId, setSousTraitantId] = useState('')
  const [technicien, setTechnicien] = useState('')

  const [lines, setLines] = useState<LineItem[]>([])
  const [signature, setSignature] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('sous_traitants').select('*').order('nom').then(({ data }) => {
      if (data) setSousTraitants(data)
    })
    supabase.from('produits').select('*').order('categorie,designation').then(({ data }) => {
      if (data) setProduits(data)
    })
  }, [])

  function addProduct(produit: Produit) {
    if (lines.find(l => l.produit.id === produit.id)) return
    setLines(prev => [...prev, { produit, quantite: 1, serials: [''] }])
  }

  function updateQty(produitId: string, qty: number) {
    setLines(prev => prev.map(l => {
      if (l.produit.id !== produitId) return l
      const serials = Array(qty).fill('').map((_, i) => l.serials[i] || '')
      return { ...l, quantite: qty, serials }
    }))
  }

  function updateSerial(produitId: string, idx: number, val: string) {
    setLines(prev => prev.map(l => {
      if (l.produit.id !== produitId) return l
      const serials = [...l.serials]
      serials[idx] = val
      return { ...l, serials }
    }))
  }

  function removeLine(produitId: string) {
    setLines(prev => prev.filter(l => l.produit.id !== produitId))
  }

  async function submit() {
    if (!signature) { alert('Signature obligatoire'); return }
    setLoading(true)
    try {
      const blob = await fetch(signature).then(r => r.blob())
      const filename = `br-${Date.now()}.png`
      let signatureUrl = null
      const { data: uploadData } = await supabase.storage.from('signatures').upload(filename, blob)
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(filename)
        signatureUrl = urlData.publicUrl
      }

      const { count } = await supabase.from('bons_reception').select('*', { count: 'exact', head: true })
      const numero = `BR-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: br, error } = await supabase.from('bons_reception').insert({
        numero,
        fournisseur,
        numero_bl_fournisseur: numeroBL,
        date_bl: dateBL,
        sous_traitant_id: sousTraitantId,
        technicien,
        statut: 'valide',
        signature_url: signatureUrl,
      }).select().single()

      if (error || !br) throw error

      for (const line of lines) {
        await supabase.from('bons_reception_items').insert({
          bon_reception_id: br.id,
          produit_id: line.produit.id,
          quantite: line.quantite,
          numeros_serie: line.serials.filter(Boolean),
        })

        for (let i = 0; i < line.quantite; i++) {
          await supabase.from('stock_items').insert({
            produit_id: line.produit.id,
            sous_traitant_id: sousTraitantId,
            numero_serie: line.serials[i] || null,
            statut: 'en_stock',
            fournisseur,
            numero_bl_fournisseur: numeroBL,
            bon_reception_id: br.id,
            date_entree: dateBL,
          })
        }
      }

      router.push(`/receptions/${br.id}`)
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const step1Valid = fournisseur && numeroBL && dateBL && sousTraitantId && technicien
  const step2Valid = lines.length > 0 && lines.every(l => {
    if (!NEED_SERIAL_CATS.includes(l.produit.categorie)) return true
    return l.serials.every(s => s.trim().length > 0)
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/receptions" className="text-gray-400 hover:text-gray-600 text-sm">← Retour</Link>
        <h1 className="text-xl font-bold text-gray-900">Nouvelle réception BL</h1>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{s}</div>
            {s < 3 && <div className={`h-0.5 w-8 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <div className="ml-2 text-sm text-gray-500">
          {step === 1 ? 'Informations' : step === 2 ? 'Articles reçus' : 'Signature'}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
            <select value={fournisseur} onChange={e => setFournisseur(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner...</option>
              {FOURNISSEURS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° BL fournisseur *</label>
            <input value={numeroBL} onChange={e => setNumeroBL(e.target.value)}
              placeholder="ex: BL-2026-00123"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date du BL *</label>
            <input type="date" value={dateBL} onChange={e => setDateBL(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire (sous-traitant) *</label>
            <select value={sousTraitantId} onChange={e => setSousTraitantId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Sélectionner...</option>
              {sousTraitants.map(st => <option key={st.id} value={st.id}>{st.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Réceptionné par *</label>
            <input value={technicien} onChange={e => setTechnicien(e.target.value)}
              placeholder="Nom du technicien"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setStep(2)} disabled={!step1Valid}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors">
            Suivant →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Ajouter des articles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {produits.map(p => (
                <button key={p.id} onClick={() => addProduct(p)}
                  disabled={!!lines.find(l => l.produit.id === p.id)}
                  className="text-left px-3 py-2 border border-gray-200 rounded-lg text-xs hover:bg-blue-50 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <div className="font-medium text-gray-800">{p.designation}</div>
                  <div className="text-gray-400">{p.ref}</div>
                </button>
              ))}
            </div>
          </div>

          {lines.length > 0 && (
            <div className="space-y-3">
              {lines.map(line => (
                <div key={line.produit.id} className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{line.produit.designation}</p>
                      <p className="text-xs text-gray-400">{line.produit.ref}</p>
                    </div>
                    <button onClick={() => removeLine(line.produit.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-xs text-gray-600">Quantité:</label>
                    <input type="number" min="1" max="20" value={line.quantite}
                      onChange={e => updateQty(line.produit.id, Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {NEED_SERIAL_CATS.includes(line.produit.categorie) && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-orange-600">N° de série requis *</p>
                      {Array(line.quantite).fill(null).map((_, i) => (
                        <input key={i} value={line.serials[i] || ''} onChange={e => updateSerial(line.produit.id, i, e.target.value)}
                          placeholder={`N° série unité ${i + 1}`}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            !line.serials[i] ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              ← Retour
            </button>
            <button onClick={() => setStep(3)} disabled={!step2Valid}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors">
              Suivant →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Récapitulatif</h3>
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p><b>{fournisseur}</b> — BL: {numeroBL}</p>
              <p>→ {sousTraitants.find(s => s.id === sousTraitantId)?.nom}</p>
              <p>Réceptionné par: {technicien}</p>
              <p className="mt-2 font-medium">{lines.reduce((a, l) => a + l.quantite, 0)} article(s):</p>
              {lines.map(l => (
                <p key={l.produit.id} className="pl-2">• {l.produit.designation} × {l.quantite}</p>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Signature du réceptionnaire *</p>
              <SignatureCanvas onSave={setSignature} onClear={() => setSignature(null)} />
              {signature && <p className="text-xs text-green-600 mt-1">✓ Signature enregistrée</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              ← Retour
            </button>
            <button onClick={submit} disabled={!signature || loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-40 hover:bg-green-700 transition-colors">
              {loading ? 'Enregistrement...' : '✓ Valider la réception'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
