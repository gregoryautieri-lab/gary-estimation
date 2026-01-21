import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Loader2, User, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { cn } from '@/lib/utils';
import { useMissions } from '@/hooks/useMissions';
import { useEtudiants } from '@/hooks/useEtudiants';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Mission, MissionStatut, MISSION_STATUT_LABELS } from '@/types/prospection';

const missionSchema = z.object({
  date: z.date({ required_error: 'La date est requise' }),
  assignee_type: z.enum(['etudiant', 'courtier']),
  etudiant_id: z.string().nullable(),
  courtier_id: z.string().nullable(),
  secteur_nom: z.string().nullable(),
  courriers_prevu: z.number().min(0),
  courriers_distribues: z.number().min(0).nullable(),
  statut: z.enum(['prevue', 'en_cours', 'terminee', 'annulee']),
  notes: z.string().nullable(),
});

type MissionFormValues = z.infer<typeof missionSchema>;

interface MissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campagneId: string;
  secteurs?: string[] | null;
  mission?: Mission | null;
  onSuccess?: () => void;
}

export function MissionFormModal({
  open,
  onOpenChange,
  campagneId,
  secteurs,
  mission,
  onSuccess,
}: MissionFormModalProps) {
  const { user } = useAuth();
  const { isAdmin, isResponsableProspection } = useUserRole();
  const { create, update, isCreating, isUpdating } = useMissions();
  const { etudiants } = useEtudiants({ actif_only: true });

  const isEditMode = !!mission;

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
      courriers_prevu: 0,
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
        courriers_prevu: mission.courriers_prevu || 0,
        courriers_distribues: mission.courriers_distribues || null,
        statut: mission.statut,
        notes: mission.notes || null,
      });
    } else if (!mission && open) {
      form.reset({
        date: new Date(),
        assignee_type: 'etudiant',
        etudiant_id: null,
        courtier_id: null,
        secteur_nom: secteurs?.[0] || null,
        courriers_prevu: 0,
        courriers_distribues: null,
        statut: 'prevue',
        notes: null,
      });
    }
  }, [mission, open, form, secteurs]);

  const assigneeType = form.watch('assignee_type');

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

  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <FormLabel>Assigné à</FormLabel>
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
            {secteurs && secteurs.length > 0 && (
              <FormField
                control={form.control}
                name="secteur_nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secteur</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Courriers prévus */}
            <FormField
              control={form.control}
              name="courriers_prevu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Courriers prévus</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
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
            <div className="flex justify-end gap-2 pt-4">
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
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
