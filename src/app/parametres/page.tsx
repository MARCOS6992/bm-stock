'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Produit, SousTraitant, Distributeur } from '@/lib/types'
import PageHeader from '@/components/PageHeader'

const CATEGORIES = ['PAC Air/Eau', 'SSC', 'Ballon Électrique', 'Accessoire', 'Consommable']
const UNITES = ['unité', 'ml', 'kg', 'm']
const SERIE_CATS = ['PAC Air/Eau', 'SSC', 'Ballon Électrique']

type Tab = 'produits' | 'sous_traitants' | 'distributeurs'

export default function ParametresPage() {
  const [produits, setProduits] = useState<Produit[]>([])
  const [sousTraitants, setSousTraitants] = useState<SousTraitant[]>([])
  const [distributeurs, setDistributeurs] = useState<Distributeur[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('produits')
  const [loading, setLoading] = useState(true)

  const [ref, setRef] = useState('')
  const [designation, setDesignation] = useState('')
  const [categorie, setCategorie] = useState(CATEGORIES[0])
  const [unite, setUnite] = useState(UNITES[0])
  const [seuilMin, setSeuilMin] = useState('0')
  const [showProduitForm, setShowProduitForm] = useState(false)

  const [nomST, setNomST] = useState('')
  const [couleurST, setCouleurST] = useState('#3b82f6')
  const [showSTForm, setShowSTForm] = useState(false)

  const [nomDist, setNomDist] = useState('')
  const [showDistForm, setShowDistForm] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: p }, { data: s }, { data: d }] = await Promise.all([
      supabase.from('produits').select('*').order('designation'),
      supabase.from('sous_traitants').select('*').order('nom'),
      supabase.from('distributeurs').select('*').order('nom'),
    ])
    if (p) setProduits(p)
    if (s) setSousTraitants(s)
    if (d) setDistributeurs(d)
    setLoading(false)
  }

  async function addProduit() {
    const { error } = await supabase.from('produits').insert({
      ref, designation, categorie, unite,
      seuil_min: parseInt(seuilMin) || 0,
      necessite_serie: SERIE_CATS.includes(categorie),
    })
    if (error) { alert('Erreur: ' + error.message); return }
    setRef(''); setDesignation(''); setSeuilMin('0'); setShowProduitForm(false)
    loadData()
  }

  async function deleteProduit(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    await supabase.from('produits').delete().eq('id', id)
    loadData()
  }

  async function addSousTraitant() {
    const { error } = await supabase.from('sous_traitants').insert({ nom: nomST, couleur: couleurST })
    if (error) { alert('Erreur: ' + error.message); return }
    setNomST(''); setShowSTForm(false)
    loadData()
  }

  async function deleteSousTraitant(id: string) {
    if (!confirm('Supprimer ce sous-traitant ?')) return
    await supabase.from('sous_traitants').delete().eq('id', id)
    loadData()
  }

  async function addDistributeur() {
    const { error } = await supabase.from('distributeurs').insert({ nom: nomDist })
    if (error) { alert('Erreur: ' + error.message); return }
    setNomDist(''); setShowDistForm(false)
    loadData()
  }

  async function deleteDistributeur(id: string) {
    if (!confirm('Supprimer ce distributeur ?')) return
    await supabase.from('distributeurs').delete().eq('id', id)
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Chargement...</div>

  return (
    <div>
      <PageHeader title="Paramètres" />
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['produits', 'sous_traitants', 'distributeurs'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}>
            {tab === 'produits' ? `Produits (${produits.length})` :
             tab === 'sous_traitants' ? `Sous-traitants (${sousTraitants.length})` :
             `Distributeurs (${distributeurs.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'produits' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowProduitForm(!showProduitForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter un produit</button>
          </div>
          {showProduitForm && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Référence *</label>
                  <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="ex: PAC-001"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Désignation *</label>
                  <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Nom du produit"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                  <select value={categorie} onChange={(e) => setCategorie(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Unité</label>
                  <select value={unite} onChange={(e) => setUnite(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {UNITES.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Seuil min</label>
                  <input type="number" value={seuilMin} onChange={(e) => setSeuilMin(e.target.value)} min="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowProduitForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={addProduit} disabled={!ref || !designation}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">Ajouter</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {produits.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{p.designation}</span>
                    <span className="text-xs text-gray-400 font-mono">{p.ref}</span>
                    {p.necessite_serie && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">N° série</span>}
                  </div>
                  <div className="text-xs text-gray-400">{p.categorie} · {p.unite} · min {p.seuil_min}</div>
                </div>
                <button onClick={() => deleteProduit(p.id)}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
              </div>
            ))}
            {produits.length === 0 && <div className="px-4 py-8 text-center text-gray-400 text-sm">Aucun produit</div>}
          </div>
        </div>
      )}

      {activeTab === 'sous_traitants' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowSTForm(!showSTForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
          </div>
          {showSTForm && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                  <input value={nomST} onChange={(e) => setNomST(e.target.value)} placeholder="Nom"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Couleur</label>
                  <input type="color" value={couleurST} onChange={(e) => setCouleurST(e.target.value)}
                    className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowSTForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={addSousTraitant} disabled={!nomST}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">Ajouter</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {sousTraitants.map((st) => (
              <div key={st.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: st.couleur }} />
                  <span className="font-medium text-gray-900 text-sm">{st.nom}</span>
                </div>
                <button onClick={() => deleteSousTraitant(st.id)}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
              </div>
            ))}
            {sousTraitants.length === 0 && <div className="px-4 py-8 text-center text-gray-400 text-sm">Aucun sous-traitant</div>}
          </div>
        </div>
      )}

      {activeTab === 'distributeurs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowDistForm(!showDistForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Ajouter</button>
          </div>
          {showDistForm && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom du distributeur *</label>
                <input value={nomDist} onChange={(e) => setNomDist(e.target.value)} placeholder="ex: Atlantic, Panasonic..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDistForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={addDistributeur} disabled={!nomDist}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">Ajouter</button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {distributeurs.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-gray-900 text-sm">{d.nom}</span>
                <button onClick={() => deleteDistributeur(d.id)}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
              </div>
            ))}
            {distributeurs.length === 0 && <div className="px-4 py-8 text-center text-gray-400 text-sm">Aucun distributeur. Ajoutez-en depuis ce menu.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
