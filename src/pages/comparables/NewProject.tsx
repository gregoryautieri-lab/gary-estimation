import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Search, CheckCircle } from 'lucide-react';
import { ProjectForm, ProjectFormData } from '@/components/comparables/ProjectForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type CreationStep = 'form' | 'creating' | 'searching' | 'linking' | 'done';

export default function NewProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<CreationStep>('form');
  const [progress, setProgress] = useState(0);
  const [comparablesFound, setComparablesFound] = useState(0);

  const handleSubmit = async (data: ProjectFormData) => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      // Étape 1: Création du projet
      setStep('creating');
      setProgress(20);

      // Récupérer le nom du courtier
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: newProject, error: createError } = await supabase
        .from('projects_comparables')
        .insert({
          user_id: user.id,
          courtier_name: profile?.full_name || user.email,
          project_name: data.projectName,
          communes: data.communes,
          prix_min: data.prixMin,
          prix_max: data.prixMax,
          type_bien: data.typeBien,
          surface_min: data.surfaceMin,
          surface_max: data.surfaceMax,
          pieces_min: data.piecesMin,
          pieces_max: data.piecesMax,
          statut_filter: data.statutFilter,
          last_search_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError || !newProject) {
        console.error('Error creating project:', createError);
        toast.error('Impossible de créer le projet. Réessayez.');
        setStep('form');
        return;
      }

      const projectId = newProject.id;

      // Étape 2: Recherche des comparables
      setStep('searching');
      setProgress(40);

      // Construire la requête de recherche avec ANY pour les communes
      let query = supabase
        .from('estimations')
        .select('id, localite, prix_final, type_bien, caracteristiques, statut');

      // Filtre communes avec ANY
      if (data.communes.length > 0) {
        query = query.in('localite', data.communes);
      }

      // Filtre prix
      if (data.prixMin) {
        query = query.gte('prix_final', data.prixMin);
      }
      if (data.prixMax) {
        query = query.lte('prix_final', data.prixMax);
      }

      // Filtre type de bien
      if (data.typeBien.length > 0) {
        query = query.in('type_bien', data.typeBien as any);
      }

      // Filtre statut
      if (data.statutFilter === 'vendus') {
        query = query.eq('statut', 'mandat_signe');
      } else if (data.statutFilter === 'en_vente') {
        query = query.eq('statut', 'presentee');
      }
      // 'tous' = pas de filtre statut

      const { data: comparables, error: searchError } = await query;

      if (searchError) {
        console.warn('Search error (continuing anyway):', searchError);
        toast.warning('Projet créé mais recherche échouée.');
        navigate('/comparables');
        return;
      }

      setProgress(60);

      // Filtrer côté client pour surface et pièces (JSONB)
      let filteredComparables = comparables || [];

      if (data.surfaceMin || data.surfaceMax || data.piecesMin || data.piecesMax) {
        filteredComparables = filteredComparables.filter((est) => {
          const carac = est.caracteristiques as any;
          const surface = parseFloat(carac?.surfacePPE || carac?.surfaceHabitableMaison || '0');
          const pieces = parseFloat(carac?.nombrePieces || '0');

          if (data.surfaceMin && surface < data.surfaceMin) return false;
          if (data.surfaceMax && surface > data.surfaceMax) return false;
          if (data.piecesMin && pieces < data.piecesMin) return false;
          if (data.piecesMax && pieces > data.piecesMax) return false;

          return true;
        });
      }

      setComparablesFound(filteredComparables.length);

      // Étape 3: Lier les comparables
      setStep('linking');
      setProgress(80);

      if (filteredComparables.length > 0) {
        const linksToInsert = filteredComparables.map((comparable) => ({
          project_id: projectId,
          estimation_id: comparable.id,
          selected_by_user: false,
        }));

        const { error: linkError } = await supabase
          .from('project_comparables_links')
          .insert(linksToInsert);

        if (linkError) {
          console.warn('Link error:', linkError);
          // Continue anyway, comparables can be added manually
        }
      }

      // Étape 4: Terminé
      setStep('done');
      setProgress(100);

      // Feedback
      if (filteredComparables.length > 0) {
        toast.success(`Projet "${data.projectName}" créé ! ${filteredComparables.length} comparable${filteredComparables.length > 1 ? 's' : ''} trouvé${filteredComparables.length > 1 ? 's' : ''}.`);
      } else {
        toast.warning('Aucun comparable trouvé. Modifiez vos critères ou ajoutez-en manuellement.');
      }

      // Rediriger après un court délai pour voir le feedback
      setTimeout(() => {
        navigate('/comparables');
      }, 500);

    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Une erreur inattendue est survenue.');
      setStep('form');
    }
  };

  const handleCancel = () => {
    navigate('/comparables');
  };

  // Overlay de progression
  if (step !== 'form') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-50">
          <GaryLogo className="h-6 text-primary" />
          <span className="text-sm text-muted-foreground">Création en cours...</span>
        </header>

        {/* Progress overlay */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-sm">
            {step === 'done' ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-pulse" />
            ) : (
              <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
            )}

            <div className="space-y-2">
              <p className="font-medium text-lg">
                {step === 'creating' && 'Création du projet...'}
                {step === 'searching' && '🔍 Recherche en cours...'}
                {step === 'linking' && 'Association des comparables...'}
                {step === 'done' && `✅ ${comparablesFound} comparable${comparablesFound !== 1 ? 's' : ''} trouvé${comparablesFound !== 1 ? 's' : ''} !`}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">{progress}%</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-foreground">Nouveau Projet</h1>
          <p className="text-xs text-muted-foreground">Définissez vos critères de recherche</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border rounded-xl p-6">
            <ProjectForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={step !== 'form'}
            />
          </div>

          {/* Info */}
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <Search className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Recherche automatique</p>
                <p>
                  Après création, nous rechercherons automatiquement les biens GARY 
                  correspondant à vos critères et les ajouterons au projet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
