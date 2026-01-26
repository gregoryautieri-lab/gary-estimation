/**
 * Calculs métier pour le PDF GARY
 * Extraits exactement du fichier source original
 */

import { parseNumber, roundTo5000 } from './pdfFormatters';

// ============================================================
// INTERFACES
// ============================================================

export interface CapitalVisibiliteResult {
  capitalPct: number;
  capitalAlerts: Array<{ type: 'critical' | 'warning' | 'info'; msg: string }>;
  pauseRecommandee: boolean;
}

export interface LuxModeResult {
  luxScore: number;
  luxMode: boolean;
}

export interface SurfacesCalculees {
  surfacePPE: number;
  surfaceNonHab: number;
  surfaceBalcon: number;
  surfaceTerrasse: number;
  surfaceJardin: number;
  surfacePonderee: number;
  surfaceTerrain: number;
  surfaceUtile: number;
  surfaceHabMaison: number;
  surfacePrincipale: number;
  surfaceAuSol: number;
  surfaceAmenagement: number;
  cubage: number;
}

export interface ValeursCalculees {
  valeurSurface: number;
  valeurPlaceInt: number;
  valeurPlaceExt: number;
  valeurBox: number;
  valeurCave: number;
  valeurLignesSupp: number;
  valeurTerrain: number;
  valeurCubage: number;
  valeurAmenagement: number;
  valeurAnnexes: number;
  totalVenaleAppart: number;
  totalVenaleMaison: number;
  totalVenale: number;
  totalVenaleArrondi: number;
  valeurRendement: number;
  valeurGage: number;
  valeurGageArrondi: number;
  prixEntre: number;
  prixEt: number;
  prixMiseEnVente: number;
}

export interface LuxCopy {
  pageTitle: string;
  headerTitle: string;
  timeline: string;
  diffusion: string;
  visibilite: string;
  capitalLabel: string;
  accelerer: string;
  introPhrase: string;
  disclaimerPhrase: string;
  recalibrageTitle: string;
  recalibragePhrase: string;
}

// ============================================================
// CALCUL CAPITAL-VISIBILITE
// ============================================================

interface HistoriqueData {
  dejaDiffuse?: boolean;
  duree?: string;
  typeDiffusion?: string;
  prixAffiche?: string | number;
  portails?: string[];
}

export function calculateCapitalVisibilite(
  historique: HistoriqueData,
  totalVenale: number
): CapitalVisibiliteResult {
  let capitalPct = 100;
  const capitalAlerts: CapitalVisibiliteResult['capitalAlerts'] = [];
  let pauseRecommandee = false;

  if (historique.dejaDiffuse) {
    // Impact de la durée
    let dureeImpact = 0;
    if (historique.duree === 'moins1mois') dureeImpact = 5;
    else if (historique.duree === '1-3mois') dureeImpact = 15;
    else if (historique.duree === '3-6mois') dureeImpact = 30;
    else if (historique.duree === '6-12mois') dureeImpact = 50;
    else if (historique.duree === 'plus12mois') dureeImpact = 65;

    // Impact du type de diffusion
    let diffusionImpact = 0;
    if (historique.typeDiffusion === 'discrete') diffusionImpact = 5;
    else if (historique.typeDiffusion === 'moderee') diffusionImpact = 15;
    else if (historique.typeDiffusion === 'massive') diffusionImpact = 30;

    // Combinaison durée + type
    capitalPct = 100 - dureeImpact - diffusionImpact;

    // Bonus si diffusion discrète longue (moins grave)
    if (historique.typeDiffusion === 'discrete' && dureeImpact > 15) {
      capitalPct += 10;
    }

    // Malus si diffusion massive longue (très grave)
    if (
      historique.typeDiffusion === 'massive' &&
      ['3-6mois', '6-12mois', 'plus12mois'].includes(historique.duree || '')
    ) {
      capitalPct -= 10;
    }

    // S'assurer que le capital reste entre 10 et 100
    capitalPct = Math.max(10, Math.min(100, capitalPct));

    // Alertes et recommandations
    if (capitalPct < 40) {
      pauseRecommandee = true;
      capitalAlerts.push({
        type: 'critical',
        msg: 'Pause commerciale de 2-3 semaines recommandée avant toute nouvelle action'
      });
      capitalAlerts.push({
        type: 'info',
        msg: "Réinventer l'objet : nouvelles photos, vidéo, brochure repensée"
      });
    }

    // Vérifier écart de prix si prix estimé disponible
    const prixAfficheNum = parseNumber(historique.prixAffiche);
    if (prixAfficheNum > 0 && totalVenale > 0) {
      const ecartPrix = ((prixAfficheNum - totalVenale) / totalVenale) * 100;
      if (ecartPrix > 30) {
        capitalAlerts.push({
          type: 'warning',
          msg: `Prix affiché précédemment (${prixAfficheNum.toLocaleString('fr-CH')} CHF) supérieur de ${ecartPrix.toFixed(0)}% à notre estimation. Repositionnement prix nécessaire.`
        });
      } else if (ecartPrix > 10) {
        capitalAlerts.push({
          type: 'info',
          msg: `Prix affiché précédemment légèrement au-dessus de notre estimation (${ecartPrix.toFixed(0)}%)`
        });
      }
    }

    // Portails utilisés pour éviter
    const portailsUtilises = historique.portails || [];
    if (portailsUtilises.length > 0) {
      const portailsLabels: Record<string, string> = {
        immoscout: 'Immoscout',
        homegate: 'Homegate',
        acheterlouer: 'Acheter-Louer',
        anibis: 'Anibis',
        immostreet: 'ImmoStreet',
        autres: 'Autres'
      };
      const portailsStr = portailsUtilises
        .map((p) => portailsLabels[p] || p)
        .join(', ');
      capitalAlerts.push({
        type: 'info',
        msg: 'Portails déjà utilisés : ' + portailsStr
      });
    }
  }

  return { capitalPct, capitalAlerts, pauseRecommandee };
}

// ============================================================
// CALCUL LUXMODE
// ============================================================

interface CaracData {
  sousType?: string;
  dernierEtage?: boolean;
  piscine?: boolean;
  annexesAppart?: string[];
}

interface ContexteData {
  confidentialite?: string;
  horizon?: string;
  prioriteVendeur?: string;
}

export function calculateLuxMode(
  carac: CaracData,
  contexte: ContexteData,
  historique: HistoriqueData,
  isAppartement: boolean,
  isMaison: boolean,
  surfaceHab: number,
  surfaceTerrain: number,
  totalVenaleArrondi: number
): LuxModeResult {
  let luxScore = 0;

  // Type de bien premium
  const sousTypePremium = ['attique', 'penthouse', 'loft', 'duplex'].includes(
    carac.sousType || ''
  );
  const sousTypeMaisonPremium = ['villa', 'propriete', 'chalet'].includes(
    carac.sousType || ''
  );
  if (sousTypePremium) luxScore += 15;
  if (sousTypeMaisonPremium) luxScore += 12;
  if (carac.dernierEtage && isAppartement) luxScore += 8;

  // Surfaces hors norme
  if (surfaceHab > 300) luxScore += 15;
  else if (surfaceHab > 200) luxScore += 10;
  else if (surfaceHab > 150) luxScore += 5;

  // Terrain (maison)
  if (isMaison && surfaceTerrain > 3000) luxScore += 15;
  else if (isMaison && surfaceTerrain > 1500) luxScore += 10;
  else if (isMaison && surfaceTerrain > 800) luxScore += 5;

  // Annexes premium
  if (carac.piscine) luxScore += 12;
  const annexesPremium = (carac.annexesAppart || []).filter((a) =>
    ['piscine_int', 'piscine_ext', 'hammam', 'sauna', 'jacuzzi'].includes(a)
  );
  luxScore += annexesPremium.length * 5;

  // Contexte vendeur (discrétion, long terme)
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
  const luxMode = luxScore >= 35;

  return { luxScore, luxMode };
}

// ============================================================
// VOCABULAIRE ADAPTATIF (LUX vs STANDARD)
// ============================================================

export function getLuxCopy(isLux: boolean): LuxCopy {
  return {
    pageTitle: isLux ? 'Scénarios de gouvernance' : 'Trajectoires de vente',
    headerTitle: isLux ? 'Scénarios de gouvernance' : 'Trajectoires de vente',
    timeline: isLux ? 'Cycle de maturation' : 'Timeline de diffusion',
    diffusion: isLux ? 'Exposition maîtrisée' : 'Diffusion',
    visibilite: isLux ? 'Portée contrôlée' : 'Visibilité',
    capitalLabel: isLux ? 'Capital de portée' : 'Capital-Visibilité',
    accelerer: isLux ? 'Arbitrer le tempo' : 'Accélérer',
    introPhrase: isLux
      ? "Chaque bien d'exception appelle une gouvernance sur mesure. Le choix du scénario dépend de votre tempo, vos exigences et votre vision."
      : 'Chaque bien peut être vendu selon différentes trajectoires. Le choix du point de départ stratégique dépend de votre contexte, vos priorités et votre horizon temporel.',
    disclaimerPhrase: isLux
      ? "Dans ce segment, la retenue et la sélectivité font partie de la stratégie. Un objectif de valeur reflète le positionnement stratégique, pas une promesse de marché."
      : "Un objectif de valeur n'est pas une promesse. Il dépend des signaux du marché, du rythme de diffusion et du pilotage dans le temps. Le point de départ stratégique est réversible — vous pouvez changer de trajectoire selon les retours observés.",
    recalibrageTitle: isLux ? 'Recalibrage nécessaire' : 'Recommandations',
    recalibragePhrase: isLux
      ? "Avant d'amplifier, on stabilise le message et on évite les signaux contradictoires."
      : ''
  };
}

// ============================================================
// CALCUL SURFACES
// ============================================================

interface CaracSurfaces {
  surfacePPE?: string | number;
  surfaceNonHabitable?: string | number;
  surfaceBalcon?: string | number;
  surfaceTerrasse?: string | number;
  surfaceJardin?: string | number;
  surfaceTerrain?: string | number;
  surfaceUtile?: string | number;
  surfaceHabitableMaison?: string | number;
  nombreNiveaux?: string | number;
}

interface PreEstimationCubage {
  cubageManuel?: string | number;
  cubageCalcule?: number;
}

export function calculateSurfaces(
  carac: CaracSurfaces,
  preEstimation: PreEstimationCubage,
  isAppartement: boolean
): SurfacesCalculees {
  const surfacePPE = parseNumber(carac.surfacePPE);
  const surfaceNonHab = parseNumber(carac.surfaceNonHabitable);
  const surfaceBalcon = parseNumber(carac.surfaceBalcon);
  const surfaceTerrasse = parseNumber(carac.surfaceTerrasse);
  const surfaceJardin = parseNumber(carac.surfaceJardin);
  const surfaceTerrain = parseNumber(carac.surfaceTerrain);
  const surfaceUtile = parseNumber(carac.surfaceUtile);
  const surfaceHabMaison = parseNumber(carac.surfaceHabitableMaison);

  // Surface pondérée (appartement)
  const surfacePonderee =
    surfacePPE +
    surfaceNonHab * 0.5 +
    surfaceBalcon * 0.5 +
    surfaceTerrasse * 0.33 +
    surfaceJardin * 0.1;

  // Cubage - priorité: cubageCalcule (UI) > cubageManuel > fallback
  const cubage = parseNumber(preEstimation.cubageCalcule) || parseNumber(preEstimation.cubageManuel) || surfaceUtile * 3.1;

  // Calculs maison
  const nbNiveaux = parseInt(String(carac.nombreNiveaux || 1)) || 1;
  const surfaceAuSol = nbNiveaux > 0 ? surfaceHabMaison / nbNiveaux : 0;
  const surfaceAmenagement = Math.max(0, surfaceTerrain - surfaceAuSol);

  // Surface principale selon type
  const surfacePrincipale = isAppartement ? surfacePonderee : surfaceHabMaison;

  return {
    surfacePPE,
    surfaceNonHab,
    surfaceBalcon,
    surfaceTerrasse,
    surfaceJardin,
    surfacePonderee,
    surfaceTerrain,
    surfaceUtile,
    surfaceHabMaison,
    surfacePrincipale,
    surfaceAuSol,
    surfaceAmenagement,
    cubage
  };
}

// ============================================================
// CALCUL VALEURS
// ============================================================

interface CaracAnnexes {
  parkingInterieur?: string | number;
  parkingExterieur?: string | number;
  box?: string | number;
  cave?: boolean;
}

interface PreEstimationPrix {
  prixM2?: string | number;
  tauxVetuste?: string | number;
  prixPlaceInt?: string | number;
  prixPlaceExt?: string | number;
  prixBox?: string | number;
  prixCave?: string | number;
  lignesSupp?: Array<{ libelle?: string; prix?: string | number }>;
  prixM2Terrain?: string | number;
  prixM3?: string | number;
  tauxVetusteMaison?: string | number;
  prixM2Amenagement?: string | number;
  annexes?: Array<{ libelle?: string; prix?: string | number }>;
  loyerMensuel?: string | number;
  tauxCapitalisation?: number;
  typeMiseEnVente?: string;
}

export function calculateValeurs(
  surfaces: SurfacesCalculees,
  carac: CaracAnnexes,
  preEstimation: PreEstimationPrix,
  isAppartement: boolean
): ValeursCalculees {
  const nbPlaceInt = parseInt(String(carac.parkingInterieur || 0)) || 0;
  const nbPlaceExt = parseInt(String(carac.parkingExterieur || 0)) || 0;
  const nbBox = parseInt(String(carac.box || 0)) || 0;
  const hasCave = carac.cave ? 1 : 0;

  const prixM2 = parseNumber(preEstimation.prixM2);
  const tauxVetuste = parseNumber(preEstimation.tauxVetuste);
  const prixM2Ajuste = prixM2 * (1 - tauxVetuste / 100);
  const prixPlaceInt = parseNumber(preEstimation.prixPlaceInt);
  const prixPlaceExt = parseNumber(preEstimation.prixPlaceExt);
  const prixBox = parseNumber(preEstimation.prixBox);
  const prixCave = parseNumber(preEstimation.prixCave);
  const prixM2Terrain = parseNumber(preEstimation.prixM2Terrain);
  const prixM3 = parseNumber(preEstimation.prixM3);
  const tauxVetusteMaison = parseNumber(preEstimation.tauxVetusteMaison);
  const prixM3Ajuste = prixM3 * (1 - tauxVetusteMaison / 100);
  const prixM2Amenagement = parseNumber(preEstimation.prixM2Amenagement);

  // Valeurs appartement
  const valeurSurface = surfaces.surfacePonderee * prixM2Ajuste;
  const valeurPlaceInt = nbPlaceInt * prixPlaceInt;
  const valeurPlaceExt = nbPlaceExt * prixPlaceExt;
  const valeurBox = nbBox * prixBox;
  const valeurCave = hasCave * prixCave;
  const valeurLignesSupp = (preEstimation.lignesSupp || []).reduce(
    (sum, l) => sum + parseNumber(l.prix),
    0
  );

  // Valeurs maison
  const valeurTerrain = surfaces.surfaceTerrain * prixM2Terrain;
  const valeurCubage = surfaces.cubage * prixM3Ajuste;
  const valeurAmenagement = surfaces.surfaceAmenagement * prixM2Amenagement;
  const valeurAnnexes = (preEstimation.annexes || []).reduce(
    (sum, a) => sum + parseNumber(a.prix),
    0
  );

  // Totaux
  const totalVenaleAppart =
    valeurSurface +
    valeurPlaceInt +
    valeurPlaceExt +
    valeurBox +
    valeurCave +
    valeurLignesSupp;
  const totalVenaleMaison =
    valeurTerrain + valeurCubage + valeurAmenagement + valeurAnnexes;
  const totalVenale = isAppartement ? totalVenaleAppart : totalVenaleMaison;
  const totalVenaleArrondi = roundTo5000(totalVenale);

  // Valeur rendement
  const loyerMensuel = parseNumber(preEstimation.loyerMensuel);
  const loyerNet = loyerMensuel * 0.9;
  const loyerAnnuel = loyerNet * 12;
  const tauxCapi = (preEstimation.tauxCapitalisation || 2.5) / 100;
  const valeurRendement =
    tauxCapi > 0 ? roundTo5000(loyerAnnuel / tauxCapi) : 0;

  // Valeur gage
  const valeurGage = (2 * totalVenale + valeurRendement) / 3;
  const valeurGageArrondi = roundTo5000(valeurGage);

  // Prix fourchette
  const prixEntre = roundTo5000(totalVenale * 0.97);
  const prixEt = roundTo5000(totalVenale * 1.03);

  // Prix mise en vente selon type
  const typeMV = preEstimation.typeMiseEnVente || 'public';
  const coefMV =
    typeMV === 'offmarket' ? 1.15 : typeMV === 'comingsoon' ? 1.1 : 1.06;
  const prixMiseEnVente = roundTo5000(totalVenale * coefMV);

  return {
    valeurSurface,
    valeurPlaceInt,
    valeurPlaceExt,
    valeurBox,
    valeurCave,
    valeurLignesSupp,
    valeurTerrain,
    valeurCubage,
    valeurAmenagement,
    valeurAnnexes,
    totalVenaleAppart,
    totalVenaleMaison,
    totalVenale,
    totalVenaleArrondi,
    valeurRendement,
    valeurGage: valeurGage,
    valeurGageArrondi,
    prixEntre,
    prixEt,
    prixMiseEnVente
  };
}

// ============================================================
// CALCUL NIVEAU CONTRAINTE PROJET POST-VENTE
// ============================================================

interface ProjetPostVenteData {
  nature?: string;
  avancement?: string;
}

export function calculateNiveauContrainte(projetPV: ProjetPostVenteData): number {
  const hasProjetAchat = projetPV.nature === 'achat';
  if (!hasProjetAchat) return 0;

  const avancement = projetPV.avancement || '';
  if (avancement === 'acte_programme') return 5;
  if (avancement === 'compromis_signe') return 4;
  if (avancement === 'offre_deposee') return 3;
  if (avancement === 'bien_identifie') return 2;
  if (avancement === 'recherche') return 1;
  return 0;
}

// ============================================================
// CALCUL PAUSE RECALIBRAGE
// ============================================================

export function calculatePauseRecalibrage(historique: HistoriqueData): number {
  if (!historique.dejaDiffuse) return 0;

  const duree = historique.duree || '';
  if (duree === 'moins1mois') return 1;
  if (duree === '1-3mois') return 2;
  if (duree === '3-6mois') return 3;
  if (duree === '6-12mois') return 4;
  if (duree === 'plus12mois') return 5;
  return 2; // Défaut
}
