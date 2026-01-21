import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  Edit,
  MoreVertical,
  User,
  MapPin,
  Building2,
  FileText,
  Calendar,
  Link as LinkIcon,
  QrCode,
  Download,
  TrendingUp,
  Mail,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  BarChart3,
  Target,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCampagneDetail } from '@/hooks/useCampagneDetail';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { CampagneFormModal } from '@/components/prospection/CampagneFormModal';
import { MissionFormModal } from '@/components/prospection/MissionFormModal';
import { BottomNav } from '@/components/gary/BottomNav';
import {
  CAMPAGNE_STATUT_LABELS,
  CAMPAGNE_STATUT_COLORS,
  MISSION_STATUT_LABELS,
  MISSION_STATUT_COLORS,
  TYPE_BIEN_PROSPECTION_LABELS,
  type CampagneStatut,
  type Mission,
} from '@/types/prospection';

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MissionCard({
  mission,
  onClick,
}: {
  mission: Mission & { etudiant_name?: string | null; courtier_name?: string | null };
  onClick: () => void;
}) {
  const assigneeName = mission.etudiant_name || mission.courtier_name || 'Non assigné';
  const initials = assigneeName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{assigneeName}</p>
              {mission.strava_validated ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : mission.strava_screenshot_url ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(mission.date), 'dd MMM yyyy', { locale: fr })}
              {mission.secteur_nom && (
                <>
                  <span>•</span>
                  <span className="truncate">{mission.secteur_nom}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={MISSION_STATUT_COLORS[mission.statut]}>
              {MISSION_STATUT_LABELS[mission.statut]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {mission.courriers_distribues ?? 0} / {mission.courriers_prevu}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}

export default function CampagneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isResponsableProspection, isBackOffice } = useUserRole();

  const { campagne, missions, support, isLoading, error, refetch, updateStatut } =
    useCampagneDetail(id);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // Vérifier les permissions
  const canEdit =
    campagne &&
    (campagne.courtier_id === user?.id || isAdmin || isResponsableProspection) &&
    !isBackOffice;

  // Calculer les statistiques
  const courriersDistribues = missions
    .filter((m) => m.statut === 'terminee')
    .reduce((sum, m) => sum + (m.courriers_distribues || 0), 0);

  const courriersAssignes = missions.reduce((sum, m) => sum + (m.courriers_prevu || 0), 0);
  const courriersRestants = (campagne?.nb_courriers || 0) - courriersAssignes;

  const stats = {
    scans: campagne?.scans_count || 0,
    courriersDistribues,
    courriersAssignes,
    courriersRestants,
    prospects: campagne?.nb_prospects || 0,
    estimations: campagne?.nb_estimations || 0,
    mandats: campagne?.nb_mandats || 0,
    coutParScan:
      campagne?.scans_count && campagne.scans_count > 0
        ? ((campagne.cout_total || 0) / campagne.scans_count).toFixed(2)
        : null,
    tauxScanProspect:
      campagne?.scans_count && campagne.scans_count > 0
        ? (((campagne.nb_prospects || 0) / campagne.scans_count) * 100).toFixed(1)
        : null,
    tauxProspectEstimation:
      campagne?.nb_prospects && campagne.nb_prospects > 0
        ? (((campagne.nb_estimations || 0) / campagne.nb_prospects) * 100).toFixed(1)
        : null,
  };

  const handleStatutChange = (newStatut: CampagneStatut) => {
    updateStatut(newStatut);
  };

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setShowMissionModal(true);
  };

  const handleAddMission = () => {
    setSelectedMission(null);
    setShowMissionModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <LoadingSkeleton />
        <BottomNav />
      </div>
    );
  }

  if (error || !campagne) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            {error ? 'Erreur lors du chargement' : 'Campagne non trouvée'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/campagnes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            {error && (
              <Button onClick={() => refetch()}>Réessayer</Button>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/campagnes')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{campagne.code || 'Campagne'}</h1>
              <Badge className={CAMPAGNE_STATUT_COLORS[campagne.statut]}>
                {CAMPAGNE_STATUT_LABELS[campagne.statut]}
              </Badge>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Modifier
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleStatutChange('brouillon')}
                    disabled={campagne.statut === 'brouillon'}
                  >
                    Passer en brouillon
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatutChange('planifiee')}
                    disabled={campagne.statut === 'planifiee'}
                  >
                    Passer en planifiée
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatutChange('en_cours')}
                    disabled={campagne.statut === 'en_cours'}
                  >
                    Passer en cours
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatutChange('terminee')}
                    disabled={campagne.statut === 'terminee'}
                  >
                    Terminer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* Contenu principal avec onglets */}
      <Tabs defaultValue="infos" className="p-4">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="infos">Infos</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="qr">QR</TabsTrigger>
          <TabsTrigger value="missions">
            Missions ({missions.length})
          </TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="infos" className="space-y-4 mt-4">
          {/* Courtier */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {campagne.courtier_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {campagne.courtier_name || 'Courtier inconnu'}
                  </p>
                  {campagne.courtier_email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {campagne.courtier_email}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Détails de la campagne</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{campagne.commune}</p>
                  {campagne.secteurs && campagne.secteurs.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Secteurs: {campagne.secteurs.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p>{TYPE_BIEN_PROSPECTION_LABELS[campagne.type_bien]}</p>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p>{support?.nom || 'Support inconnu'}</p>
                  <p className="text-sm text-muted-foreground">
                    {campagne.nb_courriers} courriers • {campagne.nb_flyers} flyers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold">
                  CHF {Number(campagne.cout_total || 0).toLocaleString('fr-CH')}
                </p>
              </div>

              {(campagne.date_debut || campagne.date_fin) && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p>
                    {campagne.date_debut &&
                      format(new Date(campagne.date_debut), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    {campagne.date_fin && (
                      <>
                        {' → '}
                        {format(new Date(campagne.date_fin), 'dd MMM yyyy', {
                          locale: fr,
                        })}
                      </>
                    )}
                  </p>
                </div>
              )}

              {campagne.qr_destination_url && (
                <div className="flex items-center gap-3">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={campagne.qr_destination_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {campagne.qr_destination_url}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {campagne.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {campagne.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Statistiques */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={QrCode}
              label="Scans QR"
              value={stats.scans}
              subValue={stats.coutParScan ? `CHF ${stats.coutParScan}/scan` : undefined}
            />
            <StatCard
              icon={Mail}
              label="Courriers"
              value={`${stats.courriersDistribues}/${stats.courriersAssignes}`}
              subValue={stats.courriersRestants > 0 ? `${stats.courriersRestants} restants` : undefined}
            />
            <StatCard
              icon={Users}
              label="Prospects"
              value={stats.prospects}
              subValue={stats.tauxScanProspect ? `${stats.tauxScanProspect}% des scans` : undefined}
            />
            <StatCard
              icon={Target}
              label="Estimations"
              value={stats.estimations}
              subValue={
                stats.tauxProspectEstimation
                  ? `${stats.tauxProspectEstimation}% des prospects`
                  : undefined
              }
            />
            <StatCard
              icon={TrendingUp}
              label="Mandats"
              value={stats.mandats}
              className="col-span-2"
            />
          </div>

          {/* Placeholder pour graphique */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Évolution des scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                Graphique disponible après intégration Uniqode
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet QR Code */}
        <TabsContent value="qr" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code de la campagne
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campagne.qr_image_url ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={campagne.qr_image_url}
                      alt="QR Code"
                      className="w-48 h-48 border rounded-lg"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button asChild>
                      <a
                        href={campagne.qr_image_url}
                        download={`qr-${campagne.code}.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Télécharger en HD
                      </a>
                    </Button>
                  </div>
                  {campagne.uniqode_id && (
                    <p className="text-xs text-center text-muted-foreground">
                      ID Uniqode: {campagne.uniqode_id}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-48 h-48 mx-auto border-2 border-dashed rounded-lg flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Le QR code sera généré après configuration de Uniqode
                  </p>
                  <Button disabled variant="outline">
                    Générer le QR
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Missions */}
        <TabsContent value="missions" className="space-y-4 mt-4">
          {canEdit && (
            <Button onClick={handleAddMission} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une mission
            </Button>
          )}

          {missions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucune mission pour cette campagne
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => handleMissionClick(mission)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CampagneFormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        campagne={campagne}
        onSuccess={refetch}
      />

      <MissionFormModal
        open={showMissionModal}
        onOpenChange={setShowMissionModal}
        campagneId={campagne.id}
        secteurs={campagne.secteurs}
        mission={selectedMission}
        courriersRestants={stats.courriersRestants}
        onSuccess={refetch}
      />

      <BottomNav />
    </div>
  );
}
