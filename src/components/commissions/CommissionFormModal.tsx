import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Plus, X } from "lucide-react";
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

interface CommissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: Commission | null;
  onDelete: (id: string) => void;
}

const ORIGINES = ["Réseau", "Prospection", "Recommandation", "Autre"];

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
  const [repartition, setRepartition] = useState<{ courtier: string; montant: string }[]>([]);

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
        setRepartition(
          Object.entries(commission.repartition || {}).map(([courtier, montant]) => ({
            courtier,
            montant: montant.toString(),
          }))
        );
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
      }
    }
  }, [open, commission]);

  // Calculate sum of repartition
  const repartitionSum = repartition.reduce((sum, r) => sum + (parseFloat(r.montant) || 0), 0);
  const commissionTotaleNum = parseFloat(commissionTotale) || 0;
  const isRepartitionValid = Math.abs(repartitionSum - commissionTotaleNum) < 0.01 || repartition.length === 0;

  // Add repartition row
  const addRepartitionRow = () => {
    setRepartition([...repartition, { courtier: "", montant: "" }]);
  };

  // Remove repartition row
  const removeRepartitionRow = (index: number) => {
    setRepartition(repartition.filter((_, i) => i !== index));
  };

  // Update repartition row
  const updateRepartitionRow = (index: number, field: "courtier" | "montant", value: string) => {
    const updated = [...repartition];
    updated[index][field] = value;
    setRepartition(updated);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const repartitionObj: Record<string, number> = {};
      repartition.forEach((r) => {
        if (r.courtier && r.montant) {
          repartitionObj[r.courtier] = parseFloat(r.montant);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="adresse">Adresse *</Label>
                <Input
                  id="adresse"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Adresse complète du bien"
                  required
                />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <Input
                      type="number"
                      value={r.montant}
                      onChange={(e) => updateRepartitionRow(index, "montant", e.target.value)}
                      placeholder="Montant CHF"
                      className="w-32"
                    />
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
                  <span className="text-muted-foreground">Total répartition :</span>
                  <span className={!isRepartitionValid ? "text-destructive font-medium" : ""}>
                    {repartitionSum.toLocaleString("fr-CH")} CHF
                    {!isRepartitionValid && ` (attendu: ${commissionTotaleNum.toLocaleString("fr-CH")} CHF)`}
                  </span>
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
