import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MultiSelectCommunes } from '@/components/ui/multi-select-communes';
import { ProjectStatutFilter } from '@/hooks/useProjectsComparables';

// Types de bien disponibles (doivent correspondre à l'enum type_bien dans la DB)
const TYPE_BIEN_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison / Villa' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'immeuble', label: 'Immeuble' },
];

// Schema de validation
const projectFormSchema = z.object({
  projectName: z.string()
    .min(1, 'Le nom du projet est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  communes: z.array(z.string()).min(1, 'Sélectionnez au moins une commune'),
  prixMin: z.number().nullable(),
  prixMax: z.number().nullable(),
  typeBien: z.array(z.string()).min(1, 'Sélectionnez au moins un type de bien'),
  surfaceMin: z.number().nullable(),
  surfaceMax: z.number().nullable(),
  piecesMin: z.number().nullable(),
  piecesMax: z.number().nullable(),
  statutFilter: z.enum(['tous', 'vendus', 'en_vente']),
}).refine((data) => {
  if (data.prixMin && data.prixMax && data.prixMin > data.prixMax) {
    return false;
  }
  return true;
}, {
  message: 'Le prix minimum doit être inférieur au prix maximum',
  path: ['prixMax'],
}).refine((data) => {
  if (data.surfaceMin && data.surfaceMax && data.surfaceMin > data.surfaceMax) {
    return false;
  }
  return true;
}, {
  message: 'La surface minimum doit être inférieure à la surface maximum',
  path: ['surfaceMax'],
}).refine((data) => {
  if (data.piecesMin && data.piecesMax && data.piecesMin > data.piecesMax) {
    return false;
  }
  return true;
}, {
  message: 'Le nombre de pièces minimum doit être inférieur au maximum',
  path: ['piecesMax'],
});

export type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  defaultValues?: Partial<ProjectFormData>;
}

export function ProjectForm({ 
  onSubmit, 
  onCancel, 
  isSubmitting,
  defaultValues 
}: ProjectFormProps) {
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: defaultValues?.projectName || '',
      communes: defaultValues?.communes || [],
      prixMin: defaultValues?.prixMin ?? null,
      prixMax: defaultValues?.prixMax ?? null,
      typeBien: defaultValues?.typeBien || ['appartement', 'maison'],
      surfaceMin: defaultValues?.surfaceMin ?? null,
      surfaceMax: defaultValues?.surfaceMax ?? null,
      piecesMin: defaultValues?.piecesMin ?? null,
      piecesMax: defaultValues?.piecesMax ?? null,
      statutFilter: defaultValues?.statutFilter as any || 'tous',
    },
  });

  // Parse formatted number back to number
  const parseNumber = (value: string): number | null => {
    const num = value.replace(/[^\d]/g, '');
    return num ? parseInt(num, 10) : null;
  };

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nom du projet */}
        <FormField
          control={form.control}
          name="projectName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du projet *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ex: Cologny 2-5M"
                  maxLength={100}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Communes (multi-select) */}
        <FormField
          control={form.control}
          name="communes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Communes *</FormLabel>
              <FormControl>
                <MultiSelectCommunes
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sélectionner des communes..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fourchette de prix */}
        <div className="space-y-2">
          <Label>Fourchette de prix (CHF)</Label>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="prixMin"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Min"
                      value={field.value ? field.value.toLocaleString('fr-CH') : ''}
                      onChange={(e) => field.onChange(parseNumber(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prixMax"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Max"
                      value={field.value ? field.value.toLocaleString('fr-CH') : ''}
                      onChange={(e) => field.onChange(parseNumber(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Types de bien */}
        <FormField
          control={form.control}
          name="typeBien"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Types de bien *</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_BIEN_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${option.value}`}
                      checked={field.value?.includes(option.value)}
                      onCheckedChange={(checked) => {
                        const newValue = checked
                          ? [...(field.value || []), option.value]
                          : (field.value || []).filter((v) => v !== option.value);
                        field.onChange(newValue);
                      }}
                    />
                    <label
                      htmlFor={`type-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Surface habitable */}
        <div className="space-y-2">
          <Label>Surface habitable (m²)</Label>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="surfaceMin"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Min"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surfaceMax"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="Max"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Nombre de pièces */}
        <div className="space-y-2">
          <Label>Nombre de pièces</Label>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="piecesMin"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      placeholder="Min"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="piecesMax"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      placeholder="Max"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Statut */}
        <FormField
          control={form.control}
          name="statutFilter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tous" id="statut-tous" />
                    <label htmlFor="statut-tous" className="text-sm cursor-pointer">Tous</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vendus" id="statut-vendus" />
                    <label htmlFor="statut-vendus" className="text-sm cursor-pointer">Vendus uniquement</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en_vente" id="statut-en-vente" />
                    <label htmlFor="statut-en-vente" className="text-sm cursor-pointer">En vente</label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Création en cours...' : 'Créer et rechercher'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
