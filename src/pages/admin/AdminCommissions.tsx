import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Download, TrendingUp, Target, Hash, Wallet, Users, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CommissionFormModal } from "@/components/commissions/CommissionFormModal";

// Liste des courtiers prédéfinis
export const COURTIERS_LIST = ["Steven", "Fred", "Guive", "Michel", "Véronique", "Greg", "Jared"];

// Objectif annuel hardcodé
const OBJECTIF_ANNUEL = 1850000;

// Objectifs par courtier (hardcodés pour v1)
const OBJECTIFS_COURTIERS: Record<string, number> = {
  "Steven": 300000,
  "Fred": 250000,
  "Guive": 350000,
  "Michel": 200000,
  "Véronique": 250000,
  "Greg": 300000,
  "Jared": 200000,
};

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

interface CourtierStats {
  courtier: string;
  nbVentes: number;
  caTotal: number;
  commissionMoyenne: number;
  pourcentageTotal: number;
  objectif: number;
  pourcentageObjectif: number;
}

interface MonthlyData {
  month: string;
  monthIndex: number;
  caReel: number;
  caCumule: number;
  objectifCumule: number;
}

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function AdminCommissions() {
  const navigate = useNavigate();
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

  // Commissions filtrées par année (pour stats, graphique, tableau courtiers)
  const commissionsYear = useMemo(() => {
    return commissions.filter((c) => {
      if (!c.date_paiement) return false;
      return new Date(c.date_paiement).getFullYear().toString() === filterYear;
    });
  }, [commissions, filterYear]);

  // Commissions filtrées (pour la liste détaillée)
  const filteredCommissions = useMemo(() => {
    return commissionsYear.filter((c) => {
      if (filterCourtier !== "all" && c.courtier_principal !== filterCourtier) return false;
      if (filterStatut !== "all" && c.statut !== filterStatut) return false;
      return true;
    });
  }, [commissionsYear, filterCourtier, filterStatut]);

  // Stats globales
  const statsGlobal = useMemo(() => {
    const caTotal = commissionsYear.reduce((sum, c) => sum + Number(c.commission_totale), 0);
    const nbVentes = commissionsYear.length;
    const commissionMoyenne = nbVentes > 0 ? caTotal / nbVentes : 0;
    const pourcentageObjectif = (caTotal / OBJECTIF_ANNUEL) * 100;

    return { caTotal, nbVentes, commissionMoyenne, pourcentageObjectif };
  }, [commissionsYear]);

  // Stats par courtier (basé sur répartition)
  const statsCourtiers = useMemo(() => {
    const courtierMap: Record<string, { total: number; count: number }> = {};
    let grandTotal = 0;

    commissionsYear.forEach((c) => {
      const repartition = c.repartition || {};
      Object.entries(repartition).forEach(([courtier, montant]) => {
        if (!courtierMap[courtier]) {
          courtierMap[courtier] = { total: 0, count: 0 };
        }
        courtierMap[courtier].total += Number(montant);
        courtierMap[courtier].count += 1;
        grandTotal += Number(montant);
      });
    });

    const stats: CourtierStats[] = Object.entries(courtierMap)
      .map(([courtier, data]) => ({
        courtier,
        nbVentes: data.count,
        caTotal: data.total,
        commissionMoyenne: data.count > 0 ? data.total / data.count : 0,
        pourcentageTotal: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
        objectif: OBJECTIFS_COURTIERS[courtier] || 200000,
        pourcentageObjectif: ((data.total / (OBJECTIFS_COURTIERS[courtier] || 200000)) * 100),
      }))
      .sort((a, b) => b.caTotal - a.caTotal);

    return stats;
  }, [commissionsYear]);

  // Données pour le graphique mensuel
  const monthlyData = useMemo(() => {
    const monthlyCA: number[] = Array(12).fill(0);
    const objectifMensuel = OBJECTIF_ANNUEL / 12;

    commissionsYear.forEach((c) => {
      if (c.date_paiement) {
        const month = new Date(c.date_paiement).getMonth();
        monthlyCA[month] += Number(c.commission_totale);
      }
    });

    let cumule = 0;
    const data: MonthlyData[] = MOIS_LABELS.map((month, index) => {
      cumule += monthlyCA[index];
      return {
        month,
        monthIndex: index,
        caReel: monthlyCA[index],
        caCumule: cumule,
        objectifCumule: objectifMensuel * (index + 1),
      };
    });

    return data;
  }, [commissionsYear]);

  // Liste des années disponibles
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add(currentYear.toString());
    years.add((currentYear - 1).toString());
    years.add((currentYear + 1).toString());
    commissions.forEach((c) => {
      if (c.date_paiement) {
        years.add(new Date(c.date_paiement).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [commissions, currentYear]);

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
    link.download = `commissions_${filterYear}_export_${format(new Date(), "yyyy-MM-dd")}.csv`;
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

  const formatCHFShort = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Commissions</h1>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Section 1: Stats Cards */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CA Total {filterYear}</p>
                    <p className="text-2xl font-bold text-primary">{formatCHF(statsGlobal.caTotal)}</p>
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
                    <p className="text-2xl font-bold">{statsGlobal.nbVentes}</p>
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
                    <p className="text-2xl font-bold">{formatCHF(statsGlobal.commissionMoyenne)}</p>
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
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Objectif {filterYear}</p>
                    <p className="text-2xl font-bold">{statsGlobal.pourcentageObjectif.toFixed(1)}%</p>
                    <Progress value={Math.min(statsGlobal.pourcentageObjectif, 100)} className="h-2 mt-2" />
                    <p className="text-xs text-muted-foreground mt-1">{formatCHF(statsGlobal.caTotal)} / {formatCHF(OBJECTIF_ANNUEL)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 2: Graphique évolution mensuelle */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Évolution mensuelle</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => formatCHFShort(value)} 
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCHF(value),
                        name === "caCumule" ? "CA Cumulé" : "Objectif"
                      ]}
                      labelFormatter={(label) => `Mois: ${label}`}
                    />
                    <Legend 
                      formatter={(value) => value === "caCumule" ? "CA Cumulé" : "Objectif linéaire"}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="caCumule" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="objectifCumule" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 3: Tableau par courtier */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance par courtier
          </h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Courtier</TableHead>
                    <TableHead className="text-center">Nb ventes</TableHead>
                    <TableHead className="text-right">CA Total</TableHead>
                    <TableHead className="text-right">Commission moy.</TableHead>
                    <TableHead className="text-right">% du total</TableHead>
                    <TableHead className="w-[200px]">Objectif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsCourtiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Aucune donnée pour {filterYear}
                      </TableCell>
                    </TableRow>
                  ) : (
                    statsCourtiers.map((stat) => (
                      <TableRow key={stat.courtier}>
                        <TableCell className="font-medium">{stat.courtier}</TableCell>
                        <TableCell className="text-center">{stat.nbVentes}</TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatCHF(stat.caTotal)}
                        </TableCell>
                        <TableCell className="text-right">{formatCHF(stat.commissionMoyenne)}</TableCell>
                        <TableCell className="text-right">{stat.pourcentageTotal.toFixed(1)}%</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{stat.pourcentageObjectif.toFixed(0)}%</span>
                              <span className="text-muted-foreground">{formatCHF(stat.objectif)}</span>
                            </div>
                            <Progress 
                              value={Math.min(stat.pourcentageObjectif, 100)} 
                              className="h-2"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Section 4: Liste des commissions */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold">Détail des commissions</h2>
            <div className="flex flex-wrap gap-2">
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
          </div>
          
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
        </section>
      </div>

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
