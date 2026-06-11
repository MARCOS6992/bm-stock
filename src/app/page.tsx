'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { SousTraitant, Produit, StockItem, BonReception, BonPose } from '@/lib/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface StockSummary {
  sousTraitant: SousTraitant
  count: number
}

interface LowStockAlert {
  produit: Produit
  total: number
}

export default function Dashboard() {
  const [stockSummaries, setStockSummaries] = useState<StockSummary[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([])
  const [recentReceptions, setRecentReceptions] = useState<BonReception[]>([])
  const [recentPoses, setRecentPoses] = useState<BonPose[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const { data: sousTraitants } = await supabase.from('sous_traitants').select('*').order('nom')
      const { data: stockItems } = await supabase.from('stock_items').select('*').eq('statut', 'en_stock')
      const { data: produits } = await supabase.from('produits').select('*')

      if (sousTraitants && stockItems) {
        setStockSummaries(sousTraitants.map((st) => ({
          sousTraitant: st,
          count: stockItems.filter((item: StockItem) => item.sous_traitant_id === st.id).length
        })))
      }

      if (produits && stockItems) {
        const alerts: LowStockAlert[] = []
        for (const produit of produits) {
          const total = stockItems.filter((item: StockItem) => item.produit_id === produit.id).length
          if (produit.seuil_min && total <= produit.seuil_min) {
            alerts.push({ produit, total })
          }
        }
        setLowStockAlerts(alerts)
      }

      const { data: receptions } = await supabase.from('bons_reception').select('*, sous_traitant:sous_traitants(*)').order('created_at', { ascending: false }).limit(5)
      if (receptions) setRecentReceptions(receptions)

      const { data: poses } = await supabase.from('bons_pose').select('*, sous_traitant:sous_traitants(*)').order('created_at', { ascending: false }).limit(5)
      if (poses) setRecentPoses(poses)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Chargement...</div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="flex gap-2">
          <Link href="/receptions/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">+ Réception</Link>
          <Link href="/poses/new" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">+ Pose</Link>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Stock par sous-traitant</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stockSummaries.map(({ sousTraitant, count }) => (
            <Link key={sousTraitant.id} href={`/stock/${sousTraitant.id}`}
              className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: sousTraitant.couleur }}>
                  {sousTraitant.nom[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{sousTraitant.nom}</p>
                  <p className="text-2xl font-bold" style={{ color: sousTraitant.couleur }}>{count}</p>
                  <p className="text-xs text-gray-500">articles en stock</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {lowStockAlerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2"><span className="text-yellow-500">⚠️</span> Alertes stock bas</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
            {lowStockAlerts.map(({ produit, total }) => (
              <div key={produit.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-yellow-800">{produit.designation}</span>
                <span className="text-yellow-600">{total} / seuil {produit.seuil_min}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">Dernières réceptions</h2>
            <Link href="/receptions" className="text-blue-600 text-sm hover:underline">Voir tout</Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {recentReceptions.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">Aucune réception</p>
            ) : (
              recentReceptions.map((reception) => (
                <div key={reception.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{reception.numero}</span>
                    <span className="text-xs text-gray-500">{format(new Date(reception.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{reception.fournisseur} → {(reception.sous_traitant as SousTraitant)?.nom}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-700">Dernières poses</h2>
            <Link href="/poses" className="text-green-600 text-sm hover:underline">Voir tout</Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {recentPoses.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">Aucune pose</p>
            ) : (
              recentPoses.map((pose) => (
                <div key={pose.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{pose.numero}</span>
                    <span className="text-xs text-gray-500">{format(new Date(pose.created_at), 'dd/MM/yyyy', { locale: fr })}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{pose.client} — {(pose.sous_traitant as SousTraitant)?.nom}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
