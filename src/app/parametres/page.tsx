'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SousTraitant, Produit } from '@/lib/types'
import PageHeader from '@/components/PageHeader'

const CATEGORIES = ['PAC_AIR_EAU', 'SSC', 'BALLON_ELEC', 'KIT_OUTILLAGE', 'ACCESSOIRE']
const UNITES = ['unité', 'pièce', 'kit', 'm', 'ml', 'lot']

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#1D4ED8',
]

export default function ParametresPage() {
  const [sousTraitants, setSousTraitants] = useState<SousTraitant[]>([])
  const [newNom, setNewNom] = useState('')
  const [newCouleur, setNewCouleur] = useState('#3B82F6')
  const [savingST, setSavingST] = useState(false)

  const [produits, setProduits] = useState<Produit[]>([])
  const [newRef, setNewRef] = useState('')
  const [newNomProd, setNewNomProd] = useState('')
  const [newCat, setNewCat] = useState('PAC_AIR_EAU')
  const [newUnite, setNewUnite] = useState('unité')
  const [newSeuil, setNewSeuil] = useState(0)
  const [savingProd, setSavingProd] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: sts }, { data: prods }] = await Promise.all([
      supabase.from('sous_traitants').select('*').order('nom'),
      supabase.from('produits').select('*').order('categorie,nom'),
    ])
    if (sts) setSousTraitants(sts)
    if (prods) setProduits(prods)
  }

  async function addSousTraitant() {
    if (!newNom.trim()) return
    setSavingST(true)
    const { error } = await supabase.from('sous_traitants').insert({
      nom: newNom.trim(),
      couleur: newCouleur,
    })
    if (!error) {
      setNewNom('')
      setNewCouleur('#3B82F6')
      await loadData()
    } else {
      alert('Erreur: ' + error.message)
    }
    setSavingST(false)
  }

  async function deleteSousTraitant(id: string) {
    if (!confirm('Supprimer ce sous-traitant ? Cette action est irréversible.')) return
    const { error } = await supabase.from('sous_traitants').delete().eq('id', id)
    if (!error) await loadData()
    else alert('Impossible de supprimer: ' + error.message)
  }

  async function addProduit() {
    if (!newRef.trim() || !newNomProd.trim()) return
    setSavingProd(true)
    const { error } = await supabase.from('produits').insert({
      reference: newRef.trim().toUpperCase(),
      nom: newNomProd.trim(),
      categorie: newCat,
      unite: newUnite,
      seuil_min: newSeuil,
    })
    if (!error) {
      setNewRef('')
      setNewNomProd('')
      setNewCat('PAC_AIR_EAU')
      setNewUnite('unité')
      setNewSeuil(0)
      await loadData()
    } else {
      alert('Erreur: ' + error.message)
    }
    setSavingProd(false)
  }

  async function deleteProduit(id: string) {
    if (!confirm('Supprimer ce produit ? Cette action est irréversible.')) return
    const { error } = await supabase.from('produits').delete().eq('id', id)
    if (!error) await loadData()
    else alert('Impossible de supprimer: ' + error.message)
  }

  const produitsByCategory = CATEGORIES.reduce<Record<string, Produit[]>>((acc, cat) => {
    acc[cat] = produits.filter((p) => p.categorie === cat)
    return acc
  }, {})

  return (
    <div className="space-y-10">
      <PageHeader
        title="Paramètres"
        subtitle="Gérer les sous-traitants et les produits"
      />

      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Sous-traitants</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100 mb-4">
          {sousTraitants.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm">Aucun sous-traitant</p>
          ) : (
            sousTraitants.map((st) => (
              <div key={st.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: st.couleur }}
                  />
                  <span className="font-medium text-gray-900">{st.nom}</span>
                  <span className="text-xs text-gray-400 font-mono">{st.couleur}</span>
                </div>
                <button
                  onClick={() => deleteSousTraitant(st.id)}
                  className="text-red-400 hover:text-red-600 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-medium text-gray-700 mb-3">Ajouter un sous-traitant</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={newNom}
              onChange={(e) => setNewNom(e.target.value)}
              placeholder="Nom du sous-traitant"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Couleur:</label>
              <input
                type="color"
                value={newCouleur}
                onChange={(e) => setNewCouleur(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewCouleur(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  newCouleur === c ? 'border-gray-900 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          <button
            onClick={addSousTraitant}
            disabled={!newNom.trim() || savingST}
            className="mt-3 w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {savingST ? 'Enregistrement...' : '+ Ajouter'}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Produits</h2>

        <div className="space-y-4 mb-4">
          {CATEGORIES.map((cat) => {
            const catProds = produitsByCategory[cat]
            if (catProds.length === 0) return null
            return (
              <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {cat.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {catProds.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{p.nom}</span>
                        <div className="flex gap-3 mt-0.5 text-xs text-gray-400">
                          <span className="font-mono">{p.reference}</span>
                          <span>{p.unite}</span>
                          <span>Seuil: {p.seuil_min}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteProduit(p.id)}
                        className="text-red-400 hover:text-red-600 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {produits.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              Aucun produit enregistré
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-medium text-gray-700 mb-3">Ajouter un produit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Référence *</label>
              <input
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                placeholder="ex: PAC-001"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
              <input
                value={newNomProd}
                onChange={(e) => setNewNomProd(e.target.value)}
                placeholder="Nom du produit"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unité</label>
              <select
                value={newUnite}
                onChange={(e) => setNewUnite(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UNITES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Seuil minimum</label>
              <input
                type="number"
                min="0"
                value={newSeuil}
                onChange={(e) => setNewSeuil(parseInt(e.target.value) || 0)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={addProduit}
            disabled={!newRef.trim() || !newNomProd.trim() || savingProd}
            className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {savingProd ? 'Enregistrement...' : '+ Ajouter le produit'}
          </button>
        </div>
      </section>
    </div>
  )
}
