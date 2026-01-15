import type { 
  EstimationData, 
  Identification, 
  Caracteristiques, 
  AnalyseTerrain, 
  PreEstimation, 
  StrategiePitch 
} from '@/types/estimation';

export interface MissingField {
  field: string;
  label: string;
  type: 'obligatoire' | 'recommandé';
  section?: string;
}

export interface ModuleMissingFields {
  moduleNumber: number;
  moduleName: string;
  fields: MissingField[];
  canProceed: boolean;
}

/**
 * Champs manquants Module 1 (Identification)
 */
export function getMissingFieldsModule1(id?: Identification): MissingField[] {
  const missing: MissingField[] = [];

  if (!id) {
    return [
      { field: 'vendeur.nom', label: 'Nom du vendeur', type: 'obligatoire', section: 'Vendeur' },
      { field: 'vendeur.telephone', label: 'Téléphone du vendeur', type: 'obligatoire', section: 'Vendeur' },
      { field: 'adresse.rue', label: 'Adresse du bien', type: 'obligatoire', section: 'Adresse' },
      { field: 'contexte.motifVente', label: 'Motif de vente', type: 'obligatoire', section: 'Contexte' },
    ];
  }

  // Vendeur
  if (!id.vendeur?.nom) {
    missing.push({ field: 'vendeur.nom', label: 'Nom du vendeur', type: 'obligatoire', section: 'Vendeur' });
  }
  if (!id.vendeur?.telephone) {
    missing.push({ field: 'vendeur.telephone', label: 'Téléphone du vendeur', type: 'obligatoire', section: 'Vendeur' });
  }
  if (!id.vendeur?.email) {
    missing.push({ field: 'vendeur.email', label: 'Email du vendeur', type: 'recommandé', section: 'Vendeur' });
  }

  // Adresse
  if (!id.adresse?.rue) {
    missing.push({ field: 'adresse.rue', label: 'Adresse du bien', type: 'obligatoire', section: 'Adresse' });
  }
  if (!id.adresse?.localite) {
    missing.push({ field: 'adresse.localite', label: 'Localité', type: 'obligatoire', section: 'Adresse' });
  }
  if (!id.adresse?.codePostal) {
    missing.push({ field: 'adresse.codePostal', label: 'Code postal', type: 'recommandé', section: 'Adresse' });
  }

  // Contexte
  if (!id.contexte?.motifVente) {
    missing.push({ field: 'contexte.motifVente', label: 'Motif de vente', type: 'obligatoire', section: 'Contexte' });
  }
  if (!id.contexte?.horizon) {
    missing.push({ field: 'contexte.horizon', label: 'Horizon de vente', type: 'recommandé', section: 'Contexte' });
  }

  return missing;
}

/**
 * Champs manquants Module 2 (Caractéristiques)
 */
export function getMissingFieldsModule2(carac?: Caracteristiques): MissingField[] {
  const missing: MissingField[] = [];

  if (!carac) {
    return [
      { field: 'typeBien', label: 'Type de bien', type: 'obligatoire', section: 'Type' },
      { field: 'surface', label: 'Surface habitable', type: 'obligatoire', section: 'Surface' },
      { field: 'nombrePieces', label: 'Nombre de pièces', type: 'obligatoire', section: 'Configuration' },
    ];
  }

  if (!carac.typeBien) {
    missing.push({ field: 'typeBien', label: 'Type de bien', type: 'obligatoire', section: 'Type' });
  }

  const isAppart = carac.typeBien === 'appartement';
  const isMaison = carac.typeBien === 'maison';

  // Surfaces selon type
  if (isAppart && (!carac.surfacePPE || parseFloat(carac.surfacePPE) <= 0)) {
    missing.push({ field: 'surfacePPE', label: 'Surface PPE', type: 'obligatoire', section: 'Surface' });
  }
  if (isMaison && (!carac.surfaceHabitableMaison || parseFloat(carac.surfaceHabitableMaison) <= 0)) {
    missing.push({ field: 'surfaceHabitableMaison', label: 'Surface habitable', type: 'obligatoire', section: 'Surface' });
  }

  if (!carac.nombrePieces || parseFloat(carac.nombrePieces) <= 0) {
    missing.push({ field: 'nombrePieces', label: 'Nombre de pièces', type: 'obligatoire', section: 'Configuration' });
  }
  if (!carac.nombreChambres) {
    missing.push({ field: 'nombreChambres', label: 'Nombre de chambres', type: 'recommandé', section: 'Configuration' });
  }
  if (!carac.nombreSDB) {
    missing.push({ field: 'nombreSDB', label: 'Nombre de salles de bain', type: 'recommandé', section: 'Configuration' });
  }

  if (!carac.anneeConstruction) {
    missing.push({ field: 'anneeConstruction', label: 'Année de construction', type: 'recommandé', section: 'Construction' });
  }

  if (isAppart && !carac.etage) {
    missing.push({ field: 'etage', label: 'Étage', type: 'recommandé', section: 'Configuration' });
  }

  return missing;
}

/**
 * Champs manquants Module 3 (Analyse Terrain)
 */
export function getMissingFieldsModule3(analyse?: AnalyseTerrain): MissingField[] {
  const missing: MissingField[] = [];

  if (!analyse) {
    return [
      { field: 'etatCuisine', label: 'État de la cuisine', type: 'obligatoire', section: 'États' },
      { field: 'etatSDB', label: 'État des salles de bain', type: 'obligatoire', section: 'États' },
      { field: 'luminosite', label: 'Luminosité', type: 'obligatoire', section: 'Ambiance' },
    ];
  }

  // États des pièces
  if (!analyse.etatCuisine) {
    missing.push({ field: 'etatCuisine', label: 'État de la cuisine', type: 'obligatoire', section: 'États' });
  }
  if (!analyse.etatSDB) {
    missing.push({ field: 'etatSDB', label: 'État des salles de bain', type: 'obligatoire', section: 'États' });
  }
  if (!analyse.etatSols) {
    missing.push({ field: 'etatSols', label: 'État des sols', type: 'recommandé', section: 'États' });
  }
  if (!analyse.etatMurs) {
    missing.push({ field: 'etatMurs', label: 'État des murs', type: 'recommandé', section: 'États' });
  }

  // Ambiance
  if (!analyse.luminosite || analyse.luminosite <= 0) {
    missing.push({ field: 'luminosite', label: 'Luminosité', type: 'obligatoire', section: 'Ambiance' });
  }
  if (!analyse.calme || analyse.calme <= 0) {
    missing.push({ field: 'calme', label: 'Niveau de calme', type: 'recommandé', section: 'Ambiance' });
  }

  // Points forts/faibles
  if (!analyse.pointsForts || analyse.pointsForts.length === 0) {
    missing.push({ field: 'pointsForts', label: 'Points forts du bien', type: 'recommandé', section: 'Analyse' });
  }
  if (!analyse.pointsFaibles || analyse.pointsFaibles.length === 0) {
    missing.push({ field: 'pointsFaibles', label: 'Points faibles du bien', type: 'recommandé', section: 'Analyse' });
  }

  if (!analyse.impressionGenerale || analyse.impressionGenerale <= 0) {
    missing.push({ field: 'impressionGenerale', label: 'Impression générale', type: 'recommandé', section: 'Ambiance' });
  }

  return missing;
}

/**
 * Champs manquants Module 4 (Pré-estimation)
 */
export function getMissingFieldsModule4(preEst?: PreEstimation, typeBien?: string): MissingField[] {
  const missing: MissingField[] = [];

  if (!preEst) {
    return [
      { field: 'prixM2', label: 'Prix au m²', type: 'obligatoire', section: 'Prix' },
      { field: 'prixEntre', label: 'Prix minimum de la fourchette', type: 'obligatoire', section: 'Fourchette' },
      { field: 'prixEt', label: 'Prix maximum de la fourchette', type: 'obligatoire', section: 'Fourchette' },
    ];
  }

  const isAppart = typeBien === 'appartement';
  const isMaison = typeBien === 'maison';

  // Prix au m² ou m³
  if (isAppart && (!preEst.prixM2 || parseFloat(preEst.prixM2) <= 0)) {
    missing.push({ field: 'prixM2', label: 'Prix au m²', type: 'obligatoire', section: 'Prix' });
  }
  if (isMaison && (!preEst.prixM3 || parseFloat(preEst.prixM3) <= 0)) {
    missing.push({ field: 'prixM3', label: 'Prix au m³', type: 'obligatoire', section: 'Prix' });
  }

  // Fourchette de prix
  if (!preEst.prixEntre || parseFloat(preEst.prixEntre) <= 0) {
    missing.push({ field: 'prixEntre', label: 'Prix minimum de la fourchette', type: 'obligatoire', section: 'Fourchette' });
  }
  if (!preEst.prixEt || parseFloat(preEst.prixEt) <= 0) {
    missing.push({ field: 'prixEt', label: 'Prix maximum de la fourchette', type: 'obligatoire', section: 'Fourchette' });
  }

  // Comparables
  if (!preEst.comparablesVendus || preEst.comparablesVendus.length === 0) {
    missing.push({ field: 'comparablesVendus', label: 'Comparables vendus', type: 'recommandé', section: 'Comparables' });
  }
  if (!preEst.comparablesEnVente || preEst.comparablesEnVente.length === 0) {
    missing.push({ field: 'comparablesEnVente', label: 'Comparables en vente', type: 'recommandé', section: 'Comparables' });
  }

  // Type mise en vente
  if (!preEst.typeMiseEnVente) {
    missing.push({ field: 'typeMiseEnVente', label: 'Type de mise en vente', type: 'recommandé', section: 'Stratégie' });
  }

  return missing;
}

/**
 * Champs manquants Module 5 (Stratégie & Pitch)
 */
export function getMissingFieldsModule5(strat?: StrategiePitch): MissingField[] {
  const missing: MissingField[] = [];

  if (!strat) {
    return [
      { field: 'dateDebut', label: 'Date de lancement', type: 'obligatoire', section: 'Planning' },
      { field: 'canauxActifs', label: 'Canaux de diffusion', type: 'obligatoire', section: 'Diffusion' },
    ];
  }

  if (!strat.dateDebut) {
    missing.push({ field: 'dateDebut', label: 'Date de lancement', type: 'obligatoire', section: 'Planning' });
  }

  if (!strat.canauxActifs || strat.canauxActifs.length === 0) {
    missing.push({ field: 'canauxActifs', label: 'Canaux de diffusion', type: 'obligatoire', section: 'Diffusion' });
  }

  if (!strat.leviers || strat.leviers.length === 0) {
    missing.push({ field: 'leviers', label: 'Leviers marketing', type: 'recommandé', section: 'Marketing' });
  }

  if (!strat.pitchCustom || strat.pitchCustom.trim().length < 20) {
    missing.push({ field: 'pitchCustom', label: 'Pitch personnalisé', type: 'recommandé', section: 'Closing' });
  }

  if (!strat.phase0Actions || strat.phase0Actions.length === 0) {
    missing.push({ field: 'phase0Actions', label: 'Actions Phase 0', type: 'recommandé', section: 'Préparation' });
  }

  return missing;
}

/**
 * Obtenir tous les champs manquants pour un module donné
 */
export function getMissingFieldsForModule(
  moduleNumber: number,
  estimation: EstimationData | null
): ModuleMissingFields {
  const moduleNames: Record<number, string> = {
    1: 'Identification',
    2: 'Caractéristiques',
    3: 'Analyse terrain',
    4: 'Pré-estimation',
    5: 'Stratégie & Pitch'
  };

  let fields: MissingField[] = [];

  switch (moduleNumber) {
    case 1:
      fields = getMissingFieldsModule1(estimation?.identification);
      break;
    case 2:
      fields = getMissingFieldsModule2(estimation?.caracteristiques);
      break;
    case 3:
      fields = getMissingFieldsModule3(estimation?.analyseTerrain);
      break;
    case 4:
      fields = getMissingFieldsModule4(estimation?.preEstimation, estimation?.caracteristiques?.typeBien);
      break;
    case 5:
      fields = getMissingFieldsModule5(estimation?.strategiePitch);
      break;
  }

  const obligatoires = fields.filter(f => f.type === 'obligatoire');
  const canProceed = obligatoires.length === 0;

  return {
    moduleNumber,
    moduleName: moduleNames[moduleNumber] || `Module ${moduleNumber}`,
    fields,
    canProceed
  };
}

/**
 * Vérifier si on peut passer au statut "À présenter"
 */
export interface PresentationBlocker {
  canPresent: boolean;
  blockers: {
    module: number;
    moduleName: string;
    completion: number;
    required: number;
    missingCount: number;
  }[];
  message?: string;
}

export function canChangeToPresentation(estimation: EstimationData | null): PresentationBlocker {
  if (!estimation) {
    return {
      canPresent: false,
      blockers: [],
      message: 'Estimation introuvable'
    };
  }

  const blockers: PresentationBlocker['blockers'] = [];

  // Calculer la complétion de chaque module
  const module1Fields = getMissingFieldsModule1(estimation.identification);
  const module2Fields = getMissingFieldsModule2(estimation.caracteristiques);
  const module4Fields = getMissingFieldsModule4(estimation.preEstimation, estimation.caracteristiques?.typeBien);

  // Module 1 doit être à 80% minimum
  const module1Obligatoires = module1Fields.filter(f => f.type === 'obligatoire').length;
  const module1Total = 8; // Total des champs vérifiés
  const module1Completion = Math.round(((module1Total - module1Fields.length) / module1Total) * 100);
  
  if (module1Obligatoires > 0) {
    blockers.push({
      module: 1,
      moduleName: 'Identification',
      completion: module1Completion,
      required: 80,
      missingCount: module1Obligatoires
    });
  }

  // Module 2 doit être à 80% minimum
  const module2Obligatoires = module2Fields.filter(f => f.type === 'obligatoire').length;
  
  if (module2Obligatoires > 0) {
    blockers.push({
      module: 2,
      moduleName: 'Caractéristiques',
      completion: 0,
      required: 80,
      missingCount: module2Obligatoires
    });
  }

  // Module 4 doit être à 60% minimum
  const module4Obligatoires = module4Fields.filter(f => f.type === 'obligatoire').length;
  
  if (module4Obligatoires > 0) {
    blockers.push({
      module: 4,
      moduleName: 'Pré-estimation',
      completion: 0,
      required: 60,
      missingCount: module4Obligatoires
    });
  }

  const canPresent = blockers.length === 0;
  
  let message: string | undefined;
  if (!canPresent) {
    const totalMissing = blockers.reduce((acc, b) => acc + b.missingCount, 0);
    message = `Complétez ${totalMissing} champ${totalMissing > 1 ? 's' : ''} obligatoire${totalMissing > 1 ? 's' : ''} avant de présenter`;
  }

  return { canPresent, blockers, message };
}
