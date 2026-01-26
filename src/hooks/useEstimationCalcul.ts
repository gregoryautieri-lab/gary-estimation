import { useMemo } from 'react';
import type { 
  Caracteristiques, 
  PreEstimation, 
  Historique,
  Contexte,
  TypeMiseEnVente,
  CapitalVisibilite,
  LuxMode
} from '@/types/estimation';

// ============================================
// Constantes SIA (cubage normalisé) - Valeurs par défaut
// ============================================
const HAUTEUR_ETAGE_DEFAUT = 2.7; // mètres (hors-sol)
const HAUTEUR_SOUS_SOL_DEFAUT = 2.4; // mètres (sous-sol)
const HAUTEUR_COMBLES = 1.5; // mètres (combles aménageables)

// ============================================
// Fonctions utilitaires
// ============================================
const parseNum = (val: string | number | undefined): number => {
  if (typeof val === 'number') return val;
  return parseFloat(val || '0') || 0;
};

const arrondir5000 = (val: number): number => {
  return Math.ceil(val / 5000) * 5000;
};

export const formatPriceCHF = (n: number | undefined): string => {
  if (!n || isNaN(n)) return "—";
  return n.toLocaleString('fr-CH') + " CHF";
};

// ============================================
// Hook principal de calcul
// ============================================
export interface EstimationCalculResult {
  // Type de bien
  isAppartement: boolean;
  isMaison: boolean;
  
  // Surfaces calculées (Appartement)
  surfacePonderee: number;
  surfaceHabitable: number;
  
  // Cubage SIA (Maison)
  cubageAuto: number;
  cubage: number;
  surfaceAmenagement: number;
  
  // Surface aménagements extérieurs (Maison) - NOUVEAU
  empriseAuSolEstimee: number;      // Surface hab / (niveaux + 1)
  surfaceAmenagementExtAuto: number; // Surface parcelle - emprise
  surfaceAmenagementExt: number;     // Valeur utilisée (auto ou manuel)
  
  // Valeurs intermédiaires Appartement
  prixM2Ajuste: number;
  valeurSurfaceBrute: number;
  valeurSurface: number;
  valeurPlaceInt: number;
  valeurPlaceExt: number;
  valeurBox: number;
  valeurCave: number;
  valeurLignesSupp: number;
  
  // Valeurs intermédiaires Maison
  prixM3Ajuste: number;
  valeurTerrain: number;
  valeurCubage: number;
  valeurAmenagement: number;
  valeurAnnexes: number;
  
  // Totaux
  totalVenale: number;
  totalVenaleArrondi: number;
  
  // Rendement
  loyerBrut: number;
  loyerNet: number;
  loyerAnnuel: number;
  valeurRendement: number;
  
  // Valeur de gage
  valeurGage: number;
  valeurGageArrondi: number;
  
  // Fourchette
  prixEntreCalcule: number;
  prixEtCalcule: number;
  
  // Prix mise en vente par type
  prixOffmarket: number;
  prixComingSoon: number;
  prixPublic: number;
  prixMiseEnVente: number;
  
  // Quantités (pour affichage)
  nbPlaceInt: number;
  nbPlaceExt: number;
  nbBox: number;
  hasCave: boolean;
}

export function useEstimationCalcul(
  caracteristiques: Caracteristiques | null | undefined,
  preEstimation: PreEstimation | null | undefined
): EstimationCalculResult {
  return useMemo(() => {
    // Handle null/undefined safely
    const carac = caracteristiques || {} as Partial<Caracteristiques>;
    const preEst = preEstimation || {} as Partial<PreEstimation>;
    
    const isAppartement = carac.typeBien === 'appartement';
    const isMaison = carac.typeBien === 'maison';
    
    // ============================================
    // APPARTEMENT - Surface pondérée GARY
    // Coefficients officiels GARY:
    // - Habitable: 100%
    // - Sous-sol (cave incluse dans PPE): 50%
    // - Balcon: 50%
    // - Terrasse: 33%
    // - Jardin: 10%
    // ============================================
    const surfacePPE = parseNum(carac.surfacePPE);
    const surfaceNonHab = parseNum(carac.surfaceNonHabitable);
    const surfaceBalcon = parseNum(carac.surfaceBalcon);
    const surfaceTerrasse = parseNum(carac.surfaceTerrasse);
    const surfaceJardin = parseNum(carac.surfaceJardin);
    
    // Surface habitable = PPE - non habitable (caves, etc.)
    const surfaceHabitable = surfacePPE - surfaceNonHab;
    
    // Surface pondérée GARY complète
    // Sous-sol pondéré à 50% (surfaceNonHab représente le sous-sol/cave)
    const surfacePonderee = surfaceHabitable + 
      (surfaceNonHab * 0.5) +  // Sous-sol/Cave à 50%
      (surfaceBalcon * 0.5) + 
      (surfaceTerrasse * 0.33) + 
      (surfaceJardin * 0.1);
    
    // ============================================
    // MAISON - Cubage SIA amélioré
    // ============================================
    const surfaceHabMaison = parseNum(carac.surfaceHabitableMaison);
    const surfaceUtile = parseNum(carac.surfaceUtile);
    const surfaceTerrain = parseNum(carac.surfaceTerrain);
    const nombreNiveaux = parseNum(carac.nombreNiveaux) || 1;
    
    // Hauteurs personnalisables (ou défauts SIA)
    const hauteurEtage = parseNum(carac.hauteurSousPlafond) || HAUTEUR_ETAGE_DEFAUT;
    const hauteurSousSol = parseNum(carac.hauteurSousSol) || HAUTEUR_SOUS_SOL_DEFAUT;
    
    // Surface sous-sol (auto-calculée ou saisie)
    const surfaceSousSolAuto = Math.max(0, surfaceUtile - surfaceHabMaison);
    const surfaceSousSol = parseNum(carac.surfaceSousSol) || surfaceSousSolAuto;
    
    // Emprise au sol ESTIMÉE = surface habitable / (nombre de niveaux + 1)
    // nombreNiveaux = étages AU-DESSUS du RDC, donc +1 pour inclure le RDC
    const empriseAuSolEstimee = (nombreNiveaux + 1) > 0 
      ? surfaceHabMaison / (nombreNiveaux + 1) 
      : surfaceHabMaison;
    
    // Surface aménagements extérieurs AUTO = parcelle - emprise estimée
    const surfaceAmenagementExtAuto = Math.max(0, surfaceTerrain - empriseAuSolEstimee);
    
    // Surface utilisée (manuel si saisi, sinon auto)
    const surfaceAmenagementExtManuel = parseNum(preEst.surfaceAmenagementManuel);
    const surfaceAmenagementExt = surfaceAmenagementExtManuel > 0 
      ? surfaceAmenagementExtManuel 
      : surfaceAmenagementExtAuto;
    
    // Cubage SIA :
    // 1. Hors-sol : surface habitable × hauteur sous-plafond
    const cubageHorsSol = surfaceHabMaison * hauteurEtage;
    
    // 2. Sous-sol : surface sous-sol × hauteur sous-sol
    const cubageSousSol = surfaceSousSol * hauteurSousSol;
    
    // 3. Combles : emprise × 1.5m si aménageables (utilise l'emprise estimée)
    const comblesType = carac.comblesType || '';
    const cubageCombles = comblesType === 'amenageables' ? empriseAuSolEstimee * HAUTEUR_COMBLES : 0;
    
    // Total cubage automatique
    const cubageAuto = cubageHorsSol + cubageSousSol + cubageCombles;
    
    // Cubage utilisé (manuel si saisi, sinon auto)
    const cubageManuel = parseNum(preEst.cubageManuel);
    const cubage = cubageManuel > 0 ? cubageManuel : cubageAuto;
    
    // 🔵 DEBUG: Vérifier le calcul cubage dans l'UI
    console.log('🔵 UI CALCUL - cubageAuto:', cubageAuto, '| cubageManuel:', cubageManuel, '| cubage final:', cubage);
    
    // Surface aménagement (sous-sol) pour valorisation
    const surfaceAmenagement = surfaceSousSol;
    
    // ============================================
    // PRIX & VETUSTE
    // ============================================
    const prixM2 = parseNum(preEst.prixM2);
    const tauxVetuste = preEst.tauxVetuste || 0;
    const prixM2Ajuste = prixM2 * (1 - tauxVetuste / 100);
    
    const prixM3 = parseNum(preEst.prixM3);
    const tauxVetusteMaison = preEst.tauxVetusteMaison || 0;
    const prixM3Ajuste = prixM3 * (1 - tauxVetusteMaison / 100);
    
    // ============================================
    // VALEURS APPARTEMENT
    // ============================================
    const valeurSurfaceBrute = surfacePonderee * prixM2;
    const valeurSurface = surfacePonderee * prixM2Ajuste;
    
    const nbPlaceInt = parseNum(carac.parkingInterieur);
    const nbPlaceExt = parseNum(carac.parkingExterieur);
    const nbBox = parseNum(carac.box);
    const hasCave = carac.cave || false;
    
    const valeurPlaceInt = nbPlaceInt * parseNum(preEst.prixPlaceInt);
    const valeurPlaceExt = nbPlaceExt * parseNum(preEst.prixPlaceExt);
    const valeurBox = nbBox * parseNum(preEst.prixBox);
    const valeurCave = hasCave ? parseNum(preEst.prixCave) : 0;
    
    const valeurLignesSupp = (preEst.lignesSupp || []).reduce(
      (sum, l) => sum + parseNum(l.prix), 0
    );
    
    // ============================================
    // VALEURS MAISON
    // ============================================
    const valeurTerrain = surfaceTerrain * parseNum(preEst.prixM2Terrain);
    const valeurCubage = cubage * prixM3Ajuste;
    // Utilise surfaceAmenagementExt (jardin/extérieur) pour la valorisation des aménagements
    const valeurAmenagement = surfaceAmenagementExt * parseNum(preEst.prixM2Amenagement);
    const valeurAnnexes = (preEst.annexes || []).reduce(
      (sum, a) => sum + parseNum(a.prix), 0
    );
    
    // ============================================
    // TOTAL VALEUR VENALE
    // ============================================
    const totalVenaleAppart = valeurSurface + valeurPlaceInt + valeurPlaceExt + 
      valeurBox + valeurCave + valeurLignesSupp;
    const totalVenaleMaison = valeurTerrain + valeurCubage + valeurAmenagement + valeurAnnexes;
    const totalVenale = isAppartement ? totalVenaleAppart : totalVenaleMaison;
    const totalVenaleArrondi = arrondir5000(totalVenale);
    
    // ============================================
    // VALEUR DE RENDEMENT (Loyer capitalisé)
    // Formule: (Loyer mensuel net × 12) / Taux de capitalisation
    // Si pas de loyer renseigné mais valeur locative estimée, on l'utilise
    // ============================================
    const loyerMensuelSaisi = parseNum(preEst.loyerMensuel);
    const valeurLocativeEstimee = parseNum(preEst.valeurLocativeEstimee);
    
    // Utiliser le loyer saisi ou estimer depuis la valeur locative
    const loyerBrut = loyerMensuelSaisi > 0 
      ? loyerMensuelSaisi 
      : (valeurLocativeEstimee > 0 ? valeurLocativeEstimee / 12 : 0);
    
    // Charges déduites (10% par défaut ou personnalisé)
    const tauxCharges = parseNum(preEst.tauxChargesLocatives) || 10;
    const loyerNet = loyerBrut * (1 - tauxCharges / 100);
    const loyerAnnuel = loyerNet * 12;
    
    // Taux capitalisation (en % direct, ex: 3.5 pour 3.5%)
    const tauxCapi = (preEst.tauxCapitalisation || 3.5) / 100;
    const valeurRendement = tauxCapi > 0 && loyerAnnuel > 0 
      ? arrondir5000(loyerAnnuel / tauxCapi) 
      : 0;
    
    // ============================================
    // VALEUR DE GAGE (Formule bancaire suisse)
    // Formule: (2 × Valeur vénale + Valeur de rendement) / 3
    // Si pas de valeur rendement, utiliser uniquement vénale
    // ============================================
    const valeurGage = valeurRendement > 0 
      ? (2 * totalVenale + valeurRendement) / 3
      : totalVenale * 0.85; // Estimation prudente si pas de rendement
    const valeurGageArrondi = arrondir5000(valeurGage);
    
    // ============================================
    // FOURCHETTE (±3% autour de la valeur vénale)
    // ============================================
    const prixEntreCalcule = totalVenale > 0 ? arrondir5000(totalVenale * 0.97) : 0;
    const prixEtCalcule = totalVenale > 0 ? arrondir5000(totalVenale * 1.03) : 0;
    
    // ============================================
    // PRIX MISE EN VENTE PAR TYPE DE DIFFUSION
    // Off-market: +15% (négociation possible)
    // Coming Soon: +10%
    // Public: +6%
    // ============================================
    const pourcOffmarket = preEst.pourcOffmarket ?? 15;
    const pourcComingsoon = preEst.pourcComingsoon ?? 10;
    const pourcPublic = preEst.pourcPublic ?? 6;
    
    const prixOffmarket = arrondir5000(totalVenale * (1 + pourcOffmarket / 100));
    const prixComingSoon = arrondir5000(totalVenale * (1 + pourcComingsoon / 100));
    const prixPublic = arrondir5000(totalVenale * (1 + pourcPublic / 100));
    
    const typeMV = preEst.typeMiseEnVente || 'public';
    const prixMiseEnVente = typeMV === 'offmarket' ? prixOffmarket : 
      (typeMV === 'comingsoon' ? prixComingSoon : prixPublic);
    
    return {
      isAppartement,
      isMaison,
      surfacePonderee,
      surfaceHabitable,
      cubageAuto,
      cubage,
      surfaceAmenagement,
      empriseAuSolEstimee,
      surfaceAmenagementExtAuto,
      surfaceAmenagementExt,
      prixM2Ajuste,
      valeurSurfaceBrute,
      valeurSurface,
      valeurPlaceInt,
      valeurPlaceExt,
      valeurBox,
      valeurCave,
      valeurLignesSupp,
      prixM3Ajuste,
      valeurTerrain,
      valeurCubage,
      valeurAmenagement,
      valeurAnnexes,
      totalVenale,
      totalVenaleArrondi,
      loyerBrut,
      loyerNet,
      loyerAnnuel,
      valeurRendement,
      valeurGage,
      valeurGageArrondi,
      prixEntreCalcule,
      prixEtCalcule,
      prixOffmarket,
      prixComingSoon,
      prixPublic,
      prixMiseEnVente,
      nbPlaceInt,
      nbPlaceExt,
      nbBox,
      hasCave
    };
  }, [caracteristiques, preEstimation]);
}

// ============================================
// Hook Capital-Visibilité
// ============================================
export function useCapitalVisibilite(historique: Historique): CapitalVisibilite {
  return useMemo(() => {
    let capitalPct = 100;
    const alerts: CapitalVisibilite['alerts'] = [];
    let pauseRecommandee = false;
    
    if (!historique.dejaDiffuse) {
      return { pourcentage: capitalPct, alerts, pauseRecommandee };
    }
    
    // Impact de la durée
    let dureeImpact = 0;
    switch (historique.duree) {
      case 'moins1mois': dureeImpact = 5; break;
      case '1-3mois': dureeImpact = 15; break;
      case '3-6mois': dureeImpact = 30; break;
      case '6-12mois': dureeImpact = 50; break;
      case 'plus12mois': dureeImpact = 65; break;
    }
    
    // Impact du type de diffusion
    let diffusionImpact = 0;
    switch (historique.typeDiffusion) {
      case 'discrete': diffusionImpact = 5; break;
      case 'moderee': diffusionImpact = 15; break;
      case 'massive': diffusionImpact = 30; break;
    }
    
    // Combinaison
    capitalPct = 100 - dureeImpact - diffusionImpact;
    
    // Bonus si diffusion discrète longue (moins grave)
    if (historique.typeDiffusion === 'discrete' && dureeImpact > 15) {
      capitalPct += 10;
    }
    
    // Malus si diffusion massive longue (très grave)
    if (historique.typeDiffusion === 'massive' && 
        ['3-6mois', '6-12mois', 'plus12mois'].includes(historique.duree)) {
      capitalPct -= 10;
    }
    
    // Clamp entre 10 et 100
    capitalPct = Math.max(10, Math.min(100, capitalPct));
    
    // Alertes
    if (capitalPct < 40) {
      pauseRecommandee = true;
      alerts.push({
        type: 'critical',
        msg: 'Pause commerciale de 2-3 semaines recommandée avant toute nouvelle action'
      });
      alerts.push({
        type: 'info',
        msg: 'Réinventer l\'objet : nouvelles photos, vidéo, brochure repensée'
      });
    }
    
    // Portails utilisés
    if (historique.portails && historique.portails.length > 0) {
      const portailsLabels: Record<string, string> = {
        immoscout: 'Immoscout',
        homegate: 'Homegate',
        acheterlouer: 'Acheter-Louer',
        anibis: 'Anibis',
        immostreet: 'ImmoStreet',
        autres: 'Autres'
      };
      const portailsStr = historique.portails
        .map(p => portailsLabels[p] || p)
        .join(', ');
      alerts.push({
        type: 'info',
        msg: `Portails déjà utilisés : ${portailsStr}`
      });
    }
    
    return { pourcentage: capitalPct, alerts, pauseRecommandee };
  }, [historique]);
}

// ============================================
// Hook LuxMode (calcul automatique)
// ============================================
export function useLuxMode(
  caracteristiques: Caracteristiques | null | undefined,
  contexte: Contexte | null | undefined,
  historique: Historique | null | undefined,
  totalVenaleArrondi: number
): LuxMode {
  return useMemo(() => {
    const carac = caracteristiques || {} as Partial<Caracteristiques>;
    const ctx = contexte || {} as Partial<Contexte>;
    const hist = historique || {} as Partial<Historique>;
    
    let luxScore = 0;
    
    const isAppartement = carac.typeBien === 'appartement';
    const isMaison = carac.typeBien === 'maison';
    
    // Type de bien premium
    const sousTypePremium = ['attique', 'penthouse', 'loft', 'duplex'].includes(carac.sousType || '');
    const sousTypeMaisonPremium = ['villa', 'propriete', 'chalet'].includes(carac.sousType || '');
    
    if (sousTypePremium) luxScore += 15;
    if (sousTypeMaisonPremium) luxScore += 12;
    if (carac.dernierEtage && isAppartement) luxScore += 8;
    
    // Surfaces hors norme
    const surfacePonderee = parseNum(carac.surfacePPE) - parseNum(carac.surfaceNonHabitable);
    const surfaceHabMaison = parseNum(carac.surfaceHabitableMaison);
    const surfaceHab = isAppartement ? surfacePonderee : surfaceHabMaison;
    
    if (surfaceHab > 300) luxScore += 15;
    else if (surfaceHab > 200) luxScore += 10;
    else if (surfaceHab > 150) luxScore += 5;
    
    // Terrain (maison)
    const surfaceTerrain = parseNum(carac.surfaceTerrain);
    if (isMaison && surfaceTerrain > 3000) luxScore += 15;
    else if (isMaison && surfaceTerrain > 1500) luxScore += 10;
    else if (isMaison && surfaceTerrain > 800) luxScore += 5;
    
    // Annexes premium
    if (carac.piscine) luxScore += 12;
    
    // Contexte vendeur
    if (ctx.confidentialite === 'confidentielle') luxScore += 12;
    else if (ctx.confidentialite === 'discrete') luxScore += 8;
    if (ctx.horizon === 'flexible') luxScore += 5;
    if (ctx.prioriteVendeur === 'prixMax') luxScore += 5;
    
    // Bien déjà exposé + volonté de protéger
    if (hist.dejaDiffuse && ctx.confidentialite !== 'normale') {
      luxScore += 8;
    }
    
    // Valeur vénale
    if (totalVenaleArrondi > 10000000) luxScore += 20;
    else if (totalVenaleArrondi > 5000000) luxScore += 15;
    else if (totalVenaleArrondi > 3000000) luxScore += 10;
    else if (totalVenaleArrondi > 2000000) luxScore += 5;
    
    // Seuil luxMode
    const isLux = luxScore >= 35;
    
    return { score: luxScore, isLux };
  }, [caracteristiques, contexte, historique, totalVenaleArrondi]);
}
