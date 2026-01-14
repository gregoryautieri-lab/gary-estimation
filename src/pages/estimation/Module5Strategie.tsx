import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { EstimationData } from '@/types/estimation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Calendar, Target, Rocket, Clock } from 'lucide-react';

export default function Module5Strategie() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
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
    }
  };

  const handleSave = async () => {
    if (!id || !estimation) return;
    setSaving(true);
    
    const success = await updateEstimation(id, {
      // Save strategie data here when implemented
    });
    
    setSaving(false);
    
    if (success) {
      toast.success('Stratégie enregistrée');
    }
  };

  const handleNext = async () => {
    await handleSave();
    // Navigate to next module (photos or recap)
    toast.success('Module 5 terminé — Module 6 à venir');
    navigate(`/estimations`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ModuleHeader moduleNumber={5} title="Stratégie" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ModuleHeader 
        moduleNumber={5} 
        title="Stratégie" 
        subtitle="Phases de vente et timeline"
        backPath={`/estimation/${id}/4`}
      />

      <div className="p-4 space-y-6">
        {/* Placeholder content */}
        <FormSection title="Canaux de diffusion" icon={<Target className="h-5 w-5" />}>
          <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <Rocket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Module en cours de développement</p>
            <p className="text-xs mt-2">Portails, réseaux, off-market...</p>
          </div>
        </FormSection>

        <FormSection title="Phases de vente" icon={<Clock className="h-5 w-5" />}>
          <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Préparation → Off-market → Coming Soon → Public</p>
            <p className="text-xs mt-2">Timeline et calendrier à venir</p>
          </div>
        </FormSection>

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/estimation/${id}/4`)}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Button
            onClick={handleNext}
            disabled={saving}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {saving ? 'Enregistrement...' : 'Terminer'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
