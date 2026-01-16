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
    const startTime = Date.now();
    setLoading(true);
    setError(null);

    // Log #1: Démarrage recherche
    console.log('🗺️ [Cadastre] Recherche démarrée', {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      postalCode: postalCode || 'non renseigné',
      timestamp: new Date().toISOString()
    });

    try {
      // Log #2: Appel API
      console.log('📡 [Cadastre] Appel Edge Function cadastre-lookup...');
      
      const { data: responseData, error: fetchError } = await supabase.functions.invoke(
        'cadastre-lookup',
        {
          body: { lat, lng, postalCode }
        }
      );

      const responseTime = Date.now() - startTime;

      // Log #3: Réponse API reçue
      console.log('📡 [Cadastre] Réponse API reçue', {
        status: fetchError ? 'error' : 'success',
        hasData: !!responseData,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });

      if (fetchError) {
        // Log #4: Erreur Supabase
        console.error('❌ [Cadastre] Erreur Supabase détaillée', {
          error: fetchError.message,
          context: fetchError.context,
          coordinates: { lat, lng },
          postalCode,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        });
        throw new Error(fetchError.message);
      }

      // Log #5: Réponse brute
      console.log('📦 [Cadastre] Payload reçu:', JSON.stringify(responseData, null, 2));

      if (responseData?.error && !responseData.numeroParcelle) {
        // Log #6: Erreur métier
        console.warn('⚠️ [Cadastre] Erreur métier détectée', {
          error: responseData.error,
          source: responseData.source || 'unknown',
          coordinates: { lat, lng },
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString()
        });
        setError(responseData.error);
        setData(null);
        return null;
      }

      const cadastreData = responseData as CadastreData;
      
      // Log #7: Succès
      console.log('✅ [Cadastre] Données récupérées avec succès', {
        numeroParcelle: cadastreData.numeroParcelle,
        surfaceParcelle: `${cadastreData.surfaceParcelle} m²`,
        commune: cadastreData.commune,
        zone: cadastreData.zone,
        zoneDetail: cadastreData.zoneDetail || 'N/A',
        canton: cadastreData.canton,
        source: cadastreData.source,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
      
      setData(cadastreData);
      return cadastreData;

    } catch (err) {
      const responseTime = Date.now() - startTime;
      const message = err instanceof Error ? err.message : 'Erreur lors de la recherche cadastrale';
      
      // Log #8: Exception
      console.error('💥 [Cadastre] Exception détaillée', {
        error: message,
        stack: err instanceof Error ? err.stack : undefined,
        coordinates: { lat, lng },
        postalCode,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
      
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
    console.log('🔄 [Cadastre] Reset effectué');
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
