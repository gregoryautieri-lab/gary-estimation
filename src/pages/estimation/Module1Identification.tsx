import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { LockBanner } from '@/components/gary/LockBanner';
import { CourtierSelector } from '@/components/gary/CourtierSelector';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useEstimationLock } from '@/hooks/useEstimationLock';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { ChevronRight, Save, Loader2 } from 'lucide-react';
import type { EstimationData, Identification, MapState } from '@/types/estimation';
import { defaultIdentification, defaultEstimation } from '@/types/estimation';
import { AddressAutocomplete } from '@/components/address/AddressAutocomplete';
import { LocationPreview } from '@/components/maps/LocationPreview';
import { CadastreMap } from '@/components/maps/CadastreMap';
import { ProximitesEditor } from '@/components/gary/ProximitesEditor';

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

const PORTAILS_OPTIONS = [
  { value: 'immoscout', label: 'ImmoScout24' },
  { value: 'homegate', label: 'Homegate' },
  { value: 'acheterlouer', label: 'Acheter-Louer' },
  { value: 'anibis', label: 'Anibis' },
  { value: 'immostreet', label: 'ImmoStreet' },
  { value: 'comparis', label: 'Comparis' },
  { value: 'newhome', label: 'Newhome' },
  { value: 'autres', label: 'Autres portails' }
];

const RAISONS_ECHEC = [
  { value: 'prix_eleve', label: 'Prix trop élevé' },
  { value: 'mauvaises_photos', label: 'Photos de mauvaise qualité' },
  { value: 'description_faible', label: 'Description insuffisante' },
  { value: 'visibilite_faible', label: 'Manque de visibilité' },
  { value: 'agence_passive', label: 'Agence peu réactive' },
  { value: 'marche_difficile', label: 'Marché difficile' },
  { value: 'bien_atypique', label: 'Bien atypique' },
  { value: 'travaux_importants', label: 'Travaux à prévoir' },
  { value: 'emplacement', label: 'Emplacement peu attractif' },
  { value: 'autre', label: 'Autre raison' }
];

// Projet Post-Vente options
const NATURES_PROJET = [
  { value: 'achat', label: 'Achat d\'un nouveau bien' },
  { value: 'location', label: 'Location' },
  { value: 'depart', label: 'Départ (étranger, EMS, etc.)' },
  { value: 'autre', label: 'Autre projet' },
  { value: 'non_concerne', label: 'Non concerné / Pas de projet' }
];

const AVANCEMENTS_PROJET = [
  { value: 'pas_commence', label: 'Pas encore commencé' },
  { value: 'recherche', label: 'En recherche active' },
  { value: 'bien_identifie', label: 'Bien identifié' },
  { value: 'offre_deposee', label: 'Offre déposée' },
  { value: 'compromis_signe', label: 'Compromis signé' },
  { value: 'acte_programme', label: 'Acte programmé' }
];

const FLEXIBILITES = [
  { value: 'faible', label: 'Faible - Dates impératives' },
  { value: 'moyenne', label: 'Moyenne - Quelques semaines' },
  { value: 'elevee', label: 'Élevée - Très flexible' }
];

const NIVEAUX_COORDINATION = [
  { value: 'vente_seule', label: 'Vente seule (pas d\'achat lié)' },
  { value: 'legere', label: 'Coordination légère' },
  { value: 'active', label: 'Coordination active requise' },
  { value: 'achat_envisageable', label: 'Achat envisageable avec GARY' },
  { value: 'achat_souhaite', label: 'Achat souhaité avec GARY' }
];

const MOIS_OPTIONS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' }
];

const ANNEES_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() + i;
  return { value: year.toString(), label: year.toString() };
});

const Module1Identification = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, duplicateEstimation, loading } = useEstimationPersistence();
  const { saveLocal } = useOfflineSync();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [identification, setIdentification] = useState<Identification>(defaultIdentification);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  
  // Verrouillage selon statut
  const { isLocked, lockMessage } = useEstimationLock(estimation?.statut);

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
      // Deep merge pour préserver les objets imbriqués (adresse, vendeur, etc.)
      const ident = (data.identification || {}) as Partial<Identification>;
      setIdentification({
        ...defaultIdentification,
        ...ident,
        adresse: {
          ...defaultIdentification.adresse,
          ...(ident.adresse || {})
        },
        vendeur: {
          ...defaultIdentification.vendeur,
          ...(ident.vendeur || {})
        },
        contexte: {
          ...defaultIdentification.contexte,
          ...(ident.contexte || {})
        },
        historique: {
          ...defaultIdentification.historique,
          ...(ident.historique || {})
        },
        financier: {
          ...defaultIdentification.financier,
          ...(ident.financier || {})
        },
        projetPostVente: {
          ...defaultIdentification.projetPostVente,
          ...(ident.projetPostVente || {})
        },
        proximites: ident.proximites || defaultIdentification.proximites
      });
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

  // Toggle pour les tableaux (portails, raisons échec, etc.)
  const toggleArrayField = (
    section: 'historique',
    field: 'portails' | 'raisonEchec',
    value: string
  ) => {
    setIdentification(prev => {
      const currentArray = prev[section][field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  const handleSave = async (goNext = false) => {
    if (!id || isLocked) return;
    setSaving(true);
    
    const dataToSave = {
      identification,
      vendeurNom: identification.vendeur.nom,
      vendeurEmail: identification.vendeur.email,
      vendeurTelephone: identification.vendeur.telephone,
      adresse: identification.adresse.rue,
      codePostal: identification.adresse.codePostal,
      localite: identification.adresse.localite
    };
    
    // Sauvegarde locale immédiate (offline-first)
    saveLocal(id, dataToSave);
    
    // Puis sync avec Supabase
    const updated = await updateEstimation(id, dataToSave, true);
    
    setSaving(false);
    
    if (goNext && updated) {
      navigate(`/estimation/${id}/2`);
    }
  };
  
  const handleDuplicate = async () => {
    if (!id) return;
    setDuplicating(true);
    const duplicated = await duplicateEstimation(id);
    setDuplicating(false);
    if (duplicated) {
      navigate(`/estimation/${duplicated.id}/1`);
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
        {/* Bandeau de verrouillage */}
        {isLocked && lockMessage && (
          <LockBanner 
            message={lockMessage} 
            onDuplicate={handleDuplicate}
            duplicating={duplicating}
          />
        )}
        
        {/* Courtier en charge */}
        <FormSection icon="👤" title="Courtier en charge">
          <CourtierSelector
            value={identification.courtierAssigne || ''}
            onChange={(courtierId) => setIdentification(prev => ({
              ...prev,
              courtierAssigne: courtierId
            }))}
            disabled={isLocked}
          />
        </FormSection>
        
        {/* Vendeur */}
        <FormSection icon="🏠" title="Vendeur">
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

        {/* Proximités */}
        <FormSection icon="📍" title="Proximités">
          <p className="text-sm text-muted-foreground mb-4">
            Points d'intérêt à proximité du bien — renseignez les informations pertinentes.
          </p>
          <ProximitesEditor
            proximites={identification.proximites}
            coordinates={identification.adresse.coordinates}
            onChange={(proximites) => setIdentification(prev => ({ ...prev, proximites }))}
            disabled={isLocked}
          />
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
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Prix initial">
                  <Input
                    placeholder="CHF"
                    value={identification.historique.prixInitial || ''}
                    onChange={(e) => updateField('historique', 'prixInitial', e.target.value)}
                  />
                </FormRow>
                <FormRow label="Dernier prix affiché">
                  <Input
                    placeholder="CHF"
                    value={identification.historique.prixAffiche}
                    onChange={(e) => updateField('historique', 'prixAffiche', e.target.value)}
                  />
                </FormRow>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Portails utilisés */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Portails utilisés</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PORTAILS_OPTIONS.map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`portail-${opt.value}`}
                        checked={identification.historique.portails?.includes(opt.value) || false}
                        onCheckedChange={() => toggleArrayField('historique', 'portails', opt.value)}
                      />
                      <Label htmlFor={`portail-${opt.value}`} className="text-sm cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raisons d'échec */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Raisons de l'échec</Label>
                <div className="grid grid-cols-2 gap-2">
                  {RAISONS_ECHEC.map(opt => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`raison-${opt.value}`}
                        checked={identification.historique.raisonEchec?.includes(opt.value) || false}
                        onCheckedChange={() => toggleArrayField('historique', 'raisonEchec', opt.value)}
                      />
                      <Label htmlFor={`raison-${opt.value}`} className="text-sm cursor-pointer">
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {identification.historique.raisonEchec?.includes('autre') && (
                  <Input
                    placeholder="Précisez la raison..."
                    value={identification.historique.raisonEchecDetail || ''}
                    onChange={(e) => updateField('historique', 'raisonEchecDetail', e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Agence précédente" optional>
                  <Input
                    placeholder="Nom de l'agence"
                    value={identification.historique.agencePrecedente || ''}
                    onChange={(e) => updateField('historique', 'agencePrecedente', e.target.value)}
                  />
                </FormRow>
                <FormRow label="Nb visites effectuées" optional>
                  <Input
                    type="number"
                    placeholder="0"
                    value={identification.historique.visitesPrecedentes || ''}
                    onChange={(e) => updateField('historique', 'visitesPrecedentes', parseInt(e.target.value) || undefined)}
                  />
                </FormRow>
              </div>

              <FormRow label="Offres reçues" optional>
                <Input
                  placeholder="Ex: 2 offres, meilleure à 1.2M"
                  value={identification.historique.offresRecues || ''}
                  onChange={(e) => updateField('historique', 'offresRecues', e.target.value)}
                />
              </FormRow>
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Prix d'achat">
              <Input
                placeholder="CHF"
                value={identification.financier.prixAchat}
                onChange={(e) => updateField('financier', 'prixAchat', e.target.value)}
              />
            </FormRow>
            <FormRow label="Valeur locative" optional>
              <Input
                placeholder="CHF"
                value={identification.financier.valeurLocative || ''}
                onChange={(e) => updateField('financier', 'valeurLocative', e.target.value)}
              />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Cédule hypothécaire">
              <Input
                placeholder="CHF"
                value={identification.financier.ceduleHypothecaire}
                onChange={(e) => updateField('financier', 'ceduleHypothecaire', e.target.value)}
              />
            </FormRow>
            <FormRow label="Montant hypothèque" optional>
              <Input
                placeholder="CHF"
                value={identification.financier.montantHypotheque || ''}
                onChange={(e) => updateField('financier', 'montantHypotheque', e.target.value)}
              />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormRow label="Charges annuelles" optional>
              <Input
                placeholder="CHF/an"
                value={identification.financier.chargesAnnuelles || ''}
                onChange={(e) => updateField('financier', 'chargesAnnuelles', e.target.value)}
              />
            </FormRow>
            <FormRow label="Impôt foncier" optional>
              <Input
                placeholder="CHF/an"
                value={identification.financier.impotFoncier || ''}
                onChange={(e) => updateField('financier', 'impotFoncier', e.target.value)}
              />
            </FormRow>
          </div>
        </FormSection>

        {/* Fin de bail (si locataire) */}
        {identification.contexte.statutOccupation === 'occupe_locataire' && (
          <FormSection icon="📅" title="Fin de bail">
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Mois">
                <Select
                  value={identification.contexte.finBailMois}
                  onValueChange={(value) => updateField('contexte', 'finBailMois', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mois..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOIS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Année">
                <Select
                  value={identification.contexte.finBailAnnee}
                  onValueChange={(value) => updateField('contexte', 'finBailAnnee', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Année..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ANNEES_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
            </div>
          </FormSection>
        )}

        {/* Projet Post-Vente */}
        <FormSection icon="🎯" title="Projet post-vente">
          <FormRow label="Nature du projet">
            <Select
              value={identification.projetPostVente.nature}
              onValueChange={(value) => updateField('projetPostVente', 'nature', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                {NATURES_PROJET.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>

          {identification.projetPostVente.nature && identification.projetPostVente.nature !== 'non_concerne' && (
            <div className="space-y-4 pt-2">
              {identification.projetPostVente.nature === 'achat' && (
                <>
                  <FormRow label="Avancement du projet">
                    <Select
                      value={identification.projetPostVente.avancement}
                      onValueChange={(value) => updateField('projetPostVente', 'avancement', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AVANCEMENTS_PROJET.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormRow>

                  <div className="grid grid-cols-2 gap-3">
                    <FormRow label="Budget projet suivant" optional>
                      <Input
                        placeholder="CHF"
                        value={identification.projetPostVente.budgetProjetSuivant || ''}
                        onChange={(e) => updateField('projetPostVente', 'budgetProjetSuivant', e.target.value)}
                      />
                    </FormRow>
                    <FormRow label="Région recherchée" optional>
                      <Input
                        placeholder="Ex: Rive droite"
                        value={identification.projetPostVente.regionRecherche || ''}
                        onChange={(e) => updateField('projetPostVente', 'regionRecherche', e.target.value)}
                      />
                    </FormRow>
                  </div>

                  <FormRow label="Niveau de coordination">
                    <Select
                      value={identification.projetPostVente.niveauCoordination}
                      onValueChange={(value) => updateField('projetPostVente', 'niveauCoordination', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEAUX_COORDINATION.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormRow>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Date cible">
                  <Input
                    type="date"
                    value={identification.projetPostVente.dateCible}
                    onChange={(e) => updateField('projetPostVente', 'dateCible', e.target.value)}
                  />
                </FormRow>
                <FormRow label="Date butoir" optional>
                  <Input
                    type="date"
                    value={identification.projetPostVente.dateButoir || ''}
                    onChange={(e) => updateField('projetPostVente', 'dateButoir', e.target.value)}
                  />
                </FormRow>
              </div>

              <FormRow label="Flexibilité sur les dates">
                <Select
                  value={identification.projetPostVente.flexibilite}
                  onValueChange={(value) => updateField('projetPostVente', 'flexibilite', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FLEXIBILITES.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>

              {/* Tolérances stratégiques */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tolérances du vendeur</Label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tol-vente-longue"
                      checked={identification.projetPostVente.toleranceVenteLongue || false}
                      onCheckedChange={(checked) => updateField('projetPostVente', 'toleranceVenteLongue', !!checked)}
                    />
                    <Label htmlFor="tol-vente-longue" className="text-sm cursor-pointer">
                      Accepte une vente plus longue si meilleur prix
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tol-vente-rapide"
                      checked={identification.projetPostVente.toleranceVenteRapide || false}
                      onCheckedChange={(checked) => updateField('projetPostVente', 'toleranceVenteRapide', !!checked)}
                    />
                    <Label htmlFor="tol-vente-rapide" className="text-sm cursor-pointer">
                      Accepte un prix inférieur pour vendre vite
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tol-decalage"
                      checked={identification.projetPostVente.accepteDecalage === 'oui'}
                      onCheckedChange={(checked) => updateField('projetPostVente', 'accepteDecalage', checked ? 'oui' : 'non')}
                    />
                    <Label htmlFor="tol-decalage" className="text-sm cursor-pointer">
                      Accepte un décalage entre vente et achat
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tol-transitoire"
                      checked={identification.projetPostVente.accepteTransitoire === 'oui'}
                      onCheckedChange={(checked) => updateField('projetPostVente', 'accepteTransitoire', checked ? 'oui' : 'non')}
                    />
                    <Label htmlFor="tol-transitoire" className="text-sm cursor-pointer">
                      Accepte un logement transitoire
                    </Label>
                  </div>
                </div>
              </div>

              <FormRow label="Commentaire projet" optional>
                <Textarea
                  placeholder="Notes libres sur le projet post-vente..."
                  value={identification.projetPostVente.commentaireProjet || ''}
                  onChange={(e) => updateField('projetPostVente', 'commentaireProjet', e.target.value)}
                  rows={2}
                />
              </FormRow>
            </div>
          )}
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
            disabled={saving || isLocked}
          >
            {saving ? 'Enregistrement...' : isLocked ? 'Lecture seule' : 'Suivant'}
            {!saving && !isLocked && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Module1Identification;
