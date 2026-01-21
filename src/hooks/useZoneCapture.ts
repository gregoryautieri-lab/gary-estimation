import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

interface ZoneCaptureResult {
  imageUrl: string;
  geoJson: GeoJsonPolygon;
}

interface UseZoneCaptureReturn {
  capturing: boolean;
  error: string | null;
  captureZone: (
    mapContainerRef: HTMLElement | null,
    getCoordinates: () => [number, number][],
    missionId?: string
  ) => Promise<ZoneCaptureResult | null>;
}

export function useZoneCapture(): UseZoneCaptureReturn {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureZone = useCallback(
    async (
      mapContainerRef: HTMLElement | null,
      getCoordinates: () => [number, number][],
      missionId?: string
    ): Promise<ZoneCaptureResult | null> => {
      if (!mapContainerRef) {
        setError('Conteneur de carte non trouvé');
        return null;
      }

      const coordinates = getCoordinates();
      if (!coordinates || coordinates.length === 0) {
        setError('Aucune zone dessinée');
        return null;
      }

      setCapturing(true);
      setError(null);

      try {
        // 1. Capturer la carte avec html2canvas
        const canvas = await html2canvas(mapContainerRef, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          scale: 2,
        });

        // 2. Convertir en blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png', 0.9);
        });

        if (!blob) {
          throw new Error('Échec de la conversion en image');
        }

        // 3. Générer un nom de fichier unique
        const timestamp = Date.now();
        const fileName = missionId
          ? `${missionId}_${timestamp}.png`
          : `zone_${timestamp}.png`;
        const filePath = `zones/${fileName}`;

        // 4. Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('prospection')
          .upload(filePath, blob, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // 5. Récupérer l'URL publique
        const { data: urlData } = supabase.storage
          .from('prospection')
          .getPublicUrl(filePath);

        // 6. Créer le GeoJSON
        const geoJson: GeoJsonPolygon = {
          type: 'Polygon',
          coordinates: [coordinates],
        };

        return {
          imageUrl: urlData.publicUrl,
          geoJson,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur de capture';
        setError(message);
        console.error('Erreur capture zone:', err);
        return null;
      } finally {
        setCapturing(false);
      }
    },
    []
  );

  return { capturing, error, captureZone };
}
