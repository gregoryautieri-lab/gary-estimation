import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSupportsProspection } from '@/hooks/useSupportsProspection';
import { useUniqode } from '@/hooks/useUniqode';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { COMMUNES_GENEVE } from '@/constants/communesGeneve';
import type { Campagne, TypeBienProspection } from '@/types/prospection';

// ============ SCHEMA ZOD ============

const campagneSchema = z.object({
  courtier_id: z.string().min(1, 'Le courtier est obligatoire'),
  commune: z.string().min(1, 'La commune est obligatoire'),
  type_bien: z.enum(['PPE', 'Villa', 'Mixte'] as const, {
    required_error: 'Le type de bien est obligatoire',
  }),
  support_id: z.string().min(1, 'Le support est obligatoire'),
  nb_courriers: z.number().min(0, 'Minimum 0'),
  nb_flyers: z.number().min(0, 'Minimum 0'),
  cout_unitaire_courrier: z.number().min(0, 'Minimum 0'),
  cout_unitaire_flyer: z.number().min(0, 'Minimum 0'),
  date_debut: z.date().nullable(),
  qr_destination_url: z.string().url('URL invalide').or(z.literal('')).optional(),
  notes: z.string().optional(),
});

type CampagneFormValues = z.infer<typeof campagneSchema>;

// ============ PROPS ============

interface CampagneFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campagne?: Campagne | null;
  onSuccess?: () => void;
}

// ============ COMPONENT ============

export function CampagneFormModal({ open, onOpenChange, campagne, onSuccess }: CampagneFormModalProps) {
  const { user } = useAuth();
  const { isAdmin, isResponsableProspection, isBackOffice } = useUserRole();
  const { supports, isLoading: supportsLoading } = useSupportsProspection();
  const { createQRCode, isCreating: isCreatingQR } = useUniqode();
  const queryClient = useQueryClient();

  const isEditMode = !!campagne;
  const canViewAll = isAdmin || isResponsableProspection;

  // State pour la date de fin calculée (dimanche de la semaine)
  const [dateFin, setDateFin] = useState<Date | null>(null);

  // Vérifier les permissions
  const canEdit = useMemo(() => {
    if (!campagne) return true; // Création
    if (isAdmin || isResponsableProspection) return true;
    return campagne.courtier_id === user?.id;
  }, [campagne, isAdmin, isResponsableProspection, user?.id]);

  // Récupérer les courtiers (profiles)
  const { data: courtiers = [], isLoading: courtiersLoading } = useQuery({
    queryKey: ['courtiers_profiles_form'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  // Form
  const form = useForm<CampagneFormValues>({
    resolver: zodResolver(campagneSchema),
    defaultValues: {
      courtier_id: '',
      commune: '',
      type_bien: 'Mixte',
      support_id: '',
      nb_courriers: 0,
      nb_flyers: 0,
      cout_unitaire_courrier: 0,
      cout_unitaire_flyer: 0.09,
      date_debut: null,
      qr_destination_url: '',
      notes: '',
    },
  });

  const { watch, setValue, control, handleSubmit, reset, formState: { errors } } = form;

  // Watch values for calculations
  const supportId = watch('support_id');
  const nbCourriers = watch('nb_courriers');
  const nbFlyers = watch('nb_flyers');
  const coutUnitaireCourrier = watch('cout_unitaire_courrier');
  const coutUnitaireFlyer = watch('cout_unitaire_flyer');

  // Auto-update cout_unitaire_courrier quand le support change (uniquement en mode création)
  useEffect(() => {
    if (supportId && !isEditMode) {
      const selectedSupport = supports.find(s => s.id === supportId);
      if (selectedSupport) {
        setValue('cout_unitaire_courrier', selectedSupport.tarif_unitaire);
      }
    }
  }, [supportId, supports, setValue, isEditMode]);

  // Pré-remplir le formulaire
  useEffect(() => {
    if (open) {
      if (campagne) {
        // Mode édition
        const dateDebutEdit = campagne.date_debut ? new Date(campagne.date_debut) : null;
        reset({
          courtier_id: campagne.courtier_id,
          commune: campagne.commune,
          type_bien: campagne.type_bien,
          support_id: campagne.support_id,
          nb_courriers: campagne.nb_courriers,
          nb_flyers: campagne.nb_flyers,
          cout_unitaire_courrier: campagne.cout_unitaire_courrier ?? 0,
          cout_unitaire_flyer: campagne.cout_unitaire_flyer,
          date_debut: dateDebutEdit,
          qr_destination_url: campagne.qr_destination_url || '',
          notes: campagne.notes || '',
        });
        // Initialiser dateFin depuis la campagne ou recalculer
        if (campagne.date_fin) {
          setDateFin(new Date(campagne.date_fin));
        } else if (dateDebutEdit) {
          setDateFin(endOfWeek(dateDebutEdit, { weekStartsOn: 1 }));
        } else {
          setDateFin(null);
        }
      } else {
        // Mode création
        reset({
          courtier_id: canViewAll ? '' : user?.id || '',
          commune: '',
          type_bien: 'Mixte',
          support_id: '',
          nb_courriers: 0,
          nb_flyers: 0,
          cout_unitaire_courrier: 0,
          cout_unitaire_flyer: 0.09,
          date_debut: null,
          qr_destination_url: '',
          notes: '',
        });
        setDateFin(null);
      }
    }
  }, [open, campagne, reset, user?.id, canViewAll]);

  // Fonction pour gérer la sélection de date (calcul auto lundi/dimanche)
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setValue('date_debut', null);
      setDateFin(null);
      return;
    }
    // Calculer le lundi de la semaine
    const lundi = startOfWeek(selectedDate, { weekStartsOn: 1 });
    // Calculer le dimanche
    const dimanche = endOfWeek(selectedDate, { weekStartsOn: 1 });
    
    setValue('date_debut', lundi);
    setDateFin(dimanche);
  };

  // Calcul du coût total en temps réel
  const coutTotal = useMemo(() => {
    const courriers = (nbCourriers || 0) * (coutUnitaireCourrier || 0);
    const flyers = (nbFlyers || 0) * (coutUnitaireFlyer || 0);
    return courriers + flyers;
  }, [nbCourriers, nbFlyers, coutUnitaireCourrier, coutUnitaireFlyer]);

  // Mutation création
  const createMutation = useMutation({
    mutationFn: async (data: CampagneFormValues) => {
      const payload = {
        courtier_id: data.courtier_id,
        commune: data.commune,
        type_bien: data.type_bien,
        support_id: data.support_id,
        nb_courriers: data.nb_courriers,
        nb_flyers: data.nb_flyers,
        cout_unitaire_courrier: data.cout_unitaire_courrier,
        cout_unitaire_flyer: data.cout_unitaire_flyer,
        cout_total: coutTotal,
        date_debut: data.date_debut ? format(data.date_debut, 'yyyy-MM-dd') : null,
        date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : null,
        qr_destination_url: data.qr_destination_url || null,
        notes: data.notes || null,
        statut: 'brouillon' as const,
      };

      const { data: result, error } = await supabase
        .from('campagnes')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      
      // Generate QR code if destination URL is provided
      if (data.qr_destination_url && result.code) {
        try {
          const qrResult = await createQRCode(result.code, data.qr_destination_url);
          
          if (qrResult.success && qrResult.uniqodeId) {
            // Update campagne with QR data
            await supabase
              .from('campagnes')
              .update({
                uniqode_id: qrResult.uniqodeId,
                qr_image_url: qrResult.qrImageUrl,
              })
              .eq('id', result.id);
            
            toast.success('QR code généré avec succès');
          } else {
            toast.warning('Campagne créée mais QR non généré: ' + (qrResult.error || 'Erreur inconnue'));
          }
        } catch (qrError) {
          console.error('Error generating QR:', qrError);
          toast.warning('Campagne créée mais erreur lors de la génération du QR');
        }
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campagnes'] });
      toast.success('Campagne créée avec succès');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Mutation modification
  const updateMutation = useMutation({
    mutationFn: async (data: CampagneFormValues) => {
      if (!campagne) throw new Error('Campagne non trouvée');

      const payload = {
        courtier_id: data.courtier_id,
        commune: data.commune,
        type_bien: data.type_bien,
        support_id: data.support_id,
        nb_courriers: data.nb_courriers,
        nb_flyers: data.nb_flyers,
        cout_unitaire_courrier: data.cout_unitaire_courrier,
        cout_unitaire_flyer: data.cout_unitaire_flyer,
        cout_total: coutTotal,
        date_debut: data.date_debut ? format(data.date_debut, 'yyyy-MM-dd') : null,
        date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : null,
        qr_destination_url: data.qr_destination_url || null,
        notes: data.notes || null,
      };

      const { data: result, error } = await supabase
        .from('campagnes')
        .update(payload)
        .eq('id', campagne.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campagnes'] });
      queryClient.invalidateQueries({ queryKey: ['campagne', campagne?.id] });
      queryClient.invalidateQueries({ queryKey: ['campagne_detail', campagne?.id] });
      toast.success('Campagne modifiée avec succès');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const onSubmit = (data: CampagneFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isCreatingQR;
  const isLoading = supportsLoading || courtiersLoading;

  // Si pas les permissions en édition
  if (isEditMode && !canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-muted-foreground">
              Vous n'avez pas la permission de modifier cette campagne.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Back office = lecture seule
  if (isBackOffice && !isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Accès en lecture seule. Vous ne pouvez pas créer ou modifier de campagnes.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const activeSupports = supports.filter(s => s.actif);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Courtier */}
            <div className="space-y-2">
              <Label htmlFor="courtier_id">Courtier *</Label>
              <Controller
                name="courtier_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!canViewAll && !!user?.id}
                  >
                    <SelectTrigger id="courtier_id">
                      <SelectValue placeholder="Sélectionner un courtier" />
                    </SelectTrigger>
                    <SelectContent>
                      {courtiers.map((c) => (
                        <SelectItem key={c.user_id} value={c.user_id}>
                          {c.full_name || 'Sans nom'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.courtier_id && (
                <p className="text-xs text-destructive">{errors.courtier_id.message}</p>
              )}
            </div>

            {/* Commune */}
            <div className="space-y-2">
              <Label htmlFor="commune">Commune *</Label>
              <Controller
                name="commune"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="commune">
                      <SelectValue placeholder="Sélectionner une commune" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMUNES_GENEVE.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.commune && (
                <p className="text-xs text-destructive">{errors.commune.message}</p>
              )}
            </div>

            {/* Type de bien */}
            <div className="space-y-2">
              <Label>Type de bien *</Label>
              <Controller
                name="type_bien"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as TypeBienProspection)}
                    className="flex gap-4"
                  >
                    {(['PPE', 'Villa', 'Mixte'] as const).map((type) => (
                      <div key={type} className="flex items-center gap-2">
                        <RadioGroupItem value={type} id={`type_${type}`} />
                        <Label htmlFor={`type_${type}`} className="font-normal cursor-pointer">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
              {errors.type_bien && (
                <p className="text-xs text-destructive">{errors.type_bien.message}</p>
              )}
            </div>

            {/* Support */}
            <div className="space-y-2">
              <Label htmlFor="support_id">Support de distribution *</Label>
              <Controller
                name="support_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="support_id">
                      <SelectValue placeholder="Sélectionner un support" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSupports.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nom} — {s.tarif_unitaire.toFixed(2)} CHF/unité
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.support_id && (
                <p className="text-xs text-destructive">{errors.support_id.message}</p>
              )}
            </div>

            {/* Nb courriers + Coût unitaire courrier */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nb_courriers">Nombre de courriers *</Label>
                <Controller
                  name="nb_courriers"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="nb_courriers"
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                {errors.nb_courriers && (
                  <p className="text-xs text-destructive">{errors.nb_courriers.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cout_unitaire_courrier">Coût unitaire (CHF)</Label>
                <Controller
                  name="cout_unitaire_courrier"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="cout_unitaire_courrier"
                      type="number"
                      step="0.01"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </div>
            </div>

            {/* Nb flyers + Coût unitaire flyer */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nb_flyers">Nombre de flyers</Label>
                <Controller
                  name="nb_flyers"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="nb_flyers"
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cout_unitaire_flyer">Coût unitaire flyer (CHF)</Label>
                <Controller
                  name="cout_unitaire_flyer"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="cout_unitaire_flyer"
                      type="number"
                      step="0.01"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
              </div>
            </div>

            {/* Coût total calculé */}
            <div className="bg-muted/50 rounded-lg p-3 border">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Coût total estimé</span>
                <span className="font-semibold text-lg text-primary">
                  {coutTotal.toLocaleString('fr-CH', { minimumFractionDigits: 2 })} CHF
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ({nbCourriers} × {coutUnitaireCourrier.toFixed(2)}) + ({nbFlyers} × {coutUnitaireFlyer.toFixed(2)})
              </p>
            </div>

            {/* Date de début */}
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Controller
                name="date_debut"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? format(field.value, 'PPP', { locale: fr })
                          : 'Sélectionner une date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={handleDateSelect}
                        locale={fr}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {/* Affichage de la semaine calculée */}
              {watch('date_debut') && dateFin && (
                <p className="text-sm text-muted-foreground">
                  Semaine : {format(watch('date_debut')!, 'EEE d MMM', { locale: fr })} → {format(dateFin, 'EEE d MMM yyyy', { locale: fr })}
                </p>
              )}
            </div>

            {/* URL QR */}
            <div className="space-y-2">
              <Label htmlFor="qr_destination_url">URL de destination du QR code</Label>
              <Controller
                name="qr_destination_url"
                control={control}
                render={({ field }) => (
                  <Input
                    id="qr_destination_url"
                    type="url"
                    placeholder="https://instagram.com/gary, https://gary.ch/estimateur..."
                    {...field}
                  />
                )}
              />
              {errors.qr_destination_url && (
                <p className="text-xs text-destructive">{errors.qr_destination_url.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="notes"
                    placeholder="Notes internes..."
                    rows={3}
                    {...field}
                  />
                )}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Enregistrer' : 'Créer la campagne'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
