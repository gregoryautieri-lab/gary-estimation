import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarIcon,
  Loader2,
  User,
  Users,
  AlertTriangle,
  Trash2,
  Clock,
  Route,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useMissions } from '@/hooks/useMissions';
import { useEtudiants } from '@/hooks/useEtudiants';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ZoneDrawer } from '@/components/prospection/ZoneDrawer';
import type { GeoJsonPolygon } from '@/hooks/useZoneCapture';
import type { Mission, MissionStatut } from '@/types/prospection';

const missionSchema = z.object({
  date: z.date({ required_error: 'La date est requise' }),
  assignee_type: z.enum(['etudiant', 'courtier']),
  etudiant_id: z.string().nullable(),
  courtier_id: z.string().nullable(),
  secteur_nom: z.string().nullable(),
  courriers_prevu: z.number().min(1, 'Minimum 1 courrier'),
  courriers_distribues: z.number().min(0).nullable(),
  statut: z.enum(['prevue', 'en_cours', 'terminee', 'annulee']),
  notes: z.string().nullable(),
}).refine(
  (data) => {
    if (data.assignee_type === 'etudiant') {
      return !!data.etudiant_id;
    } else {
      return !!data.courtier_id;
    }
  },
  {
    message: 'Veuillez sélectionner un assigné',
    path: ['etudiant_id'], // Will show on the relevant field
  }
);

type MissionFormValues = z.infer<typeof missionSchema>;

interface MissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campagneId: string;
  commune: string;
  secteurs?: string[] | null;
  mission?: Mission | null;
  courriersRestants?: number;
  onSuccess?: () => void;
}

export function MissionFormModal({
  open,
  onOpenChange,
  campagneId,
  commune,
  secteurs,
  mission,
  courriersRestants = 0,
  onSuccess,
}: MissionFormModalProps) {
  const { user } = useAuth();
  const { isAdmin, isResponsableProspection } = useUserRole();
  const { create, update, delete: deleteMission, isCreating, isUpdating, isDeleting } = useMissions();
  const { etudiants } = useEtudiants({ actif_only: true });

  const isEditMode = !!mission;

  // State pour stocker les données de zone capturée
  const [zoneData, setZoneData] = useState<{
    imageUrl: string | null;
    geoJson: GeoJsonPolygon | null;
  }>({
    imageUrl: null,
    geoJson: null,
  });

  // Récupérer les courtiers (profiles)
  const { data: courtiers = [] } = useQuery({
    queryKey: ['courtiers_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      date: new Date(),
      assignee_type: 'etudiant',
      etudiant_id: null,
      courtier_id: null,
      secteur_nom: null,
      courriers_prevu: 1,
      courriers_distribues: null,
      statut: 'prevue',
      notes: null,
    },
  });

  // Pré-remplir en mode édition
  useEffect(() => {
    if (mission && open) {
      const assigneeType = mission.etudiant_id ? 'etudiant' : 'courtier';
      form.reset({
        date: new Date(mission.date),
        assignee_type: assigneeType,
        etudiant_id: mission.etudiant_id || null,
        courtier_id: mission.courtier_id || null,
        secteur_nom: mission.secteur_nom || null,
        courriers_prevu: mission.courriers_prevu || 1,
        courriers_distribues: mission.courriers_distribues || null,
        statut: mission.statut,
        notes: mission.notes || null,
      });
      // Réinitialiser les données de zone
      setZoneData({ imageUrl: null, geoJson: null });
    } else if (!mission && open) {
      form.reset({
        date: new Date(),
        assignee_type: 'etudiant',
        etudiant_id: null,
        courtier_id: null,
        secteur_nom: secteurs?.[0] || null,
        courriers_prevu: Math.min(courriersRestants, 100) || 1,
        courriers_distribues: null,
        statut: 'prevue',
        notes: null,
      });
      // Réinitialiser les données de zone
      setZoneData({ imageUrl: null, geoJson: null });
    }
  }, [mission, open, form, secteurs, courriersRestants]);

  const assigneeType = form.watch('assignee_type');
  const courriersPrevu = form.watch('courriers_prevu');

  // Calculer les courriers restants disponibles (en mode édition, on rajoute ceux de la mission en cours)
  const courriersDisponibles = isEditMode
    ? courriersRestants + (mission?.courriers_prevu || 0)
    : courriersRestants;

  const isOverLimit = courriersPrevu > courriersDisponibles;

  const onSubmit = async (values: MissionFormValues) => {
    try {
      const payload: Record<string, unknown> = {
        campagne_id: campagneId,
        date: format(values.date, 'yyyy-MM-dd'),
        etudiant_id: values.assignee_type === 'etudiant' ? values.etudiant_id : null,
        courtier_id: values.assignee_type === 'courtier' ? values.courtier_id : null,
        secteur_nom: values.secteur_nom || null,
        courriers_prevu: values.courriers_prevu,
        courriers_distribues: values.courriers_distribues,
        statut: values.statut as MissionStatut,
        notes: values.notes || null,
        // Données de zone
        zone_image_url: zoneData.imageUrl || mission?.zone_image_url || null,
        zone_geojson: zoneData.geoJson || mission?.zone_geojson || null,
      };

      if (isEditMode && mission) {
        update({ id: mission.id, ...payload } as Parameters<typeof update>[0]);
      } else {
        await create(payload as Parameters<typeof create>[0]);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const handleDelete = () => {
    if (mission) {
      deleteMission(mission.id);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const isPending = isCreating || isUpdating;

  // Section Strava lecture seule (mode édition uniquement)
  const hasStravaData = mission && (mission.strava_temps || mission.strava_distance_km || mission.strava_vitesse_moy);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Empêcher la fermeture si on clique sur un élément Google Maps (portail externe)
          const target = e.target as HTMLElement;
          if (
            target.closest('.gm-style') ||
            target.closest('[class*="gm-"]') ||
            target.closest('.pac-container') ||
            document.querySelector('.gm-style')?.contains(target)
          ) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Même logique pour les interactions en dehors
          const target = e.target as HTMLElement;
          if (
            target.closest('.gm-style') ||
            target.closest('[class*="gm-"]') ||
            target.closest('.pac-container')
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier la mission' : 'Nouvelle mission'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de la mission *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: fr })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={fr}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type d'assigné */}
            <FormField
              control={form.control}
              name="assignee_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigné à *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="etudiant" id="etudiant" />
                        <Label htmlFor="etudiant" className="flex items-center gap-1 cursor-pointer">
                          <Users className="h-4 w-4" />
                          Étudiant
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="courtier" id="courtier" />
                        <Label htmlFor="courtier" className="flex items-center gap-1 cursor-pointer">
                          <User className="h-4 w-4" />
                          Courtier
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Sélection Étudiant */}
            {assigneeType === 'etudiant' && (
              <FormField
                control={form.control}
                name="etudiant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étudiant</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un étudiant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {etudiants.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.prenom} {e.nom || ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Sélection Courtier */}
            {assigneeType === 'courtier' && (
              <FormField
                control={form.control}
                name="courtier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Courtier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un courtier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courtiers.map((c) => (
                          <SelectItem key={c.user_id} value={c.user_id}>
                            {c.full_name || c.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Secteur */}
            <FormField
              control={form.control}
              name="secteur_nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secteur / Zone</FormLabel>
                  {secteurs && secteurs.length > 0 ? (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un secteur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {secteurs.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input
                        placeholder="Ex: Quartier des Eaux-Vives"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Zone à couvrir - ZoneDrawer */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Zone à couvrir</Label>
              <ZoneDrawer
                commune={commune}
                initialZone={mission?.zone_geojson as GeoJsonPolygon | null}
                missionId={mission?.id}
                readOnly={false}
                onZoneCaptured={(imageUrl, geoJson) => {
                  setZoneData({ imageUrl, geoJson });
                }}
              />
              {mission?.zone_image_url && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Image de zone actuelle :</p>
                  <img 
                    src={mission.zone_image_url} 
                    alt="Zone de la mission" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>

            {/* Courriers prévus avec avertissement */}
            <FormField
              control={form.control}
              name="courriers_prevu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Courriers prévus *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    Courriers restants à assigner : {courriersDisponibles}
                  </FormDescription>
                  {isOverLimit && (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Dépasse les courriers restants de la campagne</span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Courriers distribués (en mode édition) */}
            {isEditMode && (
              <FormField
                control={form.control}
                name="courriers_distribues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Courriers distribués</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Statut */}
            <FormField
              control={form.control}
              name="statut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="prevue">Prévue</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="terminee">Terminée</SelectItem>
                      <SelectItem value="annulee">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Section Strava lecture seule (mode édition uniquement) */}
            {isEditMode && hasStravaData && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Route className="h-4 w-4" />
                      Données Strava
                    </Label>
                    {mission.strava_validated ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Validé
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Non validé
                      </Badge>
                    )}
                  </div>
                  <Card>
                    <CardContent className="p-3 grid grid-cols-3 gap-3 text-center">
                      {mission.strava_temps && (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">Temps</span>
                          </div>
                          <p className="font-medium">{mission.strava_temps}</p>
                        </div>
                      )}
                      {mission.strava_distance_km && (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Route className="h-3 w-3" />
                            <span className="text-xs">Distance</span>
                          </div>
                          <p className="font-medium">{mission.strava_distance_km} km</p>
                        </div>
                      )}
                      {mission.strava_vitesse_moy && (
                        <div>
                          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                            <Gauge className="h-3 w-3" />
                            <span className="text-xs">Vitesse</span>
                          </div>
                          <p className="font-medium">{mission.strava_vitesse_moy} km/h</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  {mission.strava_screenshot_url && (
                    <a
                      href={mission.strava_screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={mission.strava_screenshot_url}
                        alt="Screenshot Strava"
                        className="w-full rounded-lg border"
                      />
                    </a>
                  )}
                </div>
              </>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notes sur la mission..."
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Boutons */}
            <div className="flex justify-between pt-4">
              {/* Bouton Supprimer (mode édition) */}
              {isEditMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer cette mission ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. La mission sera définitivement supprimée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
