// ============================================
// Prochaines Étapes - Mode Présentation
// ============================================

import React from 'react';
import { MessageSquare, Sparkles, Phone, Mail, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PresentationPitchProps {
  pitch: string;
  vendeurNom: string;
  vendeurPrenom: string;
  vendeurTelephone?: string;
  vendeurEmail?: string;
  isLuxe?: boolean;
}

// Composant pour un item de timeline
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
      <span className="text-sm md:text-base text-[#374151]">{text}</span>
    </div>
  );
}

// Composant pour une section de timeline
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
      {/* Ligne verticale */}
      {!isLast && (
        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-[#e5e7eb]" />
      )}
      
      {/* Badge numéroté */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0 z-10",
        isLuxe ? "bg-amber-500" : "bg-[#FA4238]"
      )}>
        {badge}
      </div>
      
      {/* Contenu */}
      <div className="flex-1 pb-6">
        <h3 className="text-lg md:text-xl font-semibold text-[#1a2e35] mb-3">
          {title}
        </h3>
        <div className={cn(
          "rounded-lg p-4 md:p-5 border-l-4",
          isLuxe 
            ? "bg-amber-50/50 border-amber-500" 
            : "bg-[#fafafa] border-[#FA4238]"
        )}>
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
  isLuxe = false 
}: PresentationPitchProps) {
  // Formatter le pitch avec des paragraphes
  const paragraphs = pitch.split('\n\n').filter(p => p.trim());

  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Vos Prochaines Étapes
          </h1>
          
          {vendeurPrenom && (
            <p className="text-white/60 text-lg">
              {vendeurPrenom} {vendeurNom}
            </p>
          )}
        </div>

        {/* Pitch content - condensé */}
        {paragraphs.length > 0 && (
          <div className={cn(
            "rounded-2xl p-5 md:p-6 backdrop-blur-sm",
            isLuxe 
              ? "bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20" 
              : "bg-white/5"
          )}>
            <div className="flex items-start gap-3 mb-3">
              <MessageSquare className={cn(
                "h-5 w-5 shrink-0 mt-0.5",
                isLuxe ? "text-amber-400" : "text-primary"
              )} />
              <span className={cn(
                "font-semibold",
                isLuxe ? "text-amber-400" : "text-primary"
              )}>
                Notre Proposition
              </span>
            </div>
            <p className="text-white/80 text-sm md:text-base leading-relaxed line-clamp-4">
              {paragraphs[0]}
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* TIMELINE POST-SIGNATURE */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl p-5 md:p-6 space-y-2">
          
          {/* Section 1 : J+0 - Signature */}
          <TimelineSection
            badge="①"
            title="Aujourd'hui — Signature du mandat"
            isLuxe={isLuxe}
          >
            <div className="space-y-2">
              <TimelineItem emoji="✅" text="Validation du prix de mise en vente" isLuxe={isLuxe} />
              <TimelineItem emoji="✅" text="Signature du mandat de courtage" isLuxe={isLuxe} />
              <TimelineItem emoji="📧" text="Envoi du récapitulatif complet par email" isLuxe={isLuxe} />
            </div>
          </TimelineSection>

          {/* Section 2 : J+1 à J+8 - Préparation */}
          <TimelineSection
            badge="②"
            title="Semaine 1 — Préparation du lancement"
            isLuxe={isLuxe}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Colonne GARY */}
              <div>
                <p className="text-sm font-semibold text-[#6b7280] mb-3">
                  Ce que GARY fait :
                </p>
                <div className="space-y-2">
                  <TimelineItem emoji="📸" text="Organisation du shooting photo professionnel" isLuxe={isLuxe} />
                  <TimelineItem emoji="✍️" text="Rédaction du texte de l'annonce" isLuxe={isLuxe} />
                  <TimelineItem emoji="🌐" text="Préparation des supports de diffusion" isLuxe={isLuxe} />
                </div>
              </div>
              
              {/* Séparateur desktop */}
              <div className="hidden md:block absolute left-1/2 top-8 bottom-4 w-px bg-[#e5e7eb]" style={{ position: 'relative', left: 0, top: 0, bottom: 0 }} />
              
              {/* Colonne Vendeur */}
              <div className="border-t md:border-t-0 md:border-l border-[#e5e7eb] pt-4 md:pt-0 md:pl-6">
                <p className="text-sm font-semibold text-[#6b7280] mb-3">
                  Ce que vous fournissez :
                </p>
                <div className="space-y-2">
                  <TimelineItem emoji="📄" text="Documents (plans, CECB, charges)" isLuxe={isLuxe} />
                  <TimelineItem emoji="📅" text="Créneaux de visite possibles" isLuxe={isLuxe} />
                  <TimelineItem emoji="✅" text="Validation de l'annonce" isLuxe={isLuxe} />
                </div>
              </div>
            </div>
          </TimelineSection>

          {/* Section 3 : J+8 - Lancement */}
          <TimelineSection
            badge="③"
            title="Jour 8 — Lancement de la Phase 1"
            isLuxe={isLuxe}
            isLast={true}
          >
            <div className="space-y-2">
              <TimelineItem emoji="🔒" text="Activation du réseau privé GARY" isLuxe={isLuxe} />
              <TimelineItem emoji="📱" text="Diffusion ciblée auprès des acheteurs qualifiés" isLuxe={isLuxe} />
              <TimelineItem emoji="🎯" text="Premières prises de contact" isLuxe={isLuxe} />
            </div>
          </TimelineSection>
        </div>

        {/* ============================================ */}
        {/* BLOC PILOTAGE */}
        {/* ============================================ */}
        <div 
          className="rounded-xl p-5 md:p-6 text-center"
          style={{
            backgroundColor: 'rgba(250, 66, 56, 0.05)',
            border: '1px solid rgba(250, 66, 56, 0.2)'
          }}
        >
          <div className="space-y-2">
            <p className="text-[#374151] text-base md:text-lg font-medium">
              💬 GARY pilote, vous décidez.
            </p>
            <p className="text-[#374151] text-sm md:text-base">
              ✅ Vous validez chaque passage de phase
            </p>
            <p className="text-[#374151] text-sm md:text-base">
              ✅ Vous gardez le contrôle des décisions importantes
            </p>
          </div>
        </div>

        {/* Signature GARY */}
        <div className="text-center space-y-4">
          <div className={cn(
            "inline-flex items-center gap-2",
            isLuxe ? "text-amber-400" : "text-primary"
          )}>
            <Sparkles className="h-5 w-5" />
            <span className="font-bold text-xl">GARY</span>
            <span className="text-white/60">Immobilier</span>
          </div>
          
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Votre partenaire de confiance pour une vente réussie à Genève
          </p>
        </div>

        {/* Actions de contact */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className={cn(
              "flex-col h-auto py-4 border-white/20 text-white hover:bg-white/10",
              isLuxe && "border-amber-500/30 hover:bg-amber-500/10"
            )}
            onClick={() => vendeurTelephone && window.open(`tel:${vendeurTelephone}`)}
            disabled={!vendeurTelephone}
          >
            <Phone className="h-5 w-5 mb-2" />
            <span className="text-xs">Appeler</span>
          </Button>
          
          <Button
            variant="outline"
            className={cn(
              "flex-col h-auto py-4 border-white/20 text-white hover:bg-white/10",
              isLuxe && "border-amber-500/30 hover:bg-amber-500/10"
            )}
            onClick={() => vendeurEmail && window.open(`mailto:${vendeurEmail}`)}
            disabled={!vendeurEmail}
          >
            <Mail className="h-5 w-5 mb-2" />
            <span className="text-xs">Email</span>
          </Button>
          
          <Button
            variant="outline"
            className={cn(
              "flex-col h-auto py-4 border-white/20 text-white hover:bg-white/10",
              isLuxe && "border-amber-500/30 hover:bg-amber-500/10"
            )}
          >
            <Calendar className="h-5 w-5 mb-2" />
            <span className="text-xs">RDV</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
