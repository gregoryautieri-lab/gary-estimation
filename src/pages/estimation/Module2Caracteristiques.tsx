import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { EstimationData, defaultCaracteristiques, Caracteristiques, TypeBien } from '@/types/estimation';
import { toast } from 'sonner';
import { ChevronRight, Home, Building2, Mountain, Building } from 'lucide-react';

const typeBienOptions: { value: TypeBien | ''; label: string; icon: React.ElementType }[] = [
  { value: 'appartement', label: 'Appartement', icon: Building2 },
  { value: 'maison', label: 'Maison', icon: Home },
  { value: 'immeuble', label: 'Immeuble', icon: Building },
  { value: 'terrain', label: 'Terrain', icon: Mountain },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
];

const vueOptions = [
  { value: 'lac', label: 'Vue lac' },
  { value: 'montagne', label: 'Vue montagne' },
  { value: 'lac_montagne', label: 'Vue lac et montagne' },
  { value: 'degagee', label: 'Vue dégagée' },
  { value: 'jardin', label: 'Vue jardin' },
  { value: 'urbaine', label: 'Vue urbaine' },
  { value: 'aucune', label: 'Sans vue particulière' },
];

const expositionOptions = [
  { value: 'nord', label: 'Nord' },
  { value: 'nord-est', label: 'Nord-Est' },
  { value: 'est', label: 'Est' },
  { value: 'sud-est', label: 'Sud-Est' },
  { value: 'sud', label: 'Sud' },
  { value: 'sud-ouest', label: 'Sud-Ouest' },
  { value: 'ouest', label: 'Ouest' },
  { value: 'nord-ouest', label: 'Nord-Ouest' },
];

const ascenseurOptions = [
  { value: 'oui', label: 'Oui' },
  { value: 'non', label: 'Non' },
  { value: 'projet', label: 'En projet' },
];

const etageOptions = Array.from({ length: 21 }, (_, i) => ({
  value: i.toString(),
  label: i === 0 ? 'Rez-de-chaussée' : `${i}${i === 1 ? 'er' : 'e'} étage`
}));

export default function Module2Caracteristiques() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [carac, setCarac] = useState<Caracteristiques>(defaultCaracteristiques);
  const [saving, setSaving] = useState(false);

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
        subtitle={estimation?.identification?.vendeur?.nom || 'Nouveau bien'}
        backPath={`/estimation/${id}/1`}
      />

      <div className="p-4 space-y-6">
        {/* Type de bien */}
        <FormSection title="Type de bien">
          <div className="grid grid-cols-3 gap-2">
            {typeBienOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateField('typeBien', value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  carac.typeBien === value 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-medium text-center">{label}</span>
              </button>
            ))}
          </div>
        </FormSection>

        {/* Surfaces */}
        <FormSection title="Surfaces">
          <div className="space-y-4">
            {isAppartement && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FormRow label="Surface PPE (m²)">
                    <Input
                      type="number"
                      value={carac.surfacePPE}
                      onChange={(e) => updateField('surfacePPE', e.target.value)}
                      placeholder="135"
                    />
                  </FormRow>
                  <FormRow label="Non habitable (m²)">
                    <Input
                      type="number"
                      value={carac.surfaceNonHabitable}
                      onChange={(e) => updateField('surfaceNonHabitable', e.target.value)}
                      placeholder="15"
                    />
                  </FormRow>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormRow label="Balcon (m²)">
                    <Input
                      type="number"
                      value={carac.surfaceBalcon}
                      onChange={(e) => updateField('surfaceBalcon', e.target.value)}
                      placeholder="12"
                    />
                  </FormRow>
                  <FormRow label="Terrasse (m²)">
                    <Input
                      type="number"
                      value={carac.surfaceTerrasse}
                      onChange={(e) => updateField('surfaceTerrasse', e.target.value)}
                      placeholder="25"
                    />
                  </FormRow>
                </div>

                <FormRow label="Jardin privatif (m²)">
                  <Input
                    type="number"
                    value={carac.surfaceJardin}
                    onChange={(e) => updateField('surfaceJardin', e.target.value)}
                    placeholder="100"
                  />
                </FormRow>
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
                      placeholder="180"
                    />
                  </FormRow>
                  <FormRow label="Surface utile (m²)">
                    <Input
                      type="number"
                      value={carac.surfaceUtile}
                      onChange={(e) => updateField('surfaceUtile', e.target.value)}
                      placeholder="220"
                    />
                  </FormRow>
                </div>

                <FormRow label="Surface terrain (m²)">
                  <Input
                    type="number"
                    value={carac.surfaceTerrain}
                    onChange={(e) => updateField('surfaceTerrain', e.target.value)}
                    placeholder="800"
                  />
                </FormRow>
              </>
            )}

            {!isAppartement && !isMaison && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sélectionnez un type de bien pour afficher les champs de surface correspondants.
              </p>
            )}
          </div>
        </FormSection>

        {/* Configuration */}
        <FormSection title="Configuration">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Nombre de pièces">
                <Input
                  type="number"
                  step="0.5"
                  value={carac.nombrePieces}
                  onChange={(e) => updateField('nombrePieces', e.target.value)}
                  placeholder="4.5"
                />
              </FormRow>
              <FormRow label="Chambres">
                <Input
                  type="number"
                  value={carac.nombreChambres}
                  onChange={(e) => updateField('nombreChambres', e.target.value)}
                  placeholder="3"
                />
              </FormRow>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Salles de bain">
                <Input
                  type="number"
                  value={carac.nombreSDB}
                  onChange={(e) => updateField('nombreSDB', e.target.value)}
                  placeholder="2"
                />
              </FormRow>
              <FormRow label="WC séparés">
                <Input
                  type="number"
                  value={carac.nombreWC}
                  onChange={(e) => updateField('nombreWC', e.target.value)}
                  placeholder="1"
                />
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
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {etageOptions.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormRow>
                  <FormRow label="Étages immeuble">
                    <Input
                      type="number"
                      value={carac.nombreEtagesImmeuble}
                      onChange={(e) => updateField('nombreEtagesImmeuble', e.target.value)}
                      placeholder="5"
                    />
                  </FormRow>
                </div>

                <FormRow label="Ascenseur">
                  <Select 
                    value={carac.ascenseur} 
                    onValueChange={(v) => updateField('ascenseur', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {ascenseurOptions.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Label htmlFor="dernierEtage" className="text-sm">Dernier étage</Label>
                  <Switch
                    id="dernierEtage"
                    checked={carac.dernierEtage}
                    onCheckedChange={(checked) => updateField('dernierEtage', checked)}
                  />
                </div>
              </>
            )}

            {isMaison && (
              <FormRow label="Nombre de niveaux">
                <Input
                  type="number"
                  value={carac.nombreNiveaux}
                  onChange={(e) => updateField('nombreNiveaux', e.target.value)}
                  placeholder="2"
                />
              </FormRow>
            )}
          </div>
        </FormSection>

        {/* Construction */}
        <FormSection title="Construction et rénovation">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Année construction">
                <Input
                  type="number"
                  value={carac.anneeConstruction}
                  onChange={(e) => updateField('anneeConstruction', e.target.value)}
                  placeholder="1985"
                />
              </FormRow>
              <FormRow label="Dernière rénovation">
                <Input
                  type="number"
                  value={carac.anneeRenovation}
                  onChange={(e) => updateField('anneeRenovation', e.target.value)}
                  placeholder="2020"
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
                    <SelectValue placeholder="Classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'NC'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Vitrage">
                <Select 
                  value={carac.vitrage} 
                  onValueChange={(v) => updateField('vitrage', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="triple">Triple</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
            </div>
          </div>
        </FormSection>

        {/* Annexes Parking */}
        <FormSection title="Stationnement">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Places int. (box)">
                <Input
                  type="number"
                  value={carac.parkingInterieur}
                  onChange={(e) => updateField('parkingInterieur', e.target.value)}
                  placeholder="1"
                />
              </FormRow>
              <FormRow label="Places couvertes">
                <Input
                  type="number"
                  value={carac.parkingCouverte}
                  onChange={(e) => updateField('parkingCouverte', e.target.value)}
                  placeholder="0"
                />
              </FormRow>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormRow label="Places ext.">
                <Input
                  type="number"
                  value={carac.parkingExterieur}
                  onChange={(e) => updateField('parkingExterieur', e.target.value)}
                  placeholder="1"
                />
              </FormRow>
              <FormRow label="Box fermé">
                <Input
                  type="number"
                  value={carac.box}
                  onChange={(e) => updateField('box', e.target.value)}
                  placeholder="0"
                />
              </FormRow>
            </div>
          </div>
        </FormSection>

        {/* Annexes */}
        <FormSection title="Annexes et équipements">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="cave" className="text-sm">Cave</Label>
              <Switch
                id="cave"
                checked={carac.cave}
                onCheckedChange={(checked) => updateField('cave', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="piscine" className="text-sm">Piscine</Label>
              <Switch
                id="piscine"
                checked={carac.piscine}
                onCheckedChange={(checked) => updateField('piscine', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="caveVin" className="text-sm">Cave à vin</Label>
              <Switch
                id="caveVin"
                checked={carac.caveVin}
                onCheckedChange={(checked) => updateField('caveVin', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="fitness" className="text-sm">Fitness</Label>
              <Switch
                id="fitness"
                checked={carac.fitness}
                onCheckedChange={(checked) => updateField('fitness', checked)}
              />
            </div>
          </div>

          <FormRow label="Buanderie">
            <Select 
              value={carac.buanderie} 
              onValueChange={(v) => updateField('buanderie', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de buanderie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="privee">Privée</SelectItem>
                <SelectItem value="commune">Commune</SelectItem>
                <SelectItem value="aucune">Aucune</SelectItem>
              </SelectContent>
            </Select>
          </FormRow>
        </FormSection>

        {/* Vue et orientation */}
        <FormSection title="Vue et exposition">
          <div className="space-y-4">
            <FormRow label="Type de vue">
              <Select 
                value={carac.vue} 
                onValueChange={(v) => updateField('vue', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {vueOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            <FormRow label="Exposition principale">
              <div className="flex flex-wrap gap-2">
                {expositionOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => {
                      const current = carac.exposition || [];
                      const updated = current.includes(value)
                        ? current.filter(v => v !== value)
                        : [...current, value];
                      updateField('exposition', updated);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      carac.exposition?.includes(value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FormRow>
          </div>
        </FormSection>

        {/* Charges */}
        <FormSection title="Charges">
          <FormRow label="Charges mensuelles (CHF)">
            <Input
              type="number"
              value={carac.chargesMensuelles}
              onChange={(e) => updateField('chargesMensuelles', e.target.value)}
              placeholder="450"
            />
          </FormRow>

          {isAppartement && (
            <FormRow label="Fonds de rénovation (CHF)">
              <Input
                type="number"
                value={carac.fondRenovation}
                onChange={(e) => updateField('fondRenovation', e.target.value)}
                placeholder="25000"
              />
            </FormRow>
          )}
        </FormSection>
      </div>

      {/* Footer actions */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-4">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleNext}
            disabled={saving}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
