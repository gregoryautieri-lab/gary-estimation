import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection } from '@/components/gary/FormSection';
import { ModuleProgressBar } from '@/components/gary/ModuleProgressBar';
import { MissingFieldsAlert } from '@/components/gary/MissingFieldsAlert';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useAutoSave } from '@/hooks/useAutoSave';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useStrategieLogic } from '@/hooks/useStrategieLogic';
import { EstimationData, StrategiePitch, defaultStrategiePitch, PhaseDurees } from '@/types/estimation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Target, Clock, Rocket, MessageSquare, CheckSquare, BarChart3, Zap, Calendar, Settings2, RefreshCw, Sparkles, Users, Crown, AlertTriangle, Presentation } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExportPDFButton } from '@/components/estimation/ExportPDFButton';
import { useLuxMode } from '@/hooks/useEstimationCalcul';
import { supabase } from '@/integrations/supabase/client';

// Composants stratégie
import { CapitalGaugeAdvanced } from '@/components/strategie/CapitalGaugeAdvanced';
import { PhaseCard } from '@/components/strategie/PhaseCard';
import { TimelineGraph } from '@/components/strategie/TimelineGraph';
import { CanalCard } from '@/components/strategie/CanalCard';
import { AlerteCourtier } from '@/components/strategie/AlerteCourtier';
import { LevierChip, LEVIERS_MARKETING } from '@/components/strategie/LevierChip';
import { RecapExpress } from '@/components/strategie/RecapExpress';
import { PitchEditor } from '@/components/strategie/PitchEditor';
import { EtapeChecklist, ETAPES_PROCHAINES } from '@/components/strategie/EtapeChecklist';
import { Phase0ChecklistEnhanced, getDefaultPhase0Actions, Phase0Action } from '@/components/strategie/Phase0ChecklistEnhanced';
import { DateVenteIdeale } from '@/components/strategie/DateVenteIdeale';
import { LockBannerEnhanced } from '@/components/gary/LockBannerEnhanced';
import { useEstimationLockEnhanced } from '@/hooks/useEstimationLockEnhanced';
import { ContrainteBadge } from '@/components/strategie/ContrainteBadge';
// Note: PresentationMode moved to dedicated route /estimation/:id/presentation
import { format, nextMonday } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Module5Strategie() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [strategie, setStrategie] = useState<StrategiePitch>(defaultStrategiePitch);
  const [saving, setSaving] = useState(false);
  const [pitchCustom, setPitchCustom] = useState('');
  const [customPhase0Actions, setCustomPhase0Actions] = useState<string[]>([]);
  const [checkedPhase0Actions, setCheckedPhase0Actions] = useState<string[]>([]);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchSource, setPitchSource] = useState<'rule' | 'ai'>('rule');
  // Note: Presentation mode now uses dedicated route

  useEffect(() => {
    if (id) loadEstimation();
  }, [id]);

  const loadEstimation = async () => {
    if (!id) return;
    const data = await fetchEstimation(id);
    if (data) {
      setEstimation(data);
      const strat = { ...defaultStrategiePitch, ...data.strategiePitch };
      
      // Date de lancement auto = prochain lundi si non définie
      if (!strat.dateDebut) {
        const now = new Date();
        // Si l'estimation vient d'être créée, on prend le lundi suivant
        const createdAt = data.createdAt ? new Date(data.createdAt) : now;
        strat.dateDebut = format(nextMonday(createdAt), 'yyyy-MM-dd');
      }
      
      setStrategie(strat);
      setCheckedPhase0Actions(strat.phase0Actions || []);
    }
  };

  // Hook de verrouillage
  const { isLocked, lockMessage, duplicateAndNavigate, duplicating } = useEstimationLockEnhanced(
    estimation?.statut
  );

  const handleDuplicate = async () => {
    if (!id || !estimation) return;
    await duplicateAndNavigate(id, estimation);
  };

  // Logique métier
  const logic = useStrategieLogic(
    estimation?.identification || null,
    estimation?.caracteristiques || null,
    estimation?.analyseTerrain || null,
    estimation?.preEstimation || null,
    strategie
  );

  // Calcul LuxMode basé sur le prix - DOIT être avant tout return conditionnel
  const prixAffiche = estimation?.prixFinal || 0;
  const luxMode = useLuxMode(
    estimation?.caracteristiques || null,
    estimation?.identification?.contexte || null,
    estimation?.identification?.historique || null,
    prixAffiche
  );

  // Progress tracking - MUST be before any conditional returns
  const { moduleStatuses, missingFields, canProceed, presentationBlocker } = useModuleProgress(
    estimation,
    id || '',
    5
  );

  // Autosave pour éviter perte de données
  const { scheduleSave, isSaving: autoSaving } = useAutoSave({
    delay: 2000,
    onSave: async () => {
      if (!id || isLocked) return;
      await updateEstimation(id, { 
        strategiePitch: { 
          ...strategie, 
          phase0Actions: [...checkedPhase0Actions, ...customPhase0Actions] 
        } 
      });
    },
    enabled: !isLocked && !!id && !!estimation
  });

  const updateField = <K extends keyof StrategiePitch>(field: K, value: StrategiePitch[K]) => {
    setStrategie(prev => ({ ...prev, [field]: value }));
    scheduleSave();
  };

  const updatePhaseDuree = (phaseKey: keyof PhaseDurees, delta: number) => {
    const current = strategie.phaseDurees || defaultStrategiePitch.phaseDurees;
    const newDuree = Math.max(1, current[phaseKey] + delta);
    updateField('phaseDurees', { ...current, [phaseKey]: newDuree });
    // Clear date ideale when manually editing
    if (strategie.dateVenteIdeale) {
      updateField('dateVenteIdeale', '');
    }
  };

  const toggleCanal = (canalId: string) => {
    const current = strategie.canauxActifs || [];
    const newCanaux = current.includes(canalId)
      ? current.filter(c => c !== canalId)
      : [...current, canalId];
    updateField('canauxActifs', newCanaux);
  };

  const toggleLevier = (levierId: string) => {
    const current = strategie.leviers || [];
    const newLeviers = current.includes(levierId)
      ? current.filter(l => l !== levierId)
      : [...current, levierId];
    updateField('leviers', newLeviers);
  };

  const toggleEtape = (etape: string) => {
    const current = strategie.etapesCochees || [];
    const newEtapes = current.includes(etape)
      ? current.filter(e => e !== etape)
      : [...current, etape];
    updateField('etapesCochees', newEtapes);
  };

  const togglePhase0Action = (actionId: string) => {
    setCheckedPhase0Actions(prev => 
      prev.includes(actionId) 
        ? prev.filter(a => a !== actionId)
        : [...prev, actionId]
    );
    scheduleSave();
  };

  // Génération du pitch via IA avec fallback rule-based
  const generateAIPitch = useCallback(async () => {
    if (!estimation) return;
    
    setGeneratingPitch(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-pitch', {
        body: {
          vendeur: {
            nom: estimation.identification?.vendeur?.nom || 'Client',
            prenom: estimation.identification?.vendeur?.prenom || ''
          },
          motifVente: estimation?.identification?.contexte?.motifVente || '',
          prioriteVendeur: estimation?.identification?.contexte?.prioriteVendeur || '',
          horizon: estimation?.identification?.contexte?.horizon || '',
          typeBien: estimation?.caracteristiques?.typeBien || 'appartement',
          pointsForts: estimation?.analyseTerrain?.pointsForts || [],
          pointsFaibles: estimation?.analyseTerrain?.pointsFaibles || [],
          prixEntre: estimation?.preEstimation?.prixEntre || '',
          prixEt: estimation?.preEstimation?.prixEt || '',
          capitalVisibilite: {
            label: logic.capitalVisibilite.label,
            pauseRecalibrage: logic.capitalVisibilite.pauseRecalibrage
          },
          projetPostVente: estimation?.identification?.projetPostVente ? {
            nature: estimation.identification?.projetPostVente?.nature || '',
            avancement: estimation.identification?.projetPostVente?.avancement || '',
            niveauCoordination: estimation.identification?.projetPostVente?.niveauCoordination || '',
            accepteDecalage: estimation.identification?.projetPostVente?.accepteDecalage ?? false
          } : undefined,
          niveauContrainte: logic.niveauContrainte,
          dateDebutFormate: logic.dateDebutFormate,
          typeMiseEnVente: logic.typeMiseEnVente,
          isLuxe: (estimation.prixFinal || 0) > 5000000,
          fallbackPitch: logic.pitch.complet
        }
      });

      if (error) {
        console.error('Error generating AI pitch:', error);
        toast.error('Erreur IA, pitch standard utilisé');
        setPitchCustom(logic.pitch.complet);
        setPitchSource('rule');
        return;
      }

      if (data?.pitch) {
        setPitchCustom(data.pitch);
        setPitchSource(data.source === 'ai' ? 'ai' : 'rule');
        
        if (data.source === 'ai') {
          toast.success('Pitch généré par IA');
        } else if (data.error === 'rate_limited') {
          toast.warning('Limite atteinte, pitch standard utilisé');
        } else {
          toast.info('Pitch standard utilisé');
        }
      }
    } catch (err) {
      console.error('Error calling generate-pitch:', err);
      toast.error('Erreur de connexion, pitch standard utilisé');
      setPitchCustom(logic.pitch.complet);
      setPitchSource('rule');
    } finally {
      setGeneratingPitch(false);
    }
  }, [estimation, logic]);

  const handleSave = async () => {
    if (!id || !estimation) return;
    setSaving(true);
    await updateEstimation(id, { 
      strategiePitch: { 
        ...strategie, 
        phase0Actions: [...checkedPhase0Actions, ...customPhase0Actions] 
      } 
    });
    setSaving(false);
    toast.success('Stratégie enregistrée');
  };

  const handleNext = async () => {
    await handleSave();
    toast.success('Estimation terminée !');
    navigate(`/estimations`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ModuleHeader moduleNumber={5} title="Stratégie" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  // Adresse complète - essayer plusieurs sources
  const adresseData = estimation?.identification?.adresse;
  const adresse = adresseData?.rue || estimation?.adresse || '';
  const localite = adresseData?.localite 
    ? `${adresseData.codePostal || ''} ${adresseData.localite}`.trim()
    : estimation?.localite || '';
  
  const typeBien = estimation?.caracteristiques?.typeBien || '';
  // Surface selon type de bien (PPE pour appart, surfaceHabitableMaison pour maison)
  const surface = typeBien === 'maison' 
    ? parseFloat(estimation?.caracteristiques?.surfaceHabitableMaison || '0')
    : parseFloat(estimation?.caracteristiques?.surfacePPE || '0');
  const pointsForts = estimation?.analyseTerrain?.pointsForts || [];

  // Préparer actions Phase 0 avec état checked
  const phase0ActionsWithState = logic.actionsPhase0.map(a => ({
    ...a,
    checked: checkedPhase0Actions.includes(a.id)
  }));
  
  // Calculer date fin estimée et durée totale
  const dateFinEstimee = logic.phases.length > 0 
    ? format(logic.phases[logic.phases.length - 1].dateFin, 'd MMMM yyyy', { locale: fr })
    : undefined;
  const dureeTotale = logic.phaseDurees.phase0 + logic.phaseDurees.phase1 + 
    logic.phaseDurees.phase2 + logic.phaseDurees.phase3;
  
  // Alerte contrainte pour RecapExpress
  const contrainteAlerte = logic.niveauContrainte >= 4 
    ? "Timing serré — projet achat avancé, coordination étroite requise"
    : logic.niveauContrainte >= 3 
      ? "Offre en cours côté achat — rester agile sur la vente"
      : undefined;
  
  // Vérifier si critères d'achat manquants
  const projetPostVente = estimation?.identification?.projetPostVente;
  const isAchatProject = projetPostVente?.nature === 'achat';
  const criteresAchat = projetPostVente?.criteresAchat;
  const needsCriteresAchat = isAchatProject && (
    !criteresAchat || 
    !criteresAchat.actif ||
    criteresAchat.zones.length === 0 ||
    criteresAchat.budgetMax === 0
  );
  return (
    <div className="min-h-screen bg-background pb-32">
      <ModuleHeader 
        moduleNumber={5} 
        title="Stratégie" 
        subtitle="Timeline et pitch de closing"
        backPath={`/estimation/${id}/4`}
        isSaving={autoSaving}
      />

      {/* Barre de progression */}
      {id && (
        <ModuleProgressBar
          modules={moduleStatuses}
          currentModule={5}
          estimationId={id}
        />
      )}

      <div className="p-4 space-y-6">
        {/* Bandeau de verrouillage */}
        {isLocked && lockMessage && (
          <LockBannerEnhanced
            statut={estimation?.statut || 'brouillon'}
            message={lockMessage}
            onDuplicate={handleDuplicate}
            duplicating={duplicating}
          />
        )}

        {/* Alerte champs manquants */}
        {missingFields.length > 0 && !isLocked && (
          <MissingFieldsAlert
            fields={missingFields}
            moduleName="Stratégie & Pitch"
            showMarkComplete={canProceed}
            onMarkComplete={handleSave}
          />
        )}

        {/* Blocage présentation si applicable */}
        {!presentationBlocker.canPresent && presentationBlocker.message && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Impossible de présenter</AlertTitle>
            <AlertDescription>{presentationBlocker.message}</AlertDescription>
          </Alert>
        )}

        {/* Alerte critères d'achat manquants */}
        {needsCriteresAchat && (
          <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-200">Critères d'achat non renseignés</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              Ce client cherche à acheter mais les critères détaillés ne sont pas renseignés.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-1 text-yellow-800 dark:text-yellow-200 underline"
                onClick={() => navigate(`/estimation/${id}/1`)}
              >
                Compléter dans Module 1
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Badge Ultra-Luxe si applicable */}
        {luxMode.isLux && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl p-3">
            <Crown className="h-5 w-5" />
            <div>
              <p className="font-bold text-sm">Mode Ultra-Luxe activé</p>
              <p className="text-xs opacity-90">Vocabulaire premium, stratégie adaptée au segment haut de gamme</p>
            </div>
            <span className="ml-auto text-2xl font-bold">{luxMode.score}</span>
          </div>
        )}

        {/* Récap Express enrichi */}
        <RecapExpress
          adresse={adresse}
          localite={localite}
          prixAffiche={prixAffiche}
          typeMiseEnVente={logic.typeMiseEnVente}
          dateDebut={logic.dateDebutFormate}
          typeBien={typeBien}
          surface={surface}
          pointsForts={pointsForts}
          dateFinEstimee={dateFinEstimee}
          dureeTotale={dureeTotale}
          niveauContrainte={logic.niveauContrainte}
          isLuxe={luxMode.isLux}
          contrainteAlerte={contrainteAlerte}
        />

        {/* Niveau de Contrainte Vendeur */}
        {logic.niveauContrainte > 0 && (
          <FormSection title="Contrainte vendeur" icon={<Users className="h-5 w-5" />}>
            <ContrainteBadge 
              niveau={logic.niveauContrainte} 
              label={logic.contrainteLabel}
            />
          </FormSection>
        )}

        {/* Alertes Courtier */}
        {logic.ajustementPhases.alerteCourtier && (
          <AlerteCourtier
            type={logic.ajustementPhases.alerteCourtier.type}
            title={logic.ajustementPhases.alerteCourtier.title}
            message={logic.ajustementPhases.alerteCourtier.message}
            actions={logic.ajustementPhases.alerteCourtier.actions}
          />
        )}
        
        {/* Alertes supplémentaires */}
        {logic.ajustementPhases.alertesSupplementaires?.map((alerte, idx) => (
          <AlerteCourtier
            key={idx}
            type={alerte.type}
            title={alerte.title}
            message={alerte.message}
            actions={alerte.actions}
          />
        ))}

        {/* Capital-Visibilité Avancé */}
        <FormSection title="Capital-Visibilité" icon={<BarChart3 className="h-5 w-5" />}>
          <CapitalGaugeAdvanced 
            {...logic.capitalVisibilite} 
            historiqueDiffusion={estimation?.identification?.historique ? {
              dejaDiffuse: estimation.identification?.historique?.dejaDiffuse ?? false,
              duree: estimation.identification?.historique?.duree || '',
              typeDiffusion: estimation.identification?.historique?.typeDiffusion || '',
              dateRetrait: estimation.identification?.historique?.dateRetrait || ''
            } : undefined}
          />
        </FormSection>

        {/* Date de début */}
        <FormSection title="Date de lancement" icon={<Calendar className="h-5 w-5" />}>
          <Input
            type="date"
            value={strategie.dateDebut}
            onChange={(e) => updateField('dateDebut', e.target.value)}
          />
        </FormSection>

        {/* Date de vente idéale */}
        <FormSection title="Date de vente idéale" icon={<Target className="h-5 w-5" />}>
          <DateVenteIdeale
            value={strategie.dateVenteIdeale}
            onChange={(v) => updateField('dateVenteIdeale', v)}
            message={logic.phasesCalculees.message}
            isUrgent={logic.phasesCalculees.isUrgent}
          />
        </FormSection>

        {/* Actions Phase 0 - Checklist améliorée avec progression */}
        <FormSection title="Préparation (Phase 0)" icon={<Settings2 className="h-5 w-5" />}>
          <Phase0ChecklistEnhanced
            actions={phase0ActionsWithState}
            customActions={customPhase0Actions}
            onToggleAction={togglePhase0Action}
            onAddCustomAction={(a) => setCustomPhase0Actions(prev => [...prev, a])}
            onRemoveCustomAction={(a) => setCustomPhase0Actions(prev => prev.filter(x => x !== a))}
            disabled={isLocked}
          />
        </FormSection>

        {/* Timeline Graphique */}
        <FormSection title="Timeline de vente" icon={<Clock className="h-5 w-5" />}>
          <TimelineGraph
            phases={logic.phases}
            dateFinEstimee={logic.phases.length > 0 ? logic.phases[logic.phases.length - 1].dateFin : null}
            isUrgent={logic.phasesCalculees.isUrgent}
            pauseRecalibrage={logic.capitalVisibilite.pauseRecalibrage}
            typeMiseEnVente={logic.typeMiseEnVente}
          />
          
          {/* Phases Cards (scroll horizontal) */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Ajuster les durées :</p>
            <ScrollArea className="w-full">
              <div className="flex gap-3 pb-4">
                {logic.phases.map((phase, idx) => (
                  <PhaseCard
                    key={idx}
                    nom={phase.nom}
                    icon={phase.icon}
                    duree={phase.duree}
                    dateDebut={phase.dateDebut}
                    dateFin={phase.dateFin}
                    isActive={idx === 1}
                    isFirst={idx === 0}
                    editable={!strategie.dateVenteIdeale}
                    onDureeChange={(delta) => {
                      const keys: (keyof PhaseDurees)[] = ['phase0', 'phase1', 'phase2', 'phase3'];
                      updatePhaseDuree(keys[idx], delta);
                    }}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          
          {strategie.dateVenteIdeale && (
            <p className="text-xs text-muted-foreground">
              💡 Durées calculées automatiquement. Effacez la date idéale pour éditer manuellement.
            </p>
          )}
        </FormSection>

        {/* Canaux de Diffusion */}
        <FormSection title="Canaux de diffusion" icon={<Target className="h-5 w-5" />}>
          <div className="grid grid-cols-1 gap-3">
            {logic.canaux.map((canal) => (
              <CanalCard
                key={canal.id}
                {...canal}
                selected={strategie.canauxActifs?.includes(canal.id)}
                onToggle={() => toggleCanal(canal.id)}
              />
            ))}
          </div>
        </FormSection>

        {/* Leviers Marketing */}
        <FormSection title="Leviers marketing" icon={<Zap className="h-5 w-5" />}>
          <div className="flex flex-wrap gap-2">
            {LEVIERS_MARKETING.map((levier) => (
              <LevierChip
                key={levier.id}
                label={levier.label}
                icon={levier.icon}
                selected={strategie.leviers?.includes(levier.id) || false}
                onToggle={() => toggleLevier(levier.id)}
              />
            ))}
          </div>
        </FormSection>

        {/* Pitch de Closing */}
        <FormSection title="Pitch de closing" icon={<MessageSquare className="h-5 w-5" />}>
          <div className="space-y-3">
            {/* Bouton générer avec IA */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={generateAIPitch}
                disabled={generatingPitch}
                className="flex items-center gap-2"
              >
                {generatingPitch ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Générer avec IA
                  </>
                )}
              </Button>
              {pitchSource === 'ai' && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Généré par IA
                </span>
              )}
            </div>
            
            <PitchEditor
              value={pitchCustom}
              defaultValue={logic.pitch.complet}
              onChange={setPitchCustom}
            />
          </div>
        </FormSection>

        {/* Prochaines Étapes */}
        <FormSection title="Prochaines étapes" icon={<CheckSquare className="h-5 w-5" />}>
          <EtapeChecklist
            etapes={ETAPES_PROCHAINES}
            cochees={strategie.etapesCochees || []}
            onToggle={toggleEtape}
          />
        </FormSection>

        {/* Navigation */}
        <div className="flex flex-col gap-3 pt-4">
          {/* Bouton Mode Présentation - Navigation vers la route dédiée */}
          <Button 
            variant="outline" 
            className="w-full border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate(`/estimation/${id}/presentation`)}
          >
            <Presentation className="h-4 w-4 mr-2" />
            🎨 Mode Présentation Client
          </Button>
          
          {estimation && (
            <ExportPDFButton estimation={estimation} className="w-full" />
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(`/estimation/${id}/4`)} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={handleNext} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
              {saving ? 'Enregistrement...' : 'Terminer'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
