// ============================================
// Écran 7 : Stratégie & Proposition commerciale
// ============================================

import React from 'react';
import { 
  Clock, Lock, Megaphone, Globe, 
  Camera, Video, Plane, Home, Eye, Circle,
  Instagram, Facebook, Linkedin, 
  Globe2, Mail, Phone
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Identification, 
  Caracteristiques, 
  PreEstimation, 
  StrategiePitch,
  TypeMiseEnVente,
  getCourtierById
} from '@/types/estimation';
import { calculateLuxMode, getLuxCopy } from '@/utils/pdf/pdfCalculs';
import { parseNumber, roundTo5000 } from '@/utils/pdf/pdfFormatters';
import { format, addWeeks, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';

interface PresentationStrategieProps {
  identification: Identification;
  caracteristiques: Caracteristiques;
  preEstimation: PreEstimation;
  strategie: StrategiePitch;
  totalVenale: number;
}

// Icônes des phases
const PHASE_ICONS: Record<string, React.ReactNode> = {
  preparation: <Clock className="h-5 w-5" />,
  offmarket: <Lock className="h-5 w-5" />,
  comingsoon: <Megaphone className="h-5 w-5" />,
  public: <Globe className="h-5 w-5" />,
};

// Leviers avec icônes
const LEVIER_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  photos: { icon: <Camera className="h-4 w-4" />, label: 'Photos pro' },
  video: { icon: <Video className="h-4 w-4" />, label: 'Vidéo' },
  drone: { icon: <Plane className="h-4 w-4" />, label: 'Drone' },
  homestaging: { icon: <Home className="h-4 w-4" />, label: 'Home staging' },
  visite360: { icon: <Eye className="h-4 w-4" />, label: 'Visite 360°' },
};

// Canaux/Portails
const PORTAIL_CONFIG: Record<string, string> = {
  immoscout: 'Immoscout',
  homegate: 'Homegate',
  'acheter-louer': 'Acheter-Louer',
  'immobilier.ch': 'immobilier.ch',
  anibis: 'Anibis',
  immostreet: 'ImmoStreet',
};

const RESEAU_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  instagram: { icon: <Instagram className="h-4 w-4" />, label: 'Instagram' },
  facebook: { icon: <Facebook className="h-4 w-4" />, label: 'Facebook' },
  linkedin: { icon: <Linkedin className="h-4 w-4" />, label: 'LinkedIn' },
};

export function PresentationStrategie({
  identification,
  caracteristiques,
  preEstimation,
  strategie,
  totalVenale,
}: PresentationStrategieProps) {
  // Calcul luxMode
  const carac = caracteristiques || {} as Caracteristiques;
  const contexte = identification?.contexte || {};
  const historique = identification?.historique || {};
  const isAppartement = carac.typeBien === 'appartement';
  const isMaison = carac.typeBien === 'maison';
  const surfaceHab = parseNumber(isAppartement ? carac.surfacePPE : carac.surfaceHabitableMaison);
  const surfaceTerrainVal = parseNumber(carac.surfaceTerrain);
  
  const { luxMode } = calculateLuxMode(
    carac as any,
    contexte as any,
    historique as any,
    isAppartement,
    isMaison,
    surfaceHab,
    surfaceTerrainVal,
    roundTo5000(totalVenale)
  );
  
  const copy = getLuxCopy(luxMode);
  
  // Récupérer les données de stratégie
  // PhaseDurees utilise phase0, phase1, phase2, phase3
  const phaseDurees = strategie?.phaseDurees || {
    phase0: 2,
    phase1: 3,  // Off-market
    phase2: 2,  // Coming soon
    phase3: 4,  // Public
  };
  const typeMiseEnVente = preEstimation?.typeMiseEnVente || 'public';
  const dateDebut = strategie?.dateDebut ? parseISO(strategie.dateDebut) : new Date();
  
  // Pourcentages objectifs
  const pourcOffmarket = preEstimation?.pourcOffmarket ?? 15;
  const pourcComingsoon = preEstimation?.pourcComingsoon ?? 10;
  const pourcPublic = preEstimation?.pourcPublic ?? 6;
  
  // Prix objectifs par trajectoire
  const prixOffmarket = roundTo5000(totalVenale * (1 + pourcOffmarket / 100));
  const prixComingsoon = roundTo5000(totalVenale * (1 + pourcComingsoon / 100));
  const prixPublic = roundTo5000(totalVenale * (1 + pourcPublic / 100));
  
  // Construire les phases à afficher
  const phases: Array<{
    id: string;
    nom: string;
    duree: number;
    dateDebut: Date;
    dateFin: Date;
    isPointDepart: boolean;
  }> = [];
  
  let currentDate = new Date(dateDebut);
  
  // Phase 0 - Préparation (toujours)
  if (phaseDurees.phase0 > 0) {
    const phaseFin = addWeeks(currentDate, phaseDurees.phase0);
    phases.push({
      id: 'preparation',
      nom: 'Préparation',
      duree: phaseDurees.phase0,
      dateDebut: new Date(currentDate),
      dateFin: phaseFin,
      isPointDepart: false,
    });
    currentDate = phaseFin;
  }
  
  // Phase 1 - Off-Market (si activée ou point de départ)
  if (phaseDurees.phase1 > 0 || typeMiseEnVente === 'offmarket') {
    const duree = phaseDurees.phase1 || 3;
    const phaseFin = addWeeks(currentDate, duree);
    phases.push({
      id: 'offmarket',
      nom: 'Off-Market',
      duree,
      dateDebut: new Date(currentDate),
      dateFin: phaseFin,
      isPointDepart: typeMiseEnVente === 'offmarket',
    });
    currentDate = phaseFin;
  }
  
  // Phase 2 - Coming Soon (si activée ou point de départ)
  if (phaseDurees.phase2 > 0 || typeMiseEnVente === 'comingsoon') {
    const duree = phaseDurees.phase2 || 2;
    const phaseFin = addWeeks(currentDate, duree);
    phases.push({
      id: 'comingsoon',
      nom: 'Coming Soon',
      duree,
      dateDebut: new Date(currentDate),
      dateFin: phaseFin,
      isPointDepart: typeMiseEnVente === 'comingsoon',
    });
    currentDate = phaseFin;
  }
  
  // Phase 3 - Public (toujours)
  const dureePublic = phaseDurees.phase3 || 4;
  phases.push({
    id: 'public',
    nom: 'Public',
    duree: dureePublic,
    dateDebut: new Date(currentDate),
    dateFin: addWeeks(currentDate, dureePublic),
    isPointDepart: typeMiseEnVente === 'public',
  });
  
  const dateVenteEstimee = phases[phases.length - 1]?.dateFin;
  
  // Trajectoires pour les cards
  const trajectoires = [
    { id: 'offmarket', nom: 'Off-Market', pourc: pourcOffmarket, prix: prixOffmarket },
    { id: 'comingsoon', nom: 'Coming Soon', pourc: pourcComingsoon, prix: prixComingsoon },
    { id: 'public', nom: 'Public', pourc: pourcPublic, prix: prixPublic },
  ];
  
  // Leviers activés
  const leviersActifs = strategie?.leviers || [];
  
  // Canaux activés
  const canauxActifs = strategie?.canauxActifs || [];
  const portailsActifs = canauxActifs.filter(c => Object.keys(PORTAIL_CONFIG).includes(c));
  const reseauxActifs = canauxActifs.filter(c => Object.keys(RESEAU_CONFIG).includes(c));
  
  // Prochaines étapes
  const datePhase1 = phases.find(p => p.isPointDepart)?.dateDebut || phases[1]?.dateDebut;
  const prochesEtapes = [
    { num: 1, label: 'Proposition détaillée sous 48h' },
    { num: 2, label: 'Rendez-vous signature du mandat' },
    { num: 3, label: 'Shooting photo professionnel' },
    { num: 4, label: `Lancement ${typeMiseEnVente === 'offmarket' ? 'Off-Market' : typeMiseEnVente === 'comingsoon' ? 'Coming Soon' : 'Public'}${datePhase1 ? ` (${format(datePhase1, 'd MMM', { locale: fr })})` : ''}` },
  ];
  
  // Courtier
  const courtierId = identification?.courtierAssigne;
  const courtier = courtierId ? getCourtierById(courtierId) : null;
  const courtierNom = courtier ? `${courtier.prenom} ${courtier.nom}` : 'GARY Immobilier';
  const courtierEmail = courtier?.email || 'contact@gary-immobilier.ch';
  const courtierTel = courtier?.telephone || '+41 22 552 22 22';

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Titre */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {luxMode ? 'Votre scénario de gouvernance' : 'Votre stratégie de vente'}
          </h1>
          <p className="text-white/60">
            {luxMode ? 'Un accompagnement sur mesure' : 'Plan d\'action personnalisé'}
          </p>
        </div>

        {/* Timeline des phases */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {copy.timeline}
          </h2>
          
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className={cn(
                  "flex-1 min-w-[140px] rounded-xl p-3 md:p-4 transition-all",
                  phase.isPointDepart 
                    ? "bg-primary/20 ring-2 ring-primary" 
                    : "bg-white/5"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center",
                    phase.isPointDepart 
                      ? "bg-primary text-white" 
                      : "bg-white/10 text-white/60"
                  )}>
                    {PHASE_ICONS[phase.id] || <Circle className="h-4 w-4" />}
                  </div>
                  <span className={cn(
                    "font-semibold text-sm",
                    phase.isPointDepart ? "text-primary" : "text-white"
                  )}>
                    {phase.nom}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs">
                  <p className="text-white/50">
                    {phase.duree} semaine{phase.duree > 1 ? 's' : ''}
                  </p>
                  <p className="text-white/70">
                    {format(phase.dateDebut, 'd MMM', { locale: fr })}
                  </p>
                </div>
                
                {phase.isPointDepart && (
                  <Badge className="mt-2 bg-primary/30 text-primary border-0 text-[10px]">
                    Point de départ
                  </Badge>
                )}
              </div>
            ))}
          </div>
          
          {/* Date vente estimée */}
          {dateVenteEstimee && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-white/50">Vente estimée :</span>
              <span className={cn(
                "font-semibold",
                luxMode ? "text-amber-400" : "text-primary"
              )}>
                {format(dateVenteEstimee, 'd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          )}
        </div>

        {/* Objectifs par trajectoire */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Objectifs de valeur</h2>
          
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {trajectoires.map((traj) => {
              const isSelected = typeMiseEnVente === traj.id;
              return (
                <div
                  key={traj.id}
                  className={cn(
                    "rounded-xl p-3 md:p-4 text-center transition-all",
                    isSelected 
                      ? "bg-primary/20 ring-2 ring-primary" 
                      : "bg-white/5"
                  )}
                >
                  <p className={cn(
                    "font-semibold text-sm mb-1",
                    isSelected ? "text-primary" : "text-white/80"
                  )}>
                    {traj.nom}
                  </p>
                  <p className={cn(
                    "text-lg md:text-xl font-bold",
                    isSelected ? "text-white" : "text-white/70"
                  )}>
                    +{traj.pourc}%
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {formatPriceCHF(traj.prix)}
                  </p>
                  <Badge 
                    className={cn(
                      "mt-2 text-[10px] border-0",
                      isSelected 
                        ? "bg-primary text-white" 
                        : "bg-white/10 text-white/60"
                    )}
                  >
                    {isSelected ? 'Sélectionné' : 'Activable'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leviers activés */}
        {leviersActifs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Leviers activés</h2>
            <div className="flex flex-wrap gap-2">
              {leviersActifs.map((levier) => {
                const config = LEVIER_CONFIG[levier];
                if (!config) return null;
                return (
                  <div
                    key={levier}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 text-white"
                  >
                    {config.icon}
                    <span className="text-sm">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Canaux de diffusion */}
        {(portailsActifs.length > 0 || reseauxActifs.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Canaux de diffusion</h2>
            
            <div className="flex flex-wrap gap-3">
              {/* Portails */}
              {portailsActifs.map((portail) => (
                <div
                  key={portail}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/80"
                >
                  <Globe2 className="h-4 w-4 text-white/50" />
                  <span className="text-sm">{PORTAIL_CONFIG[portail]}</span>
                </div>
              ))}
              
              {/* Réseaux sociaux */}
              {reseauxActifs.map((reseau) => {
                const config = RESEAU_CONFIG[reseau];
                if (!config) return null;
                return (
                  <div
                    key={reseau}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/80"
                  >
                    {config.icon}
                    <span className="text-sm">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Prochaines étapes */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Prochaines étapes</h2>
          
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            {prochesEtapes.map((etape) => (
              <div key={etape.num} className="flex items-center gap-4">
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                  luxMode ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                )}>
                  <span className="font-bold text-sm">{etape.num}</span>
                </div>
                <p className="text-white">{etape.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer GARY */}
        <div className="bg-[#1a2e35] rounded-xl p-6 mt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo et slogan */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="text-white font-bold text-lg">GARY</span>
              </div>
              <p className="text-white/60 text-sm italic">
                "On pilote, vous décidez."
              </p>
            </div>
            
            {/* Contact courtier */}
            <div className="text-center md:text-right space-y-1">
              <p className="text-white font-semibold">{courtierNom}</p>
              <div className="flex items-center justify-center md:justify-end gap-2 text-white/70 text-sm">
                <Phone className="h-3.5 w-3.5" />
                <span>{courtierTel}</span>
              </div>
              <div className="flex items-center justify-center md:justify-end gap-2 text-white/70 text-sm">
                <Mail className="h-3.5 w-3.5" />
                <span>{courtierEmail}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
