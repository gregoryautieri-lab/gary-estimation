import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, AlertTriangle, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ProjectData } from '@/hooks/useProjectDetail';

interface AddManualComparableModalProps {
  projectId: string;
  project: ProjectData | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DuplicateMatch {
  id: string;
  adresse: string;
  localite: string;
  prix: number | null;
  surface: number | null;
}

interface FormData {
  adresse: string;
  codePostal: string;
  localite: string;
  typeBien: string;
  prix: string;
  surface: string;
  pieces: string;
  statutMarche: 'vendu' | 'en_vente';
  strategieDiffusion: string;
  dateVente: string;
  notes: string;
  urlSource: string;
}

const TYPE_BIEN_OPTIONS = [
  { value: 'appartement', label: 'Appartement' },
  { value: 'maison', label: 'Maison' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'commercial', label: 'Commercial' },
];

const STRATEGIE_OPTIONS = [
  { value: 'non_specifie', label: 'Non spécifié' },
  { value: 'off_market', label: 'Off-market' },
  { value: 'coming_soon', label: 'Coming soon' },
  { value: 'public', label: 'Public' },
];

export function AddManualComparableModal({
  projectId,
  project,
  open,
  onClose,
  onSuccess,
}: AddManualComparableModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    adresse: '',
    codePostal: '',
    localite: '',
    typeBien: '',
    prix: '',
    surface: '',
    pieces: '',
    statutMarche: 'en_vente',
    strategieDiffusion: '',
    dateVente: '',
    notes: '',
    urlSource: '',
  });

  // Pre-fill from project
  useEffect(() => {
    if (open && project) {
      setFormData(prev => ({
        ...prev,
        localite: project.communes[0] || '',
        typeBien: project.typeBien[0] || '',
        prix: project.prixMin ? String(project.prixMin) : '',
      }));
      setDuplicates([]);
      setCoordinates(null);
    }
  }, [open, project]);

  // Normalize address for comparison
  const normalizeAddress = (addr: string, loc: string): string => {
    return `${addr.toLowerCase().trim()}_${loc.toLowerCase().trim()}`.replace(/\s+/g, '');
  };

  // Debounced duplicate check
  useEffect(() => {
    if (!open || !formData.adresse || !formData.localite) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        // Search in comparables table first
        const { data: existingComparables } = await supabase
          .from('comparables')
          .select('id, adresse, localite, prix, surface')
          .ilike('adresse', `%${formData.adresse.trim()}%`)
          .ilike('localite', `%${formData.localite.trim()}%`)
          .limit(5);

        // Also search in estimations
        const { data: existingEstimations } = await supabase
          .from('estimations')
          .select('id, adresse, localite, prix_final')
          .ilike('adresse', `%${formData.adresse.trim()}%`)
          .ilike('localite', `%${formData.localite.trim()}%`)
          .limit(5);

        const matches: DuplicateMatch[] = [];
        
        if (existingComparables) {
          matches.push(...existingComparables.map(c => ({
            id: c.id,
            adresse: c.adresse || '',
            localite: c.localite || '',
            prix: c.prix ? Number(c.prix) : null,
            surface: c.surface ? Number(c.surface) : null,
          })));
        }
        
        if (existingEstimations) {
          matches.push(...existingEstimations.map(e => ({
            id: e.id,
            adresse: e.adresse || '',
            localite: e.localite || '',
            prix: e.prix_final ? Number(e.prix_final) : null,
            surface: null,
          })));
        }

        setDuplicates(matches);
      } catch (err) {
        console.error('Duplicate check error:', err);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [open, formData.adresse, formData.localite]);

  // Geocode address
  const handleGeocode = useCallback(async () => {
    if (!formData.adresse || !formData.localite) {
      toast.error('Renseignez l\'adresse et la localité');
      return;
    }

    setGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: {
          action: 'geocode',
          address: `${formData.adresse}, ${formData.codePostal} ${formData.localite}, Suisse`,
        },
      });

      if (error || !data?.success || !data?.location) {
        toast.error('Impossible de géolocaliser cette adresse');
        return;
      }

      setCoordinates(data.location);
      toast.success('Adresse géolocalisée');
    } catch (err) {
      console.error('Geocoding error:', err);
      toast.error('Erreur de géolocalisation');
    } finally {
      setGeocoding(false);
    }
  }, [formData.adresse, formData.codePostal, formData.localite]);

  // Submit form
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (!formData.adresse || !formData.localite) {
      toast.error('L\'adresse et la localité sont obligatoires');
      return;
    }

    setLoading(true);
    try {
      // 1. Insert into comparables table
      const insertData: any = {
        user_id: user.id,
        adresse: formData.adresse.trim(),
        code_postal: formData.codePostal.trim() || null,
        localite: formData.localite.trim(),
        statut_marche: formData.statutMarche,
        source: 'manual',
      };
      
      // Add optional fields
      if (formData.typeBien) insertData.type_bien = formData.typeBien;
      if (formData.prix) insertData.prix = parseFloat(formData.prix);
      if (formData.surface) insertData.surface = parseFloat(formData.surface);
      if (formData.pieces) insertData.pieces = parseFloat(formData.pieces);
      if (formData.strategieDiffusion && formData.strategieDiffusion !== 'non_specifie') insertData.strategie_diffusion = formData.strategieDiffusion;
      if (formData.dateVente) insertData.date_vente = new Date(formData.dateVente).toISOString();
      if (coordinates?.lat) insertData.latitude = coordinates.lat;
      if (coordinates?.lng) insertData.longitude = coordinates.lng;
      if (formData.urlSource.trim()) insertData.url_source = formData.urlSource.trim();
      if (formData.notes.trim()) insertData.notes = formData.notes.trim();

      const { data: newComparable, error: insertError } = await supabase
        .from('comparables')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        toast.error('Impossible de créer le comparable');
        return;
      }

      // 2. Link to project
      const { error: linkError } = await supabase
        .from('project_comparables_links')
        .insert({
          project_id: projectId,
          comparable_id: newComparable.id,
          selected_by_user: true,
        });

      if (linkError) {
        console.error('Link error:', linkError);
        toast.error('Comparable créé mais non lié au projet');
        return;
      }

      toast.success('Comparable ajouté au projet');
      onSuccess();
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPrice = (value: string) => {
    const num = parseInt(value.replace(/\D/g, ''), 10);
    return isNaN(num) ? '' : num.toLocaleString('fr-CH');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un comparable externe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Duplicate Warning */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    {duplicates.length} doublon{duplicates.length > 1 ? 's' : ''} potentiel{duplicates.length > 1 ? 's' : ''}
                  </p>
                  <div className="mt-2 space-y-1">
                    {duplicates.slice(0, 3).map(d => (
                      <p key={d.id} className="text-xs text-amber-700 dark:text-amber-300">
                        • {d.adresse}, {d.localite} 
                        {d.prix && ` — ${d.prix.toLocaleString('fr-CH')} CHF`}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address Section */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="adresse">Adresse *</Label>
              <div className="relative">
                <Input
                  id="adresse"
                  placeholder="Rue et numéro"
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                />
                {checkingDuplicates && (
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="codePostal">NPA</Label>
                <Input
                  id="codePostal"
                  placeholder="1200"
                  value={formData.codePostal}
                  onChange={(e) => handleInputChange('codePostal', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="localite">Localité *</Label>
                <Input
                  id="localite"
                  placeholder="Genève"
                  value={formData.localite}
                  onChange={(e) => handleInputChange('localite', e.target.value)}
                />
              </div>
            </div>

            {/* Geocode button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGeocode}
              disabled={geocoding || !formData.adresse || !formData.localite}
              className="w-full"
            >
              {geocoding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {coordinates ? 'Géolocalisé ✓' : 'Géolocaliser l\'adresse'}
            </Button>
          </div>

          {/* Characteristics Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="typeBien">Type de bien</Label>
                <Select
                  value={formData.typeBien}
                  onValueChange={(v) => handleInputChange('typeBien', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_BIEN_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statutMarche">Statut marché *</Label>
                <Select
                  value={formData.statutMarche}
                  onValueChange={(v) => handleInputChange('statutMarche', v as 'vendu' | 'en_vente')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_vente">En vente</SelectItem>
                    <SelectItem value="vendu">Vendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="prix">Prix (CHF)</Label>
                <Input
                  id="prix"
                  type="text"
                  inputMode="numeric"
                  placeholder="1'500'000"
                  value={formData.prix}
                  onChange={(e) => handleInputChange('prix', e.target.value.replace(/[^\d]/g, ''))}
                />
              </div>
              <div>
                <Label htmlFor="surface">Surface m²</Label>
                <Input
                  id="surface"
                  type="number"
                  placeholder="120"
                  value={formData.surface}
                  onChange={(e) => handleInputChange('surface', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="pieces">Pièces</Label>
                <Input
                  id="pieces"
                  type="number"
                  step="0.5"
                  placeholder="4.5"
                  value={formData.pieces}
                  onChange={(e) => handleInputChange('pieces', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="strategieDiffusion">Stratégie</Label>
                <Select
                  value={formData.strategieDiffusion}
                  onValueChange={(v) => handleInputChange('strategieDiffusion', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Non spécifié" />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGIE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.statutMarche === 'vendu' && (
                <div>
                  <Label htmlFor="dateVente">Date de vente</Label>
                  <Input
                    id="dateVente"
                    type="date"
                    value={formData.dateVente}
                    onChange={(e) => handleInputChange('dateVente', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Optional Section */}
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label htmlFor="urlSource">URL source (optionnel)</Label>
              <Input
                id="urlSource"
                type="url"
                placeholder="https://immoscout24.ch/..."
                value={formData.urlSource}
                onChange={(e) => handleInputChange('urlSource', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Observations, infos supplémentaires..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.adresse || !formData.localite}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Ajouter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
