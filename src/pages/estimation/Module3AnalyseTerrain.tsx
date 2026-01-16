import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { ModuleProgressBar } from '@/components/gary/ModuleProgressBar';
import { MissingFieldsAlert } from '@/components/gary/MissingFieldsAlert';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useEstimationLockEnhanced } from '@/hooks/useEstimationLockEnhanced';
import { useModuleProgress } from '@/hooks/useModuleProgress';
import { useAutoSave } from '@/hooks/useAutoSave';
import { EstimationData, defaultAnalyseTerrain, AnalyseTerrain } from '@/types/estimation';
import { PointChipsGrid, POINTS_FORTS_OPTIONS, POINTS_FAIBLES_OPTIONS } from '@/components/gary/PointChipsGrid';
import { LockBannerEnhanced } from '@/components/gary/LockBannerEnhanced';
import { toast } from 'sonner';
import { ChevronRight, Sun, Volume2, Maximize2, Star } from 'lucide-react';

const etatOptions = [
  { value: '1', label: '1', description: 'À refaire' },
  { value: '2', label: '2', description: 'Vétuste' },
  { value: '3', label: '3', description: 'Correct' },
  { value: '4', label: '4', description: 'Bon' },
  { value: '5', label: '5', description: 'Excellent' },
];

const piecesEtat = [
  { key: 'etatCuisine', label: 'Cuisine', icon: '🍳' },
  { key: 'etatSDB', label: 'Salle de bain', icon: '🚿' },
  { key: 'etatSols', label: 'Sols', icon: '🪵' },
  { key: 'etatMurs', label: 'Murs/Plafonds', icon: '🧱' },
  { key: 'etatMenuiseries', label: 'Menuiseries', icon: '🚪' },
  { key: 'etatElectricite', label: 'Électricité', icon: '⚡' },
] as const;

// Options nuisances uniquement (les points forts/faibles sont maintenant dans PointChipsGrid)
const nuisancesOptions = [
  { value: 'route', label: 'Route passante', icon: '🚗' },
  { value: 'train', label: 'Voie ferrée', icon: '🚂' },
  { value: 'avion', label: 'Couloir aérien', icon: '✈️' },
  { value: 'bar', label: 'Bar/Restaurant', icon: '🍺' },
  { value: 'ecole', label: 'École/Crèche', icon: '🏫' },
  { value: 'chantier', label: 'Chantier', icon: '🏗️' },
  { value: 'industrie', label: 'Zone industrielle', icon: '🏭' },
  { value: 'aucune', label: 'Aucune', icon: '✅' },
];

interface RatingButtonsProps {
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
  label: string;
}

const RatingButtons = ({ value, onChange, icon, label }: RatingButtonsProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
      {icon}
      {label}
    </div>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            value >= n
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

export default function Module3AnalyseTerrain() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [analyse, setAnalyse] = useState<AnalyseTerrain>(defaultAnalyseTerrain);
  const [saving, setSaving] = useState(false);
  const [customPointsForts, setCustomPointsForts] = useState<string[]>([]);
  const [customPointsFaibles, setCustomPointsFaibles] = useState<string[]>([]);

  // Hook de progression
  const { moduleStatuses, missingFields } = useModuleProgress(estimation, id || '', 3);

  // Hook de verrouillage
  const { isLocked, lockMessage, duplicateAndNavigate, duplicating } = useEstimationLockEnhanced(
    estimation?.statut
  );

  useEffect(() => {
    if (id) {
      loadEstimation();
    }
  }, [id]);

  const loadEstimation = async () => {
    if (!id) return;
    const data = await fetchEstimation(id);
    if (data) {
      setEstimation(data);
      setAnalyse({ ...defaultAnalyseTerrain, ...data.analyseTerrain });
    }
  };

  // Autosave pour éviter perte de données
  const { scheduleSave, isSaving: autoSaving } = useAutoSave({
    delay: 2000,
    onSave: async () => {
      if (!id || isLocked) return;
      await updateEstimation(id, { analyseTerrain: analyse });
    },
    enabled: !isLocked && !!id && !!estimation
  });

  const updateField = <K extends keyof AnalyseTerrain>(field: K, value: AnalyseTerrain[K]) => {
    setAnalyse(prev => ({ ...prev, [field]: value }));
    scheduleSave();
  };

  const toggleArrayItem = (field: 'pointsForts' | 'pointsFaibles' | 'nuisances', item: string) => {
    const current = analyse[field] || [];
    const updated = current.includes(item)
      ? current.filter(v => v !== item)
      : [...current, item];
    updateField(field, updated);
  };

  const handleSave = async () => {
    if (!id || !estimation) return;
    setSaving(true);
    
    const success = await updateEstimation(id, {
      analyseTerrain: analyse,
    });
    
    setSaving(false);
    
    if (success) {
      toast.success('Analyse terrain enregistrée');
    }
  };

  const handleNext = async () => {
    await handleSave();
    navigate(`/estimation/${id}/photos`);
  };

  const handleDuplicate = async () => {
    if (!id || !estimation) return;
    await duplicateAndNavigate(id, estimation);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ModuleHeader moduleNumber={3} title="Analyse Terrain" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ModuleHeader 
        moduleNumber={3} 
        title="Analyse Terrain" 
        subtitle={estimation?.identification?.vendeur?.nom || 'Nouveau bien'}
        backPath={`/estimation/${id}/2`}
        isSaving={autoSaving}
      />

      {/* Barre de progression */}
      <ModuleProgressBar modules={moduleStatuses} currentModule={3} estimationId={id || ''} />

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

        {/* État pièce par pièce */}
        <FormSection title="État pièce par pièce">
          <div className="space-y-4">
            {piecesEtat.map(({ key, label, icon }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span>{icon}</span>
                  {label}
                </div>
                <div className="flex gap-1">
                  {etatOptions.map(({ value, label: optLabel, description }) => {
                    const currentValue = analyse[key as keyof AnalyseTerrain] as string;
                    const isSelected = currentValue === value;
                    return (
                      <button
                        key={value}
                        onClick={() => updateField(key as keyof AnalyseTerrain, value as never)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        title={description}
                      >
                        {optLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </FormSection>

        {/* Ambiance */}
        <FormSection title="Ambiance générale">
          <div className="space-y-4">
            <RatingButtons
              value={analyse.luminosite}
              onChange={(v) => updateField('luminosite', v)}
              icon={<Sun className="h-4 w-4 text-yellow-500" />}
              label="Luminosité"
            />
            <RatingButtons
              value={analyse.calme}
              onChange={(v) => updateField('calme', v)}
              icon={<Volume2 className="h-4 w-4 text-blue-500" />}
              label="Calme"
            />
            <RatingButtons
              value={analyse.volumes}
              onChange={(v) => updateField('volumes', v)}
              icon={<Maximize2 className="h-4 w-4 text-green-500" />}
              label="Volumes"
            />
          </div>
        </FormSection>

        {/* Impression générale */}
        <FormSection title="Impression générale">
          <RatingButtons
            value={analyse.impressionGenerale}
            onChange={(v) => updateField('impressionGenerale', v)}
            icon={<Star className="h-4 w-4 text-amber-500" />}
            label="Note globale du bien"
          />
        </FormSection>

        {/* Points forts - Nouveau composant avec chips emoji */}
        <FormSection title="Points forts">
          <PointChipsGrid
            type="fort"
            options={POINTS_FORTS_OPTIONS}
            selected={analyse.pointsForts || []}
            customItems={customPointsForts}
            onToggle={(value) => toggleArrayItem('pointsForts', value)}
            onAddCustom={(value) => setCustomPointsForts(prev => [...prev, value])}
            onRemoveCustom={(value) => setCustomPointsForts(prev => prev.filter(v => v !== value))}
            disabled={isLocked}
          />
        </FormSection>

        {/* Points faibles - Nouveau composant avec chips emoji */}
        <FormSection title="Points faibles">
          <PointChipsGrid
            type="faible"
            options={POINTS_FAIBLES_OPTIONS}
            selected={analyse.pointsFaibles || []}
            customItems={customPointsFaibles}
            onToggle={(value) => toggleArrayItem('pointsFaibles', value)}
            onAddCustom={(value) => setCustomPointsFaibles(prev => [...prev, value])}
            onRemoveCustom={(value) => setCustomPointsFaibles(prev => prev.filter(v => v !== value))}
            disabled={isLocked}
          />
        </FormSection>

        {/* Nuisances */}
        <FormSection title="Nuisances">
          <div className="grid grid-cols-2 gap-2">
            {nuisancesOptions.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => toggleArrayItem('nuisances', value)}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  analyse.nuisances?.includes(value)
                    ? value === 'aucune' 
                      ? 'border-green-500 bg-green-500/10 text-green-700'
                      : 'border-red-500 bg-red-500/10 text-red-700'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <span>{icon}</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </FormSection>

        {/* Objections et notes */}
        <FormSection title="Notes">
          <div className="space-y-4">
            <FormRow label="Objections potentielles des acheteurs">
              <Textarea
                value={analyse.objectionsAcheteurs || ''}
                onChange={(e) => updateField('objectionsAcheteurs', e.target.value)}
                placeholder="Quelles objections anticipez-vous ?"
                rows={3}
              />
            </FormRow>
            <FormRow label="Notes libres">
              <Textarea
                value={analyse.notesLibres || ''}
                onChange={(e) => updateField('notesLibres', e.target.value)}
                placeholder="Autres observations..."
                rows={3}
              />
            </FormRow>
          </div>
        </FormSection>

        {/* Alerte champs manquants */}
        <MissingFieldsAlert fields={missingFields} moduleName="Analyse terrain" />
      </div>

      {/* Footer actions */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(`/estimation/${id}/2`)}
          >
            Précédent
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Suivant'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
