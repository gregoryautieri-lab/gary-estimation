import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupportsProspection } from '@/hooks/useSupportsProspection';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

import type { SupportProspection } from '@/types/prospection';

// ============ SCHEMA ============

const supportSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  tarif_unitaire: z.number().min(0.01, 'Le tarif doit être supérieur à 0'),
  description: z.string().optional(),
  actif: z.boolean(),
  ordre: z.number().min(0),
});

type SupportFormValues = z.infer<typeof supportSchema>;

// ============ PROPS ============

interface SupportFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  support?: SupportProspection | null;
}

// ============ COMPONENT ============

export function SupportFormModal({ open, onOpenChange, support }: SupportFormModalProps) {
  const { supports, create, update, isCreating, isUpdating } = useSupportsProspection();
  const isEditMode = !!support;

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      nom: '',
      tarif_unitaire: 0,
      description: '',
      actif: true,
      ordre: 0,
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form;

  // Pré-remplir le formulaire
  useEffect(() => {
    if (open) {
      if (support) {
        reset({
          nom: support.nom,
          tarif_unitaire: support.tarif_unitaire,
          description: support.description || '',
          actif: support.actif,
          ordre: support.ordre,
        });
      } else {
        // Nouvel ordre = max + 1
        const maxOrdre = supports.length > 0 ? Math.max(...supports.map(s => s.ordre)) : 0;
        reset({
          nom: '',
          tarif_unitaire: 0,
          description: '',
          actif: true,
          ordre: maxOrdre + 1,
        });
      }
    }
  }, [open, support, reset, supports]);

  const onSubmit = (data: SupportFormValues) => {
    // Vérifier unicité du nom (hors support actuel)
    const exists = supports.some(s => 
      s.nom.toLowerCase() === data.nom.toLowerCase() && s.id !== support?.id
    );
    if (exists) {
      form.setError('nom', { message: 'Ce nom de support existe déjà' });
      return;
    }

    const payload = {
      nom: data.nom,
      tarif_unitaire: data.tarif_unitaire,
      description: data.description || null,
      actif: data.actif,
      ordre: data.ordre,
    };

    if (isEditMode && support) {
      update({ id: support.id, ...payload });
    } else {
      create(payload);
    }
    onOpenChange(false);
  };

  const isPending = isCreating || isUpdating;
  const actifValue = watch('actif');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier le support' : 'Nouveau support'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du support *</Label>
            <Input
              id="nom"
              {...register('nom')}
              placeholder="Ex: Flyer A5"
            />
            {errors.nom && (
              <p className="text-xs text-destructive">{errors.nom.message}</p>
            )}
          </div>

          {/* Tarif unitaire */}
          <div className="space-y-2">
            <Label htmlFor="tarif_unitaire">Tarif unitaire (CHF) *</Label>
            <Input
              id="tarif_unitaire"
              type="number"
              step="0.01"
              min="0.01"
              {...register('tarif_unitaire', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.tarif_unitaire && (
              <p className="text-xs text-destructive">{errors.tarif_unitaire.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Description optionnelle..."
              rows={3}
            />
          </div>

          {/* Ordre */}
          <div className="space-y-2">
            <Label htmlFor="ordre">Ordre d'affichage</Label>
            <Input
              id="ordre"
              type="number"
              min="0"
              {...register('ordre', { valueAsNumber: true })}
            />
          </div>

          {/* Actif */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="actif"
              checked={actifValue}
              onCheckedChange={(checked) => setValue('actif', !!checked)}
            />
            <Label htmlFor="actif" className="font-normal cursor-pointer">
              Support actif
            </Label>
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
              {isEditMode ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
