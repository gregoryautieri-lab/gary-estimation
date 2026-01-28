import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { supabase } from '@/integrations/supabase/client';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AddressAutocomplete, type AddressDetails } from '@/components/address/AddressAutocomplete';
import { 
  Zap, 
  User, 
  MapPin, 
  Home, 
  Calculator, 
  ArrowLeft,
  Send,
  FileEdit,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { formatPriceCHF } from '@/hooks/useEstimationCalcul';
import { toast } from 'sonner';

interface ExpressFormData {
  vendeurNom: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  localite: string;
  typeBien: 'appartement' | 'maison' | '';
  nombrePieces: string;
  surface: string;
  etat: 'excellent' | 'bon' | 'renover' | 'mauvais' | '';
  prixM2: string;
  hasParking: boolean;
  hasCave: boolean;
  urgence: 'moins1mois' | '1-3mois' | '3-6mois' | 'plus6mois' | '';
}

const PRIX_M2_SUGGESTIONS: Record<string, { min: number; max: number; default: number }> = {
  '1200': { min: 14000, max: 22000, default: 17000 }, // Genève centre
  '1201': { min: 12000, max: 18000, default: 15000 },
  '1202': { min: 11000, max: 16000, default: 13500 },
  '1203': { min: 10000, max: 15000, default: 12500 },
  '1204': { min: 15000, max: 25000, default: 19000 }, // Eaux-Vives
  '1205': { min: 12000, max: 18000, default: 14500 },
  '1206': { min: 14000, max: 22000, default: 17500 }, // Champel
  '1207': { min: 13000, max: 20000, default: 16000 },
  '1208': { min: 12000, max: 18000, default: 15000 },
  '1209': { min: 10000, max: 15000, default: 12000 },
  '1212': { min: 10000, max: 15000, default: 12500 }, // Grand-Lancy
  '1213': { min: 9000, max: 14000, default: 11500 },  // Onex
  '1214': { min: 9000, max: 13000, default: 11000 },  // Vernier
  '1215': { min: 9000, max: 13000, default: 11000 },
  '1216': { min: 11000, max: 16000, default: 13500 }, // Cointrin
  '1217': { min: 10000, max: 14000, default: 12000 }, // Meyrin
  '1218': { min: 12000, max: 18000, default: 14500 }, // Grand-Saconnex
  '1219': { min: 10000, max: 14000, default: 12000 }, // Châtelaine
  '1220': { min: 9000, max: 13000, default: 11000 },
  '1222': { min: 11000, max: 16000, default: 13500 }, // Vésenaz
  '1223': { min: 15000, max: 25000, default: 19000 }, // Cologny
  '1224': { min: 12000, max: 18000, default: 15000 }, // Chêne-Bougeries
  '1225': { min: 11000, max: 16000, default: 13500 }, // Chêne-Bourg
  '1226': { min: 11000, max: 17000, default: 14000 }, // Thônex
  '1227': { min: 12000, max: 18000, default: 15000 }, // Carouge
  '1228': { min: 10000, max: 15000, default: 12500 }, // Plan-les-Ouates
  'default': { min: 10000, max: 16000, default: 13000 }
};

interface FromLeadData {
  lead_id: string;
  vendeur_nom: string;
  vendeur_prenom: string | null;
  vendeur_telephone: string | null;
  vendeur_email: string | null;
  bien_adresse: string | null;
  bien_npa: string | null;
  bien_localite: string | null;
  bien_type: string | null;
}

const EstimationExpress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createEstimation, loading } = useEstimationPersistence();
  
  // Récupérer les données du lead si on vient de la page lead
  const fromLead = location.state?.fromLead as FromLeadData | undefined;
  
  const [formData, setFormData] = useState<ExpressFormData>({
    vendeurNom: '',
    telephone: '',
    adresse: '',
    codePostal: '',
    localite: '',
    typeBien: '',
    nombrePieces: '',
    surface: '',
    etat: '',
    prixM2: '',
    hasParking: false,
    hasCave: false,
    urgence: ''
  });
  
  const [showResult, setShowResult] = useState(false);
  const [createdEstimationId, setCreatedEstimationId] = useState<string | null>(null);

  // Pré-remplir le formulaire si on vient d'un lead
  useEffect(() => {
    if (fromLead) {
      const fullName = [fromLead.vendeur_prenom, fromLead.vendeur_nom]
        .filter(Boolean)
        .join(' ');
      
      // Mapper le type de bien (lead → express)
      let typeBien: 'appartement' | 'maison' | '' = '';
      if (fromLead.bien_type === 'appartement') typeBien = 'appartement';
      else if (fromLead.bien_type === 'villa') typeBien = 'maison';
      
      setFormData(prev => ({
        ...prev,
        vendeurNom: fullName || '',
        telephone: fromLead.vendeur_telephone || '',
        adresse: fromLead.bien_adresse || '',
        codePostal: fromLead.bien_npa || '',
        localite: fromLead.bien_localite || '',
        typeBien
      }));
    }
  }, [fromLead]);

  // Suggestions prix/m² selon le code postal
  const prixM2Suggestion = useMemo(() => {
    const cp = formData.codePostal.slice(0, 4);
    return PRIX_M2_SUGGESTIONS[cp] || PRIX_M2_SUGGESTIONS['default'];
  }, [formData.codePostal]);

  // Calcul automatique du prix
  const estimation = useMemo(() => {
    const surface = parseFloat(formData.surface) || 0;
    const prixM2 = parseFloat(formData.prixM2) || 0;
    
    if (surface <= 0 || prixM2 <= 0) return null;

    const prixBase = surface * prixM2;
    
    const ajustementEtat: Record<string, number> = {
      'excellent': 1.1,
      'bon': 1.0,
      'renover': 0.85,
      'mauvais': 0.7
    };
    
    const coefEtat = ajustementEtat[formData.etat] || 1.0;
    const prixParking = formData.hasParking ? 30000 : 0;
    const prixCave = formData.hasCave ? 5000 : 0;

    const prixEstime = (prixBase * coefEtat) + prixParking + prixCave;
    
    return {
      prixEstime: Math.round(prixEstime / 1000) * 1000,
      prixMin: Math.round((prixEstime * 0.93) / 1000) * 1000,
      prixMax: Math.round((prixEstime * 1.07) / 1000) * 1000,
      details: {
        prixBase: Math.round(prixBase),
        coefEtat,
        prixParking,
        prixCave
      }
    };
  }, [formData]);

  const handleAddressSelect = (details: AddressDetails) => {
    setFormData(prev => ({
      ...prev,
      adresse: details.formatted || details.rue || '',
      codePostal: details.postalCode || details.codePostal || '',
      localite: details.locality || details.localite || ''
    }));
    
    const cp = details.postalCode || details.codePostal || '';
    if (!formData.prixM2 && cp) {
      const cpPrefix = cp.slice(0, 4);
      const suggestion = PRIX_M2_SUGGESTIONS[cpPrefix] || PRIX_M2_SUGGESTIONS['default'];
      setFormData(prev => ({
        ...prev,
        prixM2: suggestion.default.toString()
      }));
    }
  };

  const updateField = <K extends keyof ExpressFormData>(field: K, value: ExpressFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = useMemo(() => {
    return (
      formData.vendeurNom.trim() !== '' &&
      formData.telephone.trim() !== '' &&
      formData.adresse.trim() !== '' &&
      formData.typeBien !== '' &&
      formData.nombrePieces !== '' &&
      formData.surface !== '' &&
      formData.etat !== '' &&
      formData.prixM2 !== '' &&
      formData.urgence !== ''
    );
  }, [formData]);

  const handleCalculate = async () => {
    if (!isFormValid || !estimation) return;

    // Créer l'estimation en base
    const horizonMap: Record<string, string> = {
      'moins1mois': 'urgent',
      '1-3mois': 'court',
      '3-6mois': 'moyen',
      'plus6mois': 'long'
    };

    const created = await createEstimation({
      statut: 'brouillon',
      vendeurNom: formData.vendeurNom,
      vendeurTelephone: formData.telephone,
      vendeurEmail: fromLead?.vendeur_email || '',
      adresse: formData.adresse,
      codePostal: formData.codePostal,
      localite: formData.localite,
      typeBien: formData.typeBien as 'appartement' | 'maison',
      prixMin: estimation.prixMin,
      prixMax: estimation.prixMax,
      prixFinal: estimation.prixEstime,
      leadId: fromLead?.lead_id,
      identification: {
        vendeur: {
          nom: formData.vendeurNom,
          telephone: formData.telephone,
          email: fromLead?.vendeur_email || '',
          situation: ''
        },
        adresse: {
          rue: formData.adresse,
          codePostal: formData.codePostal,
          localite: formData.localite
        },
        contexte: {
          horizon: horizonMap[formData.urgence] || 'moyen',
          motifVente: '',
          prixAttendu: '',
          statutOccupation: '',
          finBailMois: '',
          finBailAnnee: '',
          confidentialite: 'normale',
          prioriteVendeur: 'equilibre'
        },
        historique: {
          dejaDiffuse: false,
          duree: '',
          prixAffiche: '',
          typeDiffusion: '',
          portails: [],
          reseauxSociaux: [],
          raisonEchec: []
        },
        proximites: [],
        financier: {
          dateAchat: '',
          prixAchat: '',
          ceduleHypothecaire: '',
          valeurLocative: ''
        },
        projetPostVente: {
          nature: '',
          avancement: '',
          dateCible: '',
          dateButoir: '',
          flexibilite: '',
          accepteDecalage: '',
          accepteTransitoire: '',
          toleranceVenteLongue: false,
          toleranceVenteRapide: false,
          toleranceInaction: false,
          toleranceRetrait: false,
          niveauCoordination: ''
        }
      },
      notesLibres: `Estimation Express créée le ${new Date().toLocaleDateString('fr-CH')}\nÉtat: ${formData.etat}\nSurface: ${formData.surface} m²\nPrix/m²: ${formData.prixM2} CHF`
    });

    if (created?.id) {
      // Si on vient d'un lead, le marquer comme converti
      if (fromLead?.lead_id) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            statut: 'converti',
            estimation_id: created.id,
            converti_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', fromLead.lead_id);

        if (updateError) {
          console.error('Erreur lors de la mise à jour du lead:', updateError);
          toast.error('Estimation créée mais erreur lors de la conversion du lead');
        } else {
          toast.success('Estimation créée et lead converti');
        }
      } else {
        toast.success('Estimation express créée !');
      }
      
      setCreatedEstimationId(created.id);
      setShowResult(true);
    }
  };

  const handleSendToClient = () => {
    if (!estimation) return;
    
    const message = `Bonjour ${formData.vendeurNom},

Suite à notre échange, voici une première estimation pour votre bien situé ${formData.adresse} :

📊 Fourchette de prix : ${formatPriceCHF(estimation.prixMin)} - ${formatPriceCHF(estimation.prixMax)}
💰 Prix estimé : ${formatPriceCHF(estimation.prixEstime)}

Cette estimation préliminaire est basée sur les informations fournies. Une visite approfondie permettra d'affiner cette évaluation.

Bien cordialement,
GARY Immobilier`;

    const encoded = encodeURIComponent(message);
    const phone = formData.telephone.replace(/\s/g, '').replace('+', '');
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handleComplete = () => {
    if (createdEstimationId) {
      navigate(`/estimation/${createdEstimationId}/1`);
    }
  };

  if (showResult && estimation) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-50">
          <Button variant="ghost" size="icon" onClick={() => setShowResult(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span className="font-semibold">Résultat Express</span>
          </div>
        </header>

        <main className="flex-1 p-4">
          <div className="max-w-md mx-auto space-y-6">
            {/* Result Card */}
            <Card className="p-6 text-center space-y-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estimation pour</p>
                <p className="font-semibold text-lg">{formData.adresse}</p>
                <p className="text-sm text-muted-foreground">{formData.localite}</p>
              </div>

              <div className="py-4 border-y border-border/50">
                <p className="text-sm text-muted-foreground mb-2">Fourchette de prix</p>
                <div className="flex items-center justify-center gap-2 text-lg">
                  <span className="font-medium">{formatPriceCHF(estimation.prixMin)}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="font-medium">{formatPriceCHF(estimation.prixMax)}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Prix estimé</p>
                <p className="text-3xl font-bold text-primary">{formatPriceCHF(estimation.prixEstime)}</p>
              </div>

              {/* Détails calcul */}
              <div className="text-xs text-muted-foreground bg-background/50 rounded-lg p-3 text-left">
                <p>📐 {formData.surface} m² × {formatPriceCHF(parseInt(formData.prixM2))}/m² = {formatPriceCHF(estimation.details.prixBase)}</p>
                <p>🏠 État {formData.etat} : ×{estimation.details.coefEtat}</p>
                {formData.hasParking && <p>🚗 Parking : +{formatPriceCHF(estimation.details.prixParking)}</p>}
                {formData.hasCave && <p>📦 Cave : +{formatPriceCHF(estimation.details.prixCave)}</p>}
              </div>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full h-14 text-lg" 
                onClick={handleSendToClient}
              >
                <Send className="h-5 w-5 mr-2" />
                Envoyer au client (WhatsApp)
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-14 text-lg"
                onClick={handleComplete}
              >
                <FileEdit className="h-5 w-5 mr-2" />
                Compléter l'estimation
              </Button>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Retour au tableau de bord
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <span className="font-semibold">Estimation Express</span>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          {/* Intro */}
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">
              Obtenez une estimation en <span className="font-semibold text-primary">5 minutes</span>
            </p>
          </div>

          {/* Section 1 : Qui & Où */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <User className="h-4 w-4" />
              <span>Qui & Où</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="vendeurNom">Nom du vendeur *</Label>
                <Input
                  id="vendeurNom"
                  placeholder="M. Dupont"
                  value={formData.vendeurNom}
                  onChange={(e) => updateField('vendeurNom', e.target.value)}
                  className="h-12 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="telephone">Téléphone *</Label>
                <Input
                  id="telephone"
                  type="tel"
                  placeholder="+41 79 123 45 67"
                  value={formData.telephone}
                  onChange={(e) => updateField('telephone', e.target.value)}
                  className="h-12 mt-1"
                />
              </div>

              <div>
                <Label>Adresse complète *</Label>
                <div className="mt-1">
                  <AddressAutocomplete
                    value={formData.adresse}
                    onAddressSelect={handleAddressSelect}
                    placeholder="Rue, numéro, ville..."
                    className="h-12"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 2 : Le bien */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Home className="h-4 w-4" />
              <span>Le bien</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Type de bien *</Label>
                <Select
                  value={formData.typeBien}
                  onValueChange={(v) => updateField('typeBien', v as 'appartement' | 'maison')}
                >
                  <SelectTrigger className="h-12 mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appartement">Appartement</SelectItem>
                    <SelectItem value="maison">Maison / Villa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Pièces *</Label>
                  <Select
                    value={formData.nombrePieces}
                    onValueChange={(v) => updateField('nombrePieces', v)}
                  >
                    <SelectTrigger className="h-12 mt-1">
                      <SelectValue placeholder="..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 pièce</SelectItem>
                      <SelectItem value="2">2 pièces</SelectItem>
                      <SelectItem value="2.5">2.5 pièces</SelectItem>
                      <SelectItem value="3">3 pièces</SelectItem>
                      <SelectItem value="3.5">3.5 pièces</SelectItem>
                      <SelectItem value="4">4 pièces</SelectItem>
                      <SelectItem value="4.5">4.5 pièces</SelectItem>
                      <SelectItem value="5">5 pièces</SelectItem>
                      <SelectItem value="5.5">5.5 pièces</SelectItem>
                      <SelectItem value="6">6 pièces</SelectItem>
                      <SelectItem value="7+">7+ pièces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="surface">Surface (m²) *</Label>
                  <Input
                    id="surface"
                    type="number"
                    placeholder="85"
                    value={formData.surface}
                    onChange={(e) => updateField('surface', e.target.value)}
                    className="h-12 mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>État général *</Label>
                <Select
                  value={formData.etat}
                  onValueChange={(v) => updateField('etat', v as ExpressFormData['etat'])}
                >
                  <SelectTrigger className="h-12 mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">🌟 Excellent (neuf ou rénové récemment)</SelectItem>
                    <SelectItem value="bon">👍 Bon (entretenu, quelques travaux mineurs)</SelectItem>
                    <SelectItem value="renover">🔧 À rénover (travaux importants)</SelectItem>
                    <SelectItem value="mauvais">⚠️ Mauvais (rénovation complète)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Section 3 : Prix */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Calculator className="h-4 w-4" />
              <span>Estimation</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="prixM2">Prix au m² (CHF) *</Label>
                <Input
                  id="prixM2"
                  type="number"
                  placeholder={prixM2Suggestion.default.toString()}
                  value={formData.prixM2}
                  onChange={(e) => updateField('prixM2', e.target.value)}
                  className="h-12 mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Zone {formData.codePostal || '...'} : {formatPriceCHF(prixM2Suggestion.min)} - {formatPriceCHF(prixM2Suggestion.max)}/m²
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="parking"
                    checked={formData.hasParking}
                    onCheckedChange={(c) => updateField('hasParking', c === true)}
                  />
                  <Label htmlFor="parking" className="cursor-pointer">
                    🚗 Parking (+30k)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cave"
                    checked={formData.hasCave}
                    onCheckedChange={(c) => updateField('hasCave', c === true)}
                  />
                  <Label htmlFor="cave" className="cursor-pointer">
                    📦 Cave (+5k)
                  </Label>
                </div>
              </div>

              <div>
                <Label>Urgence de vente *</Label>
                <Select
                  value={formData.urgence}
                  onValueChange={(v) => updateField('urgence', v as ExpressFormData['urgence'])}
                >
                  <SelectTrigger className="h-12 mt-1">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moins1mois">🔥 Moins d'1 mois</SelectItem>
                    <SelectItem value="1-3mois">⚡ 1-3 mois</SelectItem>
                    <SelectItem value="3-6mois">📅 3-6 mois</SelectItem>
                    <SelectItem value="plus6mois">🕐 Plus de 6 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview estimation */}
              {estimation && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Estimation préliminaire</p>
                  <p className="text-2xl font-bold text-primary">{formatPriceCHF(estimation.prixEstime)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPriceCHF(estimation.prixMin)} — {formatPriceCHF(estimation.prixMax)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Submit button */}
          <Button 
            className="w-full h-14 text-lg"
            disabled={!isFormValid || loading}
            onClick={handleCalculate}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Zap className="h-5 w-5 mr-2" />
            )}
            Calculer l'estimation
          </Button>
        </div>
      </main>
    </div>
  );
};

export default EstimationExpress;
