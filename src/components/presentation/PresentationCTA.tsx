// ============================================
// Slide 10 : CTA Final - Mode Présentation
// CTAs adoucis + Footer GARY professionnel
// ============================================

import React from 'react';
import { Phone, Mail, Calendar, MessageCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PresentationCTAProps {
  vendeurNom: string;
  vendeurPrenom: string;
  vendeurTelephone?: string;
  vendeurEmail?: string;
  courtierNom?: string;
  isLuxe?: boolean;
}

export function PresentationCTA({
  vendeurNom,
  vendeurPrenom,
  vendeurTelephone,
  vendeurEmail,
  courtierNom,
  isLuxe = false,
}: PresentationCTAProps) {
  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="max-w-md mx-auto flex flex-col justify-center min-h-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className={cn(
            "text-3xl md:text-4xl font-bold mb-4",
            isLuxe ? "text-amber-400" : "text-white"
          )}>
            Prêt à avancer ?
          </h1>
          <p className="text-white/60 text-lg">
            {vendeurPrenom ? `${vendeurPrenom}, prenons` : 'Prenons'} rendez-vous pour concrétiser votre projet.
          </p>
        </div>
        
        {/* CTA Principal */}
        <div className="space-y-4">
          <Button
            size="lg"
            className={cn(
              "w-full h-16 text-lg font-semibold rounded-2xl gap-3",
              isLuxe 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                : "bg-primary hover:bg-primary/90 text-white"
            )}
          >
            <MessageCircle className="h-6 w-6" />
            Discutons ensemble
          </Button>
          
          <button
            className={cn(
              "w-full h-14 text-base rounded-2xl gap-3 inline-flex items-center justify-center font-medium transition-colors border bg-transparent",
              isLuxe 
                ? "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                : "border-white/20 text-white hover:bg-white/10"
            )}
          >
            <HelpCircle className="h-5 w-5" />
            J'ai des questions
          </button>
        </div>
        
        {/* Actions contact */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="ghost"
            className="flex-col h-auto py-4 rounded-xl hover:bg-white/10 text-white"
            onClick={() => vendeurTelephone && window.open(`tel:${vendeurTelephone}`)}
            disabled={!vendeurTelephone}
          >
            <div className={cn(
              "p-3 rounded-full mb-2",
              isLuxe ? "bg-amber-500/20" : "bg-primary/20"
            )}>
              <Phone className={cn("h-5 w-5", isLuxe ? "text-amber-400" : "text-primary")} />
            </div>
            <span className="text-xs text-white/70">Appeler</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex-col h-auto py-4 rounded-xl hover:bg-white/10 text-white"
            onClick={() => vendeurEmail && window.open(`mailto:${vendeurEmail}`)}
            disabled={!vendeurEmail}
          >
            <div className={cn(
              "p-3 rounded-full mb-2",
              isLuxe ? "bg-amber-500/20" : "bg-primary/20"
            )}>
              <Mail className={cn("h-5 w-5", isLuxe ? "text-amber-400" : "text-primary")} />
            </div>
            <span className="text-xs text-white/70">Email</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex-col h-auto py-4 rounded-xl hover:bg-white/10 text-white"
          >
            <div className={cn(
              "p-3 rounded-full mb-2",
              isLuxe ? "bg-amber-500/20" : "bg-primary/20"
            )}>
              <Calendar className={cn("h-5 w-5", isLuxe ? "text-amber-400" : "text-primary")} />
            </div>
            <span className="text-xs text-white/70">RDV</span>
          </Button>
        </div>
        
        {/* Footer GARY amélioré */}
        <div className="text-center pt-8 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center",
              isLuxe ? "bg-amber-500" : "bg-primary"
            )}>
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-white font-bold text-xl">GARY</span>
          </div>
          <p className="text-white/50 text-sm italic mb-4">
            "On pilote, vous décidez."
          </p>
          
          {courtierNom && (
            <p className="text-white/60 text-sm">
              Votre conseiller : <span className="text-white font-medium">{courtierNom}</span>
            </p>
          )}
        </div>
        
      </div>
    </div>
  );
}
