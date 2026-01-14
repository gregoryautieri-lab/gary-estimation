import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useStrategieLogic } from '@/hooks/useStrategieLogic';
import { EstimationData, StrategiePitch, defaultStrategiePitch } from '@/types/estimation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Target, Clock, Rocket, MessageSquare, CheckSquare, BarChart3, Zap, Calendar } from 'lucide-react';

// Composants stratégie
import { CapitalGauge } from '@/components/strategie/CapitalGauge';
import { PhaseCard } from '@/components/strategie/PhaseCard';
import { CanalCard } from '@/components/strategie/CanalCard';
import { AlerteCourtier } from '@/components/strategie/AlerteCourtier';
import { LevierChip, LEVIERS_MARKETING } from '@/components/strategie/LevierChip';
import { RecapExpress } from '@/components/strategie/RecapExpress';
import { PitchEditor } from '@/components/strategie/PitchEditor';
import { EtapeChecklist, ETAPES_PROCHAINES } from '@/components/strategie/EtapeChecklist';
import { format, nextMonday } from 'date-fns';

export default function Module5Strategie() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [strategie, setStrategie] = useState<StrategiePitch>(defaultStrategiePitch);
  const [saving, setSaving] = useState(false);
  const [pitchCustom, setPitchCustom] = useState('');

  useEffect(() => {
    if (id) loadEstimation();
  }, [id]);

  const loadEstimation = async () => {
    if (!id) return;
    const data = await fetchEstimation(id);
    if (data) {
      setEstimation(data);
      const strat = { ...defaultStrategiePitch, ...data.strategiePitch };
      // Date par défaut : prochain lundi
      if (!strat.dateDebut) {
        strat.dateDebut = format(nextMonday(new Date()), 'yyyy-MM-dd');
      }
      setStrategie(strat);
    }
  };

  // Logique métier
  const logic = useStrategieLogic(
    estimation?.identification || null,
    estimation?.caracteristiques || null,
    estimation?.analyseTerrain || null,
    estimation?.preEstimation || null,
    strategie
  );

  const updateField = <K extends keyof StrategiePitch>(field: K, value: StrategiePitch[K]) => {
    setStrategie(prev => ({ ...prev, [field]: value }));
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

  const handleSave = async () => {
    if (!id || !estimation) return;
    setSaving(true);
    await updateEstimation(id, { strategiePitch: strategie });
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

  const prixAffiche = estimation?.prixFinal || 0;
  const adresse = estimation?.identification?.adresse?.rue || '';
  const localite = estimation?.identification?.adresse?.localite || '';

  return (
    <div className="min-h-screen bg-background pb-32">
      <ModuleHeader 
        moduleNumber={5} 
        title="Stratégie" 
        subtitle="Timeline et pitch de closing"
        backPath={`/estimation/${id}/4`}
      />

      <div className="p-4 space-y-6">
        {/* Récap Express */}
        <RecapExpress
          adresse={adresse}
          localite={localite}
          prixAffiche={prixAffiche}
          typeMiseEnVente={logic.typeMiseEnVente}
          dateDebut={logic.dateDebutFormate}
        />

        {/* Alerte Courtier */}
        {logic.ajustementPhases.alerteCourtier && (
          <AlerteCourtier
            type={logic.ajustementPhases.alerteCourtier.type}
            message={logic.ajustementPhases.alerteCourtier.message}
          />
        )}

        {/* Capital-Visibilité */}
        <FormSection title="Capital-Visibilité" icon={<BarChart3 className="h-5 w-5" />}>
          <CapitalGauge {...logic.capitalVisibilite} />
        </FormSection>

        {/* Date de début */}
        <FormSection title="Date de lancement" icon={<Calendar className="h-5 w-5" />}>
          <Input
            type="date"
            value={strategie.dateDebut}
            onChange={(e) => updateField('dateDebut', e.target.value)}
          />
        </FormSection>

        {/* Timeline Phases */}
        <FormSection title="Phases de vente" icon={<Clock className="h-5 w-5" />}>
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
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
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
          <PitchEditor
            value={pitchCustom}
            defaultValue={logic.pitch.complet}
            onChange={setPitchCustom}
          />
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
        <div className="flex gap-3 pt-4">
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

      <BottomNav />
    </div>
  );
}
