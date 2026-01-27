import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTypesMessages, type TypeMessage } from '@/hooks/useTypesMessages';

const GROUPES = ['Ventes', 'Recherche', 'Propositions', 'Spécial', 'Autres'];

const formSchema = z.object({
  groupe: z.string().min(1, 'Le groupe est requis'),
  valeur: z
    .string()
    .min(1, 'La valeur technique est requise')
    .regex(/^[a-z_]+$/, 'Uniquement lettres minuscules et underscores'),
  label: z.string().min(1, 'Le libellé est requis'),
  actif: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface TypeMessageFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeMessage: TypeMessage | null;
}

export function TypeMessageFormModal({
  open,
  onOpenChange,
  typeMessage,
}: TypeMessageFormModalProps) {
  const { create, update, isCreating, isUpdating } = useTypesMessages();
  const isEditing = !!typeMessage;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupe: 'Ventes',
      valeur: '',
      label: '',
      actif: true,
    },
  });

  useEffect(() => {
    if (typeMessage) {
      form.reset({
        groupe: typeMessage.groupe,
        valeur: typeMessage.valeur,
        label: typeMessage.label,
        actif: typeMessage.actif,
      });
    } else {
      form.reset({
        groupe: 'Ventes',
        valeur: '',
        label: '',
        actif: true,
      });
    }
  }, [typeMessage, form]);

  const onSubmit = (values: FormValues) => {
    if (isEditing && typeMessage) {
      update(
        { id: typeMessage.id, groupe: values.groupe, valeur: values.valeur, label: values.label, actif: values.actif },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      create(
        { groupe: values.groupe, valeur: values.valeur, label: values.label, actif: values.actif },
        { onSuccess: () => onOpenChange(false) }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le type de message' : 'Nouveau type de message'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="groupe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Groupe</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un groupe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GROUPES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valeur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valeur technique</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ex: nous_avons_vendu"
                      disabled={isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé affiché</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ex: Nous avons vendu" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actif"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="cursor-pointer">Actif</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isEditing ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
