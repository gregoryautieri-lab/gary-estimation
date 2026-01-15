import type { 
  EstimationData, 
  Identification, 
  Caracteristiques, 
  AnalyseTerrain, 
  PreEstimation, 
  StrategiePitch 
} from '@/types/estimation';

export interface ModuleCompletion {
  module1: number;
  module2: number;
  module3: number;
  module4: number;
  module5: number;
  total: number;
}

export interface ModuleStatus {
  name: string;
  moduleNumber: number | string;
  completion: number;
  status: 'complete' | 'partial' | 'empty';
  details?: string;
  route: string;
}

/**
 * Calcule le score de complétion du Module 1 (Identification)
 */
function calculateModule1Completion(id?: Identification): number {
  if (!id) return 0;
  
  let score = 0;
  let total = 0;
  
  // Vendeur (30 points)
  if (id.vendeur?.nom) { score += 10; } total += 10;
  if (id.vendeur?.telephone) { score += 10; } total += 10;
  if (id.vendeur?.email) { score += 10; } total += 10;
  
  // Adresse (30 points)
  if (id.adresse?.rue) { score += 15; } total += 15;
  if (id.adresse?.localite) { score += 15; } total += 15;
  
  // Contexte (20 points)
  if (id.contexte?.motifVente) { score += 10; } total += 10;
  if (id.contexte?.horizon) { score += 10; } total += 10;
  
  // Projet post-vente (20 points)
  if (id.projetPostVente?.nature) { 
    score += 10; 
    // Bonus si critères achat renseignés
    if (id.projetPostVente.nature === 'achat' && id.projetPostVente.criteresAchat?.actif) {
      score += 10;
    } else if (id.projetPostVente.nature !== 'achat') {
      score += 10; // Pas besoin de critères si pas achat
    }
  }
  total += 20;
  
  return Math.round((score / total) * 100);
}

/**
 * Calcule le score de complétion du Module 2 (Caractéristiques)
 */
function calculateModule2Completion(carac?: Caracteristiques): number {
  if (!carac) return 0;
  
  let score = 0;
  let total = 0;
  
  // Type de bien (obligatoire)
  if (carac.typeBien) { score += 20; } total += 20;
  
  const isAppart = carac.typeBien === 'appartement';
  const isMaison = carac.typeBien === 'maison';
  
  // Surfaces
  if (isAppart) {
    if (carac.surfacePPE && parseFloat(carac.surfacePPE) > 0) { score += 15; } total += 15;
  } else if (isMaison) {
    if (carac.surfaceHabitableMaison && parseFloat(carac.surfaceHabitableMaison) > 0) { score += 15; } total += 15;
  }
  
  // Configuration
  if (carac.nombrePieces && parseFloat(carac.nombrePieces) > 0) { score += 10; } total += 10;
  if (carac.nombreChambres && parseFloat(carac.nombreChambres) > 0) { score += 10; } total += 10;
  if (carac.nombreSDB && parseFloat(carac.nombreSDB) > 0) { score += 5; } total += 5;
  
  // Construction
  if (carac.anneeConstruction) { score += 10; } total += 10;
  if (carac.cecb) { score += 5; } total += 5;
  
  // Étage (appart seulement)
  if (isAppart) {
    if (carac.etage) { score += 5; } total += 5;
  }
  
  // Chauffage
  if (carac.chauffage) { score += 5; } total += 5;
  
  // Parking
  const hasParking = 
    (carac.parkingCouverte && parseInt(carac.parkingCouverte) > 0) ||
    (carac.parkingExterieur && parseInt(carac.parkingExterieur) > 0) ||
    (carac.box && parseInt(carac.box) > 0);
  if (hasParking || carac.typeBien) { score += 5; } total += 5; // On compte si renseigné même si 0
  
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

/**
 * Calcule le score de complétion du Module 3 (Analyse Terrain)
 */
function calculateModule3Completion(analyse?: AnalyseTerrain): number {
  if (!analyse) return 0;
  
  let score = 0;
  let total = 0;
  
  // États (40 points)
  if (analyse.etatCuisine && analyse.etatCuisine !== '') { score += 10; } total += 10;
  if (analyse.etatSDB && analyse.etatSDB !== '') { score += 10; } total += 10;
  if (analyse.etatSols && analyse.etatSols !== '') { score += 10; } total += 10;
  if (analyse.etatMurs && analyse.etatMurs !== '') { score += 10; } total += 10;
  
  // Ambiance (20 points)
  if (analyse.luminosite && analyse.luminosite > 0) { score += 10; } total += 10;
  if (analyse.calme && analyse.calme > 0) { score += 10; } total += 10;
  
  // Points forts/faibles (20 points)
  if (analyse.pointsForts && analyse.pointsForts.length > 0) { score += 10; } total += 10;
  if (analyse.pointsFaibles && analyse.pointsFaibles.length > 0) { score += 10; } total += 10;
  
  // Impression générale (10 points)
  if (analyse.impressionGenerale && analyse.impressionGenerale > 0) { score += 10; } total += 10;
  
  // Notes (10 points)
  if (analyse.notesLibres && analyse.notesLibres.trim().length > 0) { score += 10; } total += 10;
  
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

/**
 * Calcule le score de complétion du Module 4 (Pré-estimation)
 */
function calculateModule4Completion(preEst?: PreEstimation, typeBien?: string): number {
  if (!preEst) return 0;
  
  let score = 0;
  let total = 0;
  
  const isAppart = typeBien === 'appartement';
  const isMaison = typeBien === 'maison';
  
  // Prix au m² / m³ selon type
  if (isAppart) {
    if (preEst.prixM2 && parseFloat(preEst.prixM2) > 0) { score += 20; } total += 20;
  } else if (isMaison) {
    if (preEst.prixM3 && parseFloat(preEst.prixM3) > 0) { score += 20; } total += 20;
  } else {
    total += 20; // Type non défini
  }
  
  // Fourchette de prix (obligatoire)
  if (preEst.prixEntre && parseFloat(preEst.prixEntre) > 0) { score += 15; } total += 15;
  if (preEst.prixEt && parseFloat(preEst.prixEt) > 0) { score += 15; } total += 15;
  
  // Comparables (bonus)
  if (preEst.comparablesVendus && preEst.comparablesVendus.length > 0) { score += 20; } total += 20;
  if (preEst.comparablesEnVente && preEst.comparablesEnVente.length > 0) { score += 10; } total += 10;
  
  // Type mise en vente
  if (preEst.typeMiseEnVente) { score += 10; } total += 10;
  
  // Rendement (optionnel mais valorisé)
  if (preEst.loyerMensuel && parseFloat(preEst.loyerMensuel) > 0) { score += 10; } total += 10;
  
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

/**
 * Calcule le score de complétion du Module 5 (Stratégie & Pitch)
 */
function calculateModule5Completion(strat?: StrategiePitch): number {
  if (!strat) return 0;
  
  let score = 0;
  let total = 0;
  
  // Date de début
  if (strat.dateDebut) { score += 20; } total += 20;
  
  // Canaux actifs
  if (strat.canauxActifs && strat.canauxActifs.length > 0) { score += 15; } total += 15;
  
  // Durées de phase configurées
  if (strat.phaseDurees) { score += 15; } total += 15;
  
  // Leviers marketing
  if (strat.leviers && strat.leviers.length > 0) { score += 15; } total += 15;
  
  // Pitch personnalisé ou généré
  if (strat.pitchCustom && strat.pitchCustom.trim().length > 20) { score += 20; } total += 20;
  
  // Actions phase 0
  if (strat.phase0Actions && strat.phase0Actions.length > 0) { score += 15; } total += 15;
  
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

/**
 * Calcule le score global et par module
 */
export function calculateModuleCompletion(estimation: EstimationData | null): ModuleCompletion {
  if (!estimation) {
    return { module1: 0, module2: 0, module3: 0, module4: 0, module5: 0, total: 0 };
  }
  
  const module1 = calculateModule1Completion(estimation.identification);
  const module2 = calculateModule2Completion(estimation.caracteristiques);
  const module3 = calculateModule3Completion(estimation.analyseTerrain);
  const module4 = calculateModule4Completion(estimation.preEstimation, estimation.caracteristiques?.typeBien);
  const module5 = calculateModule5Completion(estimation.strategiePitch);
  
  const total = Math.round((module1 + module2 + module3 + module4 + module5) / 5);
  
  return { module1, module2, module3, module4, module5, total };
}

/**
 * Retourne le statut détaillé par module
 */
export function getModuleStatuses(estimation: EstimationData | null, id: string): ModuleStatus[] {
  const completion = calculateModuleCompletion(estimation);
  
  const getStatus = (pct: number): 'complete' | 'partial' | 'empty' => {
    if (pct >= 90) return 'complete';
    if (pct > 0) return 'partial';
    return 'empty';
  };
  
  const getDetail = (pct: number, moduleName: string): string | undefined => {
    if (pct >= 90) return undefined;
    if (pct >= 50) return 'À compléter';
    if (pct > 0) return 'Incomplet';
    return 'Non démarré';
  };
  
  return [
    {
      name: 'Identification',
      moduleNumber: 1,
      completion: completion.module1,
      status: getStatus(completion.module1),
      details: getDetail(completion.module1, 'Identification'),
      route: `/estimation/${id}/1`
    },
    {
      name: 'Caractéristiques',
      moduleNumber: 2,
      completion: completion.module2,
      status: getStatus(completion.module2),
      details: getDetail(completion.module2, 'Caractéristiques'),
      route: `/estimation/${id}/2`
    },
    {
      name: 'Analyse terrain',
      moduleNumber: 3,
      completion: completion.module3,
      status: getStatus(completion.module3),
      details: getDetail(completion.module3, 'Analyse terrain'),
      route: `/estimation/${id}/3`
    },
    {
      name: 'Pré-estimation',
      moduleNumber: 4,
      completion: completion.module4,
      status: getStatus(completion.module4),
      details: getDetail(completion.module4, 'Pré-estimation'),
      route: `/estimation/${id}/4`
    },
    {
      name: 'Stratégie & Pitch',
      moduleNumber: 5,
      completion: completion.module5,
      status: getStatus(completion.module5),
      details: getDetail(completion.module5, 'Stratégie'),
      route: `/estimation/${id}/5`
    },
    {
      name: 'Photos',
      moduleNumber: '📸',
      completion: estimation?.photos?.items?.length ? 100 : 0,
      status: estimation?.photos?.items?.length ? 'complete' : 'empty',
      details: estimation?.photos?.items?.length 
        ? `${estimation.photos.items.length} photo(s)` 
        : 'Aucune photo',
      route: `/estimation/${id}/photos`
    }
  ];
}

/**
 * Trouve le prochain module à compléter
 */
export function getNextIncompleteModule(estimation: EstimationData | null, id: string): string {
  const statuses = getModuleStatuses(estimation, id);
  const incomplete = statuses.find(s => s.status !== 'complete');
  return incomplete?.route || `/estimation/${id}/5`;
}