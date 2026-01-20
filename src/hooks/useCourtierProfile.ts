// ============================================
// Hook pour récupérer le profil complet d'un courtier
// Utilisé pour les présentations et PDFs
// ============================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CourtierProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  telephone: string | null;
  avatar_url: string | null;
  email?: string;
}

// Téléphone GARY par défaut
const GARY_DEFAULT_TEL = '+41 22 557 07 00';
const GARY_DEFAULT_EMAIL = 'gary@gary.ch';

/**
 * Récupère le profil d'un courtier par son user_id
 */
export async function getCourtierProfileById(userId: string): Promise<CourtierProfile | null> {
  if (!userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, telephone, avatar_url')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching courtier profile:', error);
      return null;
    }

    return data as CourtierProfile;
  } catch (err) {
    console.error('Error in getCourtierProfileById:', err);
    return null;
  }
}

/**
 * Récupère les informations complètes du courtier pour affichage
 * Retourne les valeurs par défaut GARY si pas de profil trouvé
 */
export function useCourtierProfile(userId: string | undefined | null) {
  const [profile, setProfile] = useState<CourtierProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const data = await getCourtierProfileById(userId);
      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [userId]);

  return {
    profile,
    loading,
    // Valeurs avec fallback GARY
    nom: profile?.full_name || 'GARY Immobilier',
    telephone: profile?.telephone || GARY_DEFAULT_TEL,
    email: profile?.email || GARY_DEFAULT_EMAIL,
    avatarUrl: profile?.avatar_url || null,
  };
}

/**
 * Fonction utilitaire pour obtenir le téléphone d'un courtier (sync)
 * À utiliser dans les fonctions de génération PDF
 */
export async function getCourtierTelephone(userId: string | undefined | null): Promise<string> {
  if (!userId) return GARY_DEFAULT_TEL;
  
  const profile = await getCourtierProfileById(userId);
  return profile?.telephone || GARY_DEFAULT_TEL;
}

/**
 * Fonction utilitaire pour obtenir les infos complètes d'un courtier
 */
export async function getCourtierInfos(userId: string | undefined | null): Promise<{
  nom: string;
  telephone: string;
  email: string;
}> {
  if (!userId) {
    return {
      nom: 'GARY Immobilier',
      telephone: GARY_DEFAULT_TEL,
      email: GARY_DEFAULT_EMAIL,
    };
  }
  
  const profile = await getCourtierProfileById(userId);
  
  return {
    nom: profile?.full_name || 'GARY Immobilier',
    telephone: profile?.telephone || GARY_DEFAULT_TEL,
    email: GARY_DEFAULT_EMAIL, // Email toujours gary@gary.ch pour l'instant
  };
}
