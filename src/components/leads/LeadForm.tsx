import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { PartnerFormModal } from './PartnerFormModal';
import { usePartners } from '@/hooks/usePartners';
import { useCourtiers } from '@/hooks/useLeads';
import { useCreateLead } from '@/hooks/useLeadMutations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Package, Smartphone, Phone, Globe, Users, Handshake, CalendarDays, HelpCircle,
  Home, ClipboardList, CalendarIcon, Plus
} from 'lucide-react';
import { 
  LeadSource, LeadTypeDemande, Partner, BienType,
  LEAD_SOURCE_OPTIONS, BIEN_TYPE_OPTIONS 
} from '@/types/leads';

const SOURCE_ICONS: Record<LeadSource, React.ReactNode> = {
  boitage: <Package className="h-4 w-4" />,
  reseaux_sociaux: <Smartphone className="h-4 w-4" />,
  telephone: <Phone className="h-4 w-4" />,
  site_web: <Globe className="h-4 w-4" />,
  recommandation: <Users className="h-4 w-4" />,
  partenariat: <Handshake className="h-4 w-4" />,
  salon: <CalendarDays className="h-4 w-4" />,
  autre: <HelpCircle className="h-4 w-4" />,
};

export const LeadForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: partners = [] } = usePartners();
  const { data: courtiers = [] } = useCourtiers();
  const createLead = useCreateLead();

  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  // Form state
  const [source, setSource] = useState<LeadSource>('telephone');
  const [sourceDetail, setSourceDetail] = useState('');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [retroType, setRetroType] = useState<'pourcentage' | 'fixe' | null>(null);
  const [retroValeur, setRetroValeur] = useState<number | null>(null);
  const [overrideRetro, setOverrideRetro] = useState(false);
  const [recommandePar, setRecommandePar] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [typeDemande, setTypeDemande] = useState<LeadTypeDemande>('estimation');
  const [bienAdresse, setBienAdresse] = useState('');
  const [bienNpa, setBienNpa] = useState('');
  const [bienLocalite, setBienLocalite] = useState('');
  const [bienType, setBienType] = useState<BienType | null>(null);
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [rappelDate, setRappelDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // Set default assignedTo to current user
  useEffect(() => {
    if (user && !assignedTo) {
      setAssignedTo(user.id);
    }
  }, [user, assignedTo]);

  // Update retro values when partner changes
  const selectedPartner = partners.find(p => p.id === partnerId);
  useEffect(() => {
    if (selectedPartner && !overrideRetro) {
      setRetroType(selectedPartner.retro_default_type === 'aucune' ? null : selectedPartner.retro_default_type);
      setRetroValeur(selectedPartner.retro_default_valeur);
    }
  }, [selectedPartner, overrideRetro]);

  const handlePartnerCreated = (partner: Partner) => {
    setPartnerId(partner.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim()) {
      toast({ title: 'Erreur', description: 'Le nom est requis', variant: 'destructive' });
      return;
    }

    if (!assignedTo) {
      toast({ title: 'Erreur', description: 'Le courtier assigné est requis', variant: 'destructive' });
      return;
    }

    try {
      await createLead.mutateAsync({
        source,
        source_detail: sourceDetail || null,
        partner_id: source === 'partenariat' ? partnerId : null,
        retro_type: source === 'partenariat' && partnerId ? retroType : null,
        retro_valeur: source === 'partenariat' && partnerId ? retroValeur : null,
        recommande_par: source === 'recommandation' ? recommandePar : null,
        nom,
        prenom: prenom || null,
        telephone: telephone || null,
        email: email || null,
        type_demande: typeDemande,
        statut: 'nouveau',
        bien_adresse: typeDemande === 'estimation' ? bienAdresse || null : null,
        bien_npa: typeDemande === 'estimation' ? bienNpa || null : null,
        bien_localite: typeDemande === 'estimation' ? bienLocalite || null : null,
        bien_type: typeDemande === 'estimation' ? bienType : null,
        assigned_to: assignedTo,
        rappel_date: rappelDate ? format(rappelDate, 'yyyy-MM-dd') : null,
        notes: notes || null,
        created_by: user?.id || null,
        perdu_raison: null,
        estimation_id: null,
        converti_at: null,
      });

      toast({ title: 'Succès', description: 'Lead créé avec succès' });
      navigate('/leads');
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({ title: 'Erreur', description: 'Impossible de créer le lead', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SOURCE */}
      <FormSection title="Source du lead">
        <div className="space-y-4">
          <RadioGroup
            value={source}
            onValueChange={(value) => setSource(value as LeadSource)}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          >
            {LEAD_SOURCE_OPTIONS.map((opt) => (
              <Label
                key={opt.value}
                htmlFor={`source-${opt.value}`}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                  source === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <RadioGroupItem value={opt.value} id={`source-${opt.value}`} className="sr-only" />
                {SOURCE_ICONS[opt.value]}
                <span className="text-sm">{opt.label}</span>
              </Label>
            ))}
          </RadioGroup>

          <FormRow label="Détail source" optional>
            <Input
              value={sourceDetail}
              onChange={(e) => setSourceDetail(e.target.value)}
              placeholder="Ex: Campagne Eaux-Vives, LinkedIn Ads février..."
            />
          </FormRow>
        </div>
      </FormSection>

      {/* PARTENARIAT */}
      {source === 'partenariat' && (
        <FormSection title="Partenariat" variant="highlight">
          <div className="space-y-4">
            <FormRow label="Partenaire référent" required>
              <div className="flex gap-2">
                <Select value={partnerId || ''} onValueChange={setPartnerId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un partenaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.societe}{p.nom ? ` — ${p.nom}` : ''}{p.contact_nom ? ` (${p.contact_nom})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setPartnerModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </FormRow>

            {selectedPartner && (
              <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  Rétro prévue :{' '}
                  <span className="font-medium">
                    {selectedPartner.retro_default_type === 'aucune' || !selectedPartner.retro_default_type
                      ? 'Aucune'
                      : selectedPartner.retro_default_type === 'pourcentage'
                      ? `${selectedPartner.retro_default_valeur}%`
                      : `CHF ${selectedPartner.retro_default_valeur}`}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="override-retro"
                    checked={overrideRetro}
                    onCheckedChange={(checked) => setOverrideRetro(checked === true)}
                  />
                  <Label htmlFor="override-retro" className="text-sm cursor-pointer">
                    Modifier la rétro pour ce lead
                  </Label>
                </div>

                {overrideRetro && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <RadioGroup
                        value={retroType || ''}
                        onValueChange={(v) => setRetroType(v as 'pourcentage' | 'fixe')}
                        className="flex gap-4"
                      >
                        <Label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="pourcentage" />
                          <span className="text-sm">Pourcentage</span>
                        </Label>
                        <Label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="fixe" />
                          <span className="text-sm">Fixe</span>
                        </Label>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>{retroType === 'pourcentage' ? 'Pourcentage (%)' : 'Montant (CHF)'}</Label>
                      <Input
                        type="number"
                        step={retroType === 'pourcentage' ? '0.1' : '1'}
                        value={retroValeur ?? ''}
                        onChange={(e) => setRetroValeur(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </FormSection>
      )}

      {/* RECOMMANDATION */}
      {source === 'recommandation' && (
        <FormSection title="Recommandation" variant="highlight">
          <FormRow label="Recommandé par">
            <Input
              value={recommandePar}
              onChange={(e) => setRecommandePar(e.target.value)}
              placeholder="Nom du client ou contact"
            />
          </FormRow>
        </FormSection>
      )}

      {/* COORDONNÉES */}
      <FormSection title="Coordonnées du lead">
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Nom" required>
            <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
          </FormRow>
          <FormRow label="Prénom">
            <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" />
          </FormRow>
          <FormRow label="Téléphone">
            <Input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+41 79 000 00 00" />
          </FormRow>
          <FormRow label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
          </FormRow>
        </div>
      </FormSection>

      {/* TYPE DE DEMANDE */}
      <FormSection title="Type de demande">
        <RadioGroup
          value={typeDemande}
          onValueChange={(v) => setTypeDemande(v as LeadTypeDemande)}
          className="grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="type-estimation"
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
              typeDemande === 'estimation'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="estimation" id="type-estimation" className="sr-only" />
            <Home className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Demande d'estimation</p>
              <p className="text-xs text-muted-foreground">Le lead souhaite estimer un bien</p>
            </div>
          </Label>
          <Label
            htmlFor="type-qualifier"
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
              typeDemande === 'a_qualifier'
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="a_qualifier" id="type-qualifier" className="sr-only" />
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Lead à qualifier</p>
              <p className="text-xs text-muted-foreground">Besoin à déterminer</p>
            </div>
          </Label>
        </RadioGroup>
      </FormSection>

      {/* BIEN */}
      {typeDemande === 'estimation' && (
        <FormSection title="Informations sur le bien" variant="highlight">
          <div className="space-y-4">
            <FormRow label="Adresse">
              <Input
                value={bienAdresse}
                onChange={(e) => setBienAdresse(e.target.value)}
                placeholder="Rue et numéro"
              />
            </FormRow>
            <div className="grid grid-cols-3 gap-4">
              <FormRow label="NPA">
                <Input value={bienNpa} onChange={(e) => setBienNpa(e.target.value)} placeholder="1200" />
              </FormRow>
              <div className="col-span-2">
                <FormRow label="Localité">
                  <Input value={bienLocalite} onChange={(e) => setBienLocalite(e.target.value)} placeholder="Genève" />
                </FormRow>
              </div>
            </div>
            <FormRow label="Type de bien">
              <Select value={bienType || ''} onValueChange={(v) => setBienType(v as BienType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {BIEN_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          </div>
        </FormSection>
      )}

      {/* ASSIGNATION */}
      <FormSection title="Assignation">
        <div className="grid grid-cols-2 gap-4">
          <FormRow label="Courtier assigné" required>
            <Select value={assignedTo || ''} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un courtier" />
              </SelectTrigger>
              <SelectContent>
                {courtiers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Rappeler avant le" optional>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !rappelDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {rappelDate ? format(rappelDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={rappelDate}
                  onSelect={setRappelDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </FormRow>
        </div>
      </FormSection>

      {/* NOTES */}
      <FormSection title="Notes">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informations complémentaires..."
          rows={4}
        />
      </FormSection>

      {/* FOOTER */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => navigate('/leads')}>
          Annuler
        </Button>
        <Button type="submit" disabled={createLead.isPending}>
          {createLead.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      <PartnerFormModal
        open={partnerModalOpen}
        onOpenChange={setPartnerModalOpen}
        onPartnerCreated={handlePartnerCreated}
      />
    </form>
  );
};
