import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { EstimationData, defaultAnalyseTerrain, AnalyseTerrain } from '@/types/estimation';
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

const pointsFortsOptions = [
  'Luminosité exceptionnelle',
  'Vue dégagée',
  'Calme absolu',
  'Beaux volumes',
  'Finitions haut de gamme',
  'Cuisine équipée récente',
  'Parquet massif',
  'Cheminée',
  'Dressing',
  'Grande terrasse',
  'Jardin privatif',
  'Proximité transports',
  'Quartier recherché',
  'Faibles charges',
  'Pas de vis-à-vis',
];

const pointsFaiblesOptions = [
  'Travaux à prévoir',
  'Cuisine à refaire',
  'SDB vieillissante',
  'Manque de rangements',
  'Étage sans ascenseur',
  'Nuisances sonores',
  'Vis-à-vis',
  'Exposition nord',
  'Charges élevées',
  'Stationnement difficile',
  'Copropriété vieillissante',
];

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

  const updateField = <K extends keyof AnalyseTerrain>(field: K, value: AnalyseTerrain[K]) => {
    setAnalyse(prev => ({ ...prev, [field]: value }));
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
    navigate(`/estimation/${id}/4`);
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
      />

      <div className="p-4 space-y-6">
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

        {/* Points forts */}
        <FormSection title="Points forts">
          <div className="flex flex-wrap gap-2">
            {pointsFortsOptions.map((point) => (
              <button
                key={point}
                onClick={() => toggleArrayItem('pointsForts', point)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  analyse.pointsForts?.includes(point)
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {point}
              </button>
            ))}
          </div>
          <FormRow label="Autre point fort">
            <Textarea
              value={analyse.pointFortCustom || ''}
              onChange={(e) => updateField('pointFortCustom', e.target.value)}
              placeholder="Ajoutez un point fort personnalisé..."
              rows={2}
            />
          </FormRow>
        </FormSection>

        {/* Points faibles */}
        <FormSection title="Points faibles">
          <div className="flex flex-wrap gap-2">
            {pointsFaiblesOptions.map((point) => (
              <button
                key={point}
                onClick={() => toggleArrayItem('pointsFaibles', point)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  analyse.pointsFaibles?.includes(point)
                    ? 'bg-red-500 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {point}
              </button>
            ))}
          </div>
          <FormRow label="Autre point faible">
            <Textarea
              value={analyse.pointFaibleCustom || ''}
              onChange={(e) => updateField('pointFaibleCustom', e.target.value)}
              placeholder="Ajoutez un point faible personnalisé..."
              rows={2}
            />
          </FormRow>
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
