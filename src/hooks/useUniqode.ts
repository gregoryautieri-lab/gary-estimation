import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateQRResult {
  success: boolean;
  uniqodeId?: string;
  trackingUrl?: string;
  qrImageUrl?: string;
  error?: string;
}

interface QRStats {
  success: boolean;
  totalScans?: number;
  scansByDay?: { date: string; scans: number }[];
  error?: string;
}

/**
 * Hook pour interagir avec l'API Uniqode via Edge Function
 */
export function useUniqode() {
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Crée un QR code dynamique pour une campagne
   */
  const createQRCode = async (
    campagneCode: string,
    destinationUrl: string
  ): Promise<CreateQRResult> => {
    setIsCreating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('uniqode-qr', {
        body: {
          action: 'create',
          campagneCode,
          destinationUrl,
        },
      });

      if (error) {
        console.error('Error calling uniqode-qr:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Erreur inconnue' };
      }

      return {
        success: true,
        uniqodeId: data.uniqodeId,
        trackingUrl: data.trackingUrl,
        qrImageUrl: data.qrImageUrl,
      };
    } catch (err: any) {
      console.error('Error in createQRCode:', err);
      return { success: false, error: err.message || 'Erreur de connexion' };
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Récupère les statistiques d'un QR code
   */
  const getQRStats = async (uniqodeId: string): Promise<QRStats> => {
    try {
      const { data, error } = await supabase.functions.invoke('uniqode-qr', {
        body: {
          action: 'stats',
          uniqodeId,
        },
      });

      if (error) {
        console.error('Error calling uniqode-qr stats:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Erreur inconnue' };
      }

      return {
        success: true,
        totalScans: data.totalScans,
        scansByDay: data.scansByDay,
      };
    } catch (err: any) {
      console.error('Error in getQRStats:', err);
      return { success: false, error: err.message || 'Erreur de connexion' };
    }
  };

  return {
    createQRCode,
    getQRStats,
    isCreating,
  };
}

/**
 * Hook React Query pour récupérer les stats d'un QR avec cache et refresh
 */
export function useQRStats(uniqodeId: string | null | undefined) {
  return useQuery({
    queryKey: ['qr-stats', uniqodeId],
    queryFn: async () => {
      if (!uniqodeId) return null;
      
      const { data, error } = await supabase.functions.invoke('uniqode-qr', {
        body: {
          action: 'stats',
          uniqodeId,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return {
        totalScans: data.totalScans as number,
        scansByDay: data.scansByDay as { date: string; scans: number }[],
      };
    },
    enabled: !!uniqodeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}
