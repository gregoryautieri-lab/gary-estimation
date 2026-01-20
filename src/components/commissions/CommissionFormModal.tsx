import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, X, Lightbulb, Link2, Unlink, Home, Ruler, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { COURTIERS_LIST } from "@/pages/admin/AdminCommissions";

interface Commission {
  id: string;
  adresse: string;
  commune: string | null;
  courtier_principal: string;
  courtier_principal_email: string | null;
  prix_vente: number;
  commission_totale: number;
  date_signature: string | null;
  date_paiement: string | null;
  origine: string | null;
  origine_detail: string | null;
  estimation_id: string | null;
  notes: string | null;
  statut: string;
  repartition: Record<string, number>;
}

interface EstimationSuggestion {
  id: string;
  adresse: string | null;
  localite: string | null;
  type_bien: string | null;
  courtier_id: string;
  courtier_name: string | null;
  prix_min: number | null;
  prix_max: number | null;
  surface: number | null;
  pieces: number | null;
}

interface CommissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: Commission | null;
  onDelete: (id: string) => void;
}

const ORIGINES = ["Réseau", "Prospection", "Recommandation", "Autre"];

// Normalise text for search (lowercase, remove accents)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function CommissionFormModal({ open, onOpenChange, commission, onDelete }: CommissionFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!commission;

  // Form state
  const [adresse, setAdresse] = useState("");
  const [commune, setCommune] = useState("");
  const [courtierPrincipal, setCourtierPrincipal] = useState("");
  const [courtierPrincipalEmail, setCourtierPrincipalEmail] = useState("");
  const [prixVente, setPrixVente] = useState("");
  const [commissionTotale, setCommissionTotale] = useState("");
  const [dateSignature, setDateSignature] = useState("");
  const [datePaiement, setDatePaiement] = useState("");
  const [origine, setOrigine] = useState("");
  const [origineDetail, setOrigineDetail] = useState("");
  const [notes, setNotes] = useState("");
  const [statut, setStatut] = useState("Payée");
  const [repartition, setRepartition] = useState<{ courtier: string; pourcentage: string }[]>([]);

  // Estimation linking state
  const [estimationId, setEstimationId] = useState<string | null>(null);
  const [linkedEstimation, setLinkedEstimation] = useState<EstimationSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<EstimationSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced address for search
  const debouncedAdresse = useDebounce(adresse, 300);

  // Reset form when modal opens/closes or commission changes
  useEffect(() => {
    if (open) {
      if (commission) {
        setAdresse(commission.adresse);
        setCommune(commission.commune || "");
        setCourtierPrincipal(commission.courtier_principal);
        setCourtierPrincipalEmail(commission.courtier_principal_email || "");
        setPrixVente(commission.prix_vente.toString());
        setCommissionTotale(commission.commission_totale.toString());
        setDateSignature(commission.date_signature || "");
        setDatePaiement(commission.date_paiement || "");
        setOrigine(commission.origine || "");
        setOrigineDetail(commission.origine_detail || "");
        setNotes(commission.notes || "");
        setStatut(commission.statut);
        // Convert stored CHF amounts to percentages
        const totalComm = commission.commission_totale || 1;
        setRepartition(
          Object.entries(commission.repartition || {}).map(([courtier, montant]) => ({
            courtier,
            pourcentage: totalComm > 0 ? ((montant as number / totalComm) * 100).toFixed(0) : "0",
          }))
        );
        setEstimationId(commission.estimation_id);
        // Load linked estimation details if exists
        if (commission.estimation_id) {
          loadLinkedEstimation(commission.estimation_id);
        } else {
          setLinkedEstimation(null);
        }
      } else {
        // Reset for new commission
        setAdresse("");
        setCommune("");
        setCourtierPrincipal("");
        setCourtierPrincipalEmail("");
        setPrixVente("");
        setCommissionTotale("");
        setDateSignature("");
        setDatePaiement("");
        setOrigine("");
        setOrigineDetail("");
        setNotes("");
        setStatut("Payée");
        setRepartition([]);
        setEstimationId(null);
        setLinkedEstimation(null);
      }
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [open, commission]);

  // Load linked estimation details
  const loadLinkedEstimation = async (estId: string) => {
    try {
      const { data: est, error } = await supabase
        .from("estimations")
        .select("id, adresse, localite, type_bien, courtier_id, prix_min, prix_max, caracteristiques")
        .eq("id", estId)
        .maybeSingle();

      if (error || !est) return;

      // Get courtier name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", est.courtier_id)
        .maybeSingle();

      const carac = est.caracteristiques as any || {};

      setLinkedEstimation({
        id: est.id,
        adresse: est.adresse,
        localite: est.localite,
        type_bien: est.type_bien,
        courtier_id: est.courtier_id,
        courtier_name: profile?.full_name || null,
        prix_min: est.prix_min,
        prix_max: est.prix_max,
        surface: carac.surface_habitable || null,
        pieces: carac.nb_pieces || null,
      });
    } catch (err) {
      console.error("Error loading linked estimation:", err);
    }
  };

  // Search estimations when address changes
  useEffect(() => {
    if (!open || linkedEstimation) return;
    
    const searchEstimations = async () => {
      if (debouncedAdresse.length < 5) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchTerms = normalizeText(debouncedAdresse).split(/\s+/).filter(t => t.length > 2);
        
        // Build search query
        const { data, error } = await supabase
          .from("estimations")
          .select("id, adresse, localite, type_bien, courtier_id, prix_min, prix_max, caracteristiques")
          .neq("statut", "brouillon")
          .not("adresse", "is", null)
          .limit(20);

        if (error) throw error;

        // Filter client-side with normalized comparison
        const filtered = (data || [])
          .filter(est => {
            if (!est.adresse) return false;
            const normalizedAddr = normalizeText(est.adresse);
            return searchTerms.every(term => normalizedAddr.includes(term));
          })
          .slice(0, 5);

        // Get courtier names for filtered results
        const courtierIds = [...new Set(filtered.map(e => e.courtier_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", courtierIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

        const suggestionsWithNames: EstimationSuggestion[] = filtered.map(est => {
          const carac = est.caracteristiques as any || {};
          return {
            id: est.id,
            adresse: est.adresse,
            localite: est.localite,
            type_bien: est.type_bien,
            courtier_id: est.courtier_id,
            courtier_name: profileMap.get(est.courtier_id) || null,
            prix_min: est.prix_min,
            prix_max: est.prix_max,
            surface: carac.surface_habitable || null,
            pieces: carac.nb_pieces || null,
          };
        });

        setSuggestions(suggestionsWithNames);
        setShowSuggestions(suggestionsWithNames.length > 0);
      } catch (err) {
        console.error("Error searching estimations:", err);
      } finally {
        setIsSearching(false);
      }
    };

    searchEstimations();
  }, [debouncedAdresse, open, linkedEstimation]);

  // Link estimation
  const handleLinkEstimation = (estimation: EstimationSuggestion) => {
    setEstimationId(estimation.id);
    setLinkedEstimation(estimation);
    setShowSuggestions(false);
    
    // Pre-fill fields
    if (estimation.adresse) setAdresse(estimation.adresse);
    if (estimation.localite) setCommune(estimation.localite);
    
    // Try to match courtier name with predefined list
    if (estimation.courtier_name) {
      const firstName = estimation.courtier_name.split(" ")[0];
      const matchedCourtier = COURTIERS_LIST.find(c => 
        c.toLowerCase() === firstName.toLowerCase()
      );
      if (matchedCourtier) {
        setCourtierPrincipal(matchedCourtier);
      }
    }

    toast.success("Estimation liée");
  };

  // Unlink estimation
  const handleUnlinkEstimation = () => {
    setEstimationId(null);
    setLinkedEstimation(null);
    toast.info("Estimation déliée");
  };

  // Format price for display
  const formatPriceRange = (min: number | null, max: number | null): string => {
    if (!min && !max) return "-";
    const formatM = (v: number) => (v / 1000000).toFixed(1) + "M";
    if (min && max) return `${formatM(min)} - ${formatM(max)}`;
    if (min) return `≥ ${formatM(min)}`;
    if (max) return `≤ ${formatM(max)}`;
    return "-";
  };

  // Type bien label
  const getTypeBienLabel = (type: string | null): string => {
    if (!type) return "-";
    const labels: Record<string, string> = {
      appartement: "Appartement",
      maison: "Villa",
      terrain: "Terrain",
      commercial: "Commercial",
    };
    return labels[type] || type;
  };

  // Calculate sum of repartition percentages
  const commissionTotaleNum = parseFloat(commissionTotale) || 0;
  const repartitionPourcentageSum = repartition.reduce((sum, r) => sum + (parseFloat(r.pourcentage) || 0), 0);
  const repartitionCHFSum = (repartitionPourcentageSum / 100) * commissionTotaleNum;
  const isRepartitionValid = Math.abs(repartitionPourcentageSum - 100) < 0.01 || repartition.length === 0;

  // Calculate CHF amount for a given percentage
  const calculateMontant = (pourcentage: string): number => {
    const pct = parseFloat(pourcentage) || 0;
    return (pct / 100) * commissionTotaleNum;
  };

  // Add repartition row
  const addRepartitionRow = () => {
    setRepartition([...repartition, { courtier: "", pourcentage: "" }]);
  };

  // Remove repartition row
  const removeRepartitionRow = (index: number) => {
    setRepartition(repartition.filter((_, i) => i !== index));
  };

  // Update repartition row
  const updateRepartitionRow = (index: number, field: "courtier" | "pourcentage", value: string) => {
    const updated = [...repartition];
    updated[index][field] = value;
    setRepartition(updated);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Convert percentages to CHF amounts for storage
      const repartitionObj: Record<string, number> = {};
      const totalComm = parseFloat(commissionTotale) || 0;
      repartition.forEach((r) => {
        if (r.courtier && r.pourcentage) {
          const pct = parseFloat(r.pourcentage) || 0;
          repartitionObj[r.courtier] = Math.round((pct / 100) * totalComm);
        }
      });

      const payload = {
        adresse,
        commune: commune || null,
        courtier_principal: courtierPrincipal,
        courtier_principal_email: courtierPrincipalEmail || null,
        prix_vente: parseFloat(prixVente),
        commission_totale: parseFloat(commissionTotale),
        date_signature: dateSignature || null,
        date_paiement: datePaiement || null,
        origine: origine || null,
        origine_detail: origineDetail || null,
        notes: notes || null,
        statut,
        repartition: repartitionObj,
        estimation_id: estimationId,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("commissions")
          .update(payload)
          .eq("id", commission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("commissions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success(isEditing ? "Commission mise à jour" : "Commission créée");
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error saving commission:", error);
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!adresse || !courtierPrincipal || !prixVente || !commissionTotale) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    if (repartition.length > 0 && !isRepartitionValid) {
      toast.error("La somme des répartitions doit égaler la commission totale");
      return;
    }

    saveMutation.mutate();
  };

  const handleDelete = () => {
    if (commission) {
      onDelete(commission.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la commission" : "Nouvelle commission"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations du bien */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Informations du bien</h3>
            
            {/* Linked estimation badge */}
            {linkedEstimation && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium">Liée à l'estimation</p>
                        <p className="text-xs text-muted-foreground">{linkedEstimation.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleUnlinkEstimation}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Unlink className="h-4 w-4 mr-1" />
                      Délier
                    </Button>
                  </div>
                  
                  {/* Estimation details */}
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>{getTypeBienLabel(linkedEstimation.type_bien)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>{linkedEstimation.surface ? `${linkedEstimation.surface}m²` : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DoorOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{linkedEstimation.pieces ? `${linkedEstimation.pieces}p` : "-"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 relative">
                <Label htmlFor="adresse">Adresse *</Label>
                <Input
                  id="adresse"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Adresse complète du bien"
                  required
                  autoComplete="off"
                />
                
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && !linkedEstimation && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleLinkEstimation(suggestion)}
                      >
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {suggestion.adresse}
                              {suggestion.localite && `, ${suggestion.localite}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {suggestion.courtier_name || "Courtier inconnu"}
                              {suggestion.type_bien && ` • ${getTypeBienLabel(suggestion.type_bien)}`}
                              {suggestion.pieces && ` ${suggestion.pieces}p`}
                              {suggestion.surface && ` • ${suggestion.surface}m²`}
                              {(suggestion.prix_min || suggestion.prix_max) && 
                                ` • Est: ${formatPriceRange(suggestion.prix_min, suggestion.prix_max)}`}
                            </p>
                            <Badge variant="outline" className="mt-1.5 text-xs">
                              <Link2 className="h-3 w-3 mr-1" />
                              Lier cette estimation
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {isSearching && (
                  <p className="text-xs text-muted-foreground mt-1">Recherche d'estimations...</p>
                )}
              </div>
              <div>
                <Label htmlFor="commune">Commune</Label>
                <Input
                  id="commune"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Commune"
                />
              </div>
            </div>
          </div>

          {/* Courtier principal */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Courtier principal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="courtier">Nom *</Label>
                <Select value={courtierPrincipal} onValueChange={setCourtierPrincipal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURTIERS_LIST.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={courtierPrincipalEmail}
                  onChange={(e) => setCourtierPrincipalEmail(e.target.value)}
                  placeholder="email@gary.ch"
                />
              </div>
            </div>
          </div>

          {/* Montants */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Montants</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prix">Prix de vente (CHF) *</Label>
                <Input
                  id="prix"
                  type="number"
                  value={prixVente}
                  onChange={(e) => setPrixVente(e.target.value)}
                  placeholder="1500000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="commission">Commission totale (CHF) *</Label>
                <Input
                  id="commission"
                  type="number"
                  value={commissionTotale}
                  onChange={(e) => setCommissionTotale(e.target.value)}
                  placeholder="45000"
                  required
                />
              </div>
              <div>
                <Label>Pourcentage</Label>
                <div className="h-10 flex items-center px-3 rounded-md border bg-muted/50 text-sm font-medium">
                  {prixVente && commissionTotale && parseFloat(prixVente) > 0
                    ? `${((parseFloat(commissionTotale) / parseFloat(prixVente)) * 100).toFixed(2)}%`
                    : "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Dates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateSignature">Date signature compromis</Label>
                <Input
                  id="dateSignature"
                  type="date"
                  value={dateSignature}
                  onChange={(e) => setDateSignature(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="datePaiement">Date encaissement</Label>
                <Input
                  id="datePaiement"
                  type="date"
                  value={datePaiement}
                  onChange={(e) => setDatePaiement(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Origine */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Origine du mandat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origine">Source</Label>
                <Select value={origine} onValueChange={setOrigine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGINES.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(origine === "Prospection" || origine === "Autre") && (
                <div>
                  <Label htmlFor="origineDetail">Détail</Label>
                  <Input
                    id="origineDetail"
                    value={origineDetail}
                    onChange={(e) => setOrigineDetail(e.target.value)}
                    placeholder={origine === "Prospection" ? "ID campagne" : "Préciser"}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Statut */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Statut</h3>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Payée">Payée</SelectItem>
                <SelectItem value="En attente">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Répartition */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">Répartition par courtier</h3>
              <Button type="button" variant="outline" size="sm" onClick={addRepartitionRow}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>

            {repartition.length > 0 && (
              <div className="space-y-2">
                {repartition.map((r, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select value={r.courtier} onValueChange={(v) => updateRepartitionRow(index, "courtier", v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Courtier" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURTIERS_LIST.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={r.pourcentage}
                        onChange={(e) => updateRepartitionRow(index, "pourcentage", e.target.value)}
                        placeholder="50"
                        className="w-20 text-right"
                        min="0"
                        max="100"
                        step="any"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <div className="w-28 text-right text-sm text-muted-foreground">
                      {calculateMontant(r.pourcentage).toLocaleString("fr-CH")} CHF
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRepartitionRow(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Total :</span>
                  <div className="flex gap-4">
                    <span className={!isRepartitionValid ? "text-destructive font-medium" : ""}>
                      {repartitionPourcentageSum}%
                      {!isRepartitionValid && " (attendu: 100%)"}
                    </span>
                    <span className="font-medium">
                      {repartitionCHFSum.toLocaleString("fr-CH")} CHF
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes libres..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <DialogFooter className="flex justify-between sm:justify-between gap-2">
            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette commission sera supprimée. Cette action peut être annulée par un administrateur.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
