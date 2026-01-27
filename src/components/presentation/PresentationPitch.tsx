// ============================================
// Prochaines Étapes - Mode Présentation (Dark Mode)
// Slide 9 - Dynamique selon scénario
// ============================================

import React from 'react';
import { Sparkles, Phone, Mail, Calendar, Lock, Megaphone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TypeMiseEnVente } from '@/types/estimation';

interface PresentationPitchProps {
  pitch: string;
  vendeurNom: string;
  vendeurPrenom: string;
  vendeurTelephone?: string;
  vendeurEmail?: string;
  isLuxe?: boolean;
  // Props dynamiques
  typeMiseEnVente?: TypeMiseEnVente;
  phaseDurees?: { phase0: number; phase1: number; phase2: number; phase3: number };
  dateDebut?: Date;
  courtierNom?: string;
  historique?: { dejaDiffuse?: boolean };
  capitalVisibilite?: number;
}

// Noms des phases
const PHASE_LABELS: Record<string, string> = {
  offmarket: 'Off-Market',
  comingsoon: 'Coming Soon',
  public: 'Public',
};

// Icônes des phases
const PHASE_ICONS: Record<string, React.ReactNode> = {
  offmarket: <Lock className="h-5 w-5" />,
  comingsoon: <Megaphone className="h-5 w-5" />,
  public: <Globe className="h-5 w-5" />,
};

// Actions selon phase
const getActionsLancement = (typeMV: string) => {
  if (typeMV === 'offmarket') {
    return [
      { emoji: '🔒', text: 'Activation du réseau privé GARY' },
      { emoji: '📱', text: 'Approche des acquéreurs qualifiés' },
      { emoji: '🎯', text: 'Premières prises de contact ciblées' },
    ];
  }
  if (typeMV === 'comingsoon') {
    return [
      { emoji: '📢', text: 'Teasing sur réseaux ciblés' },
      { emoji: '📝', text: 'Création de la liste d\'attente' },
      { emoji: '🎯', text: 'Communication maîtrisée' },
    ];
  }
  return [
    { emoji: '🌐', text: 'Publication sur tous les portails' },
    { emoji: '📱', text: 'Diffusion réseaux sociaux' },
    { emoji: '🎯', text: 'Visibilité maximale' },
  ];
};

// Formatter date FR-CH
const formatDateFRCH = (date: Date) => {
  return date.toLocaleDateString('fr-CH', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
};

// Composant pour un item de timeline (Dark Mode)
function TimelineItem({ 
  emoji, 
  text, 
  isLuxe 
}: { 
  emoji: string; 
  text: string; 
  isLuxe: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base shrink-0">{emoji}</span>
      <span className="text-sm md:text-base text-[#d1d5db]">{text}</span>
    </div>
  );
}

// Composant pour une section de timeline (Dark Mode)
function TimelineSection({
  badge,
  title,
  children,
  isLuxe,
  isLast = false,
}: {
  badge: string;
  title: string;
  children: React.ReactNode;
  isLuxe: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {/* Ligne verticale - Dark */}
      {!isLast && (
        <div 
          className="absolute left-5 top-14 bottom-0 w-0.5" 
          style={{ backgroundColor: 'rgba(75, 85, 99, 0.4)' }}
        />
      )}
      
      {/* Badge numéroté - Gradient orange */}
      <div 
        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 z-10"
        style={{
          background: isLuxe 
            ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
            : 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
          boxShadow: isLuxe 
            ? '0 4px 12px rgba(245, 158, 11, 0.3)' 
            : '0 4px 12px rgba(255, 165, 0, 0.3)'
        }}
      >
        {badge}
      </div>
      
      {/* Contenu */}
      <div className="flex-1 pb-6">
        <h3 className="text-lg md:text-xl font-semibold text-white mb-3">
          {title}
        </h3>
        <div 
          className="rounded-xl p-4 md:p-5"
          style={{
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            border: '1px solid rgba(75, 85, 99, 0.3)',
            borderLeft: isLuxe ? '3px solid #F59E0B' : '3px solid #FA4238',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function PresentationPitch({ 
  pitch, 
  vendeurNom, 
  vendeurPrenom,
  vendeurTelephone,
  vendeurEmail,
  isLuxe = false,
  typeMiseEnVente = 'offmarket',
  phaseDurees,
  dateDebut,
  courtierNom,
  historique,
  capitalVisibilite,
}: PresentationPitchProps) {
  
  // Calculs dynamiques
  const dateDebutReelle = dateDebut || new Date();
  const needsRecalibrage = historique?.dejaDiffuse && (capitalVisibilite || 100) < 70;
  const dureePreparation = needsRecalibrage 
    ? (phaseDurees?.phase0 || 1) + 2 
    : (phaseDurees?.phase0 || 1);
  
  const dateLancement = new Date(dateDebutReelle);
  dateLancement.setDate(dateLancement.getDate() + (dureePreparation * 7));
  
  const actionsLancement = getActionsLancement(typeMiseEnVente);
  const phaseLabel = PHASE_LABELS[typeMiseEnVente] || 'Public';

  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-4xl font-semibold text-white">
            Vos Prochaines Étapes
          </h1>
          
          {vendeurPrenom && (
            <p className="text-[#9ca3af] text-lg">
              {vendeurPrenom} {vendeurNom}
            </p>
          )}
        </div>

        {/* ============================================ */}
        {/* TIMELINE DYNAMIQUE */}
        {/* ============================================ */}
        <div className="space-y-2">
          
          {/* Section 1 : Aujourd'hui */}
          <TimelineSection
            badge="①"
            title={`Aujourd'hui — ${formatDateFRCH(new Date())}`}
            isLuxe={isLuxe}
          >
            <div className="space-y-3">
              <TimelineItem emoji="✅" text="Validation du prix de mise en vente" isLuxe={isLuxe} />
              <TimelineItem emoji="✅" text="Signature du mandat de courtage" isLuxe={isLuxe} />
              <TimelineItem emoji="📧" text="Envoi du récapitulatif par email" isLuxe={isLuxe} />
            </div>
          </TimelineSection>

          {/* Section 2 : Préparation (avec recalibrage si nécessaire) */}
          <TimelineSection
            badge="②"
            title={`Semaines 1-${dureePreparation} — Préparation${needsRecalibrage ? ' & Recalibrage' : ''}`}
            isLuxe={isLuxe}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Colonne GARY */}
              <div>
                <p 
                  className="text-sm font-semibold mb-3 uppercase tracking-wide"
                  style={{ color: isLuxe ? '#F59E0B' : '#FFA500' }}
                >
                  Ce que GARY fait :
                </p>
                <div className="space-y-3">
                  <TimelineItem emoji="📸" text="Shooting photo professionnel" isLuxe={isLuxe} />
                  <TimelineItem emoji="✍️" text="Rédaction de l'annonce" isLuxe={isLuxe} />
                  <TimelineItem emoji="🌐" text="Préparation des supports" isLuxe={isLuxe} />
                  {needsRecalibrage && (
                    <TimelineItem emoji="🔄" text="Repositionnement stratégique" isLuxe={isLuxe} />
                  )}
                </div>
              </div>
              
              {/* Colonne Vendeur */}
              <div 
                className="border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6"
                style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}
              >
                <p 
                  className="text-sm font-semibold mb-3 uppercase tracking-wide"
                  style={{ color: isLuxe ? '#F59E0B' : '#FFA500' }}
                >
                  Ce que vous fournissez :
                </p>
                <div className="space-y-3">
                  <TimelineItem emoji="📄" text="Documents (plans, CECB, charges)" isLuxe={isLuxe} />
                  <TimelineItem emoji="📅" text="Créneaux de visite possibles" isLuxe={isLuxe} />
                  <TimelineItem emoji="✅" text="Validation de l'annonce" isLuxe={isLuxe} />
                </div>
              </div>
            </div>
          </TimelineSection>

          {/* Section 3 : Lancement - DYNAMIQUE selon typeMiseEnVente */}
          <TimelineSection
            badge="③"
            title={`${formatDateFRCH(dateLancement)} — Lancement ${phaseLabel}`}
            isLuxe={isLuxe}
            isLast={true}
          >
            <div className="space-y-3">
              {actionsLancement.map((action, idx) => (
                <TimelineItem key={idx} emoji={action.emoji} text={action.text} isLuxe={isLuxe} />
              ))}
            </div>
          </TimelineSection>
        </div>

        {/* ============================================ */}
        {/* BLOC PILOTAGE */}
        {/* ============================================ */}
        <div 
          className="rounded-xl p-5 md:p-6 text-center"
          style={{
            backgroundColor: isLuxe ? 'rgba(245, 158, 11, 0.1)' : 'rgba(250, 66, 56, 0.1)',
            border: isLuxe ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(250, 66, 56, 0.3)'
          }}
        >
          <p className="text-white text-base md:text-lg font-semibold">
            💬 GARY pilote, vous décidez.
          </p>
          <p className="text-[#d1d5db] text-sm md:text-base mt-2">
            Chaque passage de phase est validé ensemble.
          </p>
        </div>

        {/* CTAs adoucis */}
        <div className="space-y-3 text-center">
          <Button
            className="px-10 py-6 text-lg font-semibold rounded-lg hover:brightness-110 transition-all"
            style={{
              backgroundColor: isLuxe ? '#F59E0B' : '#FA4238',
              color: '#FFFFFF'
            }}
          >
            Discutons ensemble
          </Button>
          
          <Button
            variant="outline"
            className="px-8 py-4 text-base rounded-lg text-white/70 border-white/20 hover:bg-white/10"
          >
            J'ai des questions
          </Button>
        </div>

        {/* Actions de contact */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex-col h-auto py-4 text-[#d1d5db] hover:text-white transition-colors"
            style={{
              backgroundColor: 'rgba(55, 65, 81, 0.5)',
              border: '1px solid rgba(75, 85, 99, 0.5)'
            }}
            onClick={() => vendeurTelephone && window.open(`tel:${vendeurTelephone}`)}
            disabled={!vendeurTelephone}
          >
            <Phone className="h-5 w-5 mb-2" style={{ color: isLuxe ? '#F59E0B' : '#FFA500' }} />
            <span className="text-xs">Appeler</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex-col h-auto py-4 text-[#d1d5db] hover:text-white transition-colors"
            style={{
              backgroundColor: 'rgba(55, 65, 81, 0.5)',
              border: '1px solid rgba(75, 85, 99, 0.5)'
            }}
            onClick={() => vendeurEmail && window.open(`mailto:${vendeurEmail}`)}
            disabled={!vendeurEmail}
          >
            <Mail className="h-5 w-5 mb-2" style={{ color: isLuxe ? '#F59E0B' : '#FFA500' }} />
            <span className="text-xs">Email</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex-col h-auto py-4 text-[#d1d5db] hover:text-white transition-colors"
            style={{
              backgroundColor: 'rgba(55, 65, 81, 0.5)',
              border: '1px solid rgba(75, 85, 99, 0.5)'
            }}
          >
            <Calendar className="h-5 w-5 mb-2" style={{ color: isLuxe ? '#F59E0B' : '#FFA500' }} />
            <span className="text-xs">RDV</span>
          </Button>
        </div>

        {/* Contact courtier */}
        {courtierNom && (
          <div className="text-center p-4 rounded-lg bg-white/5">
            <p className="text-white/60 text-sm">Votre conseiller</p>
            <p className="text-white font-semibold text-lg">{courtierNom}</p>
          </div>
        )}

        {/* Signature GARY */}
        <div className="text-center space-y-4 pt-4">
          <div className={cn(
            "inline-flex items-center gap-2",
            isLuxe ? "text-amber-400" : "text-[#FFA500]"
          )}>
            <Sparkles className="h-5 w-5" />
            <span className="font-bold text-xl">GARY</span>
            <span className="text-[#9ca3af]">Immobilier</span>
          </div>
          
          <p className="text-[#9ca3af] text-sm max-w-md mx-auto">
            Votre partenaire de confiance pour une vente réussie à Genève
          </p>
        </div>
      </div>
    </div>
  );
}
