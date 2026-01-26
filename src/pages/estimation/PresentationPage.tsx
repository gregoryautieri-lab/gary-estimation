// ============================================
// Page Présentation Client - Route Dédiée
// 9 écrans en swipe plein écran
// Ordre narratif : Contexte → Confiance → Solution → Closing
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Share2, Copy, Check, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useGoogleMapsKey } from '@/hooks/useGoogleMapsKey';
import { useEstimationCalcul, useLuxMode } from '@/hooks/useEstimationCalcul';
import { calculateCapitalVisibilite } from '@/utils/pdf/pdfCalculs';
import { 
  Photo, 
  TypeMiseEnVente, 
  defaultCaracteristiques, 
  defaultIdentification, 
  defaultAnalyseTerrain, 
  defaultPreEstimation, 
  defaultStrategiePitch,
  Caracteristiques,
  Identification,
  AnalyseTerrain,
  PreEstimation,
  StrategiePitch
} from '@/types/estimation';

// Composants de présentation
import { PresentationCover } from '@/components/presentation/PresentationCover';
import { PresentationCharacteristics } from '@/components/presentation/PresentationCharacteristics';
import { PresentationLocation } from '@/components/presentation/PresentationLocation';
import { PresentationPrix } from '@/components/presentation/PresentationPrix';
import { PresentationTimeline } from '@/components/presentation/PresentationTimeline';
import { PresentationPitch } from '@/components/presentation/PresentationPitch';
import { PresentationCondition } from '@/components/presentation/PresentationCondition';
import { PresentationMarche } from '@/components/presentation/PresentationMarche';
import { PresentationStrategie } from '@/components/presentation/PresentationStrategie';
import { PresentationGary } from '@/components/presentation/PresentationGary';

// Types pour les sections - Nouvel ordre en 9 écrans
// 1. Couverture → 2. Le Bien → 3. Localisation → 4. État → 5. Qui est GARY → 6. Marché → 7. Stratégie → 8. Prix → 9. Prochaines étapes
type Section = 'cover' | 'bien' | 'localisation' | 'etat' | 'gary' | 'marche' | 'strategie' | 'prix' | 'next';

// Type local simplifié pour la page presentation
interface PresentationEstimation {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  courtierId: string;
  adresse: string;
  localite: string;
  prixFinal: number;
  identification: Identification;
  caracteristiques: Caracteristiques;
  analyseTerrain: AnalyseTerrain;
  photos: Photo[];
  preEstimation: PreEstimation;
  strategiePitch: StrategiePitch;
}

// Nouvel ordre des sections (9 écrans)
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'cover', label: 'Couverture' },
  { id: 'bien', label: 'Le Bien' },
  { id: 'localisation', label: 'Localisation' },
  { id: 'etat', label: 'État' },
  { id: 'gary', label: 'Qui est GARY' },
  { id: 'marche', label: 'Marché' },
  { id: 'strategie', label: 'Stratégie' },
  { id: 'prix', label: 'Prix' },
  { id: 'next', label: 'Prochaines étapes' },
];

export default function PresentationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Charger l'API Google Maps UNE SEULE FOIS au niveau parent
  const { apiKey: googleMapsApiKey, loading: googleMapsLoading } = useGoogleMapsKey();
  
  const [estimation, setEstimation] = useState<PresentationEstimation | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<Section>('cover');
  const [copied, setCopied] = useState(false);
  const [courtierTelephone, setCourtierTelephone] = useState<string | null>(null);
  const [courtierNom, setCourtierNom] = useState<string | null>(null);
  
  // Touch handling pour swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Charger l'estimation
  useEffect(() => {
    async function loadEstimation() {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('estimations')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          // Extraire photos correctement (peut être tableau ou objet avec items)
          let photosArray: Photo[] = [];
          if (data.photos) {
            const photosData = data.photos as unknown;
            if (Array.isArray(photosData)) {
              photosArray = photosData as Photo[];
            } else if (typeof photosData === 'object' && photosData !== null && 'items' in photosData) {
              photosArray = (photosData as { items: Photo[] }).items || [];
            }
          }

          // Mapper les données Supabase
          const mapped: PresentationEstimation = {
            id: data.id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            status: data.statut || 'brouillon',
            courtierId: data.courtier_id,
            adresse: data.adresse || '',
            localite: data.localite || '',
            prixFinal: data.prix_final || 0,
            identification: {
              ...defaultIdentification,
              ...(data.identification as object || {})
            },
            caracteristiques: {
              ...defaultCaracteristiques,
              ...(data.caracteristiques as object || {})
            },
            analyseTerrain: {
              ...defaultAnalyseTerrain,
              ...(data.analyse_terrain as object || {})
            },
            photos: photosArray,
            preEstimation: {
              ...defaultPreEstimation,
              ...(data.pre_estimation as object || {})
            },
            strategiePitch: {
              ...defaultStrategiePitch,
              ...(data.strategie as object || {})
            }
          };
          
          setEstimation(mapped);
          
          // Récupérer le téléphone et nom du courtier depuis son profil
          if (data.courtier_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('telephone, full_name')
              .eq('user_id', data.courtier_id)
              .maybeSingle();
            
            if (profileData) {
              setCourtierTelephone(profileData.telephone || null);
              setCourtierNom(profileData.full_name || null);
            }
          }
        }
      } catch (error) {
        console.error('Erreur chargement estimation:', error);
        toast.error('Impossible de charger l\'estimation');
      } finally {
        setLoading(false);
      }
    }
    
    loadEstimation();
  }, [id]);

  // Navigation
  const currentIndex = SECTIONS.findIndex(s => s.id === currentSection);
  
  const goToNextSection = useCallback(() => {
    if (currentIndex < SECTIONS.length - 1) {
      setCurrentSection(SECTIONS[currentIndex + 1].id);
    }
  }, [currentIndex]);

  const goToPrevSection = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentSection(SECTIONS[currentIndex - 1].id);
    }
  }, [currentIndex]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNextSection();
    }
    if (isRightSwipe) {
      goToPrevSection();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(`/estimation/${id}/5`);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNextSection();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevSection();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, goToNextSection, goToPrevSection, navigate, id]);

  // Actions
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/presentation/${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    navigate(`/estimation/${id}/5`);
  };

  // ========================================
  // CALCULS CORRECTS - Hooks AVANT les early returns
  // ========================================
  
  // Calcul via le hook useEstimationCalcul (toujours appelé)
  const calcul = useEstimationCalcul(
    estimation?.caracteristiques || null,
    estimation?.preEstimation || null
  );
  
  // Mode luxe calculé correctement (toujours appelé)
  const luxModeResult = useLuxMode(
    estimation?.caracteristiques || null,
    estimation?.identification?.contexte || null,
    estimation?.identification?.historique || null,
    calcul.totalVenaleArrondi
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/60">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!estimation) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4">Estimation non trouvée</p>
          <Button onClick={() => navigate('/estimations')}>
            Retour aux estimations
          </Button>
        </div>
      </div>
    );
  }

  // Valeurs calculées (après vérification que estimation existe)
  const totalVenaleCalcule = calcul.totalVenaleArrondi;
  const isLuxe = luxModeResult.isLux;
  
  // Capital visibilité calculé (pas un hook, peut être après le if)
  const capitalResult = calculateCapitalVisibilite(
    estimation.identification?.historique || {},
    totalVenaleCalcule
  );
  const capitalVisibiliteCalcule = capitalResult.capitalPct;
  
  // Extraire les données
  const photos = estimation.photos;
  
  const adresse = estimation.identification?.adresse?.rue || estimation.adresse || '';
  const localite = estimation.identification?.adresse?.localite 
    ? `${estimation.identification.adresse.codePostal || ''} ${estimation.identification.adresse.localite}`.trim()
    : estimation.localite || '';
  
  const typeBien = estimation.caracteristiques?.typeBien || 'appartement';
  const surfaceRaw = typeBien === 'maison'
    ? estimation.caracteristiques?.surfaceHabitableMaison
    : estimation.caracteristiques?.surfacePPE;
  const surface = typeof surfaceRaw === 'number' ? surfaceRaw : parseFloat(String(surfaceRaw || '0'));
  
  const coordinates = estimation.identification?.adresse?.coordinates || null;
  const pointsForts = estimation.analyseTerrain?.pointsForts || [];
  const vendeurNom = estimation.identification?.vendeur?.nom || '';
  const vendeurPrenom = estimation.identification?.vendeur?.prenom || '';
  const vendeurEmail = estimation.identification?.vendeur?.email;
  const vendeurTelephone = estimation.identification?.vendeur?.telephone;
  
  // Pitch - peut être un objet PitchGenere ou une chaîne custom
  const pitchGenere = estimation.strategiePitch?.pitchGenere;
  const pitchText = typeof pitchGenere === 'object' && pitchGenere 
    ? pitchGenere.pitchComplet || ''
    : estimation.strategiePitch?.pitchCustom || '';
  
  // Type de mise en vente - lecture directe (pas déduction)
  const typeMiseEnVente: TypeMiseEnVente = estimation.preEstimation?.typeMiseEnVente || 'public';
  
  const proximites = estimation.identification?.proximites || [];

  // Construire les phases pour la timeline
  const dateDebutStr = estimation.strategiePitch?.dateDebut;
  const dateDebut = dateDebutStr ? new Date(dateDebutStr) : new Date();
  
  const phaseDurees = estimation.strategiePitch?.phaseDurees || { phase0: 1, phase1: 2, phase2: 2, phase3: 4 };
  const dureeP1 = phaseDurees.phase1 || 2;
  const dureeP2 = phaseDurees.phase2 || 2;
  const dureeP3 = phaseDurees.phase3 || 4;
  
  const phase1End = new Date(dateDebut);
  phase1End.setDate(phase1End.getDate() + dureeP1 * 7);
  
  const phase2End = new Date(phase1End);
  phase2End.setDate(phase2End.getDate() + dureeP2 * 7);
  
  const phase3End = new Date(phase2End);
  phase3End.setDate(phase3End.getDate() + dureeP3 * 7);

  const phases = [
    {
      nom: 'Off-Market',
      icon: <Lock className="h-5 w-5" />,
      duree: `${dureeP1} sem.`,
      dateDebut: dateDebut,
      dateFin: phase1End
    },
    {
      nom: 'Coming Soon',
      icon: <Sparkles className="h-5 w-5" />,
      duree: `${dureeP2} sem.`,
      dateDebut: phase1End,
      dateFin: phase2End
    },
    {
      nom: 'Public',
      icon: <Share2 className="h-5 w-5" />,
      duree: `${dureeP3} sem.`,
      dateDebut: phase2End,
      dateFin: phase3End
    }
  ];

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden",
        isLuxe 
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-amber-900/20" 
          : "bg-gray-900"
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header - visible sauf sur la couverture */}
      {currentSection !== 'cover' && (
        <header className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 z-20">
          <div className="flex items-center gap-3">
            {isLuxe && (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Ultra-Luxe
              </Badge>
            )}
            <div>
              <h1 className="text-white font-semibold text-lg truncate max-w-[200px]">
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
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>
      )}

      {/* Close button on cover */}
      {currentSection === 'cover' && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-30 text-white/70 hover:text-white hover:bg-white/10"
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Section content */}
        <div className="h-full">
          {currentSection === 'cover' && (
            <PresentationCover 
              identification={estimation.identification}
              caracteristiques={estimation.caracteristiques}
              isLuxe={isLuxe}
              onNext={goToNextSection}
              courtierNom={courtierNom || undefined}
            />
          )}
          {currentSection === 'bien' && (
            <PresentationCharacteristics 
              identification={estimation.identification}
              caracteristiques={estimation.caracteristiques}
              isLuxe={isLuxe}
            />
          )}
          {currentSection === 'localisation' && (
            <PresentationLocation 
              identification={estimation.identification}
              isLuxe={isLuxe}
              googleMapsApiKey={googleMapsApiKey}
              googleMapsLoading={googleMapsLoading}
            />
          )}
          {currentSection === 'etat' && (
            <PresentationCondition 
              analyseTerrain={estimation.analyseTerrain}
              caracteristiques={estimation.caracteristiques}
              isLuxe={isLuxe}
            />
          )}
          {currentSection === 'gary' && (
            <PresentationGary 
              isLuxe={isLuxe}
            />
          )}
          {currentSection === 'marche' && (
            <PresentationMarche 
              identification={estimation.identification}
              preEstimation={estimation.preEstimation}
              prixRecommande={totalVenaleCalcule}
              analyseTerrain={estimation.analyseTerrain}
            />
          )}
          {currentSection === 'strategie' && (
            <PresentationStrategie 
              identification={estimation.identification}
              caracteristiques={estimation.caracteristiques}
              preEstimation={estimation.preEstimation}
              strategie={estimation.strategiePitch}
              totalVenale={totalVenaleCalcule}
              courtierTelephone={courtierTelephone || undefined}
              capitalVisibilite={capitalVisibiliteCalcule}
              isLuxe={isLuxe}
            />
          )}
          {currentSection === 'prix' && (
            <PresentationPrix 
              caracteristiques={estimation.caracteristiques}
              preEstimation={estimation.preEstimation}
              analyseTerrain={estimation.analyseTerrain}
              typeBien={typeBien}
              typeMiseEnVente={typeMiseEnVente}
              totalVenale={totalVenaleCalcule}
              isLuxe={isLuxe}
            />
          )}
{currentSection === 'next' && (
            <PresentationPitch 
              pitch={pitchText}
              vendeurNom={vendeurNom}
              vendeurPrenom={vendeurPrenom}
              vendeurTelephone={vendeurTelephone}
              vendeurEmail={vendeurEmail}
              isLuxe={isLuxe}
            />
          )}
        </div>

        {/* Navigation arrows */}
        {currentSection !== 'cover' && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center p-2 sm:p-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 min-h-12 min-w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
                  currentIndex === 0 && "opacity-30 pointer-events-none"
                )}
                onClick={goToPrevSection}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center p-2 sm:p-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 min-h-12 min-w-12 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all",
                  currentIndex === SECTIONS.length - 1 && "opacity-30 pointer-events-none"
                )}
                onClick={goToNextSection}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Bottom navigation - visible sauf sur la couverture */}
      {currentSection !== 'cover' && (
        <nav className="flex items-center justify-center gap-1.5 p-4 border-t border-white/10 shrink-0 z-20">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              className={cn(
                "h-2 rounded-full transition-all",
                currentSection === section.id
                  ? isLuxe 
                    ? "w-8 bg-amber-500" 
                    : "w-8 bg-primary"
                  : "w-2 bg-white/30 hover:bg-white/50"
              )}
              onClick={() => setCurrentSection(section.id)}
              aria-label={section.label}
            />
          ))}
          
          {/* Page indicator */}
          <span className="ml-4 text-white/50 text-sm">
            {currentIndex + 1} / {SECTIONS.length}
          </span>
        </nav>
      )}
    </div>
  );
}
