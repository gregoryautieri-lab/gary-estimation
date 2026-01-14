import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useEstimationCalcul, formatPriceCHF } from '@/hooks/useEstimationCalcul';
import { EstimationData, defaultPreEstimation, PreEstimation, TypeMiseEnVente } from '@/types/estimation';
import { toast } from 'sonner';
import { ChevronRight, Calculator, TrendingUp, Landmark, Tag } from 'lucide-react';

const miseEnVenteOptions: { value: TypeMiseEnVente; label: string; description: string; icon: string }[] = [
  { value: 'offmarket', label: 'Off-Market', description: 'Vente confidentielle', icon: '🔒' },
  { value: 'comingsoon', label: 'Coming Soon', description: 'Prévente exclusive', icon: '⏳' },
  { value: 'public', label: 'Public', description: 'Diffusion large', icon: '📢' },
];

export default function Module4PreEstimation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [preEst, setPreEst] = useState<PreEstimation>(defaultPreEstimation);
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
      setPreEst({ ...defaultPreEstimation, ...data.preEstimation });
    }
  };

  // Calculs automatiques
  const calcul = useEstimationCalcul(
    estimation?.caracteristiques || null,
    preEst
  );

  const updateField = <K extends keyof PreEstimation>(field: K, value: PreEstimation[K]) => {
    setPreEst(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!id || !estimation) return;
    setSaving(true);
    
    const success = await updateEstimation(id, {
      preEstimation: {
        ...preEst,
        prixEntre: calcul.prixEntreCalcule.toString(),
        prixEt: calcul.prixEtCalcule.toString(),
      },
      prixMin: calcul.prixEntreCalcule,
      prixMax: calcul.prixEtCalcule,
      prixFinal: calcul.prixMiseEnVente,
    });
    
    setSaving(false);
    
    if (success) {
      toast.success('Pré-estimation enregistrée');
    }
  };

  const handleNext = async () => {
    await handleSave();
    navigate(`/estimation/${id}/5`);
  };

  const isAppartement = estimation?.caracteristiques?.typeBien === 'appartement';
  const isMaison = estimation?.caracteristiques?.typeBien === 'maison';

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <ModuleHeader moduleNumber={4} title="Pré-estimation" />
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <ModuleHeader 
        moduleNumber={4} 
        title="Pré-estimation" 
        subtitle={estimation?.identification?.vendeur?.nom || 'Nouveau bien'}
        backPath={`/estimation/${id}/3`}
      />

      <div className="p-4 space-y-6">
        {/* Valeur vénale - Appartement */}
        {isAppartement && (
          <FormSection title="Valeur vénale - Appartement" icon="🏢">
            <div className="space-y-4">
              <FormRow label="Prix au m² (CHF)">
                <Input
                  type="number"
                  value={preEst.prixM2}
                  onChange={(e) => updateField('prixM2', e.target.value)}
                  placeholder="12000"
                />
              </FormRow>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Taux de vétusté</Label>
                  <span className="text-sm font-medium text-primary">{preEst.tauxVetuste}%</span>
                </div>
                <Slider
                  value={[preEst.tauxVetuste]}
                  onValueChange={([v]) => updateField('tauxVetuste', v)}
                  min={0}
                  max={50}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Réduction pour travaux à prévoir
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Prix place int.">
                  <Input
                    type="number"
                    value={preEst.prixPlaceInt}
                    onChange={(e) => updateField('prixPlaceInt', e.target.value)}
                    placeholder="50000"
                  />
                </FormRow>
                <FormRow label="Prix place ext.">
                  <Input
                    type="number"
                    value={preEst.prixPlaceExt}
                    onChange={(e) => updateField('prixPlaceExt', e.target.value)}
                    placeholder="25000"
                  />
                </FormRow>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormRow label="Prix box">
                  <Input
                    type="number"
                    value={preEst.prixBox}
                    onChange={(e) => updateField('prixBox', e.target.value)}
                    placeholder="60000"
                  />
                </FormRow>
                <FormRow label="Prix cave">
                  <Input
                    type="number"
                    value={preEst.prixCave}
                    onChange={(e) => updateField('prixCave', e.target.value)}
                    placeholder="15000"
                  />
                </FormRow>
              </div>
            </div>
          </FormSection>
        )}

        {/* Valeur vénale - Maison */}
        {isMaison && (
          <FormSection title="Valeur vénale - Maison" icon="🏠">
            <div className="space-y-4">
              <FormRow label="Prix au m² terrain (CHF)">
                <Input
                  type="number"
                  value={preEst.prixM2Terrain}
                  onChange={(e) => updateField('prixM2Terrain', e.target.value)}
                  placeholder="1200"
                />
              </FormRow>

              <FormRow label="Prix au m³ SIA (CHF)">
                <Input
                  type="number"
                  value={preEst.prixM3}
                  onChange={(e) => updateField('prixM3', e.target.value)}
                  placeholder="850"
                />
              </FormRow>

              <FormRow label="Cubage manuel (m³)">
                <Input
                  type="number"
                  value={preEst.cubageManuel}
                  onChange={(e) => updateField('cubageManuel', e.target.value)}
                  placeholder="Auto-calculé si vide"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cubage auto: {calcul.cubageAuto} m³
                </p>
              </FormRow>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Taux de vétusté</Label>
                  <span className="text-sm font-medium text-primary">{preEst.tauxVetusteMaison}%</span>
                </div>
                <Slider
                  value={[preEst.tauxVetusteMaison]}
                  onValueChange={([v]) => updateField('tauxVetusteMaison', v)}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>

              <FormRow label="Prix m² aménagement">
                <Input
                  type="number"
                  value={preEst.prixM2Amenagement}
                  onChange={(e) => updateField('prixM2Amenagement', e.target.value)}
                  placeholder="500"
                />
              </FormRow>
            </div>
          </FormSection>
        )}

        {/* Résumé calculs */}
        <FormSection title="Résumé des calculs" icon="📊">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Valeur vénale</span>
              </div>
              <span className="font-semibold">{formatPriceCHF(calcul.totalVenaleArrondi)}</span>
            </div>

            {isAppartement && (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">Surface pondérée</span>
                  <span>{calcul.surfacePonderee.toFixed(1)} m²</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">Valeur surface</span>
                  <span>{formatPriceCHF(calcul.valeurSurface)}</span>
                </div>
              </>
            )}

            {isMaison && (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">Cubage SIA</span>
                  <span>{calcul.cubage} m³</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">Valeur terrain</span>
                  <span>{formatPriceCHF(calcul.valeurTerrain)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">Valeur cubage</span>
                  <span>{formatPriceCHF(calcul.valeurCubage)}</span>
                </div>
              </>
            )}
          </div>
        </FormSection>

        {/* Rendement */}
        <FormSection title="Valeur de rendement" icon="📈">
          <div className="space-y-4">
            <FormRow label="Loyer mensuel (CHF)">
              <Input
                type="number"
                value={preEst.loyerMensuel}
                onChange={(e) => updateField('loyerMensuel', e.target.value)}
                placeholder="2500"
              />
            </FormRow>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Taux de capitalisation</Label>
                <span className="text-sm font-medium text-primary">{preEst.tauxCapitalisation}%</span>
              </div>
              <Slider
                value={[preEst.tauxCapitalisation * 10]}
                onValueChange={([v]) => updateField('tauxCapitalisation', v / 10)}
                min={15}
                max={50}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm">Valeur de rendement</span>
              </div>
              <span className="font-semibold">{formatPriceCHF(calcul.valeurRendement)}</span>
            </div>
          </div>
        </FormSection>

        {/* Valeur de gage */}
        <FormSection title="Valeur de gage" icon="🏦">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Valeur de gage estimée</span>
            </div>
            <span className="font-semibold">{formatPriceCHF(calcul.valeurGageArrondi)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Moyenne pondérée valeur vénale (60%) et rendement (40%)
          </p>
        </FormSection>

        {/* Fourchette de prix */}
        <FormSection title="Fourchette de prix" icon="💰">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Prix minimum</p>
                <p className="text-lg font-bold text-foreground">
                  {formatPriceCHF(calcul.prixEntreCalcule)}
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Prix maximum</p>
                <p className="text-lg font-bold text-foreground">
                  {formatPriceCHF(calcul.prixEtCalcule)}
                </p>
              </div>
            </div>
          </div>
        </FormSection>

        {/* Type de mise en vente */}
        <FormSection title="Type de mise en vente" icon="🎯">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {miseEnVenteOptions.map(({ value, label, description, icon }) => (
                <button
                  key={value}
                  onClick={() => updateField('typeMiseEnVente', value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    preEst.typeMiseEnVente === value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Pourcentages personnalisables */}
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">% Off-Market</Label>
                  <span className="text-xs font-medium">{preEst.pourcOffmarket}%</span>
                </div>
                <Slider
                  value={[preEst.pourcOffmarket]}
                  onValueChange={([v]) => updateField('pourcOffmarket', v)}
                  min={5}
                  max={25}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">% Coming Soon</Label>
                  <span className="text-xs font-medium">{preEst.pourcComingsoon}%</span>
                </div>
                <Slider
                  value={[preEst.pourcComingsoon]}
                  onValueChange={([v]) => updateField('pourcComingsoon', v)}
                  min={5}
                  max={20}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">% Public</Label>
                  <span className="text-xs font-medium">{preEst.pourcPublic}%</span>
                </div>
                <Slider
                  value={[preEst.pourcPublic]}
                  onValueChange={([v]) => updateField('pourcPublic', v)}
                  min={0}
                  max={15}
                  step={1}
                />
              </div>
            </div>

            {/* Prix de mise en vente */}
            <div className="p-4 bg-primary/10 border-2 border-primary rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  <span className="font-medium">Prix de mise en vente</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {formatPriceCHF(calcul.prixMiseEnVente)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mode: {preEst.typeMiseEnVente === 'offmarket' ? 'Off-Market' : 
                       preEst.typeMiseEnVente === 'comingsoon' ? 'Coming Soon' : 'Public'}
              </p>
            </div>
          </div>
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
