import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleHeader } from '@/components/gary/ModuleHeader';
import { BottomNav } from '@/components/gary/BottomNav';
import { FormSection, FormRow } from '@/components/gary/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useEstimationCalcul, formatPriceCHF } from '@/hooks/useEstimationCalcul';
import { EstimationData, defaultPreEstimation, PreEstimation, TypeMiseEnVente, Comparable, LigneSupp, Annexe } from '@/types/estimation';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, X, Flame, BarChart3, Landmark, Target, Rocket, CheckCircle2, Circle, Minus, Home, Building2, TreeDeciduous, Mountain, Warehouse, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparablesMap } from '@/components/comparables/ComparablesMap';
import { AddressAutocomplete } from '@/components/address/AddressAutocomplete';

// ============================================
// Composant Ligne Comparable
// ============================================
interface ComparableCardProps {
  index: number;
  type: 'vendu' | 'enVente';
  data: Comparable;
  onUpdate: (data: Comparable) => void;
  onDelete: () => void;
}

function ComparableCard({ index, type, data, onUpdate, onDelete }: ComparableCardProps) {
  const isVendu = type === 'vendu';
  const label = isVendu ? `Vendu #${index + 1}` : `En vente #${index + 1}`;
  
  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-card relative">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Checkbox id={`gary-${type}-${index}`} />
            <Label htmlFor={`gary-${type}-${index}`} className="text-xs text-muted-foreground">GARY</Label>
          </div>
          <button onClick={onDelete} className="text-destructive hover:text-destructive/80">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Adresse / Quartier *</Label>
          <AddressAutocomplete
            value={data.adresse}
            onAddressSelect={(details) => {
              const fullAddress = details.rue 
                ? `${details.rue}, ${details.codePostal} ${details.localite}`
                : data.adresse;
              onUpdate({ 
                ...data, 
                adresse: fullAddress,
                coordinates: details.coordinates
              });
            }}
            placeholder="Ex: Chemin du Jardin-Alpin 3a, 1217 Meyrin"
            className="mt-1"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">{isVendu ? 'Prix vendu *' : 'Prix affiché *'}</Label>
            <Input
              type="number"
              value={data.prix}
              onChange={(e) => onUpdate({ ...data, prix: e.target.value })}
              placeholder="1350000"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Surface (optionnel)</Label>
            <Input
              type="number"
              value={data.surface}
              onChange={(e) => onUpdate({ ...data, surface: e.target.value })}
              placeholder="116"
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              {isVendu ? 'Date vente (optionnel)' : 'En vente depuis (optionnel)'}
            </Label>
            <Input
              value={isVendu ? data.dateVente || '' : data.dureeEnVente || ''}
              onChange={(e) => onUpdate({ 
                ...data, 
                ...(isVendu ? { dateVente: e.target.value } : { dureeEnVente: e.target.value })
              })}
              placeholder={isVendu ? 'août 2024' : '45 jours'}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Note (optionnel)</Label>
            <Input
              value={data.commentaire}
              onChange={(e) => onUpdate({ ...data, commentaire: e.target.value })}
              placeholder={isVendu ? 'Vue dégagée' : 'Bien surévalué'}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Composant Prix Mise en Vente avec +/-
// ============================================
interface PrixMiseEnVenteOptionProps {
  type: TypeMiseEnVente;
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  pourcentage: number;
  prix: number;
  onSelect: () => void;
  onPourcChange: (delta: number) => void;
}

function PrixMiseEnVenteOption({ type, label, description, icon, selected, pourcentage, prix, onSelect, onPourcChange }: PrixMiseEnVenteOptionProps) {
  return (
    <div 
      onClick={onSelect}
      className={cn(
        "border-2 rounded-xl p-4 cursor-pointer transition-all",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
            selected ? "border-primary" : "border-muted-foreground"
          )}>
            {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
          </div>
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{label}</span>
          </div>
        </div>
        <span className={cn(
          "text-lg font-bold",
          selected ? "text-primary" : "text-foreground"
        )}>
          {formatPriceCHF(prix)}
        </span>
      </div>
      
      {/* Description de la stratégie */}
      <p className="text-xs text-muted-foreground ml-8 mt-1">{description}</p>
      
      <div className="flex items-center gap-2 mt-2 ml-8">
        <span className="text-sm text-muted-foreground">Vénale +</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onPourcChange(-0.5); }}
          className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="text-sm font-medium w-12 text-center">{pourcentage.toFixed(1)}%</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onPourcChange(0.5); }}
          className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-muted"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// ANNEXES MAISON PRÉDÉFINIES
// ============================================
const ANNEXES_MAISON_OPTIONS = [
  { id: 'piscine', label: 'Piscine', icon: '🏊', defaultPrix: '50000' },
  { id: 'pool_house', label: 'Pool House', icon: '🏠', defaultPrix: '30000' },
  { id: 'garage_double', label: 'Garage double', icon: '🚗', defaultPrix: '40000' },
  { id: 'carport', label: 'Carport', icon: '🅿️', defaultPrix: '15000' },
  { id: 'abri_jardin', label: 'Abri de jardin', icon: '🏡', defaultPrix: '5000' },
  { id: 'veranda', label: 'Véranda', icon: '🌿', defaultPrix: '25000' },
  { id: 'sauna', label: 'Sauna', icon: '🧖', defaultPrix: '15000' },
  { id: 'jacuzzi', label: 'Jacuzzi', icon: '🛁', defaultPrix: '10000' },
  { id: 'terrain_tennis', label: 'Terrain tennis', icon: '🎾', defaultPrix: '80000' },
  { id: 'ecurie', label: 'Écurie', icon: '🐴', defaultPrix: '60000' },
];

// ============================================
// Composant Principal
// ============================================
export default function Module4PreEstimation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, updateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [preEst, setPreEst] = useState<PreEstimation>(defaultPreEstimation);
  const [saving, setSaving] = useState(false);

  const loadEstimation = useCallback(async () => {
    if (!id) return;
    const data = await fetchEstimation(id);
    if (data) {
      setEstimation(data);
      setPreEst({ ...defaultPreEstimation, ...data.preEstimation });
    }
  }, [id, fetchEstimation]);

  useEffect(() => {
    if (!id) return;
    loadEstimation();
  }, [id, loadEstimation]);

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

  const handlePrevious = () => {
    navigate(`/estimation/${id}/photos`);
  };

  // Gestion des lignes supplémentaires (Appartement)
  const addLigneSupp = () => {
    updateField('lignesSupp', [...preEst.lignesSupp, { libelle: '', prix: '' }]);
  };

  const updateLigneSupp = (index: number, data: LigneSupp) => {
    const newLignes = [...preEst.lignesSupp];
    newLignes[index] = data;
    updateField('lignesSupp', newLignes);
  };

  const deleteLigneSupp = (index: number) => {
    updateField('lignesSupp', preEst.lignesSupp.filter((_, i) => i !== index));
  };

  // Gestion des annexes (Maison)
  const addAnnexe = (annexeId?: string) => {
    if (annexeId) {
      const opt = ANNEXES_MAISON_OPTIONS.find(a => a.id === annexeId);
      if (opt) {
        updateField('annexes', [...preEst.annexes, { libelle: opt.label, prix: opt.defaultPrix }]);
      }
    } else {
      updateField('annexes', [...preEst.annexes, { libelle: '', prix: '' }]);
    }
  };

  const updateAnnexe = (index: number, data: Annexe) => {
    const newAnnexes = [...preEst.annexes];
    newAnnexes[index] = data;
    updateField('annexes', newAnnexes);
  };

  const deleteAnnexe = (index: number) => {
    updateField('annexes', preEst.annexes.filter((_, i) => i !== index));
  };

  // Gestion des comparables vendus
  const addComparableVendu = () => {
    updateField('comparablesVendus', [
      ...preEst.comparablesVendus,
      { adresse: '', prix: '', surface: '', dateVente: '', commentaire: '' }
    ]);
  };

  const updateComparableVendu = (index: number, data: Comparable) => {
    const newComps = [...preEst.comparablesVendus];
    newComps[index] = data;
    updateField('comparablesVendus', newComps);
  };

  const deleteComparableVendu = (index: number) => {
    updateField('comparablesVendus', preEst.comparablesVendus.filter((_, i) => i !== index));
  };

  // Gestion des comparables en vente
  const addComparableEnVente = () => {
    updateField('comparablesEnVente', [
      ...preEst.comparablesEnVente,
      { adresse: '', prix: '', surface: '', dureeEnVente: '', commentaire: '' }
    ]);
  };

  const updateComparableEnVente = (index: number, data: Comparable) => {
    const newComps = [...preEst.comparablesEnVente];
    newComps[index] = data;
    updateField('comparablesEnVente', newComps);
  };

  const deleteComparableEnVente = (index: number) => {
    updateField('comparablesEnVente', preEst.comparablesEnVente.filter((_, i) => i !== index));
  };

  // Source unique : caracteristiques
  const typeBien = estimation?.caracteristiques?.typeBien;
  const isAppartement = typeBien === 'appartement';
  const isMaison = typeBien === 'maison';
  
  // Récupération données caractéristiques
  const carac = estimation?.caracteristiques;
  const nbPlaceInt = parseInt(carac?.parkingInterieur || '0') || 0;
  const nbPlaceExt = parseInt(carac?.parkingExterieur || '0') || 0;
  const nbBox = parseInt(carac?.box || '0') || 0;
  const hasCave = carac?.cave || false;

  // Calculs détaillés pour affichage
  const deductionTravauxAppart = calcul.valeurSurfaceBrute - calcul.valeurSurface;
  const deductionTravauxMaison = calcul.cubage * (parseFloat(preEst.prixM3 || '0') - calcul.prixM3Ajuste);
  const chargesMensuelles = calcul.loyerBrut * 0.1;
  const loyerNet = calcul.loyerBrut - chargesMensuelles;
  const loyerAnnuel = loyerNet * 12;

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
    <div className="min-h-screen bg-background pb-32">
      <ModuleHeader 
        moduleNumber={4} 
        title="Pré-estimation" 
        subtitle="Calcul de la valeur du bien"
        backPath={`/estimation/${id}/3`}
      />

      <div className="p-4 space-y-6">

        {/* ============================================ */}
        {/* BADGE TYPE DE BIEN */}
        {/* ============================================ */}
        <div className="flex items-center gap-2">
          {isAppartement && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Appartement
            </div>
          )}
          {isMaison && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              <Home className="h-4 w-4" />
              Maison
            </div>
          )}
        </div>

        {/* AVERTISSEMENT SI PAS DE TYPE DE BIEN */}
        {!isAppartement && !isMaison && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Type de bien non défini
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Veuillez d'abord remplir le Module 2 (Caractéristiques) pour sélectionner le type de bien.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* ============================================ */}
        {/* VALEUR VÉNALE - APPARTEMENT */}
        {/* ============================================ */}
        {isAppartement && (
          <FormSection 
            title="VALEUR VÉNALE" 
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            variant="highlight"
          >
            <div className="space-y-4">
              
              {/* Surface pondérée × Prix/m² */}
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="font-medium mb-3">Surface pondérée</h4>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {calcul.surfacePonderee.toFixed(1)} m²
                  </span>
                  <span className="text-muted-foreground">×</span>
                  <Input
                    type="number"
                    value={preEst.prixM2}
                    onChange={(e) => updateField('prixM2', e.target.value)}
                    placeholder="11900"
                    className="w-28 text-center"
                  />
                  <span className="text-muted-foreground">=</span>
                  <span className="font-medium whitespace-nowrap">
                    {formatPriceCHF(calcul.valeurSurfaceBrute)}
                  </span>
                </div>
              </div>
              
              {/* Réduction travaux / vétusté Appartement */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">🔧</span>
                    <span className="font-medium">Réduction travaux / vétusté</span>
                  </div>
                  <span className="font-bold text-amber-600">{preEst.tauxVetuste}%</span>
                </div>
                
                <Slider
                  value={[preEst.tauxVetuste]}
                  onValueChange={([v]) => updateField('tauxVetuste', v)}
                  min={0}
                  max={50}
                  step={1}
                  className="my-3"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>Prix/m² ajusté</span>
                    <span className="font-medium">{calcul.prixM2Ajuste.toLocaleString('fr-CH')} CHF/m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-destructive">Déduction travaux</span>
                    <span className="font-medium text-destructive">- {deductionTravauxAppart.toLocaleString('fr-CH')} CHF</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary font-medium">Valeur ajustée</span>
                    <span className="font-bold text-primary">{formatPriceCHF(calcul.valeurSurface)}</span>
                  </div>
                </div>
              </div>
              
              {/* Places intérieures */}
              {nbPlaceInt > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🚗</span>
                    <h4 className="font-medium">Places intérieures ({nbPlaceInt})</h4>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{nbPlaceInt} place(s)</span>
                    <span className="text-muted-foreground">×</span>
                    <Input
                      type="number"
                      value={preEst.prixPlaceInt}
                      onChange={(e) => updateField('prixPlaceInt', e.target.value)}
                      placeholder="30000"
                      className="w-28 text-center"
                    />
                    <span className="text-muted-foreground">=</span>
                    <span className="font-medium whitespace-nowrap">
                      {formatPriceCHF(calcul.valeurPlaceInt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Places extérieures */}
              {nbPlaceExt > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🅿️</span>
                    <h4 className="font-medium">Places extérieures ({nbPlaceExt})</h4>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{nbPlaceExt} place(s)</span>
                    <span className="text-muted-foreground">×</span>
                    <Input
                      type="number"
                      value={preEst.prixPlaceExt}
                      onChange={(e) => updateField('prixPlaceExt', e.target.value)}
                      placeholder="20000"
                      className="w-28 text-center"
                    />
                    <span className="text-muted-foreground">=</span>
                    <span className="font-medium whitespace-nowrap">
                      {formatPriceCHF(calcul.valeurPlaceExt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Box */}
              {nbBox > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🏠</span>
                    <h4 className="font-medium">Box ({nbBox})</h4>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{nbBox} box</span>
                    <span className="text-muted-foreground">×</span>
                    <Input
                      type="number"
                      value={preEst.prixBox}
                      onChange={(e) => updateField('prixBox', e.target.value)}
                      placeholder="40000"
                      className="w-28 text-center"
                    />
                    <span className="text-muted-foreground">=</span>
                    <span className="font-medium whitespace-nowrap">
                      {formatPriceCHF(calcul.valeurBox)}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Cave */}
              {hasCave && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🍷</span>
                    <h4 className="font-medium">Cave</h4>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">1 cave</span>
                    <span className="text-muted-foreground">=</span>
                    <Input
                      type="number"
                      value={preEst.prixCave}
                      onChange={(e) => updateField('prixCave', e.target.value)}
                      placeholder="0"
                      className="w-28 text-center"
                    />
                  </div>
                </div>
              )}
              
              {/* Lignes supplémentaires */}
              {preEst.lignesSupp.map((ligne, index) => (
                <div key={index} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Input
                      value={ligne.libelle}
                      onChange={(e) => updateLigneSupp(index, { ...ligne, libelle: e.target.value })}
                      placeholder="Libellé"
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">=</span>
                    <Input
                      type="number"
                      value={ligne.prix}
                      onChange={(e) => updateLigneSupp(index, { ...ligne, prix: e.target.value })}
                      placeholder="Prix"
                      className="w-28 text-center"
                    />
                    <button onClick={() => deleteLigneSupp(index)} className="text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Bouton ajouter ligne */}
              <button 
                onClick={addLigneSupp}
                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + Ajouter une ligne
              </button>
              
              {/* Total Valeur Vénale */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-semibold text-lg">Total Valeur Vénale</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPriceCHF(calcul.totalVenaleArrondi)}
                </span>
              </div>
            </div>
          </FormSection>
        )}

        {/* ============================================ */}
        {/* VALEUR VÉNALE - MAISON */}
        {/* ============================================ */}
        {isMaison && (
          <FormSection 
            title="VALEUR VÉNALE" 
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            variant="highlight"
          >
            <div className="space-y-4">
              
              {/* 1. TERRAIN */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TreeDeciduous className="h-4 w-4 text-green-600" />
                  <h4 className="font-medium">Terrain</h4>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {parseFloat(carac?.surfaceTerrain || '0').toLocaleString('fr-CH')} m²
                  </span>
                  <span className="text-muted-foreground">×</span>
                  <Input
                    type="number"
                    value={preEst.prixM2Terrain}
                    onChange={(e) => updateField('prixM2Terrain', e.target.value)}
                    placeholder="1200"
                    className="w-28 text-center"
                  />
                  <span className="text-muted-foreground">=</span>
                  <span className="font-medium whitespace-nowrap">
                    {formatPriceCHF(calcul.valeurTerrain)}
                  </span>
                </div>
              </div>

              {/* 2. CUBAGE (VOLUME) */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mountain className="h-4 w-4 text-slate-600" />
                  <h4 className="font-medium">Volume bâti (cubage SIA)</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cubage automatique</span>
                    <span>{calcul.cubageAuto.toFixed(0)} m³</span>
                  </div>
                  
                  <FormRow label="Cubage manuel (optionnel)">
                    <Input
                      type="number"
                      value={preEst.cubageManuel}
                      onChange={(e) => updateField('cubageManuel', e.target.value)}
                      placeholder="Laisser vide pour auto"
                      className="text-center"
                    />
                  </FormRow>
                  
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-muted-foreground font-medium">
                      {calcul.cubage.toFixed(0)} m³
                    </span>
                    <span className="text-muted-foreground">×</span>
                    <Input
                      type="number"
                      value={preEst.prixM3}
                      onChange={(e) => updateField('prixM3', e.target.value)}
                      placeholder="950"
                      className="w-28 text-center"
                    />
                    <span className="text-muted-foreground">=</span>
                    <span className="font-medium whitespace-nowrap">
                      {formatPriceCHF(calcul.cubage * parseFloat(preEst.prixM3 || '0'))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Réduction vétusté MAISON */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">🔧</span>
                    <span className="font-medium">Réduction travaux / vétusté</span>
                  </div>
                  <span className="font-bold text-amber-600">{preEst.tauxVetusteMaison}%</span>
                </div>
                
                <Slider
                  value={[preEst.tauxVetusteMaison]}
                  onValueChange={([v]) => updateField('tauxVetusteMaison', v)}
                  min={0}
                  max={50}
                  step={1}
                  className="my-3"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
                
                <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-900 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>Prix/m³ ajusté</span>
                    <span className="font-medium">{calcul.prixM3Ajuste.toLocaleString('fr-CH')} CHF/m³</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-destructive">Déduction travaux</span>
                    <span className="font-medium text-destructive">- {deductionTravauxMaison.toLocaleString('fr-CH')} CHF</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary font-medium">Valeur cubage ajustée</span>
                    <span className="font-bold text-primary">{formatPriceCHF(calcul.valeurCubage)}</span>
                  </div>
                </div>
              </div>

              {/* 3. AMÉNAGEMENTS EXTÉRIEURS */}
              {calcul.surfaceAmenagement > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span>🌳</span>
                    <h4 className="font-medium">Aménagements extérieurs</h4>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {calcul.surfaceAmenagement.toFixed(0)} m²
                    </span>
                    <span className="text-muted-foreground">×</span>
                    <Input
                      type="number"
                      value={preEst.prixM2Amenagement}
                      onChange={(e) => updateField('prixM2Amenagement', e.target.value)}
                      placeholder="200"
                      className="w-28 text-center"
                    />
                    <span className="text-muted-foreground">=</span>
                    <span className="font-medium whitespace-nowrap">
                      {formatPriceCHF(calcul.valeurAmenagement)}
                    </span>
                  </div>
                </div>
              )}

              {/* 4. ANNEXES MAISON */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-slate-600" />
                  <h4 className="font-medium">Annexes & Équipements</h4>
                </div>
                
                {/* Annexes existantes */}
                {preEst.annexes.map((annexe, index) => (
                  <div key={index} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Input
                        value={annexe.libelle}
                        onChange={(e) => updateAnnexe(index, { ...annexe, libelle: e.target.value })}
                        placeholder="Libellé"
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">=</span>
                      <Input
                        type="number"
                        value={annexe.prix}
                        onChange={(e) => updateAnnexe(index, { ...annexe, prix: e.target.value })}
                        placeholder="Prix"
                        className="w-28 text-center"
                      />
                      <button onClick={() => deleteAnnexe(index)} className="text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Chips annexes prédéfinies */}
                <div className="flex flex-wrap gap-2">
                  {ANNEXES_MAISON_OPTIONS
                    .filter(opt => !preEst.annexes.some(a => a.libelle === opt.label))
                    .slice(0, 6)
                    .map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => addAnnexe(opt.id)}
                        className="px-3 py-1.5 bg-muted rounded-full text-sm hover:bg-muted/80 flex items-center gap-1.5"
                      >
                        <span>{opt.icon}</span>
                        {opt.label}
                        <Plus className="h-3 w-3" />
                      </button>
                    ))}
                </div>

                {/* Bouton ajouter annexe libre */}
                <button 
                  onClick={() => addAnnexe()}
                  className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  + Ajouter une annexe
                </button>

                {/* Total annexes */}
                {preEst.annexes.length > 0 && (
                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-muted-foreground">Total annexes</span>
                    <span className="font-medium">{formatPriceCHF(calcul.valeurAnnexes)}</span>
                  </div>
                )}
              </div>
              
              {/* Total Valeur Vénale Maison */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="font-semibold text-lg">Total Valeur Vénale</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPriceCHF(calcul.totalVenaleArrondi)}
                </span>
              </div>

              {/* Détail du calcul maison */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Terrain</span>
                  <span>{formatPriceCHF(calcul.valeurTerrain)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume bâti (après vétusté)</span>
                  <span>{formatPriceCHF(calcul.valeurCubage)}</span>
                </div>
                {calcul.valeurAmenagement > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aménagements</span>
                    <span>{formatPriceCHF(calcul.valeurAmenagement)}</span>
                  </div>
                )}
                {calcul.valeurAnnexes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annexes</span>
                    <span>{formatPriceCHF(calcul.valeurAnnexes)}</span>
                  </div>
                )}
              </div>
            </div>
          </FormSection>
        )}

        {/* ============================================ */}
        {/* VALEUR DE RENDEMENT */}
        {/* ============================================ */}
        {(isAppartement || isMaison) && (
        <FormSection 
          title="VALEUR DE RENDEMENT" 
          icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
          variant="highlight"
        >
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div>
                <Label className="text-sm">Loyer mensuel brut (CHF)</Label>
                <Input
                  type="number"
                  value={preEst.loyerMensuel}
                  onChange={(e) => updateField('loyerMensuel', e.target.value)}
                  placeholder="3900"
                  className="mt-1.5 text-lg"
                />
              </div>
              
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Charges (10%)</span>
                  <span>- {chargesMensuelles.toLocaleString('fr-CH')} CHF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Loyer net mensuel</span>
                  <span>{loyerNet.toLocaleString('fr-CH')} CHF</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total annuel</span>
                  <span className="font-medium">{loyerAnnuel.toLocaleString('fr-CH')} CHF</span>
                </div>
              </div>
            </div>
            
            {/* Taux de capitalisation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Taux de capitalisation</Label>
                <span className="text-lg font-bold text-primary">{preEst.tauxCapitalisation.toFixed(2)}%</span>
              </div>
              <Slider
                value={[preEst.tauxCapitalisation]}
                onValueChange={([v]) => updateField('tauxCapitalisation', v)}
                min={2}
                max={3}
                step={0.25}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2%</span>
                <span>2.5%</span>
                <span>3%</span>
              </div>
            </div>
            
            {/* Résultat */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="font-semibold text-lg">Valeur de Rendement</span>
              <span className="text-2xl font-bold text-primary">
                {formatPriceCHF(calcul.valeurRendement)}
              </span>
            </div>
          </div>
        </FormSection>
        )}

        {/* ============================================ */}
        {/* VALEUR DE GAGE - UNIQUEMENT SI VÉNALE > 0 */}
        {/* ============================================ */}
        {calcul.totalVenale > 0 && (
        <FormSection 
          title="VALEUR DE GAGE" 
          icon={<Landmark className="h-4 w-4 text-emerald-500" />}
          variant="highlight"
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              (2 × Valeur Vénale + 1 × Valeur Rendement) / 3
            </p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-lg">Valeur de Gage</span>
              <span className="text-2xl font-bold text-primary">
                {formatPriceCHF(calcul.valeurGageArrondi)}
              </span>
            </div>
          </div>
        </FormSection>
        )}

        {/* ============================================ */}
        {/* FOURCHETTE DE PRIX - UNIQUEMENT SI VÉNALE > 0 */}
        {/* ============================================ */}
        {calcul.totalVenale > 0 && (
        <FormSection 
          title="FOURCHETTE DE PRIX" 
          icon={<Target className="h-4 w-4 text-purple-500" />}
          variant="highlight"
        >
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Calculé : Vénale ± 3%
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Entre</Label>
                <div className="mt-1 p-3 bg-card border border-border rounded-lg text-center">
                  <span className="text-lg font-bold">{formatPriceCHF(calcul.prixEntreCalcule)}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Et</Label>
                <div className="mt-1 p-3 bg-card border border-border rounded-lg text-center">
                  <span className="text-lg font-bold">{formatPriceCHF(calcul.prixEtCalcule)}</span>
                </div>
              </div>
            </div>
          </div>
        </FormSection>
        )}

        {/* ============================================ */}
        {/* PRIX DE MISE EN VENTE - UNIQUEMENT SI VÉNALE > 0 */}
        {/* ============================================ */}
        {calcul.totalVenale > 0 && (
        <FormSection 
          title="PRIX DE MISE EN VENTE" 
          icon={<Rocket className="h-4 w-4 text-rose-500" />}
          variant="highlight"
        >
          <div className="space-y-3">
            <PrixMiseEnVenteOption
              type="offmarket"
              label="Off Market"
              description="Diffusion confidentielle — réseau privé GARY uniquement"
              icon={<span>🔒</span>}
              selected={preEst.typeMiseEnVente === 'offmarket'}
              pourcentage={preEst.pourcOffmarket}
              prix={calcul.prixOffmarket}
              onSelect={() => updateField('typeMiseEnVente', 'offmarket')}
              onPourcChange={(delta) => updateField('pourcOffmarket', Math.max(0, preEst.pourcOffmarket + delta))}
            />
            
            <PrixMiseEnVenteOption
              type="comingsoon"
              label="Coming Soon"
              description="Création d'attente avant mise en ligne publique"
              icon={<span>⏳</span>}
              selected={preEst.typeMiseEnVente === 'comingsoon'}
              pourcentage={preEst.pourcComingsoon}
              prix={calcul.prixComingSoon}
              onSelect={() => updateField('typeMiseEnVente', 'comingsoon')}
              onPourcChange={(delta) => updateField('pourcComingsoon', Math.max(0, preEst.pourcComingsoon + delta))}
            />
            
            <PrixMiseEnVenteOption
              type="public"
              label="Public"
              description="Visibilité maximale sur tous les portails immobiliers"
              icon={<span>📢</span>}
              selected={preEst.typeMiseEnVente === 'public'}
              pourcentage={preEst.pourcPublic}
              prix={calcul.prixPublic}
              onSelect={() => updateField('typeMiseEnVente', 'public')}
              onPourcChange={(delta) => updateField('pourcPublic', Math.max(0, preEst.pourcPublic + delta))}
            />
          </div>
        </FormSection>
        )}

        {/* ============================================ */}
        {/* RÉCAPITULATIF - UNIQUEMENT SI VÉNALE > 0 */}
        {/* ============================================ */}
        {calcul.totalVenale > 0 && (
        <div className="bg-gray-900 text-white rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-400">
            Récapitulatif
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Valeur Vénale</span>
              <span className="font-semibold">{formatPriceCHF(calcul.totalVenaleArrondi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Valeur de Rendement</span>
              <span className="font-semibold">{formatPriceCHF(calcul.valeurRendement)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Valeur de Gage</span>
              <span className="font-semibold">{formatPriceCHF(calcul.valeurGageArrondi)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Fourchette</span>
              <span className="font-semibold">
                {formatPriceCHF(calcul.prixEntreCalcule)} - {formatPriceCHF(calcul.prixEtCalcule)}
              </span>
            </div>
            
            <div className="pt-3 border-t border-gray-700 flex justify-between">
              <span className="text-gray-300">Prix de mise en vente</span>
              <span className="text-xl font-bold text-primary">
                {formatPriceCHF(calcul.prixMiseEnVente)}
              </span>
            </div>
          </div>
        </div>
        )}

        {/* ============================================ */}
        {/* COMPARABLES MARCHÉ */}
        {/* ============================================ */}
        <FormSection 
          title="Comparables marché" 
          icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
        >
          <div className="space-y-6">
            
            {/* Carte des comparables */}
            <ComparablesMap
              bienPrincipal={{
                coordinates: estimation?.identification?.adresse?.coordinates || null,
                adresse: estimation?.identification?.adresse?.rue 
                  ? `${estimation.identification.adresse.rue}, ${estimation.identification.adresse.localite}`
                  : undefined,
                prixEstime: calcul.prixMiseEnVente,
              }}
              comparablesVendus={preEst.comparablesVendus}
              comparablesEnVente={preEst.comparablesEnVente}
            />
            
            {/* Transactions récentes (Vendus) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">Transactions récentes</span>
              </div>
              
              {preEst.comparablesVendus.map((comp, index) => (
                <ComparableCard
                  key={index}
                  index={index}
                  type="vendu"
                  data={comp}
                  onUpdate={(data) => updateComparableVendu(index, data)}
                  onDelete={() => deleteComparableVendu(index)}
                />
              ))}
              
              <button 
                onClick={addComparableVendu}
                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + Ajouter un bien vendu
              </button>
            </div>
            
            {/* Actuellement en vente */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Actuellement en vente</span>
              </div>
              
              {preEst.comparablesEnVente.map((comp, index) => (
                <ComparableCard
                  key={index}
                  index={index}
                  type="enVente"
                  data={comp}
                  onUpdate={(data) => updateComparableEnVente(index, data)}
                  onDelete={() => deleteComparableEnVente(index)}
                />
              ))}
              
              <button 
                onClick={addComparableEnVente}
                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + Ajouter un bien en vente
              </button>
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
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
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
