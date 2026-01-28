import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePartner } from '@/hooks/usePartners';
import { toast } from '@/hooks/use-toast';
import { PARTNER_TYPE_OPTIONS, RETRO_TYPE_OPTIONS, Partner } from '@/types/leads';

interface PartnerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPartnerCreated: (partner: Partner) => void;
}

export const PartnerFormModal = ({ open, onOpenChange, onPartnerCreated }: PartnerFormModalProps) => {
  const createPartner = useCreatePartner();
  
  const [formData, setFormData] = useState({
    societe: '',
    nom: '',
    type: '' as Partner['type'],
    contact_nom: '',
    contact_role: '',
    contact_email: '',
    contact_tel: '',
    retro_default_type: 'pourcentage' as Partner['retro_default_type'],
    retro_default_valeur: null as number | null,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.societe.trim()) {
      toast({ title: 'Erreur', description: 'Le nom de la société est requis', variant: 'destructive' });
      return;
    }

    try {
      const partner = await createPartner.mutateAsync({
        societe: formData.societe,
        nom: formData.nom || null,
        type: formData.type || null,
        contact_nom: formData.contact_nom || null,
        contact_role: formData.contact_role || null,
        contact_email: formData.contact_email || null,
        contact_tel: formData.contact_tel || null,
        retro_default_type: formData.retro_default_type,
        retro_default_valeur: formData.retro_default_valeur,
        notes: formData.notes || null,
        is_active: true,
      });
      
      toast({ title: 'Succès', description: 'Partenaire créé avec succès' });
      onPartnerCreated(partner);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de créer le partenaire', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      societe: '',
      nom: '',
      type: '' as Partner['type'],
      contact_nom: '',
      contact_role: '',
      contact_email: '',
      contact_tel: '',
      retro_default_type: 'pourcentage',
      retro_default_valeur: null,
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau partenaire</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="societe">Société *</Label>
              <Input
                id="societe"
                value={formData.societe}
                onChange={(e) => setFormData({ ...formData, societe: e.target.value })}
                placeholder="Nom de la société"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Département / Filiale</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: Private Banking"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de partenaire</Label>
            <Select
              value={formData.type || ''}
              onValueChange={(value) => setFormData({ ...formData, type: value as Partner['type'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h4 className="text-sm font-medium">Contact principal</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_nom">Nom</Label>
                <Input
                  id="contact_nom"
                  value={formData.contact_nom}
                  onChange={(e) => setFormData({ ...formData, contact_nom: e.target.value })}
                  placeholder="Nom du contact"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_role">Fonction</Label>
                <Input
                  id="contact_role"
                  value={formData.contact_role}
                  onChange={(e) => setFormData({ ...formData, contact_role: e.target.value })}
                  placeholder="Ex: Directeur"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_tel">Téléphone</Label>
                <Input
                  id="contact_tel"
                  type="tel"
                  value={formData.contact_tel}
                  onChange={(e) => setFormData({ ...formData, contact_tel: e.target.value })}
                  placeholder="+41 22 000 00 00"
                />
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h4 className="text-sm font-medium">Rétrocession par défaut</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retro_type">Type</Label>
                <Select
                  value={formData.retro_default_type || 'aucune'}
                  onValueChange={(value) => setFormData({ ...formData, retro_default_type: value as Partner['retro_default_type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RETRO_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.retro_default_type && formData.retro_default_type !== 'aucune' && (
                <div className="space-y-2">
                  <Label htmlFor="retro_valeur">
                    {formData.retro_default_type === 'pourcentage' ? 'Pourcentage (%)' : 'Montant (CHF)'}
                  </Label>
                  <Input
                    id="retro_valeur"
                    type="number"
                    step={formData.retro_default_type === 'pourcentage' ? '0.1' : '1'}
                    value={formData.retro_default_valeur ?? ''}
                    onChange={(e) => setFormData({ ...formData, retro_default_valeur: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder={formData.retro_default_type === 'pourcentage' ? 'Ex: 10' : 'Ex: 5000'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createPartner.isPending}>
              {createPartner.isPending ? 'Création...' : 'Créer le partenaire'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
