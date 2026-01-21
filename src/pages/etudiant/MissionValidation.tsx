import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Mail, 
  Navigation, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { StravaUploader } from '@/components/etudiant/StravaUploader';
import { EtudiantNav } from '@/components/etudiant/EtudiantNav';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Mission, StravaData, MissionStatut } from '@/types/prospection';
import { MISSION_STATUT_LABELS, MISSION_STATUT_COLORS } from '@/types/prospection';
import { cn } from '@/lib/utils';

interface MissionWithCampagne extends Omit<Mission, 'campagne'> {
  campagne?: {
    code: string;
    commune: string;
  } | null;
}

export default function MissionValidation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [stravaData, setStravaData] = useState<StravaData | null>(null);
  const [courriersDistribues, setCourriersDistribues] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Fetch mission with campagne info
  const { data: mission, isLoading, error } = useQuery({
    queryKey: ['mission', id],
    queryFn: async (): Promise<MissionWithCampagne | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          campagne:campagnes(code, commune)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as MissionWithCampagne;
    },
    enabled: !!id,
  });

  // Init form values when mission loads
  useEffect(() => {
    if (mission) {
      setCourriersDistribues(mission.courriers_distribues?.toString() || '');
      setNotes(mission.notes || '');
      
      if (mission.strava_temps || mission.strava_distance_km) {
        setStravaData({
          temps: mission.strava_temps || undefined,
          distance_km: mission.strava_distance_km || undefined,
          vitesse_moy: mission.strava_vitesse_moy || undefined,
        });
      }
    }
  }, [mission]);

  // Mutation to complete mission
  const completeMission = useMutation({
    mutationFn: async () => {
      if (!id || !stravaData) throw new Error('Données manquantes');

      let screenshotUrl = mission?.strava_screenshot_url;

      // Upload screenshot if new file
      if (uploadedFile) {
        const fileName = `${id}/${Date.now()}-strava.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('prospection')
          .upload(fileName, uploadedFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from('prospection')
          .getPublicUrl(fileName);

        screenshotUrl = publicUrl.publicUrl;
      }

      const updateData: Partial<Mission> = {
        strava_temps: stravaData.temps,
        strava_distance_km: stravaData.distance_km,
        strava_vitesse_moy: stravaData.vitesse_moy || stravaData.vitesse_moy_kmh,
        strava_screenshot_url: screenshotUrl,
        courriers_distribues: parseInt(courriersDistribues) || 0,
        notes: notes || null,
        statut: 'terminee' as MissionStatut,
      };

      const { error } = await supabase
        .from('missions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      queryClient.invalidateQueries({ queryKey: ['missions_etudiant'] });
      toast.success('Mission terminée avec succès !');
      navigate('/etudiant/missions');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Save partial progress
  const saveProgress = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID manquant');

      const updateData: Partial<Mission> = {
        courriers_distribues: parseInt(courriersDistribues) || null,
        notes: notes || null,
      };

      if (stravaData) {
        updateData.strava_temps = stravaData.temps;
        updateData.strava_distance_km = stravaData.distance_km;
        updateData.strava_vitesse_moy = stravaData.vitesse_moy || stravaData.vitesse_moy_kmh;
      }

      const { error } = await supabase
        .from('missions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      toast.success('Progression sauvegardée');
    },
  });

  const handleStravaDataExtracted = (data: StravaData) => {
    setStravaData(data);
  };

  const openInMaps = () => {
    if (mission?.campagne?.commune) {
      const query = encodeURIComponent(`${mission.secteur_nom || ''} ${mission.campagne.commune}, Suisse`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const isCompleted = mission?.statut === 'terminee';
  const canComplete = !!stravaData && !isCompleted;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Card className="max-w-sm mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="font-medium">Mission introuvable</p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => navigate('/etudiant/missions')}
            >
              Retour aux missions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/etudiant/missions')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">
              {mission.campagne?.code || 'Mission'}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {mission.secteur_nom || mission.campagne?.commune}
            </p>
          </div>
          <Badge className={cn(
            "flex-shrink-0",
            MISSION_STATUT_COLORS[mission.statut]
          )}>
            {MISSION_STATUT_LABELS[mission.statut]}
          </Badge>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Zone Image */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Zone à couvrir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mission.zone_image_url ? (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img 
                  src={mission.zone_image_url} 
                  alt="Zone de distribution"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Pas d'image de zone</p>
                </div>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={openInMaps}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Ouvrir dans Maps
            </Button>
          </CardContent>
        </Card>

        {/* Mission Info */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(mission.date), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{mission.courriers_prevu} courriers prévus</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strava Upload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Validation Strava
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StravaUploader
              onDataExtracted={handleStravaDataExtracted}
              initialData={stravaData}
              disabled={isCompleted}
              screenshotUrl={mission.strava_screenshot_url}
            />
          </CardContent>
        </Card>

        {/* Courriers distribués */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Courriers distribués
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="courriers">Nombre de courriers distribués</Label>
              <Input
                id="courriers"
                type="number"
                value={courriersDistribues}
                onChange={(e) => setCourriersDistribues(e.target.value)}
                placeholder={`Sur ${mission.courriers_prevu} prévus`}
                disabled={isCompleted}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarques sur la distribution..."
                disabled={isCompleted}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Completed Badge */}
        {isCompleted && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-xl text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Mission terminée</span>
          </div>
        )}
      </main>

      {/* Sticky Bottom Actions */}
      {!isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t space-y-2">
          <Button
            className="w-full h-12"
            disabled={!canComplete || completeMission.isPending}
            onClick={() => completeMission.mutate()}
          >
            {completeMission.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Terminer la mission
              </>
            )}
          </Button>
          
          {!stravaData && (
            <p className="text-xs text-center text-muted-foreground">
              Ajoutez votre screenshot Strava pour terminer la mission
            </p>
          )}
          
          {stravaData && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => saveProgress.mutate()}
              disabled={saveProgress.isPending}
            >
              {saveProgress.isPending ? 'Sauvegarde...' : 'Sauvegarder le progrès'}
            </Button>
          )}
        </div>
      )}

      <EtudiantNav />
    </div>
  );
}
