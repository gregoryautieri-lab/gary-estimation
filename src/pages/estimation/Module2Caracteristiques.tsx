import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useCadastreLookup } from '@/hooks/useCadastreLookup';
import { EstimationData, defaultCaracteristiques, Caracteristiques, TypeBien } from '@/types/estimation';
import { toast } from 'sonner';
import { ChevronRight, Home, Building2, Key, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { 
  PictoChipsGrid, 
  RENOVATION_OPTIONS, 
  TRAVAUX_RECENTS_OPTIONS, 
  NUISANCES_OPTIONS,
  CHAUFFAGE_MAISON_OPTIONS 
} from '@/components/gary/PictoChipsGrid';

// Type de bien options
const typeBienOptions: { value: TypeBien | ''; label: string; icon: React.ElementType }[] = [
  { value: 'appartement', label: 'Appartement', icon: Building2 },
  { value: 'maison', label: 'Maison', icon: Home },
];

// Sous-catégories
const sousCategorieAppart = [
  { value: 'standard', label: 'Standard' },
  { value: 'standing', label: 'Standing' },
  { value: 'attique', label: 'Attique' },
  { value: 'duplex_triplex', label: 'Duplex / Triplex' },
  { value: 'sousplex', label: 'Sousplex' },
  { value: 'loft', label: 'Loft' },
  { value: 'studio', label: 'Studio' },
  { value: 'rez_jardin', label: 'Rez-jardin' },
  { value: 'hotel_particulier', label: 'Hôtel particulier' },
];

const sousCategorieMaison = [
  { value: 'villa', label: 'Villa individuelle' },
  { value: 'villa_mitoyenne', label: 'Villa mitoyenne' },
  { value: 'villa_jumelee', label: 'Villa jumelée' },
  { value: 'chalet', label: 'Chalet' },
  { value: 'fermette', label: 'Fermette' },
  { value: 'maison_village', label: 'Maison de village' },
];

// Options zones
const zoneOptions = [
  { value: 'villa', label: '5 - Zone villa' },
  { value: 'residentielle', label: '4 - Zone résidentielle' },
  { value: 'mixte', label: '3 - Zone mixte' },
  { value: 'developpement', label: 'Zone de développement' },
  { value: 'agricole', label: 'Zone agricole' },
];

const vueOptions = [
  { value: 'lac', label: 'Lac' },
  { value: 'montagne', label: 'Montagne' },
  { value: 'lac_montagne', label: 'Lac et montagne' },
  { value: 'degagee', label: 'Dégagée' },
  { value: 'jardin', label: 'Jardin' },
  { value: 'urbaine', label: 'Urbaine' },
  { value: 'aucune', label: 'Sans vue particulière' },
];

const expositionSimple = ['Nord', 'Est', 'Sud', 'Ouest'];

const ascenseurOptions = [
  { value: 'oui', label: 'Oui' },
  { value: 'non', label: 'Non' },
];

const etageOptions = Array.from({ length: 21 }, (_, i) => ({
  value: i.toString(),
  label: i === 0 ? 'Rez' : `${i}e`
}));

const etagesImmeubleOptions = Array.from({ length: 20 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}`
}));

const piecesOptions = Array.from({ length: 17 }, (_, i) => {
  const val = 1 + i * 0.5;
  return { value: val.toString(), label: val.toString() };
});

const chambresOptions = Array.from({ length: 10 }, (_, i) => ({
  value: i.toString(),
  label: i.toString()
}));

const sdbOptions = Array.from({ length: 6 }, (_, i) => ({
  value: i.toString(),
  label: i.toString()
}));

const wcOptions = Array.from({ length: 6 }, (_, i) => ({
  value: i.toString(),
  label: i.toString()
}));

const niveauxOptions = Array.from({ length: 5 }, (_, i) => ({
  value: (i + 1).toString(),
  label: (i + 1).toString()
}));

const parkingOptions = Array.from({ length: 6 }, (_, i) => ({
  value: i.toString(),
  label: i.toString()
}));

const boxOptions = Array.from({ length: 4 }, (_, i) => ({
  value: i.toString(),
  label: i.toString()
}));

const buanderieAppartOptions = [
  { value: 'privee', label: "Privée dans l'appartement" },
  { value: 'privee_cave', label: 'Privée en cave' },
  { value: 'commune', label: 'Commune' },
  { value: 'aucune', label: 'Aucune' },
];

const diffusionChaleurOptions = [
  { value: 'sol', label: 'Au sol', icon: '🔥' },
  { value: 'radiateurs', label: 'Radiateurs', icon: '📻' },
  { value: 'convecteurs', label: 'Convecteurs', icon: '🌀' },
  { value: 'poele', label: 'Poêle', icon: '🔥' },
  { value: 'cheminee', label: 'Cheminée', icon: '🏠' },
  { value: 'plafond', label: 'Plafond', icon: '⬆️' },
];

const vitrageOptions = [
  { value: 'simple', label: 'Simple vitrage' },
  { value: 'double', label: 'Double vitrage' },
  { value: 'triple', label: 'Triple vitrage' },
];

const cecbOptions = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'G', label: 'G' },
  { value: 'NC', label: 'Non certifié' },
];

// Espaces maison complet
const espacesMaisonOptions = [
  { value: 'cave', label: 'Cave', icon: '🍷' },
  { value: 'buanderie', label: 'Buanderie', icon: '🧺' },
  { value: 'local_technique', label: 'Local technique', icon: '⚙️' },
  { value: 'salle_jeux', label: 'Salle de jeux', icon: '🎮' },
  { value: 'home_cinema', label: 'Home cinéma', icon: '🎬' },
  { value: 'cellier', label: 'Cellier', icon: '🍾' },
  { value: 'abri_pc', label: 'Abri PC', icon: '🛡️' },
  { value: 'chambre_ss', label: 'Chambre', icon: '🛏️' },
  { value: 'sdb_ss', label: 'Salle de bain', icon: '🛁' },
  { value: 'wc_ss', label: 'WC', icon: '🚽' },
  { value: 'bureau', label: 'Bureau', icon: '💼' },
  { value: 'studio', label: 'Studio indép.', icon: '🏠' },
  { value: 'spa', label: 'Spa / Wellness', icon: '💆' },
  { value: 'sauna', label: 'Sauna', icon: '🧖' },
  { value: 'hammam', label: 'Hammam', icon: '♨️' },
  { value: 'piscine_int', label: 'Piscine int.', icon: '🏊' },
  { value: 'piscine_ext', label: 'Piscine ext.', icon: '🏊' },
  { value: 'dressing', label: 'Dressing', icon: '👔' },
  { value: 'bibliotheque', label: 'Bibliothèque', icon: '📚' },
  { value: 'atelier', label: 'Atelier', icon: '🔧' },
  { value: 'local_ski', label: 'Local ski', icon: '⛷️' },
  { value: 'cabanon', label: 'Cabanon', icon: '🏡' },
  { value: 'pool_house', label: 'Pool house', icon: '🏖️' },
  { value: 'dependance', label: 'Dépendance', icon: '🏚️' },
  { value: 'conciergerie', label: 'Conciergerie', icon: '🔑' },
];

// Équipements luxe appartement
const equipementsLuxeAppart = [
  { value: 'piscine', label: 'Piscine' },
  { value: 'caveVin', label: 'Cave à vin' },
  { value: 'fitness', label: 'Fitness' },
];

export default function Module2Caracteristiques() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  const { fetchCadastre, loading: cadastreLoading } = useCadastreLookup();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [carac, setCarac] = useState<Caracteristiques>(defaultCaracteristiques);
  const [saving, setSaving] = useState(false);
  const [cadastreFetched, setCadastreFetched] = useState(false);

  useEffect(() => {
    if (id) {
      loadEstimation();
    }
  }, [id]);

  const loadEstimation = async () => {
    if (!id) return;
    const data = await fetchEstimation(id);
    if (data) {
      setEstimation(data);
      setCarac({ ...defaultCaracteristiques, ...data.caracteristiques });
    }
  };

  const updateField = <K extends keyof Caracteristiques>(field: K, value: Caracteristiques[K]) => {
    setCarac(prev => ({ ...prev, [field]: value }));
  };

  // Récupération automatique des données cadastrales
  const handleFetchCadastre = async () => {
    if (!id) return;

    // 1) Toujours essayer avec l'estimation en mémoire
    let coords = estimation?.identification?.adresse?.coordinates;
    let postalCode = estimation?.identification?.adresse?.codePostal;

    // 2) Si coords manquantes, recharger depuis le backend (évite un state stale)
    if (!coords?.lat || !coords?.lng) {
      const fresh = await fetchEstimation(id);
      if (fresh) {
        setEstimation(fresh);
        coords = fresh.identification?.adresse?.coordinates;
        postalCode = fresh.identification?.adresse?.codePostal;
      }
    }

    if (!coords?.lat || !coords?.lng) {
      toast.error("Coordonnées non disponibles. Vérifiez l'adresse dans le Module 1.");
      return;
    }

    const result = await fetchCadastre(coords.lat, coords.lng, postalCode);

    if (result && !result.error) {
      // Mettre à jour les champs si des données ont été trouvées
      if (result.numeroParcelle) {
        updateField('numeroParcelle', result.numeroParcelle);
      }
      if (result.surfaceParcelle && result.surfaceParcelle > 0) {
        updateField('surfaceTerrain', result.surfaceParcelle.toString());
      }
      if (result.zone) {
        updateField('zone', result.zone);
      }

      setCadastreFetched(true);

      const sourceLabel = result.source === 'sitg' ? 'SITG (Genève)'
        : result.source === 'asitvd' ? 'ASIT-VD (Vaud)'
        : result.source === 'swisstopo' ? 'Swisstopo'
        : 'Base cadastrale';

      // Si la source ne fournit pas tout, on informe plutôt que de faire croire à un échec
      if (!result.surfaceParcelle || !result.zone) {
        toast.success(`Parcelle trouvée (${sourceLabel}). Complétez surface/zone si nécessaire.`);
      } else {
        toast.success(`Données récupérées depuis ${sourceLabel}`);
      }
    } else {
      toast.error(result?.error || 'Aucune donnée cadastrale trouvée');
    }
  };

  const handleSave = async () => {
    if (!id || !estimation) return;
    setSaving(true);
    
    const success = await updateEstimation(id, {
      caracteristiques: carac,
      typeBien: carac.typeBien || undefined,
    });
    
    setSaving(false);
    
    if (success) {
      toast.success('Caractéristiques enregistrées');
    }
  };

  const handleNext = async () => {
    await handleSave();
    navigate(`/estimation/${id}/3`);
  };

  const isAppartement = carac.typeBien === 'appartement';
  const isMaison = carac.typeBien === 'maison';

  // Calcul surface pondérée totale (appartement)
  const surfacePonderee = useMemo(() => {
    if (!isAppartement) return 0;
    const ppe = parseFloat(carac.surfacePPE) || 0;
    const sousSol = (parseFloat(carac.surfaceNonHabitable) || 0) * 0.5; // pondéré 50%
    const balcon = (parseFloat(carac.surfaceBalcon) || 0) * 0.5; // pondéré 50%
    const terrasse = (parseFloat(carac.surfaceTerrasse) || 0) * 0.33; // pondéré 33%
    const jardin = (parseFloat(carac.surfaceJardin) || 0) * 0.1; // pondéré 10%
    return ppe + sousSol + balcon + terrasse + jardin;
  }, [isAppartement, carac.surfacePPE, carac.surfaceNonHabitable, carac.surfaceBalcon, carac.surfaceTerrasse, carac.surfaceJardin]);

  // Toggle exposition
  const toggleExposition = (dir: string) => {
    const current = carac.exposition || [];
    const lowerDir = dir.toLowerCase();
    if (current.includes(lowerDir)) {
      updateField('exposition', current.filter(v => v !== lowerDir));
    } else {
      updateField('exposition', [...current, lowerDir]);
    }
  };

  // Toggle diffusion
  const toggleDiffusion = (val: string) => {
    const field = isMaison ? 'diffusionMaison' : 'diffusion';
    const current = (isMaison ? carac.diffusionMaison : carac.diffusion) || [];
    if (current.includes(val)) {
      updateField(field, current.filter(v => v !== val));
    } else {
      updateField(field, [...current, val]);
    }
  };

  // Toggle espaces maison
  const toggleEspaceMaison = (val: string) => {
    const current = carac.espacesMaison || [];
    if (current.includes(val)) {
      updateField('espacesMaison', current.filter(v => v !== val));
    } else {
      updateField('espacesMaison', [...current, val]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ModuleHeader moduleNumber={2} title="Caractéristiques" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ModuleHeader 
        moduleNumber={2} 
        title="Caractéristiques" 
        subtitle="Fiche technique complète du bien"
        backPath={`/estimation/${id}/1`}
      />

      <div className="p-4 space-y-6">
        {/* Type de bien */}
        <FormSection title="Type de bien">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {typeBienOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateField('typeBien', value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  carac.typeBien === value 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Sous-catégorie */}
          {(isAppartement || isMaison) && (
            <FormRow label="Sous-catégorie">
              <Select 
                value={carac.sousType} 
                onValueChange={(v) => updateField('sousType', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {(isAppartement ? sousCategorieAppart : sousCategorieMaison).map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>
          )}
        </FormSection>

        {/* Surfaces */}
        {(isAppartement || isMaison) && (
          <FormSection title="Surfaces">
            <div className="space-y-4">
              {isAppartement && (
                <>
                  <FormRow label="Surface PPE (m²)" helper="Surface officielle du règlement PPE">
                    <Input
                      type="number"
                      value={carac.surfacePPE}
                      onChange={(e) => updateField('surfacePPE', e.target.value)}
                      placeholder="127"
                    />
                  </FormRow>

                  <FormRow label="Sous-sol habitable (m²)" optional helper="Sous-sol directement accessible dans l'appartement — Pondéré 50%">
                    <Input
                      type="number"
                      value={carac.surfaceNonHabitable}
                      onChange={(e) => updateField('surfaceNonHabitable', e.target.value)}
                      placeholder="0"
                    />
                  </FormRow>

                  <div className="grid grid-cols-2 gap-3">
                    <FormRow label="Balcon (m²)" optional helper="Pondéré 50%">
                      <Input
                        type="number"
                        value={carac.surfaceBalcon}
                        onChange={(e) => updateField('surfaceBalcon', e.target.value)}
                        placeholder="12"
                      />
                    </FormRow>
                    <FormRow label="Terrasse (m²)" optional helper="Pondéré 33%">
                      <Input
                        type="number"
                        value={carac.surfaceTerrasse}
                        onChange={(e) => updateField('surfaceTerrasse', e.target.value)}
                        placeholder="0"
                      />
                    </FormRow>
                  </div>

                  <FormRow label="Jardin privatif (m²)" optional helper="Pondéré 10%">
                    <Input
                      type="number"
                      value={carac.surfaceJardin}
                      onChange={(e) => updateField('surfaceJardin', e.target.value)}
                      placeholder="-1"
                    />
                  </FormRow>

                  {/* Surface pondérée totale */}
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <span className="text-sm font-medium text-foreground">Surface pondérée totale</span>
                    <span className="text-xl font-bold text-primary">{surfacePonderee.toFixed(1)} m²</span>
                  </div>
                </>
              )}

              {isMaison && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormRow label="Surface habitable (m²)">
                      <Input
                        type="number"
                        value={carac.surfaceHabitableMaison}
                        onChange={(e) => updateField('surfaceHabitableMaison', e.target.value)}
                        placeholder="Ex: 180"
                      />
                    </FormRow>
                    <FormRow label="Surface utile (m²)">
                      <Input
                        type="number"
                        value={carac.surfaceUtile}
                        onChange={(e) => updateField('surfaceUtile', e.target.value)}
                        placeholder="Ex: 220"
                      />
                    </FormRow>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Surface terrain dans la section Parcelle ci-dessous
                  </p>
                </>
              )}
            </div>
          </FormSection>
        )}

        {/* Copropriété PPE (appartement) */}
        {isAppartement && (
          <FormSection title="Copropriété (PPE)">
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="N° lot PPE" optional>
                <Input
                  value={carac.numeroLotPPE}
                  onChange={(e) => updateField('numeroLotPPE', e.target.value)}
                  placeholder="7.03"
                />
              </FormRow>
              <FormRow label="Fond de rénovation" optional>
                <div className="relative">
                  <Input
                    type="number"
                    value={carac.fondRenovation}
                    onChange={(e) => updateField('fondRenovation', e.target.value)}
                    placeholder="Ex: 50000"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">CHF</span>
                </div>
              </FormRow>
            </div>
          </FormSection>
        )}

        {/* Parcelle (maison) */}
        {isMaison && (
          <FormSection title="Parcelle">
            <div className="space-y-4">
              {/* Bouton récupération automatique */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchCadastre}
                  disabled={cadastreLoading}
                  className="flex items-center gap-2"
                >
                  {cadastreLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : cadastreFetched ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {cadastreLoading ? 'Recherche...' : cadastreFetched ? 'Actualiser' : 'Récupérer auto'}
                </Button>
                <span className="text-xs text-muted-foreground">
                  SITG (GE) • ASIT-VD • Swisstopo
                </span>
              </div>

              {/* Champs parcelle */}
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="N° parcelle">
                  <Input
                    value={carac.numeroParcelle}
                    onChange={(e) => updateField('numeroParcelle', e.target.value)}
                    placeholder="Ex: 1234"
                  />
                </FormRow>
                <FormRow label="Surface terrain (m²)">
                  <Input
                    type="number"
                    value={carac.surfaceTerrain}
                    onChange={(e) => updateField('surfaceTerrain', e.target.value)}
                    placeholder="Ex: 800"
                  />
                </FormRow>
              </div>

              <FormRow label="Zone">
                <Select 
                  value={carac.zone} 
                  onValueChange={(v) => updateField('zone', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {zoneOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
            </div>
          </FormSection>
        )}

        {/* Configuration */}
        {(isAppartement || isMaison) && (
          <FormSection title="Configuration">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Pièces">
                  <Select 
                    value={carac.nombrePieces} 
                    onValueChange={(v) => updateField('nombrePieces', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      {piecesOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Chambres">
                  <Select 
                    value={carac.nombreChambres} 
                    onValueChange={(v) => updateField('nombreChambres', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      {chambresOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Salles de bain">
                  <Select 
                    value={carac.nombreSDB} 
                    onValueChange={(v) => updateField('nombreSDB', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      {sdbOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="WC séparés">
                  <Select 
                    value={carac.nombreWC} 
                    onValueChange={(v) => updateField('nombreWC', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      {wcOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
              </div>

              {isAppartement && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FormRow label="Étage">
                      <Select 
                        value={carac.etage} 
                        onValueChange={(v) => updateField('etage', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="--" />
                        </SelectTrigger>
                        <SelectContent>
                          {etageOptions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormRow>
                    <FormRow label="Étages immeuble">
                      <Select 
                        value={carac.nombreEtagesImmeuble} 
                        onValueChange={(v) => updateField('nombreEtagesImmeuble', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="--" />
                        </SelectTrigger>
                        <SelectContent>
                          {etagesImmeubleOptions.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormRow>
                  </div>

                  {/* Ascenseur */}
                  <FormRow label="Ascenseur">
                    <div className="grid grid-cols-2 gap-2">
                      {ascenseurOptions.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => updateField('ascenseur', value)}
                          className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                            carac.ascenseur === value
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border bg-card hover:border-primary/50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </FormRow>

                  {/* Dernier étage avec badge PREMIUM */}
                  <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    carac.dernierEtage ? 'border-primary bg-primary/5' : 'border-border'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="dernierEtage"
                        checked={carac.dernierEtage}
                        onCheckedChange={(checked) => updateField('dernierEtage', checked as boolean)}
                      />
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-amber-500" />
                        <Label htmlFor="dernierEtage" className="text-sm font-medium cursor-pointer">
                          Dernier étage (attique)
                        </Label>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded">PREMIUM</span>
                  </div>
                </>
              )}

              {isMaison && (
                <FormRow label="Nombre de niveaux">
                  <Select 
                    value={carac.nombreNiveaux} 
                    onValueChange={(v) => updateField('nombreNiveaux', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      {niveauxOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
              )}
            </div>
          </FormSection>
        )}

        {/* Exposition & Vue */}
        {(isAppartement || isMaison) && (
          <FormSection title="Exposition & vue">
            <div className="space-y-4">
              <FormRow label="Exposition">
                <div className="grid grid-cols-4 gap-2">
                  {expositionSimple.map((dir) => {
                    const isSelected = carac.exposition?.includes(dir.toLowerCase());
                    return (
                      <button
                        key={dir}
                        onClick={() => toggleExposition(dir)}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        {dir}
                      </button>
                    );
                  })}
                </div>
              </FormRow>

              <FormRow label="Vue principale">
                <Select 
                  value={carac.vue} 
                  onValueChange={(v) => updateField('vue', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vueOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
            </div>
          </FormSection>
        )}

        {/* Caractéristiques techniques */}
        {(isAppartement || isMaison) && (
          <FormSection title="Caractéristiques techniques">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Année construction">
                  <Input
                    type="number"
                    value={carac.anneeConstruction}
                    onChange={(e) => updateField('anneeConstruction', e.target.value)}
                    placeholder="2016"
                  />
                </FormRow>
                <FormRow label="Rénovation" optional>
                  <Input
                    type="number"
                    value={carac.anneeRenovation}
                    onChange={(e) => updateField('anneeRenovation', e.target.value)}
                    placeholder="Année"
                  />
                </FormRow>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormRow label="CECB">
                  <Select 
                    value={carac.cecb} 
                    onValueChange={(v) => updateField('cecb', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      {cecbOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Diffusion chaleur">
                  <div /> {/* Placeholder for grid alignment */}
                </FormRow>
              </div>

              {/* Diffusion chaleur - icônes */}
              <div className="grid grid-cols-3 gap-2">
                {diffusionChaleurOptions.map(({ value, label, icon }) => {
                  const current = (isMaison ? carac.diffusionMaison : carac.diffusion) || [];
                  const isSelected = current.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleDiffusion(value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              <FormRow label="Vitrage">
                <Select 
                  value={carac.vitrage} 
                  onValueChange={(v) => updateField('vitrage', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    {vitrageOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>

              <FormRow label="Charges mensuelles (CHF)" optional>
                <div className="relative">
                  <Input
                    type="number"
                    value={carac.chargesMensuelles}
                    onChange={(e) => updateField('chargesMensuelles', e.target.value)}
                    placeholder="620"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">CHF</span>
                </div>
              </FormRow>
            </div>
          </FormSection>
        )}

        {/* Rénovation & Travaux */}
        {(isAppartement || isMaison) && carac.anneeRenovation && (
          <FormSection title="Détails de la rénovation">
            <div className="space-y-4">
              {/* Type de rénovation */}
              <FormRow label="Type de rénovation">
                <PictoChipsGrid
                  options={RENOVATION_OPTIONS}
                  selected={carac.typeRenovation || []}
                  onChange={(selected) => updateField('typeRenovation', selected)}
                  columns={4}
                />
              </FormRow>

              {/* Travaux récents */}
              <FormRow label="Travaux réalisés">
                <PictoChipsGrid
                  options={TRAVAUX_RECENTS_OPTIONS}
                  selected={carac.travauxRecents || []}
                  onChange={(selected) => updateField('travauxRecents', selected)}
                  columns={4}
                />
              </FormRow>
            </div>
          </FormSection>
        )}

        {/* Chauffage Maison */}
        {isMaison && (
          <FormSection title="Chauffage">
            <FormRow label="Type de chauffage">
              <PictoChipsGrid
                options={CHAUFFAGE_MAISON_OPTIONS}
                selected={carac.chauffage ? [carac.chauffage] : []}
                onChange={(selected) => updateField('chauffage', selected[selected.length - 1] || '')}
                columns={4}
              />
            </FormRow>
          </FormSection>
        )}

        {/* Nuisances */}
        {(isAppartement || isMaison) && (
          <FormSection title="Nuisances & Environnement">
            <div className="space-y-4">
              <FormRow label="Nuisances identifiées">
                <PictoChipsGrid
                  options={NUISANCES_OPTIONS}
                  selected={carac.nuisances || []}
                  onChange={(selected) => updateField('nuisances', selected)}
                  variant="negative"
                  columns={4}
                />
              </FormRow>

              {/* Détail nuisance si sélectionné */}
              {(carac.nuisances || []).length > 0 && (
                <FormRow label="Précisions sur les nuisances" optional>
                  <Input
                    value={carac.nuisanceDetail || ''}
                    onChange={(e) => updateField('nuisanceDetail', e.target.value)}
                    placeholder="Détails supplémentaires..."
                  />
                </FormRow>
              )}
            </div>
          </FormSection>
        )}

        {/* Annexes & Équipements */}
        {(isAppartement || isMaison) && (
          <FormSection title="Annexes & équipements">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormRow label={isAppartement ? "Place intérieure" : "Place couverte"}>
                  <Select 
                    value={carac.parkingInterieur} 
                    onValueChange={(v) => updateField('parkingInterieur', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      {parkingOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
                <FormRow label="Place extérieure">
                  <Select 
                    value={carac.parkingExterieur} 
                    onValueChange={(v) => updateField('parkingExterieur', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="--" />
                    </SelectTrigger>
                    <SelectContent>
                      {parkingOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>
              </div>

              <FormRow label="Box / Garage fermé">
                <Select 
                  value={carac.box} 
                  onValueChange={(v) => updateField('box', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="--" />
                  </SelectTrigger>
                  <SelectContent>
                    {boxOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>

              {isAppartement && (
                <>
                  {/* Cave privative */}
                  <FormRow label="Cave privative">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateField('cave', true)}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          carac.cave === true
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => updateField('cave', false)}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          carac.cave === false
                            ? 'border-border bg-muted'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                      >
                        Non
                      </button>
                    </div>
                  </FormRow>

                  {/* Buanderie */}
                  <FormRow label="Buanderie" optional>
                    <Select 
                      value={carac.buanderie} 
                      onValueChange={(v) => updateField('buanderie', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {buanderieAppartOptions.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormRow>

                  {/* Équipements luxe */}
                  <FormRow label="Équipements résidence / luxe" optional>
                    <div className="flex flex-wrap gap-2">
                      {equipementsLuxeAppart.map(({ value, label }) => {
                        const isChecked = value === 'piscine' ? carac.piscine 
                          : value === 'caveVin' ? carac.caveVin 
                          : carac.fitness;
                        return (
                          <label 
                            key={value}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card cursor-pointer hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (value === 'piscine') updateField('piscine', checked as boolean);
                                else if (value === 'caveVin') updateField('caveVin', checked as boolean);
                                else updateField('fitness', checked as boolean);
                              }}
                            />
                            <span className="text-sm">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </FormRow>

                  {/* Autres */}
                  <FormRow label="Autres" optional>
                    <Input
                      value={carac.autresAnnexes}
                      onChange={(e) => updateField('autresAnnexes', e.target.value)}
                      placeholder="Spa, sauna, local vélos, etc."
                    />
                  </FormRow>
                </>
              )}

              {isMaison && (
                <>
                  {/* Espaces & dépendances maison */}
                  <FormRow label="Espaces & dépendances" optional>
                    <div className="flex flex-wrap gap-2">
                      {espacesMaisonOptions.map(({ value, label, icon }) => {
                        const isSelected = carac.espacesMaison?.includes(value);
                        return (
                          <button
                            key={value}
                            onClick={() => toggleEspaceMaison(value)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card hover:border-primary/50'
                            }`}
                          >
                            <span>{icon}</span>
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormRow>
                </>
              )}
            </div>
          </FormSection>
        )}

        {/* Message si pas de type sélectionné */}
        {!isAppartement && !isMaison && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sélectionnez un type de bien pour afficher les caractéristiques.</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(`/estimation/${id}/1`)}
          >
            Précédent
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Suivant'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
