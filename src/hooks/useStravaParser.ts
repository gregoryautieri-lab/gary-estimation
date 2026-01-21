import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StravaData } from '@/types/prospection';

interface UseStravaParserResult {
  parseScreenshot: (file: File) => Promise<StravaData | null>;
  isParsing: boolean;
  error: string | null;
  lastResult: StravaData | null;
}

export function useStravaParser(): UseStravaParserResult {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<StravaData | null>(null);

  const parseScreenshot = useCallback(async (file: File): Promise<StravaData | null> => {
    setIsParsing(true);
    setError(null);

    try {
      // Convertir le fichier en base64
      const base64 = await fileToBase64(file);

      // Déterminer le mimeType
      const mimeType = file.type || 'image/jpeg';

      // Appeler l'Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('parse-strava-screenshot', {
        body: { imageBase64: base64, mimeType },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Impossible de lire les données Strava');
      }

      const stravaData: StravaData = {
        valid: true,
        temps: data.temps,
        distance_km: data.distance_km,
        vitesse_moy: data.vitesse_moy,
        vitesse_moy_kmh: data.vitesse_moy,
      };

      setLastResult(stravaData);
      toast.success('Données Strava extraites avec succès');
      return stravaData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du parsing';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return {
    parseScreenshot,
    isParsing,
    error,
    lastResult,
  };
}

// Helper pour convertir un fichier en base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Retirer le préfixe "data:image/...;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Fonction utilitaire pour validation manuelle (fallback)
export function parseStravaManual(input: string): StravaData | null {
  try {
    // Format attendu: "1h23m / 12.5km / 9.1km/h" ou similaire
    const tempsMatch = input.match(/(\d+h)?(\d+m)?(\d+s)?/);
    const distanceMatch = input.match(/([\d.]+)\s*km/i);
    const vitesseMatch = input.match(/([\d.]+)\s*km\/h/i);

    if (!distanceMatch) {
      return null;
    }

    const temps = tempsMatch ? tempsMatch[0].trim() : undefined;
    const distance_km = parseFloat(distanceMatch[1]);
    const vitesse_moy = vitesseMatch ? parseFloat(vitesseMatch[1]) : undefined;

    return {
      valid: true,
      temps,
      distance_km,
      vitesse_moy,
      vitesse_moy_kmh: vitesse_moy,
    };
  } catch {
    return null;
  }
}
