import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { AddressAutocomplete, AddressDetails } from '@/components/address/AddressAutocomplete';
import { usePartners } from '@/hooks/usePartners';
import { useCourtiers } from '@/hooks/useLeads';
import { useCreateLead, useUpdateLead } from '@/hooks/useLeadMutations';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Package, Smartphone, Phone, Globe, Users, Handshake, CalendarDays, HelpCircle,
  Home, ClipboardList, CalendarIcon, Plus, Megaphone
} from 'lucide-react';
import { 
  LeadSource, LeadTypeDemande, LeadStatut, Partner, BienType,
  LEAD_SOURCE_OPTIONS, LEAD_STATUT_OPTIONS, BIEN_TYPE_OPTIONS 
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

interface LeadFormData {
  id: string;
  source: string;
  source_detail: string | null;
  partner_id: string | null;
  campagne_id: string | null;
  retro_type: string | null;
  retro_valeur: number | null;
  recommande_par: string | null;
  nom: string;
  prenom: string | null;
  telephone: string | null;
  email: string | null;
  type_demande: string;
  statut: string;
  perdu_raison: string | null;
  bien_adresse: string | null;
  bien_npa: string | null;
  bien_localite: string | null;
  bien_type: string | null;
  assigned_to: string | null;
  rappel_date: string | null;
  notes: string | null;
}

interface LeadFormProps {
  mode?: 'create' | 'edit';
  initialData?: LeadFormData;
  onSuccess?: () => void;
}

export const LeadForm = ({ mode = 'create', initialData, onSuccess }: LeadFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: partners = [] } = usePartners();
  const { data: courtiers = [] } = useCourtiers();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  // Fetch active campaigns for boitage source
  const { data: campagnes = [] } = useQuery({
    queryKey: ['campagnes-active-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campagnes')
        .select('id, code, commune')
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const [partnerModalOpen, setPartnerModalOpen] = useState(false);

  // Form state
  const [source, setSource] = useState<LeadSource>((initialData?.source as LeadSource) || 'telephone');
  const [sourceDetail, setSourceDetail] = useState(initialData?.source_detail || '');
  const [partnerId, setPartnerId] = useState<string | null>(initialData?.partner_id || null);
  const [campagneId, setCampagneId] = useState<string | null>(initialData?.campagne_id || null);
  const [retroType, setRetroType] = useState<'pourcentage' | 'fixe' | null>(
    (initialData?.retro_type as 'pourcentage' | 'fixe' | null) || null
  );
  const [retroValeur, setRetroValeur] = useState<number | null>(initialData?.retro_valeur || null);
  const [overrideRetro, setOverrideRetro] = useState(mode === 'edit' && !!initialData?.retro_valeur);
  const [recommandePar, setRecommandePar] = useState(initialData?.recommande_par || '');
  const [nom, setNom] = useState(initialData?.nom || '');
  const [prenom, setPrenom] = useState(initialData?.prenom || '');
  const [telephone, setTelephone] = useState(initialData?.telephone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [typeDemande, setTypeDemande] = useState<LeadTypeDemande>(
    (initialData?.type_demande as LeadTypeDemande) || 'estimation'
  );
  const [statut, setStatut] = useState<LeadStatut>((initialData?.statut as LeadStatut) || 'nouveau');
  const [perduRaison, setPerduRaison] = useState(initialData?.perdu_raison || '');
  const [bienAdresse, setBienAdresse] = useState(initialData?.bien_adresse || '');
  const [bienNpa, setBienNpa] = useState(initialData?.bien_npa || '');
  const [bienLocalite, setBienLocalite] = useState(initialData?.bien_localite || '');
  const [bienType, setBienType] = useState<BienType | null>((initialData?.bien_type as BienType) || null);
  const [assignedTo, setAssignedTo] = useState<string | null>(initialData?.assigned_to || null);
  const [rappelDate, setRappelDate] = useState<Date | undefined>(
    initialData?.rappel_date ? parseISO(initialData.rappel_date) : undefined
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Set default assignedTo to current user in create mode
  useEffect(() => {
    if (mode === 'create' && user && !assignedTo) {
      setAssignedTo(user.id);
    }
  }, [user, assignedTo, mode]);

  // Update retro values when partner changes (only in create mode or if not overriding)
  const selectedPartner = partners.find(p => p.id === partnerId);
  useEffect(() => {
    if (selectedPartner && !overrideRetro && mode === 'create') {
      setRetroType(selectedPartner.retro_default_type === 'aucune' ? null : selectedPartner.retro_default_type);
      setRetroValeur(selectedPartner.retro_default_valeur);
    }
  }, [selectedPartner, overrideRetro, mode]);

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

    const formData = {
      source,
      source_detail: sourceDetail || null,
      partner_id: source === 'partenariat' ? partnerId : null,
      campagne_id: source === 'boitage' ? campagneId : null,
      retro_type: source === 'partenariat' && partnerId ? retroType : null,
      retro_valeur: source === 'partenariat' && partnerId ? retroValeur : null,
      recommande_par: source === 'recommandation' ? recommandePar : null,
      nom,
      prenom: prenom || null,
      telephone: telephone || null,
      email: email || null,
      type_demande: typeDemande,
      statut: mode === 'edit' ? statut : 'nouveau',
      perdu_raison: statut === 'perdu' ? perduRaison || null : null,
      bien_adresse: typeDemande === 'estimation' ? bienAdresse || null : null,
      bien_npa: typeDemande === 'estimation' ? bienNpa || null : null,
      bien_localite: typeDemande === 'estimation' ? bienLocalite || null : null,
      bien_type: typeDemande === 'estimation' ? bienType : null,
      assigned_to: assignedTo,
      rappel_date: rappelDate ? format(rappelDate, 'yyyy-MM-dd') : null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    };

    try {
      if (mode === 'edit' && initialData) {
        await updateLead.mutateAsync({
          id: initialData.id,
          ...formData,
        });
        toast({ title: 'Succès', description: 'Lead mis à jour' });
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(`/leads/${initialData.id}`);
        }
      } else {
        await createLead.mutateAsync({
          ...formData,
          created_by: user?.id || null,
          estimation_id: null,
          converti_at: null,
          rdv_date: null,
        });
        toast({ title: 'Succès', description: 'Lead créé avec succès' });
        navigate('/leads');
      }
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({ 
        title: 'Erreur', 
        description: mode === 'edit' ? 'Impossible de mettre à jour le lead' : 'Impossible de créer le lead', 
        variant: 'destructive' 
      });
    }
  };

  const isPending = createLead.isPending || updateLead.isPending;
  const cancelPath = mode === 'edit' && initialData ? `/leads/${initialData.id}` : '/leads';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* STATUT - Only in edit mode */}
      {mode === 'edit' && (
        <FormSection title="Statut">
          <div className="space-y-4">
            <FormRow label="Statut du lead">
              <Select value={statut} onValueChange={(v) => setStatut(v as LeadStatut)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
            
            {statut === 'perdu' && (
              <FormRow label="Raison de la perte">
                <Textarea
                  value={perduRaison}
                  onChange={(e) => setPerduRaison(e.target.value)}
                  placeholder="Pourquoi ce lead n'a pas abouti ?"
                  rows={2}
                />
              </FormRow>
            )}
          </div>
        </FormSection>
      )}

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

          {/* Campagne dropdown pour source boitage */}
          {source === 'boitage' && (
            <FormRow label="Campagne associée" optional>
              <Select 
                value={campagneId || '__none__'} 
                onValueChange={(v) => setCampagneId(v === '__none__' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une campagne" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="__none__">Aucune campagne</SelectItem>
                  {campagnes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-3 w-3 text-muted-foreground" />
                        <span>{c.code} — {c.commune}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          )}

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
              <AddressAutocomplete
                value={bienAdresse}
                onAddressSelect={(details: AddressDetails) => {
                  setBienAdresse(details.rue || details.formatted || '');
                  if (details.postalCode || details.codePostal) {
                    setBienNpa(details.postalCode || details.codePostal || '');
                  }
                  if (details.locality || details.localite) {
                    setBienLocalite(details.locality || details.localite || '');
                  }
                }}
                placeholder="Commencez à taper une adresse..."
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
                  {(typeDemande === 'estimation' 
                    ? BIEN_TYPE_OPTIONS.filter(opt => opt.value === 'appartement' || opt.value === 'villa')
                    : BIEN_TYPE_OPTIONS
                  ).map((opt) => (
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
        <Button type="button" variant="outline" onClick={() => navigate(cancelPath)}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending 
            ? 'Enregistrement...' 
            : mode === 'edit' 
              ? 'Enregistrer les modifications' 
              : 'Enregistrer'
          }
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
