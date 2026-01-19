// ============================================
// Prochaines Étapes - Mode Présentation (Dark Mode)
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
          background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
          boxShadow: '0 4px 12px rgba(255, 165, 0, 0.3)'
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
            borderLeft: '3px solid #FA4238',
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
  isLuxe = false 
}: PresentationPitchProps) {
  // Formatter le pitch avec des paragraphes
  const paragraphs = pitch.split('\n\n').filter(p => p.trim());

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

        {/* Pitch content - Dark Mode */}
        {paragraphs.length > 0 && (
          <div 
            className="rounded-xl p-5 md:p-6 backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(55, 65, 81, 0.5)',
              border: '1px solid rgba(75, 85, 99, 0.3)'
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <MessageSquare className={cn(
                "h-5 w-5 shrink-0 mt-0.5",
                isLuxe ? "text-amber-400" : "text-[#FFA500]"
              )} />
              <span className={cn(
                "font-semibold",
                isLuxe ? "text-amber-400" : "text-[#FFA500]"
              )}>
                Notre Proposition
              </span>
            </div>
            <p className="text-[#d1d5db] text-sm md:text-base leading-relaxed">
              {paragraphs[0]}
            </p>
          </div>
        )}

        {/* ============================================ */}
        {/* TIMELINE POST-SIGNATURE - Dark Mode */}
        {/* ============================================ */}
        <div className="space-y-2">
          
          {/* Section 1 : J+0 - Signature */}
          <TimelineSection
            badge="①"
            title="Aujourd'hui — Signature du mandat"
            isLuxe={isLuxe}
          >
            <div className="space-y-3">
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
                <p 
                  className="text-sm font-semibold mb-3 uppercase tracking-wide"
                  style={{ color: '#FFA500' }}
                >
                  Ce que GARY fait :
                </p>
                <div className="space-y-3">
                  <TimelineItem emoji="📸" text="Organisation du shooting photo professionnel" isLuxe={isLuxe} />
                  <TimelineItem emoji="✍️" text="Rédaction du texte de l'annonce" isLuxe={isLuxe} />
                  <TimelineItem emoji="🌐" text="Préparation des supports de diffusion" isLuxe={isLuxe} />
                </div>
              </div>
              
              {/* Colonne Vendeur */}
              <div 
                className="border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6"
                style={{ borderColor: 'rgba(75, 85, 99, 0.3)' }}
              >
                <p 
                  className="text-sm font-semibold mb-3 uppercase tracking-wide"
                  style={{ color: '#FFA500' }}
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

          {/* Section 3 : J+8 - Lancement */}
          <TimelineSection
            badge="③"
            title="Jour 8 — Lancement de la Phase 1"
            isLuxe={isLuxe}
            isLast={true}
          >
            <div className="space-y-3">
              <TimelineItem emoji="🔒" text="Activation du réseau privé GARY" isLuxe={isLuxe} />
              <TimelineItem emoji="📱" text="Diffusion ciblée auprès des acheteurs qualifiés" isLuxe={isLuxe} />
              <TimelineItem emoji="🎯" text="Premières prises de contact" isLuxe={isLuxe} />
            </div>
          </TimelineSection>
        </div>

        {/* ============================================ */}
        {/* BLOC PILOTAGE - Dark Mode */}
        {/* ============================================ */}
        <div 
          className="rounded-xl p-5 md:p-6 text-center"
          style={{
            backgroundColor: 'rgba(250, 66, 56, 0.1)',
            border: '1px solid rgba(250, 66, 56, 0.3)'
          }}
        >
          <div className="space-y-3">
            <p className="text-white text-base md:text-lg font-semibold">
              💬 GARY pilote, vous décidez.
            </p>
            <p className="text-[#d1d5db] text-sm md:text-base">
              ✅ Vous validez chaque passage de phase
            </p>
            <p className="text-[#d1d5db] text-sm md:text-base">
              ✅ Vous gardez le contrôle des décisions importantes
            </p>
          </div>
        </div>

        {/* Bouton CTA principal */}
        <div className="text-center">
          <Button
            className="px-10 py-6 text-lg font-semibold rounded-lg hover:brightness-110 transition-all"
            style={{
              backgroundColor: '#FA4238',
              color: '#FFFFFF'
            }}
          >
            Je signe le mandat
          </Button>
        </div>

        {/* Actions de contact - Dark Mode */}
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
            <Phone className="h-5 w-5 mb-2" style={{ color: '#FFA500' }} />
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
            <Mail className="h-5 w-5 mb-2" style={{ color: '#FFA500' }} />
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
            <Calendar className="h-5 w-5 mb-2" style={{ color: '#FFA500' }} />
            <span className="text-xs">RDV</span>
          </Button>
        </div>

        {/* Signature GARY - Dark Mode */}
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
