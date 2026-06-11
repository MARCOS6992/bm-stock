import { supabase } from './supabase'
export async function seedDatabase() {
  await supabase.from('sous_traitants').upsert([
    { nom: 'Daniel', couleur: '#3B82F6' },
    { nom: 'Vasypack', couleur: '#10B981' },
    { nom: 'Stan', couleur: '#8B5CF6' },
  ] as any[], { onConflict: 'nom' })
  await supabase.from('produits').upsert([
    { reference: 'PAC-ATLAN-10', nom: 'PAC Air/Eau Atlantic 10kW', categorie: 'PAC_AIR_EAU', unite: 'unité', seuil_min: 2 },
    { reference: 'PAC-ATLAN-14', nom: 'PAC Air/Eau Atlantic 14kW', categorie: 'PAC_AIR_EAU', unite: 'unité', seuil_min: 2 },
    { reference: 'PAC-DAIK-8', nom: 'PAC Air/Eau Daikin 8kW', categorie: 'PAC_AIR_EAU', unite: 'unité', seuil_min: 2 },
    { reference: 'PAC-PANA-9', nom: 'PAC Air/Eau Panasonic 9kW', categorie: 'PAC_AIR_EAU', unite: 'unité', seuil_min: 1 },
    { reference: 'SSC-ATLAN-6', nom: 'SSC Atlantic 6m²', categorie: 'SSC', unite: 'unité', seuil_min: 1 },
    { reference: 'SSC-ATLAN-9', nom: 'SSC Atlantic 9m²', categorie: 'SSC', unite: 'unité', seuil_min: 1 },
    { reference: 'BALL-ATL-200', nom: 'Ballon électrique Atlantic 200L', categorie: 'BALLON_ELEC', unite: 'unité', seuil_min: 3 },
    { reference: 'BALL-ATL-300', nom: 'Ballon électrique Atlantic 300L', categorie: 'BALLON_ELEC', unite: 'unité', seuil_min: 2 },
    { reference: 'KIT-TOOL-PAC', nom: 'Kit outillage PAC', categorie: 'KIT_OUTILLAGE', unite: 'kit', seuil_min: 1 },
    { reference: 'KIT-TOOL-SSC', nom: 'Kit outillage SSC', categorie: 'KIT_OUTILLAGE', unite: 'kit', seuil_min: 1 },
  ] as any[], { onConflict: 'reference' })
}