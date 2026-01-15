// ============================================
// Sélecteur de Courtier GARY
// ============================================

import { useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { COURTIERS_GARY, CourtierGARY } from '@/types/estimation';
import { User, Mail, Phone, MapPin } from 'lucide-react';

// Adresse et téléphone GARY
const GARY_ADRESSE = "Rue du Rhône 14, 1204 Genève";
const GARY_TEL = "+41 22 700 50 00";

interface CourtierSelectorProps {
  value: string;
  onChange: (courtierId: string) => void;
  disabled?: boolean;
}

export function CourtierSelector({ value, onChange, disabled }: CourtierSelectorProps) {
  const selectedCourtier = COURTIERS_GARY.find(c => c.id === value);

  return (
    <div className="space-y-3">
      {/* Dropdown de sélection */}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionnez votre nom..." />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-lg z-50">
          {COURTIERS_GARY.map(courtier => (
            <SelectItem key={courtier.id} value={courtier.id}>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {courtier.initiales}
                </span>
                <span>{courtier.prenom} {courtier.nom}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Carte de présentation du courtier sélectionné */}
      {selectedCourtier && (
        <div className="bg-gradient-to-br from-gary-dark to-gary-dark-light rounded-xl p-4 text-white">
          <div className="flex items-center gap-4">
            {/* Avatar avec initiales */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {selectedCourtier.initiales}
            </div>
            
            {/* Infos courtier */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate">
                {selectedCourtier.prenom} {selectedCourtier.nom}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-white/80 mt-0.5">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{selectedCourtier.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/80 mt-0.5">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{GARY_TEL}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/60 mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{GARY_ADRESSE}</span>
              </div>
            </div>

            {/* Signature (placeholder pour l'instant) */}
            {selectedCourtier.signature && (
              <img 
                src={selectedCourtier.signature} 
                alt="Signature"
                className="h-10 opacity-80 filter brightness-0 invert"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
