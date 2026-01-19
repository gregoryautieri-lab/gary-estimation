/**
 * Page 3-4 : Stratégie de commercialisation
 * Génère le HTML pour les pages stratégie et trajectoires
 */

import { EstimationData } from '@/types/estimation';
import { ico } from '../pdfIcons';
import { getLogo } from '../pdfLogos';
import { formatPrice, getNextMonday, addWeeks } from '../pdfFormatters';
import { 
  calculateCapitalVisibilite, 
  calculateLuxMode, 
  getLuxCopy,
  calculateSurfaces, 
  calculateValeurs,
  calculatePauseRecalibrage,
  calculateNiveauContrainte
} from '../pdfCalculs';

interface PageStrategieConfig {
  pageNum: number;
  totalPages: number;
  refId: string;
}

// Trajectoires de commercialisation
const trajectoires = [
  {
    id: 'offmarket',
    nom: 'Off-Market',
    icon: 'lock',
    pourc: 5,
    objectif: 'Vendre avant l\'exposition publique',
    objectifLux: 'Transaction privée entre acquéreurs qualifiés',
    typeExposition: 'Confidentielle et sélective',
    typePression: 'Pression créée par la rareté',
    priseEnCharge: 'Sélection manuelle des contacts',
    conditions: ['Prix cohérent marché', 'Bien attrayant', 'Réseau acheteurs actif']
  },
  {
    id: 'comingsoon',
    nom: 'Coming Soon',
    icon: 'clock',
    pourc: 2,
    objectif: 'Créer l\'attente avant mise en ligne',
    objectifLux: 'Création de l\'attente sur le marché premium',
    typeExposition: 'Teasing maîtrisé',
    typePression: 'Désir par anticipation',
    priseEnCharge: 'Campagne séquencée avant lancement',
    conditions: ['Photos pro disponibles', 'Délai 2-3 semaines', 'Bien préparé']
  },
  {
    id: 'public',
    nom: 'Public',
    icon: 'globe',
    pourc: 0,
    objectif: 'Maximiser la visibilité immédiate',
    objectifLux: 'Exposition maximale maîtrisée',
    typeExposition: 'Tous canaux activés',
    typePression: 'Concurrence ouverte',
    priseEnCharge: 'Diffusion multi-portails + réseaux',
    conditions: ['Bien prêt', 'Prix validé', 'Disponibilité visites']
  }
];

/**
 * Génère la page stratégie (page 3)
 */
export function generateStrategiePage(
  data: EstimationData,
  config: PageStrategieConfig
): string {
  const identification = data.identification as any || {};
  const caracteristiques = data.caracteristiques as any || {};
  const preEstimation = data.preEstimation as any || {};
  const historique = identification.historique || {};
  const contexte = identification.contexte || {};
  const strategie = data.strategiePitch as any || {};
  
  const isAppartement = data.typeBien === 'appartement';
  const isMaison = data.typeBien === 'maison';
  
  // Calculs
  const surfaces = calculateSurfaces(caracteristiques, preEstimation, isAppartement);
  const valeurs = calculateValeurs(surfaces, caracteristiques, preEstimation, isAppartement);
  const capitalResult = calculateCapitalVisibilite(historique, valeurs.totalVenale);
  const luxResult = calculateLuxMode(
    caracteristiques, 
    contexte, 
    historique, 
    isAppartement, 
    isMaison,
    surfaces.surfacePrincipale,
    surfaces.surfaceTerrain,
    valeurs.totalVenaleArrondi
  );
  const copy = getLuxCopy(luxResult.luxMode);
  const pauseRecalibrage = calculatePauseRecalibrage(historique);
  
  // Projet post-vente
  const projetPostVente = identification.projetPostVente || {};
  const hasProjetAchat = projetPostVente.nature === 'achat';
  const niveauContrainte = calculateNiveauContrainte(projetPostVente);
  const flexibilite = projetPostVente.flexibilite || 'moyenne';
  const toleranceVenteRapide = projetPostVente.toleranceVenteRapide || false;
  const toleranceVenteLongue = projetPostVente.toleranceVenteLongue || false;
  
  // Durées phases
  const phaseDurees = strategie.phaseDurees || { phase0: 1, phase1: 3, phase2: 2, phase3: 6 };
  
  // Ajustements selon projet d'achat
  let phase1Ajustee = phaseDurees.phase1 || 3;
  let phase2Ajustee = phaseDurees.phase2 || 2;

  if (hasProjetAchat && niveauContrainte > 0) {
    // Contrainte CRITIQUE ou FORTE (acte programmé, compromis signé)
    if (niveauContrainte >= 4) {
      if (flexibilite === 'faible') {
        phase1Ajustee = Math.max(1, phase1Ajustee - 2);
        phase2Ajustee = Math.max(1, phase2Ajustee - 1);
      } else {
        phase1Ajustee = Math.max(1, phase1Ajustee - 1);
      }
    }
    // Contrainte MODÉRÉE (offre déposée)
    else if (niveauContrainte === 3 && toleranceVenteRapide) {
      phase1Ajustee = Math.max(1, phase1Ajustee - 1);
    }
    // Contrainte FAIBLE (en recherche) + tolérance longue
    else if (niveauContrainte === 1 && toleranceVenteLongue) {
      phase1Ajustee = phase1Ajustee + 1;
    }
  }

  // Durées finales ajustées
  const phaseDureesFinales = {
    ...phaseDurees,
    phase1: phase1Ajustee,
    phase2: phase2Ajustee
  };
  
  // Type de mise en vente
  const typeMV = preEstimation.typeMiseEnVente || 'offmarket';
  const activerComingSoon = true; // Par défaut
  
  // Dates (avec durées ajustées)
  const startDate = getNextMonday();
  const phase1End = addWeeks(startDate, phaseDureesFinales.phase1);
  const phase2End = addWeeks(phase1End, phaseDureesFinales.phase2);
  
  let html = '<div class="page" style="page-break-before:always;">';
  
  // Header
  html += '<div class="header">';
  html += '<div>' + getLogo('white', 28) + '</div>';
  html += '<div class="header-date">Stratégie de commercialisation</div>';
  html += '</div>';
  
  // Timeline des phases
  html += generateTimelineSection(phaseDureesFinales, typeMV, activerComingSoon, startDate, phase1End, phase2End, pauseRecalibrage);
  
  // Bloc conditionnel : Passage entre phases (si projet d'achat)
  if (hasProjetAchat && niveauContrainte > 0) {
    html += '<div style="margin:12px 24px;padding:12px 16px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:0 6px 6px 0;">';
    html += '<div style="font-size:9px;font-weight:700;color:#1e40af;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">';
    html += ico('arrowRightLeft', 12, '#3b82f6') + ' Passage entre phases';
    html += '</div>';
    html += '<div style="font-size:8px;color:#1e3a5f;line-height:1.5;">';
    html += 'Chaque transition de phase s\'active lorsque le délai minimum est écoulé <strong>et</strong> que les signaux du marché le justifient. ';
    html += 'Votre projet d\'achat (niveau <strong>' + niveauContrainte + '/5</strong>) est intégré dans le calibrage des durées.';
    html += '</div>';
    html += '</div>';
  }
  
  // Trajectoires
  html += generateTrajectoiresSection(trajectoires, typeMV, valeurs.totalVenaleArrondi, luxResult.luxMode, historique as any, copy);
  
  // Capital visibilité
  html += generateCapitalSection(capitalResult, historique as any, copy);
  
  // Alertes si bien déjà diffusé
  if (capitalResult.capitalAlerts.length > 0 || (luxResult.luxMode && (historique as any).dejaDiffuse)) {
    html += generateAlertesSection(capitalResult.capitalAlerts, luxResult.luxMode, historique as any, copy);
  }
  
  // Bloc valeur à préserver (luxMode)
  if (luxResult.luxMode) {
    html += generateValeurPreserverSection();
  }
  
  // Disclaimer
  html += generateDisclaimerSection(luxResult.luxMode, copy);
  
  // Footer
  html += '<div class="footer">';
  html += '<div>' + getLogo('white', 18) + '</div>';
  html += '<div class="footer-ref">Page ' + config.pageNum + '/' + config.totalPages + ' • Réf: ' + config.refId + '</div>';
  html += '<div class="footer-slogan">On pilote, vous décidez.</div>';
  html += '</div>';
  
  html += '</div>';
  
  return html;
}

function formatDatePDF(date: Date): string {
  return 'Semaine du ' + date.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit' });
}

function generateTimelineSection(
  phaseDurees: any, 
  typeMV: string, 
  activerComingSoon: boolean, 
  startDate: Date,
  phase1End: Date,
  phase2End: Date,
  pauseRecalibrage: number
): string {
  let html = '<div style="padding:16px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('calendar', 12, '#9ca3af') + 'Calendrier prévisionnel</div>';
  
  html += '<div style="display:flex;gap:8px;margin-bottom:8px;">';
  
  // Phase 1 - Off-Market
  const phase1Active = typeMV === 'offmarket';
  html += '<div style="flex:1;text-align:center;padding:8px 4px;background:' + (phase1Active ? '#1a2e35' : '#f9fafb') + ';border-radius:6px;border:' + (phase1Active ? '2px solid #1a2e35' : '1px solid #e5e7eb') + ';">';
  html += '<div style="margin-bottom:2px;">' + ico('lock', 16, phase1Active ? 'rgba(255,255,255,0.8)' : '#9ca3af') + '</div>';
  html += '<div style="font-size:9px;font-weight:600;color:' + (phase1Active ? 'white' : '#1a2e35') + ';">Off-Market</div>';
  html += '<div style="font-size:7px;color:' + (phase1Active ? 'rgba(255,255,255,0.7)' : '#6b7280') + ';margin-top:2px;">' + formatDatePDF(startDate).split(' ').slice(0,2).join(' ') + '</div>';
  html += '<div style="font-size:7px;color:' + (phase1Active ? 'rgba(255,255,255,0.7)' : '#6b7280') + ';">~' + (phaseDurees.phase1 || 3) + ' sem.</div>';
  html += '</div>';
  
  // Phase 2 - Coming Soon
  if (activerComingSoon) {
    const phase2Active = typeMV === 'comingsoon';
    html += '<div style="flex:1;text-align:center;padding:8px 4px;background:' + (phase2Active ? '#1a2e35' : 'white') + ';border-radius:6px;border:' + (phase2Active ? '2px solid #1a2e35' : '1px solid #e5e7eb') + ';">';
    html += '<div style="margin-bottom:2px;">' + ico('clock', 16, phase2Active ? 'rgba(255,255,255,0.8)' : '#6b7280') + '</div>';
    html += '<div style="font-size:9px;font-weight:600;color:' + (phase2Active ? 'white' : '#1a2e35') + ';">Coming soon</div>';
    html += '<div style="font-size:7px;color:' + (phase2Active ? 'rgba(255,255,255,0.7)' : '#6b7280') + ';margin-top:2px;">' + formatDatePDF(phase1End).split(' ').slice(0,2).join(' ') + '</div>';
    html += '<div style="font-size:7px;color:' + (phase2Active ? 'rgba(255,255,255,0.7)' : '#6b7280') + ';">~' + (phaseDurees.phase2 || 2) + ' sem.</div>';
    html += '</div>';
  } else {
    html += '<div style="flex:1;text-align:center;padding:8px 4px;background:#f9fafb;border-radius:6px;border:1px dashed #e5e7eb;opacity:0.5;">';
    html += '<div style="margin-bottom:2px;">' + ico('clock', 16, '#d1d5db') + '</div>';
    html += '<div style="font-size:9px;font-weight:600;color:#9ca3af;">Coming soon</div>';
    html += '<div style="font-size:7px;color:#d1d5db;margin-top:2px;">—</div>';
    html += '<div style="font-size:7px;color:#d1d5db;">Optionnel</div>';
    html += '</div>';
  }
  
  // Phase 3 - Public
  html += '<div style="flex:1;text-align:center;padding:8px 4px;background:white;border-radius:6px;border:1px solid #e5e7eb;">';
  html += '<div style="margin-bottom:2px;">' + ico('globe', 16, '#6b7280') + '</div>';
  html += '<div style="font-size:9px;font-weight:600;color:#1a2e35;">Public</div>';
  html += '<div style="font-size:7px;color:#6b7280;margin-top:2px;">' + formatDatePDF(phase2End).split(' ').slice(0,2).join(' ') + '</div>';
  html += '<div style="font-size:7px;color:#6b7280;">~' + (phaseDurees.phase3 || 6) + ' sem.</div>';
  html += '</div>';
  
  html += '</div>';
  
  // Date vente estimée
  const dateVenteEstimee = addWeeks(phase2End, phaseDurees.phase3 || 6);
  html += '<div style="text-align:center;margin-top:10px;font-size:9px;color:#6b7280;">';
  html += ico('calendar', 12, '#6b7280') + ' Vente estimée : <strong style="color:#1a2e35;">' + formatDatePDF(dateVenteEstimee) + '</strong>';
  html += '</div>';
  
  // Note recalibrage si applicable
  if (pauseRecalibrage > 0) {
    html += '<div style="text-align:center;margin-top:8px;padding:8px 12px;background:#fef3c7;border-radius:4px;font-size:8px;color:#92400e;">';
    html += ico('refresh', 12, '#92400e') + ' <strong>Phase de recalibrage marché (' + pauseRecalibrage + ' sem.)</strong> — Le bien ayant déjà été exposé, cette période permet au marché de se renouveler et de repartir avec un positionnement optimal.';
    html += '</div>';
  }
  
  html += '</div>';
  
  return html;
}

function generateTrajectoiresSection(
  trajList: any[], 
  typeMV: string, 
  totalVenaleArrondi: number, 
  isLux: boolean,
  historique: any,
  copy: any
): string {
  const getStatut = (trajId: string) => {
    if (isLux && historique.dejaDiffuse) {
      if (trajId === 'offmarket') return {label: 'Conditionnel', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
      if (trajId === 'comingsoon' || trajId === typeMV) return {label: 'Point de départ stratégique', style: 'background:#1a2e35;color:white;'};
      if (trajId === 'public') return {label: 'Activable', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
    }
    if (trajId === typeMV) return {label: 'Point de départ stratégique', style: 'background:#1a2e35;color:white;'};
    if (trajId === 'public' && typeMV === 'offmarket') return {label: 'Conditionnel', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
    return {label: 'Activable', style: 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb;'};
  };
  
  let html = '<div style="padding:12px 24px;background:#f8fafc;">';
  html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;font-weight:600;display:flex;align-items:center;gap:5px;">' + ico('compass', 12, '#9ca3af') + (isLux ? 'Choisissez votre scénario' : 'Choisissez votre point de départ') + '</div>';
  
  html += '<div style="display:flex;gap:10px;">';
  
  trajList.forEach((traj) => {
    const statut = getStatut(traj.id);
    const isPointDepart = statut.label === 'Point de départ stratégique';
    const objectifValeur = Math.round(totalVenaleArrondi * (1 + traj.pourc / 100) / 5000) * 5000;
    
    html += '<div style="flex:1;background:white;border-radius:6px;border:' + (isPointDepart ? '2px solid #1a2e35' : '1px solid #e5e7eb') + ';overflow:hidden;">';
    
    // Header trajectoire
    html += '<div style="padding:10px;text-align:center;background:' + (isPointDepart ? '#1a2e35' : '#f9fafb') + ';border-bottom:1px solid #e5e7eb;">';
    html += '<div style="margin-bottom:4px;">' + ico(traj.icon, 18, isPointDepart ? 'rgba(255,255,255,0.8)' : '#9ca3af') + '</div>';
    html += '<div style="font-size:11px;font-weight:600;color:' + (isPointDepart ? 'white' : '#1a2e35') + ';">' + traj.nom + '</div>';
    html += '<div style="margin-top:4px;display:inline-block;padding:2px 6px;border-radius:3px;font-size:7px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;' + statut.style + '">' + statut.label + '</div>';
    html += '</div>';
    
    if (isLux) {
      // MODE LUXE
      html += '<div style="padding:6px 10px;background:white;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Intention</div>';
      html += '<div style="font-size:8px;color:#4b5563;line-height:1.3;">' + (traj.objectifLux || traj.objectif) + '</div>';
      html += '</div>';
      
      html += '<div style="padding:6px 10px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Exposition</div>';
      html += '<div style="font-size:8px;color:#4b5563;">' + traj.typeExposition + '</div>';
      html += '</div>';
      
      html += '<div style="padding:6px 10px;background:white;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">Pression</div>';
      html += '<div style="font-size:8px;color:#4b5563;font-style:italic;">' + traj.typePression + '</div>';
      html += '</div>';
      
      html += '<div style="padding:6px 10px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:1px;font-weight:600;">GARY pilote</div>';
      html += '<div style="font-size:8px;color:#4b5563;line-height:1.3;">' + traj.priseEnCharge + '</div>';
      html += '</div>';
      
      html += '<div style="padding:8px 10px;background:white;text-align:center;">';
      html += '<div style="font-size:7px;color:#9ca3af;text-transform:uppercase;margin-bottom:2px;font-weight:600;">Objectif de valeur</div>';
      html += '<div style="font-size:14px;font-weight:400;color:' + (isPointDepart ? '#FF4539' : '#1a2e35') + ';">' + formatPrice(objectifValeur) + '</div>';
      html += '<div style="font-size:6px;color:#9ca3af;margin-top:2px;line-height:1.2;">Atteignable si conditions respectées</div>';
      html += '</div>';
    } else {
      // MODE STANDARD
      html += '<div style="padding:10px 12px;background:white;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:3px;font-weight:600;">Objectif</div>';
      html += '<div style="font-size:9px;color:#4b5563;line-height:1.4;">' + traj.objectif + '</div>';
      html += '</div>';
      
      html += '<div style="padding:10px 12px;background:#fafafa;border-bottom:1px solid #f3f4f6;">';
      html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:4px;font-weight:600;">Conditions</div>';
      traj.conditions.forEach((c: string) => {
        html += '<div style="font-size:9px;color:#4b5563;padding:2px 0;display:flex;align-items:center;gap:4px;">' + ico('check', 10, '#9ca3af') + c + '</div>';
      });
      html += '</div>';
      
      html += '<div style="padding:12px;background:white;text-align:center;">';
      html += '<div style="font-size:8px;color:#9ca3af;text-transform:uppercase;margin-bottom:4px;font-weight:600;">Objectif de valeur</div>';
      html += '<div style="font-size:16px;font-weight:400;color:' + (isPointDepart ? '#FF4539' : '#1a2e35') + ';">' + formatPrice(objectifValeur) + '</div>';
      html += '<div style="font-size:8px;color:#9ca3af;margin-top:2px;">Vénale +' + traj.pourc + '%</div>';
      html += '</div>';
    }
    
    html += '</div>';
  });
  
  html += '</div></div>';
  
  return html;
}

function generateCapitalSection(capitalResult: any, historique: any, copy: any): string {
  const capitalPct = capitalResult.capitalPct;
  const capColor = capitalPct >= 70 ? '#1a2e35' : (capitalPct >= 50 ? '#64748b' : '#94a3b8');
  
  let html = '<div style="padding:10px 24px;background:white;border-bottom:1px solid #e5e7eb;">';
  html += '<div style="display:flex;align-items:center;gap:12px;">';
  html += '<div style="display:flex;align-items:center;gap:6px;">' + ico('eye', 14, '#9ca3af') + '<span style="font-size:8px;color:#6b7280;text-transform:uppercase;font-weight:600;">' + copy.capitalLabel + '</span></div>';
  html += '<div style="flex:1;height:5px;background:#e5e7eb;border-radius:3px;overflow:hidden;"><div style="width:' + capitalPct + '%;height:100%;background:' + capColor + ';border-radius:3px;"></div></div>';
  html += '<div style="font-size:11px;font-weight:500;color:' + capColor + ';">' + capitalPct + '%</div>';
  if (historique.dejaDiffuse) {
    html += '<div style="display:flex;align-items:center;gap:3px;padding:3px 6px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;">' + ico('alertCircle', 10, '#6b7280') + '<span style="font-size:7px;color:#6b7280;">Déjà diffusé</span></div>';
  }
  html += '</div></div>';
  
  return html;
}

function generateAlertesSection(alerts: any[], isLux: boolean, historique: any, copy: any): string {
  let html = '<div style="padding:10px 24px;background:white;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600;display:flex;align-items:center;gap:6px;">' + ico('alertCircle', 12, '#9ca3af') + copy.recalibrageTitle + '</div>';
  
  if (isLux && historique.dejaDiffuse && copy.recalibragePhrase) {
    html += '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin-bottom:6px;">';
    html += '<span style="font-size:9px;color:#4b5563;line-height:1.4;font-style:italic;">' + copy.recalibragePhrase + '</span>';
    html += '</div>';
  }
  
  alerts.forEach((alert) => {
    const alertIco = alert.type === 'critical' ? 'xCircle' : (alert.type === 'warning' ? 'alertCircle' : 'circle');
    html += '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:4px;padding:6px 10px;margin-bottom:4px;display:flex;align-items:center;gap:6px;">';
    html += ico(alertIco, 12, '#6b7280');
    html += '<span style="font-size:9px;color:#4b5563;">' + alert.msg + '</span>';
    html += '</div>';
  });
  
  html += '</div>';
  
  return html;
}

function generateValeurPreserverSection(): string {
  let html = '<div style="padding:10px 24px;background:#fffbeb;border-top:1px solid #fcd34d;">';
  html += '<div style="font-size:9px;color:#92400e;line-height:1.4;text-align:center;font-style:italic;">';
  html += '"La vraie valeur d\'un bien d\'exception se protège avant de se révéler. GARY orchestre chaque étape pour que votre patrimoine conserve sa prestance sur le marché."';
  html += '</div>';
  html += '</div>';
  
  return html;
}

function generateDisclaimerSection(isLux: boolean, copy: any): string {
  let html = '<div style="padding:10px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">';
  html += '<div style="font-size:7px;color:#9ca3af;line-height:1.4;text-align:center;">';
  html += copy.disclaimerPhrase;
  html += '</div>';
  html += '</div>';
  
  return html;
}
