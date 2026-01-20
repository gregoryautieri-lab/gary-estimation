import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";

interface Objective {
  id?: string;
  year: number;
  type: "societe" | "courtier";
  courtier_name: string | null;
  amount: number;
}

interface ObjectivesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
}

export function ObjectivesModal({ open, onOpenChange, year }: ObjectivesModalProps) {
  const queryClient = useQueryClient();
  const [societeObjectif, setSocieteObjectif] = useState<string>("");
  const [courtierObjectifs, setCourtierObjectifs] = useState<{ name: string; amount: string; id?: string }[]>([]);
  const [newCourtierName, setNewCourtierName] = useState("");

  // Fetch existing objectives for the year
  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ["commission-objectives", year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_objectives")
        .select("*")
        .eq("year", year);
      if (error) throw error;
      return data as Objective[];
    },
    enabled: open,
  });

  // Fetch users for suggestions
  const { data: users = [] } = useQuery({
    queryKey: ["profiles-for-objectives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .order("full_name");
      if (error) throw error;
      return data.filter(u => u.full_name).map(u => u.full_name!);
    },
    enabled: open,
  });

  // Initialize form when data loads
  useEffect(() => {
    if (objectives.length > 0) {
      const societe = objectives.find(o => o.type === "societe");
      setSocieteObjectif(societe?.amount?.toString() || "1850000");

      const courtiers = objectives
        .filter(o => o.type === "courtier" && o.courtier_name)
        .map(o => ({
          name: o.courtier_name!,
          amount: o.amount.toString(),
          id: o.id,
        }));
      setCourtierObjectifs(courtiers);
    } else {
      setSocieteObjectif("1850000");
      setCourtierObjectifs([]);
    }
  }, [objectives]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Upsert societe objective
      const { error: societeError } = await supabase
        .from("commission_objectives")
        .upsert({
          year,
          type: "societe",
          courtier_name: null,
          amount: parseFloat(societeObjectif) || 0,
        }, { onConflict: "year,type,courtier_name" });
      
      if (societeError) throw societeError;

      // Get existing courtier objectives
      const existingCourtierNames = objectives
        .filter(o => o.type === "courtier")
        .map(o => o.courtier_name);

      // Upsert courtier objectives
      for (const co of courtierObjectifs) {
        if (!co.name) continue;
        const { error } = await supabase
          .from("commission_objectives")
          .upsert({
            year,
            type: "courtier",
            courtier_name: co.name,
            amount: parseFloat(co.amount) || 0,
          }, { onConflict: "year,type,courtier_name" });
        if (error) throw error;
      }

      // Delete removed courtier objectives
      const currentNames = courtierObjectifs.map(c => c.name);
      const toDelete = existingCourtierNames.filter(name => name && !currentNames.includes(name));
      
      for (const name of toDelete) {
        await supabase
          .from("commission_objectives")
          .delete()
          .eq("year", year)
          .eq("type", "courtier")
          .eq("courtier_name", name);
      }
    },
    onSuccess: () => {
      // Invalidate all commission-objectives queries (with any year)
      queryClient.invalidateQueries({ queryKey: ["commission-objectives"], exact: false });
      toast.success("Objectifs enregistrés");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const addCourtierObjectif = () => {
    if (!newCourtierName.trim()) return;
    if (courtierObjectifs.some(c => c.name.toLowerCase() === newCourtierName.toLowerCase())) {
      toast.error("Ce courtier a déjà un objectif");
      return;
    }
    setCourtierObjectifs([...courtierObjectifs, { name: newCourtierName, amount: "200000" }]);
    setNewCourtierName("");
  };

  const updateCourtierAmount = (index: number, amount: string) => {
    const updated = [...courtierObjectifs];
    updated[index].amount = amount;
    setCourtierObjectifs(updated);
  };

  const removeCourtierObjectif = (index: number) => {
    setCourtierObjectifs(courtierObjectifs.filter((_, i) => i !== index));
  };

  const totalCourtiers = courtierObjectifs.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const societeAmount = parseFloat(societeObjectif) || 0;

  // Suggestions for autocomplete (users not already added)
  const availableUsers = users.filter(
    u => !courtierObjectifs.some(c => c.name.toLowerCase() === u.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Objectifs {year}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Objectif société */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Objectif société</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={societeObjectif}
                onChange={(e) => setSocieteObjectif(e.target.value)}
                placeholder="1850000"
                className="text-right"
              />
              <span className="text-sm text-muted-foreground w-12">CHF</span>
            </div>
          </div>

          <Separator />

          {/* Objectifs par courtier */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Objectifs par courtier</Label>
            
            {courtierObjectifs.map((co, index) => (
              <div key={co.name} className="flex items-center gap-2">
                <span className="flex-1 text-sm">{co.name}</span>
                <Input
                  type="number"
                  value={co.amount}
                  onChange={(e) => updateCourtierAmount(index, e.target.value)}
                  className="w-32 text-right"
                />
                <span className="text-sm text-muted-foreground w-12">CHF</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCourtierObjectif(index)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {/* Add new courtier */}
            <div className="flex items-center gap-2 pt-2">
              <select
                value={newCourtierName}
                onChange={(e) => setNewCourtierName(e.target.value)}
                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="">Ajouter un courtier...</option>
                {availableUsers.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCourtierObjectif}
                disabled={!newCourtierName}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary */}
            <div className="pt-3 border-t space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total objectifs courtiers :</span>
                <span>{totalCourtiers.toLocaleString("fr-CH")} CHF</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Objectif société :</span>
                <span>{societeAmount.toLocaleString("fr-CH")} CHF</span>
              </div>
              {totalCourtiers !== societeAmount && (
                <div className="flex justify-between text-amber-600">
                  <span>Différence :</span>
                  <span>{(societeAmount - totalCourtiers).toLocaleString("fr-CH")} CHF</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
