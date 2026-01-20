import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, TrendingUp, Target, Hash, Wallet } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { CommissionFormModal } from "@/components/commissions/CommissionFormModal";

// Liste des courtiers prédéfinis
export const COURTIERS_LIST = ["Steven", "Fred", "Guive", "Michel", "Véronique", "Greg", "Jared"];

// Objectif annuel hardcodé
const OBJECTIF_ANNUEL = 1850000;

interface Commission {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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

export default function AdminCommissions() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  
  // Filtres
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const [filterCourtier, setFilterCourtier] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");

  // Fetch commissions (non supprimées)
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .is("deleted_at", null)
        .order("date_paiement", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as Commission[];
    },
  });

  // Filtrer les commissions
  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      // Filtre année
      if (filterYear !== "all") {
        const year = c.date_paiement ? new Date(c.date_paiement).getFullYear().toString() : null;
        if (year !== filterYear) return false;
      }
      // Filtre courtier
      if (filterCourtier !== "all" && c.courtier_principal !== filterCourtier) return false;
      // Filtre statut
      if (filterStatut !== "all" && c.statut !== filterStatut) return false;
      return true;
    });
  }, [commissions, filterYear, filterCourtier, filterStatut]);

  // Stats YTD (année en cours)
  const statsYTD = useMemo(() => {
    const ytdCommissions = commissions.filter((c) => {
      if (!c.date_paiement) return false;
      return new Date(c.date_paiement).getFullYear() === currentYear;
    });

    const caTotal = ytdCommissions.reduce((sum, c) => sum + Number(c.commission_totale), 0);
    const nbVentes = ytdCommissions.length;
    const commissionMoyenne = nbVentes > 0 ? caTotal / nbVentes : 0;
    const pourcentageObjectif = (caTotal / OBJECTIF_ANNUEL) * 100;

    return { caTotal, nbVentes, commissionMoyenne, pourcentageObjectif };
  }, [commissions, currentYear]);

  // Liste des années disponibles
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    commissions.forEach((c) => {
      if (c.date_paiement) {
        years.add(new Date(c.date_paiement).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [commissions]);

  // Soft delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commissions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast.success("Commission supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  // Export CSV
  const exportCSV = () => {
    const headers = ["Date paiement", "Adresse", "Commune", "Courtier principal", "Prix vente", "Commission", "Origine", "Statut", "Répartition"];
    const rows = filteredCommissions.map((c) => {
      const repartitionText = Object.entries(c.repartition || {})
        .map(([name, amount]) => `${name}: ${Number(amount).toLocaleString("fr-CH")} CHF`)
        .join(" | ");
      return [
        c.date_paiement ? format(new Date(c.date_paiement), "dd.MM.yyyy") : "",
        c.adresse,
        c.commune || "",
        c.courtier_principal,
        c.prix_vente,
        c.commission_totale,
        c.origine || "",
        c.statut,
        repartitionText,
      ];
    });

    const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commissions_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const openEditModal = (commission: Commission) => {
    setSelectedCommission(commission);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setSelectedCommission(null);
    setIsModalOpen(true);
  };

  const formatCHF = (value: number) => {
    return new Intl.NumberFormat("fr-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Commissions</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
          <Button onClick={openNewModal} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle commission
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CA Total {currentYear}</p>
                <p className="text-2xl font-bold text-primary">{formatCHF(statsYTD.caTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre de ventes</p>
                <p className="text-2xl font-bold">{statsYTD.nbVentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission moyenne</p>
                <p className="text-2xl font-bold">{formatCHF(statsYTD.commissionMoyenne)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Objectif {currentYear}</p>
                <p className="text-2xl font-bold">{statsYTD.pourcentageObjectif.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{formatCHF(OBJECTIF_ANNUEL)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-4">
        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCourtier} onValueChange={setFilterCourtier}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Courtier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les courtiers</SelectItem>
            {COURTIERS_LIST.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="Payée">Payée</SelectItem>
            <SelectItem value="En attente">En attente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date paiement</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Courtier</TableHead>
                <TableHead className="text-right">Prix vente</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune commission trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredCommissions.map((commission) => (
                  <TableRow
                    key={commission.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openEditModal(commission)}
                  >
                    <TableCell>
                      {commission.date_paiement
                        ? format(new Date(commission.date_paiement), "dd MMM yyyy", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{commission.adresse}</TableCell>
                    <TableCell>{commission.courtier_principal}</TableCell>
                    <TableCell className="text-right">{formatCHF(commission.prix_vente)}</TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCHF(commission.commission_totale)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={commission.statut === "Payée" ? "default" : "secondary"}>
                        {commission.statut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <CommissionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        commission={selectedCommission}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </div>
  );
}
