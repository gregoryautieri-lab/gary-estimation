import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { ChevronRight, Save, Loader2 } from 'lucide-react';
import type { EstimationData, Identification, MapState } from '@/types/estimation';
import { defaultIdentification, defaultEstimation } from '@/types/estimation';
import { AddressAutocomplete } from '@/components/address/AddressAutocomplete';
import { LocationPreview } from '@/components/maps/LocationPreview';
import { CadastreMap } from '@/components/maps/CadastreMap';

// Options pour les selects
const MOTIFS_VENTE = [
  { value: 'mutation', label: 'Mutation professionnelle' },
  { value: 'separation', label: 'Séparation / Divorce' },
  { value: 'succession', label: 'Succession' },
  { value: 'investissement', label: 'Réalisation investissement' },
  { value: 'agrandissement', label: 'Recherche plus grand' },
  { value: 'reduction', label: 'Recherche plus petit' },
  { value: 'retraite', label: 'Départ à la retraite' },
  { value: 'autre', label: 'Autre' }
];

const HORIZONS = [
  { value: 'urgent', label: 'Urgent (< 1 mois)' },
  { value: 'court', label: 'Court terme (1-3 mois)' },
  { value: 'moyen', label: 'Moyen terme (3-6 mois)' },
  { value: 'long', label: 'Long terme (6-12 mois)' },
  { value: 'flexible', label: 'Flexible' }
];

const SITUATIONS_VENDEUR = [
  { value: 'proprietaire', label: 'Propriétaire occupant' },
  { value: 'bailleur', label: 'Bailleur' },
  { value: 'heritier', label: 'Héritier' },
  { value: 'investisseur', label: 'Investisseur' }
];

const STATUTS_OCCUPATION = [
  { value: 'occupe_vendeur', label: 'Occupé par le vendeur' },
  { value: 'occupe_locataire', label: 'Occupé par un locataire' },
  { value: 'libre', label: 'Libre' },
  { value: 'bientot_libre', label: 'Bientôt libre' }
];

const CONFIDENTIALITES = [
  { value: 'normale', label: 'Normale - Diffusion standard' },
  { value: 'discrete', label: 'Discrète - Portails limités' },
  { value: 'confidentielle', label: 'Confidentielle - Réseau uniquement' }
];

const PRIORITES = [
  { value: 'prixMax', label: 'Prix maximum' },
  { value: 'rapidite', label: 'Rapidité de vente' },
  { value: 'equilibre', label: 'Équilibre prix/délai' }
];

const DUREES_DIFFUSION = [
  { value: 'moins1mois', label: 'Moins d\'1 mois' },
  { value: '1-3mois', label: '1 à 3 mois' },
  { value: '3-6mois', label: '3 à 6 mois' },
  { value: '6-12mois', label: '6 à 12 mois' },
  { value: 'plus12mois', label: 'Plus de 12 mois' }
];

const TYPES_DIFFUSION = [
  { value: 'discrete', label: 'Discrète (réseau, off-market)' },
  { value: 'moderee', label: 'Modérée (quelques portails)' },
  { value: 'massive', label: 'Massive (tous portails)' }
];

const Module1Identification = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [identification, setIdentification] = useState<Identification>(defaultIdentification);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadEstimation();
    }
  }, [id]);

  const loadEstimation = async () => {
    if (!id) return;
    const data = await fetchEstimation(id);
    if (data) {
      setEstimation(data);
      setIdentification({ ...defaultIdentification, ...data.identification });
    }
  };

  const updateField = <K extends keyof Identification>(
    section: K,
    field: keyof Identification[K],
    value: unknown
  ) => {
    setIdentification(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value
      }
    }));
  };

  const handleSave = async (goNext = false) => {
    if (!id) return;
    setSaving(true);
    
    const updated = await updateEstimation(id, {
      identification,
      vendeurNom: identification.vendeur.nom,
      vendeurEmail: identification.vendeur.email,
      vendeurTelephone: identification.vendeur.telephone,
      adresse: identification.adresse.rue,
      codePostal: identification.adresse.codePostal,
      localite: identification.adresse.localite
    }, true);
    
    setSaving(false);
    
    if (goNext && updated) {
      navigate(`/estimation/${id}/2`);
    }
  };

  if (loading && !estimation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ModuleHeader
        moduleNumber={1}
        title="Identification"
        subtitle="Vendeur, bien et contexte"
        backPath="/estimations"
      />

      <main className="flex-1 p-4 pb-32 space-y-4">
        {/* Vendeur */}
        <FormSection icon="👤" title="Vendeur">
          <FormRow label="Nom complet" required>
            <Input
              placeholder="Prénom Nom"
              value={identification.vendeur.nom}
              onChange={(e) => updateField('vendeur', 'nom', e.target.value)}
            />
          </FormRow>
          <FormRow label="Téléphone">
            <Input
              type="tel"
              placeholder="+41 79 123 45 67"
              value={identification.vendeur.telephone}
              onChange={(e) => updateField('vendeur', 'telephone', e.target.value)}
            />
          </FormRow>
          <FormRow label="Email">
            <Input
              type="email"
              placeholder="email@exemple.ch"
              value={identification.vendeur.email}
              onChange={(e) => updateField('vendeur', 'email', e.target.value)}
            />
          </FormRow>
          <FormRow label="Situation">
            <Select
              value={identification.vendeur.situation}
              onValueChange={(value) => updateField('vendeur', 'situation', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {SITUATIONS_VENDEUR.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>

        {/* Adresse */}
        <FormSection icon="📍" title="Adresse du bien">
          <FormRow label="Recherche d'adresse">
            <AddressAutocomplete
              value={identification.adresse.rue}
              placeholder="Tapez une adresse suisse..."
              onAddressSelect={(details) => {
                setIdentification(prev => ({
                  ...prev,
                  adresse: {
                    ...prev.adresse,
                    rue: details.rue,
                    codePostal: details.codePostal,
                    localite: details.localite,
                    canton: details.canton,
                    coordinates: details.coordinates,
                    placeId: details.placeId
                  }
                }));
              }}
            />
          </FormRow>
          <FormRow label="Rue et numéro" required>
            <Input
              placeholder="Rue du Marché 1"
              value={identification.adresse.rue}
              onChange={(e) => updateField('adresse', 'rue', e.target.value)}
            />
          </FormRow>
          <div className="grid grid-cols-3 gap-3">
            <FormRow label="NPA">
              <Input
                placeholder="1204"
                value={identification.adresse.codePostal}
                onChange={(e) => updateField('adresse', 'codePostal', e.target.value)}
              />
            </FormRow>
            <div className="col-span-2">
              <FormRow label="Localité">
                <Input
                  placeholder="Genève"
                  value={identification.adresse.localite}
                  onChange={(e) => updateField('adresse', 'localite', e.target.value)}
                />
              </FormRow>
            </div>
          </div>
          {identification.adresse.coordinates && (
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Coordonnées GPS : {identification.adresse.coordinates.lat.toFixed(5)}, {identification.adresse.coordinates.lng.toFixed(5)}
            </div>
          )}

          {/* Carte Google Maps */}
          <div className="mt-4">
            <LocationPreview
              coordinates={identification.adresse.coordinates || null}
              initialMapState={identification.adresse.mapState}
              onMapStateChange={(mapState) => {
                setIdentification(prev => ({
                  ...prev,
                  adresse: {
                    ...prev.adresse,
                    mapState
                  }
                }));
              }}
            />
          </div>

          {/* Plan cadastral Swisstopo */}
          <div className="mt-4">
            <CadastreMap
              coordinates={identification.adresse.coordinates || null}
              initialZoom={identification.adresse.cadastreZoom}
              onZoomChange={(zoom) => {
                setIdentification(prev => ({
                  ...prev,
                  adresse: {
                    ...prev.adresse,
                    cadastreZoom: zoom
                  }
                }));
              }}
            />
          </div>
        </FormSection>

        {/* Contexte */}
        <FormSection icon="📋" title="Contexte de vente">
          <FormRow label="Motif de vente">
            <Select
              value={identification.contexte.motifVente}
              onValueChange={(value) => updateField('contexte', 'motifVente', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIFS_VENTE.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Horizon de vente souhaité">
            <Select
              value={identification.contexte.horizon}
              onValueChange={(value) => updateField('contexte', 'horizon', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {HORIZONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Prix attendu par le vendeur">
            <Input
              type="text"
              placeholder="CHF"
              value={identification.contexte.prixAttendu}
              onChange={(e) => updateField('contexte', 'prixAttendu', e.target.value)}
            />
          </FormRow>
          <FormRow label="Statut d'occupation">
            <Select
              value={identification.contexte.statutOccupation}
              onValueChange={(value) => updateField('contexte', 'statutOccupation', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {STATUTS_OCCUPATION.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Niveau de confidentialité">
            <Select
              value={identification.contexte.confidentialite}
              onValueChange={(value) => updateField('contexte', 'confidentialite', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {CONFIDENTIALITES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Priorité du vendeur">
            <Select
              value={identification.contexte.prioriteVendeur}
              onValueChange={(value) => updateField('contexte', 'prioriteVendeur', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {PRIORITES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>

        {/* Historique */}
        <FormSection icon="📊" title="Historique de diffusion">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium">Bien déjà mis en vente ?</span>
            <Switch
              checked={identification.historique.dejaDiffuse}
              onCheckedChange={(checked) => updateField('historique', 'dejaDiffuse', checked)}
            />
          </div>
          
          {identification.historique.dejaDiffuse && (
            <>
              <FormRow label="Durée de mise en vente">
                <Select
                  value={identification.historique.duree}
                  onValueChange={(value) => updateField('historique', 'duree', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DUREES_DIFFUSION.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Prix affiché">
                <Input
                  placeholder="CHF"
                  value={identification.historique.prixAffiche}
                  onChange={(e) => updateField('historique', 'prixAffiche', e.target.value)}
                />
              </FormRow>
              <FormRow label="Type de diffusion">
                <Select
                  value={identification.historique.typeDiffusion}
                  onValueChange={(value) => updateField('historique', 'typeDiffusion', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES_DIFFUSION.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
            </>
          )}
        </FormSection>

        {/* Infos financières */}
        <FormSection icon="💰" title="Informations financières">
          <FormRow label="Date d'achat">
            <Input
              type="date"
              value={identification.financier.dateAchat}
              onChange={(e) => updateField('financier', 'dateAchat', e.target.value)}
            />
          </FormRow>
          <FormRow label="Prix d'achat">
            <Input
              placeholder="CHF"
              value={identification.financier.prixAchat}
              onChange={(e) => updateField('financier', 'prixAchat', e.target.value)}
            />
          </FormRow>
          <FormRow label="Cédule hypothécaire">
            <Input
              placeholder="CHF"
              value={identification.financier.ceduleHypothecaire}
              onChange={(e) => updateField('financier', 'ceduleHypothecaire', e.target.value)}
            />
          </FormRow>
        </FormSection>
      </main>

      {/* Footer actions */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/estimations')}
          >
            Retour
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Suivant'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Module1Identification;
