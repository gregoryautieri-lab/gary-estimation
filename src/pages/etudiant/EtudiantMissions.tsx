import { useMemo } from 'react';
import { format, isToday, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, AlertCircle, Smile, CalendarDays, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useCurrentEtudiant } from '@/hooks/useCurrentEtudiant';
import { useMissionsEtudiant } from '@/hooks/useMissionsEtudiant';
import { MissionCard } from '@/components/etudiant/MissionCard';
import { EtudiantNav } from '@/components/etudiant/EtudiantNav';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Mission } from '@/types/prospection';

// Hook pour récupérer les infos de campagne pour chaque mission
function useCampagnesInfo(missions: Mission[]) {
  const campagneIds = [...new Set(missions.map(m => m.campagne_id))];

  return useQuery({
    queryKey: ['campagnes_info', campagneIds],
    queryFn: async () => {
      if (campagneIds.length === 0) return {};

      const { data, error } = await supabase
        .from('campagnes')
        .select('id, code, commune')
        .in('id', campagneIds);

      if (error) throw error;

      const map: Record<string, { code: string; commune: string }> = {};
      data?.forEach(c => {
        map[c.id] = { code: c.code || 'N/A', commune: c.commune };
      });
      return map;
    },
    enabled: campagneIds.length > 0,
  });
}

export default function EtudiantMissions() {
  const { data: etudiant, isLoading: loadingEtudiant, error: etudiantError } = useCurrentEtudiant();

  const {
    allMissions,
    isLoading: loadingMissions,
    error: missionsError,
    refetch,
  } = useMissionsEtudiant({
    etudiant_id: etudiant?.id || '',
  });

  const { data: campagnesInfo = {} } = useCampagnesInfo(allMissions);

  // Séparer les missions par catégorie
  const { missionsAujourdhui, missionsAVenir, missionsTerminees } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];

    const aujourdhui = allMissions.filter(m => m.date === today);
    const aVenir = allMissions
      .filter(m => m.date > today && m.statut === 'prevue')
      .sort((a, b) => a.date.localeCompare(b.date));
    const terminees = allMissions
      .filter(m => m.statut === 'terminee' && m.date >= thirtyDaysAgo)
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      missionsAujourdhui: aujourdhui,
      missionsAVenir: aVenir,
      missionsTerminees: terminees,
    };
  }, [allMissions]);

  const isLoading = loadingEtudiant || loadingMissions;
  const error = etudiantError || missionsError;

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-36" />
          <div className="space-y-3 mt-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <EtudiantNav />
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-sm text-muted-foreground">
              Erreur lors du chargement des missions
            </p>
            <Button onClick={() => refetch()}>Réessayer</Button>
          </CardContent>
        </Card>
        <EtudiantNav />
      </div>
    );
  }

  // Pas d'étudiant trouvé
  if (!etudiant) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Votre compte n'est pas encore lié à un profil étudiant.
              Contactez votre responsable.
            </p>
          </CardContent>
        </Card>
        <EtudiantNav />
      </div>
    );
  }

  const aujourdhuiLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const aujourdhuiCapitalized = aujourdhuiLabel.charAt(0).toUpperCase() + aujourdhuiLabel.slice(1);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold">Bonjour {etudiant.prenom} !</h1>
        <p className="text-primary-foreground/80 flex items-center gap-2 mt-1">
          <CalendarDays className="h-4 w-4" />
          {aujourdhuiCapitalized}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Missions du jour */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Missions du jour</h2>
          {missionsAujourdhui.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Smile className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Pas de mission prévue aujourd'hui.
                  <br />
                  Profitez de votre journée !
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {missionsAujourdhui.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  campagneCode={campagnesInfo[mission.campagne_id]?.code}
                  commune={campagnesInfo[mission.campagne_id]?.commune}
                />
              ))}
            </div>
          )}
        </section>

        {/* Missions à venir */}
        {missionsAVenir.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Missions à venir</h2>
            <div className="space-y-3">
              {missionsAVenir.map(mission => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  campagneCode={campagnesInfo[mission.campagne_id]?.code}
                  commune={campagnesInfo[mission.campagne_id]?.commune}
                />
              ))}
            </div>
          </section>
        )}

        {/* Missions terminées (accordéon) */}
        {missionsTerminees.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="terminees" className="border-none">
              <AccordionTrigger className="text-lg font-semibold py-0 hover:no-underline">
                Missions terminées ({missionsTerminees.length})
              </AccordionTrigger>
              <AccordionContent className="pt-3">
                <div className="space-y-3">
                  {missionsTerminees.map(mission => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      campagneCode={campagnesInfo[mission.campagne_id]?.code}
                      commune={campagnesInfo[mission.campagne_id]?.commune}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Aucune mission */}
        {allMissions.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Aucune mission pour le moment.
                <br />
                Votre responsable vous en assignera bientôt !
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <EtudiantNav />
    </div>
  );
}
