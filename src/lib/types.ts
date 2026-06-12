export interface SousTraitant {
  id: string
  nom: string
  couleur: string
  created_at: string
}

export interface Produit {
  id: string
  ref: string
  designation: string
  categorie: string
  unite: string
  seuil_min: number
  necessite_serie: boolean
  created_at: string
}

export interface Distributeur {
  id: string
  nom: string
  created_at: string
}

export interface StockUnit {
  id: string
  reference_id: string
  sous_traitant_id: string
  numero_serie: string | null
  fournisseur: string | null
  bl_fournisseur: string | null
  bon_reception_id: string | null
  date_entree: string | null
  statut: string
  produit?: Produit
  sous_traitant?: SousTraitant
}

export interface BonReception {
  id: string
  numero: string
  distributeur: string
  bl_fournisseur: string
  date_reception: string
  sous_traitant_id: string
  receptionne_par: string
  notes: string | null
  signature_url: string | null
  created_at: string
  sous_traitant?: SousTraitant
}

export interface LigneReception {
  id: string
  bon_reception_id: string
  reference_id: string
  qte: number
  series: string[]
  produit?: Produit
}

export interface BonPose {
  id: string
  numero: string
  client: string
  adresse_chantier: string
  code_cee: string | null
  numero_dossier: string | null
  sous_traitant_id: string
  notes: string | null
  signature_url: string | null
  date_pose: string | null
  created_at: string
  sous_traitant?: SousTraitant
}

export interface LignePose {
  id: string
  bon_pose_id: string
  unite_id: string
  ref: string
  designation: string
  numero_serie: string | null
  fournisseur: string | null
  bl_fournisseur: string | null
}
