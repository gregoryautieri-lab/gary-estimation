import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ComparableData } from '@/hooks/useProjectDetail';

interface EditComparableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparable: ComparableData | null;
  onSuccess: () => void;
}

interface FormData {
  adresse: string;
  localite: string;
  codePostal: string;
  typeBien: string;
  prix: string;
  surface: string;
  surfaceParcelle: string;
  pieces: string;
  statutMarche: 'vendu' | 'en_vente';
  strategieDiffusion: string;
  dateVente: string;
  notes: string;
  urlSource: string;
}

export function EditComparableModal({
  open,
  onOpenChange,
  comparable,
  onSuccess,
}: EditComparableModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    adresse: '',
    localite: '',
    codePostal: '',
    typeBien: '',
    prix: '',
    surface: '',
    surfaceParcelle: '',
    pieces: '',
    statutMarche: 'en_vente',
    strategieDiffusion: '',
    dateVente: '',
    notes: '',
    urlSource: '',
  });

  // Populate form when comparable changes
  useEffect(() => {
    if (comparable && comparable.sourceType === 'external' && comparable.comparableId) {
      // Fetch fresh data from comparables table
      fetchComparableData(comparable.comparableId);
    }
  }, [comparable?.comparableId, open]);

  const fetchComparableData = async (comparableId: string) => {
    const { data, error } = await supabase
      .from('comparables')
      .select('*')
      .eq('id', comparableId)
      .single();

    if (error || !data) {
      console.error('Error fetching comparable:', error);
      return;
    }

    setFormData({
      adresse: data.adresse || '',
      localite: data.localite || '',
      codePostal: data.code_postal || '',
      typeBien: data.type_bien || '',
      prix: data.prix?.toString() || '',
      surface: data.surface?.toString() || '',
      surfaceParcelle: data.surface_parcelle?.toString() || '',
      pieces: data.pieces?.toString() || '',
      statutMarche: data.statut_marche === 'vendu' ? 'vendu' : 'en_vente',
      strategieDiffusion: data.strategie_diffusion || '',
      dateVente: data.date_vente ? data.date_vente.split('T')[0] : '',
      notes: data.notes || '',
      urlSource: data.url_source || '',
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!comparable?.comparableId) return;

    setLoading(true);
    try {
      const updateData: any = {
        adresse: formData.adresse || null,
        localite: formData.localite || null,
        code_postal: formData.codePostal || null,
        statut_marche: formData.statutMarche,
        notes: formData.notes || null,
        url_source: formData.urlSource || null,
        updated_at: new Date().toISOString(),
      };

      if (formData.typeBien) updateData.type_bien = formData.typeBien;
      if (formData.prix) updateData.prix = parseFloat(formData.prix);
      if (formData.surface) updateData.surface = parseFloat(formData.surface);
      if (formData.surfaceParcelle) updateData.surface_parcelle = parseFloat(formData.surfaceParcelle);
      if (formData.pieces) updateData.pieces = parseFloat(formData.pieces);
      if (formData.strategieDiffusion && formData.strategieDiffusion !== 'non_specifie') {
        updateData.strategie_diffusion = formData.strategieDiffusion;
      } else {
        updateData.strategie_diffusion = null;
      }
      if (formData.dateVente) updateData.date_vente = new Date(formData.dateVente).toISOString();

      const { error } = await supabase
        .from('comparables')
        .update(updateData)
        .eq('id', comparable.comparableId);

      if (error) {
        console.error('Update error:', error);
        toast.error("Échec de la mise à jour");
        return;
      }

      toast.success("Comparable mis à jour");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  // Only allow editing external comparables
  if (comparable?.sourceType === 'gary') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le comparable</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Adresse */}
          <div>
            <Label htmlFor="edit-adresse">Adresse</Label>
            <Input
              id="edit-adresse"
              placeholder="Rue et numéro"
              value={formData.adresse}
              onChange={(e) => handleInputChange('adresse', e.target.value)}
            />
          </div>

          {/* Localité + Code postal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-codePostal">NPA</Label>
              <Input
                id="edit-codePostal"
                placeholder="1200"
                value={formData.codePostal}
                onChange={(e) => handleInputChange('codePostal', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-localite">Localité</Label>
              <Input
                id="edit-localite"
                placeholder="Genève"
                value={formData.localite}
                onChange={(e) => handleInputChange('localite', e.target.value)}
              />
            </div>
          </div>

          {/* Type de bien + Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type de bien</Label>
              <Select
                value={formData.typeBien}
                onValueChange={(v) => handleInputChange('typeBien', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appartement">Appartement</SelectItem>
                  <SelectItem value="maison">Maison</SelectItem>
                  <SelectItem value="terrain">Terrain</SelectItem>
                  <SelectItem value="immeuble">Immeuble</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
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

          {/* Prix, Surface, Pieces */}
          <div className={`grid gap-3 ${formData.typeBien === 'maison' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            <div>
              <Label htmlFor="edit-prix">Prix (CHF)</Label>
              <Input
                id="edit-prix"
                type="number"
                placeholder="1'200'000"
                value={formData.prix}
                onChange={(e) => handleInputChange('prix', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-surface">Surface m²</Label>
              <Input
                id="edit-surface"
                type="number"
                placeholder="120"
                value={formData.surface}
                onChange={(e) => handleInputChange('surface', e.target.value)}
              />
            </div>
            {formData.typeBien === 'maison' && (
              <div>
                <Label htmlFor="edit-surfaceParcelle">Parcelle m²</Label>
                <Input
                  id="edit-surfaceParcelle"
                  type="number"
                  placeholder="800"
                  value={formData.surfaceParcelle}
                  onChange={(e) => handleInputChange('surfaceParcelle', e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-pieces">Pièces</Label>
              <Input
                id="edit-pieces"
                type="number"
                step="0.5"
                placeholder="4.5"
                value={formData.pieces}
                onChange={(e) => handleInputChange('pieces', e.target.value)}
              />
            </div>
          </div>

          {/* Stratégie + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stratégie diffusion</Label>
              <Select
                value={formData.strategieDiffusion || 'non_specifie'}
                onValueChange={(v) => handleInputChange('strategieDiffusion', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non spécifié" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non_specifie">Non spécifié</SelectItem>
                  <SelectItem value="off_market">Off-market</SelectItem>
                  <SelectItem value="coming_soon">Coming soon</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-dateVente">Date de vente</Label>
              <Input
                id="edit-dateVente"
                type="date"
                value={formData.dateVente}
                onChange={(e) => handleInputChange('dateVente', e.target.value)}
              />
            </div>
          </div>

          {/* URL Source */}
          <div>
            <Label htmlFor="edit-urlSource">URL de l'annonce</Label>
            <Input
              id="edit-urlSource"
              type="url"
              placeholder="https://..."
              value={formData.urlSource}
              onChange={(e) => handleInputChange('urlSource', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              placeholder="Informations complémentaires..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
