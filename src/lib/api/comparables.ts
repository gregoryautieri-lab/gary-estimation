import { supabase } from '@/integrations/supabase/client';
import { Comparable, TypeBien } from '@/types/estimation';

export interface ScrapedComparableData {
  adresse?: string;
  prix?: string;
  surface?: string;
  nombrePieces?: string;
  typeBien?: string;
  source: string;
  description?: string;
  images?: string[]; // URLs des photos extraites
}

interface ScrapeResponse {
  success: boolean;
  data?: ScrapedComparableData;
  error?: string;
  fallback?: boolean;
}

interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Scrape une URL d'annonce immobilière via Firecrawl
 */
export async function scrapeComparableUrl(url: string): Promise<ScrapeResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-comparable', {
      body: { url },
    });

    if (error) {
      console.error('Scrape function error:', error);
      return { 
        success: false, 
        error: error.message,
        fallback: true,
        data: { source: detectSourceFromUrl(url) }
      };
    }

    return data;
  } catch (err) {
    console.error('Scrape error:', err);
    return { 
      success: false, 
      error: 'Erreur de connexion',
      fallback: true,
      data: { source: detectSourceFromUrl(url) }
    };
  }
}

/**
 * Détecte la source depuis l'URL
 */
export function detectSourceFromUrl(url: string): string {
  if (url.includes('immoscout24')) return 'ImmoScout24';
  if (url.includes('homegate')) return 'Homegate';
  if (url.includes('immobilier.ch')) return 'Immobilier.ch';
  if (url.includes('acheter-louer')) return 'Acheter-Louer';
  if (url.includes('newhome')) return 'Newhome';
  if (url.includes('anibis')) return 'Anibis';
  return 'Web';
}

/**
 * Géocode une adresse via Google Places API
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address) return null;

  try {
    const { data, error } = await supabase.functions.invoke('google-places', {
      body: { 
        action: 'geocode',
        address: address + ', Suisse'
      },
    });

    if (error || !data?.success) {
      console.warn('Geocoding failed:', error || data?.error);
      return null;
    }

    return data.location;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

/**
 * Recherche des comparables GARY proches d'une localité
 */
export async function findNearbyGaryComparables(params: {
  localite?: string;
  typeBien?: TypeBien;
  prixMin?: number;
  prixMax?: number;
  rayonKm?: number;
  excludeId?: string;
  limit?: number;
}): Promise<Comparable[]> {
  const { localite, typeBien, prixMin, prixMax, excludeId, limit = 10 } = params;

  try {
    let query = supabase
      .from('estimations')
      .select('id, adresse, localite, code_postal, prix_final, caracteristiques, type_bien, updated_at, identification')
      .eq('statut', 'mandat_signe')
      .not('prix_final', 'is', null)
      .not('adresse', 'is', null);

    // Filtre par localité (recherche souple)
    if (localite) {
      query = query.or(`localite.ilike.%${localite}%,adresse.ilike.%${localite}%`);
    }

    // Filtre par type de bien
    if (typeBien) {
      query = query.eq('type_bien', typeBien);
    }

    // Filtre par prix
    if (prixMin) {
      query = query.gte('prix_final', prixMin);
    }
    if (prixMax) {
      query = query.lte('prix_final', prixMax);
    }

    // Exclure l'estimation courante
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching nearby comparables:', error);
      return [];
    }

    return (data || []).map(est => {
      const carac = est.caracteristiques as any;
      const ident = est.identification as any;
      
      return {
        id: est.id,
        adresse: est.adresse || '',
        prix: (est.prix_final || 0).toString(),
        surface: carac?.surfacePPE || carac?.surfaceHabitableMaison || '',
        nombrePieces: carac?.nombrePieces || '',
        typeBien: est.type_bien as TypeBien || undefined,
        dateVente: est.updated_at ? new Date(est.updated_at).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' }) : undefined,
        source: 'GARY',
        commentaire: 'Mandat GARY vendu',
        isGary: true,
        coordinates: ident?.adresse?.coordinates || undefined,
      };
    });
  } catch (err) {
    console.error('Error in findNearbyGaryComparables:', err);
    return [];
  }
}

/**
 * Calcule le prix/m² d'un comparable
 */
export function calculatePrixM2(prix: string, surface: string): string {
  const prixNum = parseFloat(prix);
  const surfaceNum = parseFloat(surface);
  
  if (!prixNum || !surfaceNum || surfaceNum === 0) return '';
  
  return Math.round(prixNum / surfaceNum).toString();
}
