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
// Constantes SIA (cubage normalisé)
// ============================================
const HAUTEUR_ETAGE = 2.5; // mètres
const COEF_MURS = 1.05; // 5% pour l'épaisseur des murs

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
  caracteristiques: Caracteristiques,
  preEstimation: PreEstimation
): EstimationCalculResult {
  return useMemo(() => {
    const isAppartement = caracteristiques.typeBien === 'appartement';
    const isMaison = caracteristiques.typeBien === 'maison';
    
    // ============================================
    // APPARTEMENT - Surface pondérée
    // ============================================
    const surfacePPE = parseNum(caracteristiques.surfacePPE);
    const surfaceNonHab = parseNum(caracteristiques.surfaceNonHabitable);
    const surfaceBalcon = parseNum(caracteristiques.surfaceBalcon);
    const surfaceTerrasse = parseNum(caracteristiques.surfaceTerrasse);
    const surfaceJardin = parseNum(caracteristiques.surfaceJardin);
    
    // Surface habitable = PPE - non habitable
    const surfaceHabitable = surfacePPE - surfaceNonHab;
    
    // Surface pondérée (balcon 50%, terrasse 30%, jardin 20%)
    const surfacePonderee = surfaceHabitable + 
      (surfaceBalcon * 0.5) + 
      (surfaceTerrasse * 0.3) + 
      (surfaceJardin * 0.2);
    
    // ============================================
    // MAISON - Cubage SIA
    // ============================================
    const surfaceHabMaison = parseNum(caracteristiques.surfaceHabitableMaison);
    const surfaceUtile = parseNum(caracteristiques.surfaceUtile);
    const surfaceTerrain = parseNum(caracteristiques.surfaceTerrain);
    const nombreNiveaux = parseNum(caracteristiques.nombreNiveaux) || 1;
    
    // Cubage automatique SIA: (surface hab / niveaux) * hauteur * coef murs * niveaux
    const surfaceParNiveau = surfaceHabMaison / nombreNiveaux;
    const cubageAuto = surfaceParNiveau * HAUTEUR_ETAGE * COEF_MURS * nombreNiveaux;
    
    // Cubage utilisé (manuel ou auto)
    const cubageManuel = parseNum(preEstimation.cubageManuel);
    const cubage = cubageManuel > 0 ? cubageManuel : cubageAuto;
    
    // Surface aménagement = utile - habitable
    const surfaceAmenagement = Math.max(0, surfaceUtile - surfaceHabMaison);
    
    // ============================================
    // PRIX & VETUSTE
    // ============================================
    const prixM2 = parseNum(preEstimation.prixM2);
    const tauxVetuste = preEstimation.tauxVetuste || 0;
    const prixM2Ajuste = prixM2 * (1 - tauxVetuste / 100);
    
    const prixM3 = parseNum(preEstimation.prixM3);
    const tauxVetusteMaison = preEstimation.tauxVetusteMaison || 0;
    const prixM3Ajuste = prixM3 * (1 - tauxVetusteMaison / 100);
    
    // ============================================
    // VALEURS APPARTEMENT
    // ============================================
    const valeurSurfaceBrute = surfacePonderee * prixM2;
    const valeurSurface = surfacePonderee * prixM2Ajuste;
    
    const nbPlaceInt = parseNum(caracteristiques.parkingInterieur);
    const nbPlaceExt = parseNum(caracteristiques.parkingExterieur);
    const nbBox = parseNum(caracteristiques.box);
    const hasCave = caracteristiques.cave;
    
    const valeurPlaceInt = nbPlaceInt * parseNum(preEstimation.prixPlaceInt);
    const valeurPlaceExt = nbPlaceExt * parseNum(preEstimation.prixPlaceExt);
    const valeurBox = nbBox * parseNum(preEstimation.prixBox);
    const valeurCave = hasCave ? parseNum(preEstimation.prixCave) : 0;
    
    const valeurLignesSupp = (preEstimation.lignesSupp || []).reduce(
      (sum, l) => sum + parseNum(l.prix), 0
    );
    
    // ============================================
    // VALEURS MAISON
    // ============================================
    const valeurTerrain = surfaceTerrain * parseNum(preEstimation.prixM2Terrain);
    const valeurCubage = cubage * prixM3Ajuste;
    const valeurAmenagement = surfaceAmenagement * parseNum(preEstimation.prixM2Amenagement);
    const valeurAnnexes = (preEstimation.annexes || []).reduce(
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
    // VALEUR DE RENDEMENT
    // ============================================
    const loyerBrut = parseNum(preEstimation.loyerMensuel);
    const loyerNet = loyerBrut * 0.9; // 10% charges
    const loyerAnnuel = loyerNet * 12;
    const tauxCapi = (preEstimation.tauxCapitalisation || 2.5) / 100;
    const valeurRendement = tauxCapi > 0 ? arrondir5000(loyerAnnuel / tauxCapi) : 0;
    
    // ============================================
    // VALEUR DE GAGE
    // ============================================
    const valeurGage = (2 * totalVenale + valeurRendement) / 3;
    const valeurGageArrondi = arrondir5000(valeurGage);
    
    // ============================================
    // FOURCHETTE (±3%)
    // ============================================
    const prixEntreCalcule = totalVenale > 0 ? arrondir5000(totalVenale * 0.97) : 0;
    const prixEtCalcule = totalVenale > 0 ? arrondir5000(totalVenale * 1.03) : 0;
    
    // ============================================
    // PRIX MISE EN VENTE PAR TYPE
    // ============================================
    const pourcOffmarket = preEstimation.pourcOffmarket ?? 15;
    const pourcComingsoon = preEstimation.pourcComingsoon ?? 10;
    const pourcPublic = preEstimation.pourcPublic ?? 6;
    
    const prixOffmarket = arrondir5000(totalVenale * (1 + pourcOffmarket / 100));
    const prixComingSoon = arrondir5000(totalVenale * (1 + pourcComingsoon / 100));
    const prixPublic = arrondir5000(totalVenale * (1 + pourcPublic / 100));
    
    const typeMV = preEstimation.typeMiseEnVente || 'public';
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
  caracteristiques: Caracteristiques,
  contexte: Contexte,
  historique: Historique,
  totalVenaleArrondi: number
): LuxMode {
  return useMemo(() => {
    let luxScore = 0;
    
    const isAppartement = caracteristiques.typeBien === 'appartement';
    const isMaison = caracteristiques.typeBien === 'maison';
    
    // Type de bien premium
    const sousTypePremium = ['attique', 'penthouse', 'loft', 'duplex'].includes(caracteristiques.sousType);
    const sousTypeMaisonPremium = ['villa', 'propriete', 'chalet'].includes(caracteristiques.sousType);
    
    if (sousTypePremium) luxScore += 15;
    if (sousTypeMaisonPremium) luxScore += 12;
    if (caracteristiques.dernierEtage && isAppartement) luxScore += 8;
    
    // Surfaces hors norme
    const surfacePonderee = parseNum(caracteristiques.surfacePPE) - parseNum(caracteristiques.surfaceNonHabitable);
    const surfaceHabMaison = parseNum(caracteristiques.surfaceHabitableMaison);
    const surfaceHab = isAppartement ? surfacePonderee : surfaceHabMaison;
    
    if (surfaceHab > 300) luxScore += 15;
    else if (surfaceHab > 200) luxScore += 10;
    else if (surfaceHab > 150) luxScore += 5;
    
    // Terrain (maison)
    const surfaceTerrain = parseNum(caracteristiques.surfaceTerrain);
    if (isMaison && surfaceTerrain > 3000) luxScore += 15;
    else if (isMaison && surfaceTerrain > 1500) luxScore += 10;
    else if (isMaison && surfaceTerrain > 800) luxScore += 5;
    
    // Annexes premium
    if (caracteristiques.piscine) luxScore += 12;
    
    // Contexte vendeur
    if (contexte.confidentialite === 'confidentielle') luxScore += 12;
    else if (contexte.confidentialite === 'discrete') luxScore += 8;
    if (contexte.horizon === 'flexible') luxScore += 5;
    if (contexte.prioriteVendeur === 'prixMax') luxScore += 5;
    
    // Bien déjà exposé + volonté de protéger
    if (historique.dejaDiffuse && contexte.confidentialite !== 'normale') {
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
