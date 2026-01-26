import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Download, TrendingUp, Target, Hash, Wallet, Users, ArrowLeft, Settings, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CommissionFormModal } from "@/components/commissions/CommissionFormModal";
import { ObjectivesModal } from "@/components/commissions/ObjectivesModal";

// Liste des courtiers (agents commerciaux) - utiliser les prénoms complets
export const COURTIERS_LIST = ["Steven", "Frédéric", "Guive", "Michel", "Véronique", "Greg"];

// Personnes qui reçoivent une part mais ne sont PAS des courtiers (leur part ne "consomme" pas de CA)
const NON_COURTIERS = ["Gregory", "Jared", "Florie"];

interface Objective {
  id: string;
  year: number;
  type: "societe" | "courtier";
  courtier_name: string | null;
  amount: number;
}

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
  caProbableCumule: number;
  objectifCumule: number;
}

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function AdminCommissions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isObjectivesModalOpen, setIsObjectivesModalOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  
  // Filtres
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState<string>(currentYear.toString());
  const [filterCourtier, setFilterCourtier] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");

  // Fetch objectives for the selected year
  const { data: objectives = [] } = useQuery({
    queryKey: ["commission-objectives", parseInt(filterYear)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_objectives")
        .select("*")
        .eq("year", parseInt(filterYear));
      if (error) throw error;
      return data as Objective[];
    },
  });

  // Derive objective values from database
  const OBJECTIF_ANNUEL = useMemo(() => {
    const societe = objectives.find(o => o.type === "societe");
    return societe?.amount || 1850000;
  }, [objectives]);

  const OBJECTIFS_COURTIERS = useMemo(() => {
    const result: Record<string, number> = {};
    objectives
      .filter(o => o.type === "courtier" && o.courtier_name)
      .forEach(o => {
        result[o.courtier_name!] = o.amount;
      });
    return result;
  }, [objectives]);

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
  // Inclut Payée et En attente (affaires signées)
  const commissionsYear = useMemo(() => {
    return commissions.filter((c) => {
      if (!c.date_paiement) return false;
      if (c.statut === "Probable") return false; // Exclure les probables du CA réel
      return new Date(c.date_paiement).getFullYear().toString() === filterYear;
    });
  }, [commissions, filterYear]);

  // Commissions "Probable" pour l'année (affaires en discussion avancée)
  const commissionsProbable = useMemo(() => {
    return commissions.filter((c) => {
      if (!c.date_paiement) return false;
      if (c.statut !== "Probable") return false;
      return new Date(c.date_paiement).getFullYear().toString() === filterYear;
    });
  }, [commissions, filterYear]);

  // Toutes les commissions de l'année (incluant Probable) pour la liste détaillée
  const allCommissionsYear = useMemo(() => {
    return commissions.filter((c) => {
      if (!c.date_paiement) return false;
      return new Date(c.date_paiement).getFullYear().toString() === filterYear;
    });
  }, [commissions, filterYear]);

  // Commissions filtrées (pour la liste détaillée)
  const filteredCommissions = useMemo(() => {
    return allCommissionsYear.filter((c) => {
      // Comparaison par prénom (le filtre contient "Steven", le champ contient "Steven Bourg")
      if (filterCourtier !== "all" && !c.courtier_principal.toLowerCase().startsWith(filterCourtier.toLowerCase())) return false;
      if (filterStatut !== "all" && c.statut !== filterStatut) return false;
      return true;
    });
  }, [allCommissionsYear, filterCourtier, filterStatut]);

  // Stats globales (CA réalisé = Payée + En attente)
  const statsGlobal = useMemo(() => {
    const caTotal = commissionsYear.reduce((sum, c) => sum + Number(c.commission_totale), 0);
    const caProbable = commissionsProbable.reduce((sum, c) => sum + Number(c.commission_totale), 0);
    const caTotalPlusProbable = caTotal + caProbable;
    const nbVentes = commissionsYear.length;
    const commissionMoyenne = nbVentes > 0 ? caTotal / nbVentes : 0;
    const pourcentageObjectif = (caTotal / OBJECTIF_ANNUEL) * 100;
    const pourcentageObjectifProbable = (caTotalPlusProbable / OBJECTIF_ANNUEL) * 100;

    return { caTotal, caProbable, caTotalPlusProbable, nbVentes, commissionMoyenne, pourcentageObjectif, pourcentageObjectifProbable };
  }, [commissionsYear, commissionsProbable, OBJECTIF_ANNUEL]);

  // Stats par courtier - CA divisé équitablement entre les courtiers présents dans la répartition
  // Les non-courtiers (Gregory/CEO, Jared/Marketing, Florie) ne comptent pas dans le partage du CA
  const statsCourtiers = useMemo(() => {
    const courtierMap: Record<string, { total: number; count: number }> = {};
    let grandTotal = 0;

    commissionsYear.forEach((c) => {
      const repartition = c.repartition || {};
      
      // Trouver les vrais courtiers dans cette répartition (exclure CEO, Marketing, etc.)
      const courtiersInDeal = Object.keys(repartition).filter(
        name => !NON_COURTIERS.some(nc => name.toLowerCase().includes(nc.toLowerCase()))
      );
      
      if (courtiersInDeal.length === 0) {
        // Si aucun courtier identifié dans la répartition, attribuer au courtier_principal
        const courtier = c.courtier_principal;
        if (!courtierMap[courtier]) {
          courtierMap[courtier] = { total: 0, count: 0 };
        }
        courtierMap[courtier].total += Number(c.commission_totale);
        courtierMap[courtier].count += 1;
        grandTotal += Number(c.commission_totale);
      } else {
        // Diviser le CA équitablement entre les courtiers présents
        const sharePerCourtier = Number(c.commission_totale) / courtiersInDeal.length;
        
        courtiersInDeal.forEach(courtier => {
          if (!courtierMap[courtier]) {
            courtierMap[courtier] = { total: 0, count: 0 };
          }
          courtierMap[courtier].total += sharePerCourtier;
          courtierMap[courtier].count += 1;
        });
        grandTotal += Number(c.commission_totale);
      }
    });

    // Filtrer pour n'afficher que les vrais courtiers (exclure CEO, Marketing, Back-office)
    const stats: CourtierStats[] = Object.entries(courtierMap)
      .filter(([courtier]) => !NON_COURTIERS.some(nc => courtier.toLowerCase().includes(nc.toLowerCase())))
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
  }, [commissionsYear, OBJECTIFS_COURTIERS]);

  // Données pour le graphique mensuel
  const monthlyData = useMemo(() => {
    const monthlyCA: number[] = Array(12).fill(0);
    const monthlyProbable: number[] = Array(12).fill(0);
    const objectifMensuel = OBJECTIF_ANNUEL / 12;

    // CA réel (Payée + En attente)
    commissionsYear.forEach((c) => {
      if (c.date_paiement) {
        const month = new Date(c.date_paiement).getMonth();
        monthlyCA[month] += Number(c.commission_totale);
      }
    });

    // CA Probable
    commissionsProbable.forEach((c) => {
      if (c.date_paiement) {
        const month = new Date(c.date_paiement).getMonth();
        monthlyProbable[month] += Number(c.commission_totale);
      }
    });

    let cumule = 0;
    let cumuleProbable = 0;
    const data: MonthlyData[] = MOIS_LABELS.map((month, index) => {
      cumule += monthlyCA[index];
      cumuleProbable = cumule + monthlyProbable.slice(0, index + 1).reduce((a, b) => a + b, 0);
      return {
        month,
        monthIndex: index,
        caReel: monthlyCA[index],
        caCumule: cumule,
        caProbableCumule: cumuleProbable,
        objectifCumule: objectifMensuel * (index + 1),
      };
    });

    return data;
  }, [commissionsYear, commissionsProbable, OBJECTIF_ANNUEL]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8">
      {/* Header - Style Private Banking */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Suivi des Commissions
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Exercice {filterYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[100px] h-9 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsObjectivesModalOpen(true)} 
                title="Modifier les objectifs"
                className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 text-slate-500" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={exportCSV}
                className="h-9 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={openNewModal} 
                className="h-9 text-sm bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Section 1: KPI Cards - Style épuré */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* CA Réalisé */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">CA Réalisé</span>
              <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCHF(statsGlobal.caTotal)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{statsGlobal.nbVentes} transaction{statsGlobal.nbVentes > 1 ? 's' : ''}</p>
          </div>

          {/* CA Probable */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-5 border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">CA Probable</span>
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-amber-700 dark:text-amber-300 tracking-tight">
              {formatCHF(statsGlobal.caTotalPlusProbable)}
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">
              +{formatCHF(statsGlobal.caProbable)} en discussion
            </p>
          </div>

          {/* Ventes */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Transactions</span>
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Hash className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {statsGlobal.nbVentes}
            </p>
            <p className="text-xs text-slate-500 mt-1">clôturées</p>
          </div>

          {/* Commission moyenne */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Moyenne</span>
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCHF(statsGlobal.commissionMoyenne)}
            </p>
            <p className="text-xs text-slate-500 mt-1">par transaction</p>
          </div>

          {/* Objectif */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Objectif</span>
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Target className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                {statsGlobal.pourcentageObjectif.toFixed(1)}%
              </p>
              {statsGlobal.caProbable > 0 && (
                <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  → {statsGlobal.pourcentageObjectifProbable.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="relative mt-3">
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 dark:bg-slate-100 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(statsGlobal.pourcentageObjectif, 100)}%` }}
                />
              </div>
              {statsGlobal.caProbable > 0 && (
                <div 
                  className="absolute top-0 h-1.5 bg-amber-400/60 rounded-r-full"
                  style={{ 
                    left: `${Math.min(statsGlobal.pourcentageObjectif, 100)}%`,
                    width: `${Math.min(statsGlobal.pourcentageObjectifProbable - statsGlobal.pourcentageObjectif, 100 - statsGlobal.pourcentageObjectif)}%`
                  }}
                />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">{formatCHF(statsGlobal.caTotal)} / {formatCHF(OBJECTIF_ANNUEL)}</p>
          </div>
        </section>

        {/* Section 2: Graphique évolution mensuelle */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Évolution du chiffre d'affaires
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCHFShort(value)} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '12px 16px'
                    }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        caCumule: "CA Réalisé",
                        caProbableCumule: "CA + Probable",
                        objectifCumule: "Objectif"
                      };
                      return [formatCHF(value), labels[name] || name];
                    }}
                    labelFormatter={(label) => label}
                  />
                  <Legend 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        caCumule: "CA Réalisé",
                        caProbableCumule: "CA + Probable",
                        objectifCumule: "Objectif"
                      };
                      return <span className="text-sm text-slate-600">{labels[value] || value}</span>;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="caCumule" 
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ fill: "#0f172a", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "#0f172a" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="caProbableCumule" 
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ fill: "#d97706", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: "#d97706" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="objectifCumule" 
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Section 3: Performance par courtier */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Performance par courtier
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4">Courtier</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4 text-center">Ventes</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4 text-right">CA Total</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4 text-right">Moyenne</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4 text-right">Part</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4 w-[180px]">Progression</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsCourtiers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      Aucune donnée pour {filterYear}
                    </TableCell>
                  </TableRow>
                ) : (
                  statsCourtiers.map((stat, index) => (
                    <TableRow 
                      key={stat.courtier} 
                      className={`border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${index === 0 ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          {index === 0 && (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">1</span>
                          )}
                          {index === 1 && (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">2</span>
                          )}
                          {index === 2 && (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold">3</span>
                          )}
                          {index > 2 && (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-xs">{index + 1}</span>
                          )}
                          <span className="font-medium text-slate-900 dark:text-slate-100">{stat.courtier}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4 text-slate-600 dark:text-slate-400">{stat.nbVentes}</TableCell>
                      <TableCell className="text-right py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCHF(stat.caTotal)}
                      </TableCell>
                      <TableCell className="text-right py-4 text-slate-600 dark:text-slate-400">{formatCHF(stat.commissionMoyenne)}</TableCell>
                      <TableCell className="text-right py-4 text-slate-600 dark:text-slate-400">{stat.pourcentageTotal.toFixed(1)}%</TableCell>
                      <TableCell className="py-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{stat.pourcentageObjectif.toFixed(0)}%</span>
                            <span className="text-slate-400">{formatCHF(stat.objectif)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                stat.pourcentageObjectif >= 100 
                                  ? 'bg-emerald-500' 
                                  : stat.pourcentageObjectif >= 75 
                                    ? 'bg-slate-700 dark:bg-slate-300' 
                                    : 'bg-slate-400'
                              }`}
                              style={{ width: `${Math.min(stat.pourcentageObjectif, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Section 4: Liste des commissions réalisées */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Transactions clôturées
            </h2>
            <div className="flex items-center gap-2">
              <Select value={filterCourtier} onValueChange={setFilterCourtier}>
                <SelectTrigger className="h-9 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-[150px]">
                  <SelectValue placeholder="Courtier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {COURTIERS_LIST.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="h-9 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-[130px]">
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
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4">Date</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4">Bien</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4">Courtier</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4 text-right">Prix</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4 text-right">Commission</TableHead>
                  <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 py-4">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredCommissions.filter(c => c.statut !== "Probable").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      Aucune transaction
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCommissions
                    .filter(c => c.statut !== "Probable")
                    .map((commission) => (
                      <TableRow
                        key={commission.id}
                        className="border-b border-slate-50 dark:border-slate-800 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        onClick={() => openEditModal(commission)}
                      >
                        <TableCell className="py-4 text-slate-600 dark:text-slate-400">
                          {commission.date_paiement
                            ? format(new Date(commission.date_paiement), "dd MMM yyyy", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell className="py-4 max-w-[200px] truncate text-slate-900 dark:text-slate-100 font-medium">
                          {commission.adresse}
                        </TableCell>
                        <TableCell className="py-4 text-slate-600 dark:text-slate-400">{commission.courtier_principal}</TableCell>
                        <TableCell className="py-4 text-right text-slate-600 dark:text-slate-400">{formatCHF(commission.prix_vente)}</TableCell>
                        <TableCell className="py-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {formatCHF(commission.commission_totale)}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            commission.statut === "Payée" 
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {commission.statut === "Payée" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />}
                            {commission.statut}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Section 5: Commissions probables */}
        {allCommissionsYear.filter(c => c.statut === "Probable").length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
                En discussion
              </h2>
              <span className="text-xs text-slate-400">
                {allCommissionsYear.filter(c => c.statut === "Probable").length} affaire{allCommissionsYear.filter(c => c.statut === "Probable").length > 1 ? "s" : ""}
              </span>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50 shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/50">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400 py-4">Date prévue</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400 py-4">Bien</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400 py-4">Courtier</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400 py-4 text-right">Prix</TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400 py-4 text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCommissionsYear
                    .filter(c => c.statut === "Probable")
                    .filter(c => filterCourtier === "all" || c.courtier_principal === filterCourtier)
                    .map((commission) => (
                      <TableRow
                        key={commission.id}
                        className="border-b border-amber-100/50 dark:border-amber-900/30 cursor-pointer hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors"
                        onClick={() => openEditModal(commission)}
                      >
                        <TableCell className="py-4 text-amber-700 dark:text-amber-400">
                          {commission.date_paiement
                            ? format(new Date(commission.date_paiement), "dd MMM yyyy", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell className="py-4 max-w-[200px] truncate text-amber-900 dark:text-amber-200 font-medium">
                          {commission.adresse}
                        </TableCell>
                        <TableCell className="py-4 text-amber-700 dark:text-amber-400">{commission.courtier_principal}</TableCell>
                        <TableCell className="py-4 text-right text-amber-700 dark:text-amber-400">{formatCHF(commission.prix_vente)}</TableCell>
                        <TableCell className="py-4 text-right font-semibold text-amber-800 dark:text-amber-300">
                          {formatCHF(commission.commission_totale)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
        )}
      </div>

      {/* Commission Modal */}
      <CommissionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        commission={selectedCommission}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      {/* Objectives Modal */}
      <ObjectivesModal
        open={isObjectivesModalOpen}
        onOpenChange={setIsObjectivesModalOpen}
        year={parseInt(filterYear)}
      />
    </div>
  );
}
