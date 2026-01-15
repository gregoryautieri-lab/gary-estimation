// ============================================
// Mode Présentation Client
// Affichage épuré pour présenter l'estimation
// ============================================

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Tag, Star, Clock, Home, Maximize, ArrowRight, Mail, Copy, Check, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EstimationData, TypeMiseEnVente, Photo } from '@/types/estimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composants internes
import { PhotoCarousel } from './PhotoCarousel';
import { PresentationMap } from './PresentationMap';
import { PresentationTimeline } from './PresentationTimeline';
import { PresentationPrice } from './PresentationPrice';
import { PresentationPitch } from './PresentationPitch';

interface PresentationModeProps {
  estimation: EstimationData;
  phases: any[];
  pitch: string;
  typeMiseEnVente: TypeMiseEnVente;
  capitalVisibilite: {
    value?: number;
    label: string;
    color: string;
  };
  isLuxe?: boolean;
  onClose: () => void;
}

type Section = 'photos' | 'map' | 'timeline' | 'price' | 'pitch';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'photos', label: 'Photos', icon: <Star className="h-5 w-5" /> },
  { id: 'map', label: 'Localisation', icon: <MapPin className="h-5 w-5" /> },
  { id: 'timeline', label: 'Planning', icon: <Clock className="h-5 w-5" /> },
  { id: 'price', label: 'Prix', icon: <Tag className="h-5 w-5" /> },
  { id: 'pitch', label: 'Proposition', icon: <ArrowRight className="h-5 w-5" /> },
];

export function PresentationMode({
  estimation,
  phases,
  pitch,
  typeMiseEnVente,
  capitalVisibilite,
  isLuxe = false,
  onClose,
}: PresentationModeProps) {
  const [currentSection, setCurrentSection] = useState<Section>('photos');
  const [copied, setCopied] = useState(false);

  // Navigation clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNextSection();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevSection();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection]);

  const currentIndex = SECTIONS.findIndex(s => s.id === currentSection);
  
  const goToNextSection = () => {
    if (currentIndex < SECTIONS.length - 1) {
      setCurrentSection(SECTIONS[currentIndex + 1].id);
    }
  };

  const goToPrevSection = () => {
    if (currentIndex > 0) {
      setCurrentSection(SECTIONS[currentIndex - 1].id);
    }
  };

  // Données formatées
  // Photos peut être un tableau ou un objet avec items
  const rawPhotos = estimation.photos;
  const photos: Photo[] = Array.isArray(rawPhotos) 
    ? rawPhotos 
    : (rawPhotos as { items?: Photo[] })?.items || [];
  
  const adresse = estimation.identification?.adresse?.rue || estimation.adresse || '';
  const localite = estimation.identification?.adresse?.localite 
    ? `${estimation.identification.adresse.codePostal || ''} ${estimation.identification.adresse.localite}`.trim()
    : estimation.localite || '';
  
  const typeBien = estimation.caracteristiques?.typeBien || 'appartement';
  const surfaceRaw = typeBien === 'maison'
    ? estimation.caracteristiques?.surfaceHabitableMaison
    : estimation.caracteristiques?.surfacePPE;
  const surface = typeof surfaceRaw === 'number' ? surfaceRaw : parseFloat(String(surfaceRaw || '0'));
  
  const prixMinRaw = estimation.preEstimation?.prixEntre;
  const prixMaxRaw = estimation.preEstimation?.prixEt;
  const prixMin = typeof prixMinRaw === 'number' ? prixMinRaw : parseFloat(String(prixMinRaw || '0'));
  const prixMax = typeof prixMaxRaw === 'number' ? prixMaxRaw : parseFloat(String(prixMaxRaw || '0'));
  const prixFinal = estimation.prixFinal || Math.round((prixMin + prixMax) / 2);
  
  const coordinates = estimation.identification?.adresse?.coordinates || null;
  const pointsForts = estimation.analyseTerrain?.pointsForts || [];
  const vendeurNom = estimation.identification?.vendeur?.nom || '';
  const vendeurPrenom = estimation.identification?.vendeur?.prenom || '';

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/presentation/${estimation.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const email = estimation.identification?.vendeur?.email;
    if (!email) {
      toast.error('Email du vendeur non renseigné');
      return;
    }
    
    const subject = encodeURIComponent(`Estimation de votre bien - ${adresse}`);
    const body = encodeURIComponent(`Bonjour ${vendeurPrenom},\n\nVeuillez trouver ci-joint notre estimation pour votre bien situé au ${adresse}.\n\nCordialement,\nGARY Immobilier`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col",
      isLuxe 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900/20" 
        : "bg-gradient-to-br from-gray-900 to-gray-800"
    )}>
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {isLuxe && (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Ultra-Luxe
            </Badge>
          )}
          <div>
            <h1 className="text-white font-semibold text-lg truncate max-w-[250px]">
              {adresse || 'Présentation'}
            </h1>
            <p className="text-white/60 text-sm">{localite}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleSendEmail}
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Section content */}
        <div className="h-full">
          {currentSection === 'photos' && (
            <PhotoCarousel photos={photos} isLuxe={isLuxe} />
          )}
          {currentSection === 'map' && (
            <PresentationMap 
              coordinates={coordinates}
              adresse={adresse}
              localite={localite}
            />
          )}
          {currentSection === 'timeline' && (
            <PresentationTimeline 
              phases={phases}
              typeMiseEnVente={typeMiseEnVente}
              capitalVisibilite={capitalVisibilite}
              isLuxe={isLuxe}
            />
          )}
          {currentSection === 'price' && (
            <PresentationPrice 
              prixMin={prixMin}
              prixMax={prixMax}
              prixFinal={prixFinal}
              typeBien={typeBien}
              surface={surface}
              pointsForts={pointsForts}
              isLuxe={isLuxe}
            />
          )}
          {currentSection === 'pitch' && (
            <PresentationPitch 
              pitch={pitch}
              vendeurNom={vendeurNom}
              vendeurPrenom={vendeurPrenom}
              isLuxe={isLuxe}
            />
          )}
        </div>

        {/* Navigation arrows */}
        <div className="absolute inset-y-0 left-0 flex items-center p-2 sm:p-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
              currentIndex === 0 && "opacity-30 pointer-events-none"
            )}
            onClick={goToPrevSection}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center p-2 sm:p-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
              currentIndex === SECTIONS.length - 1 && "opacity-30 pointer-events-none"
            )}
            onClick={goToNextSection}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="flex justify-center gap-2 p-4 border-t border-white/10">
        {SECTIONS.map((section) => (
          <Button
            key={section.id}
            variant="ghost"
            size="lg"
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-4 min-w-[70px] transition-all",
              currentSection === section.id
                ? isLuxe 
                  ? "bg-amber-500/20 text-amber-400" 
                  : "bg-primary/20 text-primary"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
            onClick={() => setCurrentSection(section.id)}
          >
            {section.icon}
            <span className="text-xs font-medium">{section.label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}
