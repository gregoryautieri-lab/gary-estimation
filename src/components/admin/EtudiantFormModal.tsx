import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEtudiants } from '@/hooks/useEtudiants';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

import type { Etudiant } from '@/types/prospection';

// ============ SCHEMA ============

const etudiantSchema = z.object({
  prenom: z.string().min(1, 'Le prénom est obligatoire'),
  nom: z.string().min(1, 'Le nom est obligatoire'),
  email: z.string().email('Email invalide'),
  tel: z.string().optional(),
  salaire_horaire: z.number().min(1, 'Le salaire doit être supérieur à 1 CHF'),
  actif: z.boolean(),
  user_id: z.string().nullable(),
});

type EtudiantFormValues = z.infer<typeof etudiantSchema>;

// ============ TYPES ============

export interface EtudiantInitialValues {
  prenom?: string;
  nom?: string;
  email?: string;
  tel?: string;
  user_id?: string | null;
}

// ============ PROPS ============

interface EtudiantFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  etudiant?: Etudiant | null;
  initialValues?: EtudiantInitialValues | null;
}

// ============ COMPONENT ============

export function EtudiantFormModal({ open, onOpenChange, etudiant, initialValues }: EtudiantFormModalProps) {
  const { etudiants, create, update, isCreating, isUpdating } = useEtudiants();
  const isEditMode = !!etudiant;

  // Récupérer les utilisateurs disponibles (sans étudiant lié)
  const { data: availableUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['available_users_for_etudiant', etudiant?.id],
    queryFn: async () => {
      // Récupérer les profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Récupérer les user_id déjà liés à un étudiant
      const { data: linkedEtudiants, error: etudiantsError } = await supabase
        .from('etudiants')
        .select('user_id')
        .not('user_id', 'is', null);

      if (etudiantsError) throw etudiantsError;

      const linkedUserIds = new Set(linkedEtudiants?.map(e => e.user_id) || []);
      
      // Si mode édition, ne pas exclure l'user actuel de l'étudiant
      if (etudiant?.user_id) {
        linkedUserIds.delete(etudiant.user_id);
      }

      // Filtrer les profils disponibles
      return (profiles || []).filter(p => !linkedUserIds.has(p.user_id));
    },
    enabled: open,
  });

  const form = useForm<EtudiantFormValues>({
    resolver: zodResolver(etudiantSchema),
    defaultValues: {
      prenom: '',
      nom: '',
      email: '',
      tel: '',
      salaire_horaire: 18.00,
      actif: true,
      user_id: null,
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = form;

  // Pré-remplir le formulaire
  useEffect(() => {
    if (open) {
      if (etudiant) {
        // Mode édition
        reset({
          prenom: etudiant.prenom,
          nom: etudiant.nom || '',
          email: etudiant.email || '',
          tel: etudiant.tel || '',
          salaire_horaire: etudiant.salaire_horaire,
          actif: etudiant.actif,
          user_id: etudiant.user_id,
        });
      } else if (initialValues) {
        // Mode import avec pré-remplissage
        const nameParts = (initialValues.prenom || '').split(' ');
        const prenom = nameParts[0] || '';
        const nom = nameParts.slice(1).join(' ') || initialValues.nom || '';
        
        reset({
          prenom: prenom,
          nom: nom,
          email: initialValues.email || '',
          tel: initialValues.tel || '',
          salaire_horaire: 18.00,
          actif: true,
          user_id: initialValues.user_id || null,
        });
      } else {
        // Mode création vierge
        reset({
          prenom: '',
          nom: '',
          email: '',
          tel: '',
          salaire_horaire: 18.00,
          actif: true,
          user_id: null,
        });
      }
    }
  }, [open, etudiant, initialValues, reset]);

  const onSubmit = async (data: EtudiantFormValues) => {
    // Vérifier unicité de l'email (hors étudiant actuel)
    const emailExists = etudiants.some(e => 
      e.email?.toLowerCase() === data.email.toLowerCase() && e.id !== etudiant?.id
    );
    if (emailExists) {
      form.setError('email', { message: 'Cet email est déjà utilisé' });
      return;
    }

    const payload = {
      prenom: data.prenom,
      nom: data.nom || null,
      email: data.email || null,
      tel: data.tel || null,
      salaire_horaire: data.salaire_horaire,
      actif: data.actif,
      user_id: data.user_id,
    };

    try {
      if (isEditMode && etudiant) {
        update({ id: etudiant.id, ...payload });
      } else {
        await create(payload);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving etudiant:', error);
    }
  };

  const isPending = isCreating || isUpdating;
  const actifValue = watch('actif');
  const userIdValue = watch('user_id');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                {...register('prenom')}
                placeholder="Jean"
              />
              {errors.prenom && (
                <p className="text-xs text-destructive">{errors.prenom.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                {...register('nom')}
                placeholder="Dupont"
              />
              {errors.nom && (
                <p className="text-xs text-destructive">{errors.nom.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="jean.dupont@example.com"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="tel">Téléphone</Label>
            <Input
              id="tel"
              type="tel"
              {...register('tel')}
              placeholder="+41 79 123 45 67"
            />
          </div>

          {/* Salaire horaire */}
          <div className="space-y-2">
            <Label htmlFor="salaire_horaire">Salaire horaire (CHF/h) *</Label>
            <Input
              id="salaire_horaire"
              type="number"
              step="0.01"
              min="1"
              {...register('salaire_horaire', { valueAsNumber: true })}
            />
            {errors.salaire_horaire && (
              <p className="text-xs text-destructive">{errors.salaire_horaire.message}</p>
            )}
          </div>

          {/* Associer compte utilisateur */}
          <div className="space-y-2">
            <Label htmlFor="user_id">Associer un compte utilisateur</Label>
            <Select
              value={userIdValue || 'none'}
              onValueChange={(v) => setValue('user_id', v === 'none' ? null : v)}
              disabled={usersLoading}
            >
              <SelectTrigger id="user_id">
                <SelectValue placeholder="Aucun compte associé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun compte associé</SelectItem>
                {availableUsers.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.full_name || u.email || 'Utilisateur'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Permet à l'étudiant de se connecter à l'application
            </p>
          </div>

          {/* Actif */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="actif"
              checked={actifValue}
              onCheckedChange={(checked) => setValue('actif', !!checked)}
            />
            <Label htmlFor="actif" className="font-normal cursor-pointer">
              Étudiant actif
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
