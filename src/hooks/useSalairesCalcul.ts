import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface Etudiant {
  id: string;
  prenom: string;
  nom: string | null;
  email: string | null;
  salaire_horaire: number;
  actif: boolean;
}

interface Mission {
  id: string;
  strava_temps: string | null;
  date: string;
  etudiant_id: string;
}

interface SalaireCalcule {
  etudiant: Etudiant;
  missions: Mission[];
  totalMissions: number;
  totalHeures: number;
  salaireHoraire: number;
  montantTotal: number;
  missionsIds: string[];
}

/**
 * Convertit un temps strava (format "HH:MM:SS" ou "H:MM:SS") en heures décimales
 */
export const convertTempsToHours = (temps: string | null): number => {
  if (!temps) return 0;
  const parts = temps.split(':').map(Number);
  if (parts.length !== 3) return 0;
  const [h, m, s] = parts;
  if (isNaN(h) || isNaN(m) || isNaN(s)) return 0;
  return h + (m / 60) + (s / 3600);
};

/**
 * Formate des heures décimales en format lisible "Xh XXm"
 */
export const formatHeures = (heuresDecimales: number): string => {
  const h = Math.floor(heuresDecimales);
  const m = Math.round((heuresDecimales - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

/**
 * Calcule les dates de début et fin d'une période de paie
 * Période "2026-01" = du 23 décembre 2025 au 22 janvier 2026
 */
export const getPeriodeDates = (periode: string): { dateDebut: Date; dateFin: Date } => {
  const [year, month] = periode.split('-').map(Number);
  
  // Date début: 23 du mois précédent
  const dateDebut = new Date(year, month - 2, 23, 0, 0, 0);
  
  // Date fin: 22 du mois actuel à 23:59:59
  const dateFin = new Date(year, month - 1, 22, 23, 59, 59);
  
  return { dateDebut, dateFin };
};

/**
 * Génère une liste des périodes disponibles
 * 3 mois en arrière + mois actuel + 6 mois en avant = 10 mois
 */
export const getPeriodesDisponibles = (): { value: string; label: string }[] => {
  const periodes: { value: string; label: string }[] = [];
  const now = new Date();
  
  const moisLabels = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  // Générer : 3 mois arrière + actuel + 6 mois avant
  for (let i = -3; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const value = `${year}-${month.toString().padStart(2, '0')}`;
    const label = `${moisLabels[date.getMonth()]} ${year}`;
    periodes.push({ value, label });
  }
  
  // Plus récent en haut (inverser l'ordre)
  return periodes.reverse();
};

/**
 * Retourne la période actuelle au format "YYYY-MM"
 */
export const getPeriodeActuelle = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return `${year}-${month.toString().padStart(2, '0')}`;
};

interface UseSalairesCalculOptions {
  periode: string;
}

export function useSalairesCalcul({ periode }: UseSalairesCalculOptions) {
  // Calculer les dates de la période
  const { dateDebut, dateFin } = useMemo(() => getPeriodeDates(periode), [periode]);
  
  // Format dates pour Supabase
  const dateDebutStr = dateDebut.toISOString().split('T')[0];
  const dateFinStr = dateFin.toISOString().split('T')[0];

  // Fetch étudiants actifs
  const {
    data: etudiants = [],
    isLoading: loadingEtudiants
  } = useQuery({
    queryKey: ['etudiants-actifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etudiants')
        .select('*')
        .eq('actif', true)
        .order('prenom');

      if (error) throw error;
      return data as Etudiant[];
    }
  });

  // Fetch missions validées dans la période
  const {
    data: missions = [],
    isLoading: loadingMissions
  } = useQuery({
    queryKey: ['missions-periode', periode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('id, strava_temps, date, etudiant_id')
        .eq('strava_validated', true)
        .gte('date', dateDebutStr)
        .lte('date', dateFinStr);

      if (error) throw error;
      return data as Mission[];
    },
    enabled: !!periode
  });

  // Calculer les salaires pour chaque étudiant
  const salairesCalcules: SalaireCalcule[] = useMemo(() => {
    return etudiants.map(etudiant => {
      const etudiantMissions = missions.filter(m => m.etudiant_id === etudiant.id);
      const missionsIds = etudiantMissions.map(m => m.id);
      const totalMissions = etudiantMissions.length;
      const totalHeures = etudiantMissions.reduce(
        (sum, m) => sum + convertTempsToHours(m.strava_temps),
        0
      );
      const montantTotal = totalHeures * etudiant.salaire_horaire;

      return {
        etudiant,
        missions: etudiantMissions,
        totalMissions,
        totalHeures,
        salaireHoraire: etudiant.salaire_horaire,
        montantTotal,
        missionsIds
      };
    });
  }, [etudiants, missions]);

  // Totaux globaux
  const totaux = useMemo(() => {
    return salairesCalcules.reduce(
      (acc, s) => ({
        missions: acc.missions + s.totalMissions,
        heures: acc.heures + s.totalHeures,
        montant: acc.montant + s.montantTotal
      }),
      { missions: 0, heures: 0, montant: 0 }
    );
  }, [salairesCalcules]);

  return {
    salairesCalcules,
    totaux,
    dateDebut: dateDebutStr,
    dateFin: dateFinStr,
    isLoading: loadingEtudiants || loadingMissions,
    etudiants,
    missions
  };
}
