// ============================================
// Pitch de Closing Mode Présentation
// ============================================

import React from 'react';
import { MessageSquare, Sparkles, ArrowRight, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PresentationPitchProps {
  pitch: string;
  vendeurNom: string;
  vendeurPrenom: string;
  isLuxe?: boolean;
}

export function PresentationPitch({ 
  pitch, 
  vendeurNom, 
  vendeurPrenom, 
  isLuxe = false 
}: PresentationPitchProps) {
  // Formatter le pitch avec des paragraphes
  const paragraphs = pitch.split('\n\n').filter(p => p.trim());

  return (
    <div className="h-full overflow-auto p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-full",
            isLuxe 
              ? "bg-amber-500/20 text-amber-400" 
              : "bg-primary/20 text-primary"
          )}>
            <MessageSquare className="h-5 w-5" />
            <span className="font-semibold">Notre Proposition</span>
          </div>
          
          {vendeurPrenom && (
            <p className="text-white/60 text-lg">
              {vendeurPrenom} {vendeurNom}
            </p>
          )}
        </div>

        {/* Pitch content */}
        <div className={cn(
          "rounded-2xl p-6 md:p-8 backdrop-blur-sm space-y-6",
          isLuxe 
            ? "bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20" 
            : "bg-white/5"
        )}>
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, idx) => {
              // Détecter les listes à puces
              if (paragraph.includes('•') || paragraph.includes('-')) {
                const items = paragraph.split('\n').filter(l => l.trim());
                return (
                  <ul key={idx} className="space-y-3">
                    {items.map((item, itemIdx) => (
                      <li 
                        key={itemIdx}
                        className="flex items-start gap-3 text-white/90"
                      >
                        <ArrowRight className={cn(
                          "h-4 w-4 mt-1 shrink-0",
                          isLuxe ? "text-amber-400" : "text-primary"
                        )} />
                        <span className="text-base leading-relaxed">
                          {item.replace(/^[•\-]\s*/, '')}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              }
              
              // Paragraphe normal
              return (
                <p 
                  key={idx} 
                  className={cn(
                    "text-base md:text-lg leading-relaxed",
                    idx === 0 ? "text-white font-medium text-xl" : "text-white/80"
                  )}
                >
                  {paragraph}
                </p>
              );
            })
          ) : (
            <p className="text-white/60 text-center py-8">
              Le pitch sera généré automatiquement avec les informations de l'estimation.
            </p>
          )}
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
            onClick={() => window.open('tel:+41223456789')}
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
