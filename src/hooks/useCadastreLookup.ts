import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CadastreData {
  numeroParcelle: string;
  surfaceParcelle: number;
  zone: string;
  zoneDetail?: string;
  commune: string;
  canton: string;
  source: 'sitg' | 'swisstopo' | 'asitvd' | 'unknown';
  error?: string;
}

interface UseCadastreLookupReturn {
  data: CadastreData | null;
  loading: boolean;
  error: string | null;
  fetchCadastre: (lat: number, lng: number, postalCode?: string) => Promise<CadastreData | null>;
  reset: () => void;
}

/**
 * Hook pour récupérer les données cadastrales d'une parcelle
 * Utilise SITG (Genève), ASIT-VD (Vaud) ou Swisstopo (Suisse)
 */
export function useCadastreLookup(): UseCadastreLookupReturn {
  const [data, setData] = useState<CadastreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCadastre = useCallback(async (
    lat: number, 
    lng: number, 
    postalCode?: string
  ): Promise<CadastreData | null> => {
    setLoading(true);
    setError(null);

    console.log(`🔍 [Cadastre] Recherche: lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)}, CP=${postalCode}`);

    try {
      const { data: responseData, error: fetchError } = await supabase.functions.invoke(
        'cadastre-lookup',
        {
          body: { lat, lng, postalCode }
        }
      );

      console.log('📦 [Cadastre] Réponse brute:', responseData);

      if (fetchError) {
        console.error('❌ [Cadastre] Erreur Supabase:', fetchError);
        throw new Error(fetchError.message);
      }

      if (responseData?.error && !responseData.numeroParcelle) {
        console.warn('⚠️ [Cadastre] Erreur métier:', responseData.error);
        setError(responseData.error);
        setData(null);
        return null;
      }

      const cadastreData = responseData as CadastreData;
      console.log('✅ [Cadastre] Données chargées:', {
        numeroParcelle: cadastreData.numeroParcelle,
        surface: cadastreData.surfaceParcelle,
        zone: cadastreData.zone,
        source: cadastreData.source
      });
      
      setData(cadastreData);
      return cadastreData;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la recherche cadastrale';
      console.error('💥 [Cadastre] Exception:', err);
      setError(message);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    fetchCadastre,
    reset
  };
}

/**
 * Mapping des zones vers les labels affichés
 */
export const ZONE_LABELS: Record<string, string> = {
  villa: '5 - Zone villa',
  residentielle: '4 - Zone résidentielle',
  mixte: '3 - Zone mixte',
  developpement: 'Zone de développement',
  agricole: 'Zone agricole'
};

/**
 * Obtenir le label d'une zone
 */
export function getZoneLabel(zone: string): string {
  return ZONE_LABELS[zone] || zone;
}
