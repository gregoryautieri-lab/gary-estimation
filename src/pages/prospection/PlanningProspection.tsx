import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Mail, ClipboardList, Plus, ArrowLeft, LayoutGrid, List, CheckCircle2, CalendarDays, HelpCircle, Download } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { usePlanningMissions, type PlanningMission } from '@/hooks/usePlanningMissions';
import { useProspectionAlertes } from '@/hooks/useProspectionAlertes';
import { MissionPlanningCard } from '@/components/prospection/MissionPlanningCard';
import { AlertesProspection } from '@/components/prospection/AlertesProspection';
import { CreateMissionModal } from '@/components/prospection/CreateMissionModal';
import { MissionFormModal } from '@/components/prospection/MissionFormModal';
import { exportToExcel, type MissionExportRow } from '@/utils/exportExcel';
import type { Mission } from '@/types/prospection';

const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function PlanningProspection() {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 })
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grille' | 'liste'>('grille');
  const [selectedMission, setSelectedMission] = useState<PlanningMission | null>(null);

  const { data: missions = [], isLoading, refetch } = usePlanningMissions({ weekStart: currentWeekStart });
  const { data: alertes = [], isLoading: alertesLoading } = useProspectionAlertes();

  // Générer les 7 jours de la semaine
  const joursSemaine = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Grouper les missions par jour
  const missionsByDay = useMemo(() => {
    const grouped: Record<string, PlanningMission[]> = {};
    joursSemaine.forEach(jour => {
      const key = format(jour, 'yyyy-MM-dd');
      grouped[key] = [];
    });
    missions.forEach(mission => {
      if (grouped[mission.date]) {
        grouped[mission.date].push(mission);
      }
    });
    return grouped;
  }, [missions, joursSemaine]);

  // Calculs résumé
  const totalMissions = missions.length;
  const totalCourriers = missions.reduce((acc, m) => acc + m.courriers_prevu, 0);
  const totalDistribues = missions.reduce((acc, m) => acc + (m.courriers_distribues || 0), 0);

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 }));
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const weekLabel = useMemo(() => {
    const debut = format(currentWeekStart, 'd MMM', { locale: fr });
    const fin = format(addDays(currentWeekStart, 6), 'd MMM yyyy', { locale: fr });
    return `${debut} - ${fin}`;
  }, [currentWeekStart]);

  // Fonction d'export des missions
  const handleExportMissions = () => {
    if (missions.length === 0) {
      toast.error('Aucune mission à exporter');
      return;
    }

    const exportData: MissionExportRow[] = missions.map((m) => {
      const assigneName = m.etudiant 
        ? `${m.etudiant.prenom} ${m.etudiant.nom || ''}`.trim()
        : m.courtier_id ? 'Courtier' : 'Non assigné';
      const typeAssigne = m.etudiant_id ? 'Étudiant' : m.courtier_id ? 'Courtier' : '-';
      
      return {
        'Code campagne': m.campagne?.code || '-',
        'Date': m.date ? format(new Date(m.date), 'dd.MM.yyyy') : '-',
        'Commune': m.campagne?.commune || '-',
        'Secteur': m.secteur_nom || '-',
        'Assigné à': assigneName,
        'Type assigné': typeAssigne,
        'Statut': m.statut === 'terminee' ? 'Terminée' : m.statut === 'en_cours' ? 'En cours' : m.statut === 'annulee' ? 'Annulée' : 'Prévue',
        'Courriers prévus': m.courriers_prevu,
        'Courriers distribués': m.courriers_distribues || 0,
        'Temps Strava': '-', // Non disponible dans la vue planning
        'Distance (km)': '-',
        'Vitesse moy (km/h)': '-',
        'Validation Strava': '-',
      };
    });

    exportToExcel(exportData, 'prospection-missions', 'Missions');
    toast.success(`${missions.length} mission(s) exportée(s)`);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="container max-w-7xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/campagnes')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Calendar className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Planning Prospection</h1>
              </div>

              {/* Toggle vue + Navigation semaine + bouton nouvelle mission */}
              <div className="flex items-center gap-2">
                {/* Bouton Export */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportMissions}
                  disabled={missions.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === 'grille' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grille')}
                    className="rounded-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'liste' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('liste')}
                    className="rounded-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => setModalOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle mission
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday} className="min-w-[140px]">
                    {weekLabel}
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-7xl mx-auto px-4 py-6">
          {/* Alertes */}
          <AlertesProspection alertes={alertes} isLoading={alertesLoading} />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {/* Vue Grille */}
              {viewMode === 'grille' && (
                <>
                  {/* Grille desktop */}
                  <div className="hidden md:grid grid-cols-7 gap-3 mb-6">
                    {joursSemaine.map((jour, index) => {
                      const dateKey = format(jour, 'yyyy-MM-dd');
                      const dayMissions = missionsByDay[dateKey] || [];
                      const isAujourdhui = isToday(jour);

                      return (
                        <div key={dateKey} className="flex flex-col">
                          <div className={`text-center py-2 rounded-t-lg font-medium text-sm ${
                            isAujourdhui 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <div>{JOURS_SEMAINE[index]}</div>
                            <div className="text-xs">{format(jour, 'd MMM', { locale: fr })}</div>
                          </div>
                          <div className={`flex-1 min-h-[200px] p-2 space-y-2 rounded-b-lg border border-t-0 ${
                            isAujourdhui ? 'bg-primary/5' : 'bg-card'
                          }`}>
                            {dayMissions.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                Aucune mission
                              </p>
                            ) : (
                              dayMissions.map(mission => (
                                <MissionPlanningCard 
                                  key={mission.id} 
                                  mission={mission} 
                                  onClick={() => setSelectedMission(mission)}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Liste mobile (en mode grille) */}
                  <div className="md:hidden space-y-4 mb-6">
                    {joursSemaine.map((jour, index) => {
                      const dateKey = format(jour, 'yyyy-MM-dd');
                      const dayMissions = missionsByDay[dateKey] || [];
                      const isAujourdhui = isToday(jour);

                      return (
                        <div key={dateKey}>
                          <div className={`py-2 px-3 rounded-t-lg font-medium text-sm flex items-center justify-between ${
                            isAujourdhui 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <span>{JOURS_SEMAINE[index]} {format(jour, 'd MMM', { locale: fr })}</span>
                            <span className="text-xs">{dayMissions.length} mission{dayMissions.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className={`p-2 space-y-2 rounded-b-lg border border-t-0 ${
                            isAujourdhui ? 'bg-primary/5' : 'bg-card'
                          }`}>
                            {dayMissions.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                Aucune mission
                              </p>
                            ) : (
                              dayMissions.map(mission => (
                                <MissionPlanningCard 
                                  key={mission.id} 
                                  mission={mission} 
                                  onClick={() => setSelectedMission(mission)}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Vue Liste */}
              {viewMode === 'liste' && (
                <div className="space-y-4 mb-6">
                  {joursSemaine.map((jour, index) => {
                    const dateKey = format(jour, 'yyyy-MM-dd');
                    const dayMissions = missionsByDay[dateKey] || [];
                    const isAujourdhui = isToday(jour);

                    return (
                      <div key={dateKey}>
                        <div className={`py-2 px-4 rounded-t-lg font-medium text-sm flex items-center justify-between ${
                          isAujourdhui 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <span className="uppercase">{JOURS_SEMAINE[index]} {format(jour, 'd MMM', { locale: fr })}</span>
                          <span className="text-xs">{dayMissions.length} mission{dayMissions.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className={`rounded-b-lg border border-t-0 divide-y ${
                          isAujourdhui ? 'bg-primary/5' : 'bg-card'
                        }`}>
                          {dayMissions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4 italic">
                              Aucune mission
                            </p>
                          ) : (
                            dayMissions.map(mission => {
                              const isTerminee = mission.statut === 'terminee';
                              const isNonAssigne = !mission.etudiant_id && !mission.courtier_id;
                              const assigneName = mission.etudiant 
                                ? `${mission.etudiant.prenom} ${mission.etudiant.nom?.[0] || ''}.`
                                : isNonAssigne ? 'Non assigné' : 'Courtier';

                              return (
                                <div 
                                  key={mission.id}
                                  className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 cursor-pointer"
                                  onClick={() => setSelectedMission(mission)}
                                >
                                  <div className="flex items-center gap-3">
                                    {isTerminee ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    ) : isNonAssigne ? (
                                      <HelpCircle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                                    ) : (
                                      <CalendarDays className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                    )}
                                    <div>
                                      <p className={`font-medium ${isNonAssigne ? 'text-muted-foreground italic' : ''}`}>
                                        {assigneName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {mission.campagne?.commune} · {isTerminee 
                                          ? `${mission.courriers_distribues || 0}/${mission.courriers_prevu}` 
                                          : `${mission.courriers_prevu}`} courriers
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    mission.statut === 'terminee' ? 'bg-green-100 text-green-800' :
                                    mission.statut === 'en_cours' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {mission.statut === 'terminee' ? 'Terminée' :
                                     mission.statut === 'en_cours' ? 'En cours' : 'Prévue'}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Résumé */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Résumé de la semaine</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalMissions}</p>
                        <p className="text-xs text-muted-foreground">Mission{totalMissions !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        <Mail className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalCourriers}</p>
                        <p className="text-xs text-muted-foreground">Courriers prévus</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/20">
                        <Mail className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{totalDistribues}</p>
                        <p className="text-xs text-muted-foreground">Distribués</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Modal création mission */}
      <CreateMissionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => refetch()}
      />

      {/* Modal édition mission */}
      {selectedMission && selectedMission.campagne && (
        <MissionFormModal
          open={!!selectedMission}
          onOpenChange={(open) => !open && setSelectedMission(null)}
          campagneId={selectedMission.campagne.id}
          commune={selectedMission.campagne.commune}
          mission={selectedMission as unknown as Mission}
          onSuccess={() => { 
            setSelectedMission(null); 
            refetch(); 
          }}
        />
      )}
    </>
  );
}
