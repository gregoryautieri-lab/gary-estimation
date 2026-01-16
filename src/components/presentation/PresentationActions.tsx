// ============================================
// Actions de Closing Mode Présentation
// ============================================

import React, { useState } from 'react';
import { FileSignature, MessageCircle, Phone, Mail, CheckCircle2, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PresentationActionsProps {
  pitch: string;
  vendeurNom: string;
  vendeurPrenom: string;
  vendeurTelephone?: string;
  vendeurEmail?: string;
  isLuxe?: boolean;
}

export function PresentationActions({
  pitch,
  vendeurNom,
  vendeurPrenom,
  vendeurTelephone,
  vendeurEmail,
  isLuxe = false
}: PresentationActionsProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Formatter le pitch avec des paragraphes
  const paragraphs = pitch.split('\n\n').filter(p => p.trim());

  const handleSignMandat = () => {
    setShowConfirmation(true);
  };

  const handleContact = (type: 'phone' | 'email' | 'rdv') => {
    if (type === 'phone' && vendeurTelephone) {
      window.open(`tel:${vendeurTelephone}`);
    } else if (type === 'email' && vendeurEmail) {
      window.open(`mailto:${vendeurEmail}`);
    }
  };

  if (showConfirmation) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-8">
          <div className={cn(
            "w-24 h-24 mx-auto rounded-full flex items-center justify-center",
            isLuxe 
              ? "bg-gradient-to-br from-amber-400 to-amber-600"
              : "bg-gradient-to-br from-primary to-primary/80"
          )}>
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className={cn(
              "text-3xl font-bold",
              isLuxe ? "text-amber-400" : "text-white"
            )}>
              Merci {vendeurPrenom} !
            </h2>
            <p className="text-white/70 text-lg">
              Nous allons vous recontacter très rapidement pour finaliser le mandat.
            </p>
          </div>

          <div className={cn(
            "p-6 rounded-2xl",
            isLuxe 
              ? "bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20"
              : "bg-white/5 border border-white/10"
          )}>
            <div className="flex items-center gap-3 justify-center">
              <Sparkles className={cn("h-5 w-5", isLuxe ? "text-amber-400" : "text-primary")} />
              <span className="text-white font-semibold">GARY Immobilier</span>
            </div>
            <p className="text-white/50 text-sm mt-2">
              Votre partenaire de confiance à Genève
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold">Notre Proposition</span>
          </div>
          
          {vendeurPrenom && (
            <p className="text-white/60 text-lg">
              {vendeurPrenom} {vendeurNom}
            </p>
          )}
        </div>

        {/* Pitch summary */}
        <div className={cn(
          "rounded-2xl p-6 backdrop-blur-sm",
          isLuxe 
            ? "bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20" 
            : "bg-white/5"
        )}>
          {paragraphs.length > 0 ? (
            <div className="space-y-4">
              {paragraphs.slice(0, 3).map((paragraph, idx) => {
                // Détecter les listes à puces
                if (paragraph.includes('•') || paragraph.includes('-')) {
                  const items = paragraph.split('\n').filter(l => l.trim()).slice(0, 3);
                  return (
                    <ul key={idx} className="space-y-2">
                      {items.map((item, itemIdx) => (
                        <li 
                          key={itemIdx}
                          className="flex items-start gap-3 text-white/90"
                        >
                          <ArrowRight className={cn(
                            "h-4 w-4 mt-1 shrink-0",
                            isLuxe ? "text-amber-400" : "text-primary"
                          )} />
                          <span className="text-sm">
                            {item.replace(/^[•\-]\s*/, '')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                
                return (
                  <p 
                    key={idx} 
                    className={cn(
                      "text-base leading-relaxed",
                      idx === 0 ? "text-white font-medium" : "text-white/80"
                    )}
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-white/60 text-center py-4">
              Nous vous accompagnons dans la vente de votre bien.
            </p>
          )}
        </div>

        {/* Main CTA */}
        <div className="space-y-4">
          <Button
            size="lg"
            className={cn(
              "w-full h-16 text-lg font-semibold rounded-2xl gap-3",
              isLuxe 
                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                : "bg-primary hover:bg-primary/90"
            )}
            onClick={handleSignMandat}
          >
            <FileSignature className="h-6 w-6" />
            Je signe le mandat
          </Button>

          <Button
            variant="outline"
            size="lg"
            className={cn(
              "w-full h-14 text-base rounded-2xl gap-3",
              isLuxe 
                ? "border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                : "border-white/20 text-white hover:bg-white/10"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            J'ai des questions
          </Button>
        </div>

        {/* Contact options */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="ghost"
            className={cn(
              "flex-col h-auto py-4 rounded-xl",
              isLuxe 
                ? "hover:bg-amber-500/10 text-white"
                : "hover:bg-white/10 text-white"
            )}
            onClick={() => handleContact('phone')}
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
            className={cn(
              "flex-col h-auto py-4 rounded-xl",
              isLuxe 
                ? "hover:bg-amber-500/10 text-white"
                : "hover:bg-white/10 text-white"
            )}
            onClick={() => handleContact('email')}
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
            className={cn(
              "flex-col h-auto py-4 rounded-xl",
              isLuxe 
                ? "hover:bg-amber-500/10 text-white"
                : "hover:bg-white/10 text-white"
            )}
            onClick={() => handleContact('rdv')}
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

        {/* Signature */}
        <div className="text-center pt-4">
          <div className={cn(
            "inline-flex items-center gap-2",
            isLuxe ? "text-amber-400" : "text-primary"
          )}>
            <Sparkles className="h-5 w-5" />
            <span className="font-bold text-xl">GARY</span>
            <span className="text-white/60">Immobilier</span>
          </div>
        </div>
      </div>
    </div>
  );
}
