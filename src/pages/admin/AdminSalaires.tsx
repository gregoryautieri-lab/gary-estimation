import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Wallet, Download, Trash2, Check, Lock, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePaies, Paie, PaieFormData } from '@/hooks/usePaies';
import { 
  useSalairesCalcul, 
  formatHeures, 
  getPeriodesDisponibles, 
  getPeriodeActuelle,
  getPeriodeDates
} from '@/hooks/useSalairesCalcul';

interface SalaireRow {
  etudiantId: string;
  etudiantNom: string;
  totalMissions: number;
  totalHeures: number;
  salaireHoraire: number;
  montantTotal: number;
  paie: Paie | null;
  missionsIds: string[];
}

export default function AdminSalaires() {
  const navigate = useNavigate();
  const [periode, setPeriode] = useState(getPeriodeActuelle());
  const periodes = getPeriodesDisponibles();
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payerDialogOpen, setPayerDialogOpen] = useState(false);
  const [selectedPaieId, setSelectedPaieId] = useState<string | null>(null);

  // Hooks
  const { paies, isLoading: loadingPaies, create, valider, marquerPayee, delete: deletePaie, isCreating, isValidating, isMarkingPaid, isDeleting } = usePaies({ periode });
  const { salairesCalcules, totaux, dateDebut, dateFin, isLoading: loadingCalcul } = useSalairesCalcul({ periode });

  // Fusionner les données calculées avec les paies existantes
  const rows: SalaireRow[] = useMemo(() => {
    return salairesCalcules.map(s => {
      const paie = paies.find(p => p.etudiant_id === s.etudiant.id);
      
      // Si une paie existe, utiliser ses valeurs figées
      if (paie) {
        return {
          etudiantId: s.etudiant.id,
          etudiantNom: `${s.etudiant.prenom} ${s.etudiant.nom || ''}`.trim(),
          totalMissions: paie.total_missions,
          totalHeures: paie.total_heures,
          salaireHoraire: paie.salaire_horaire,
          montantTotal: paie.montant_total,
          paie,
          missionsIds: paie.missions_ids
        };
      }
      
      // Sinon, utiliser les valeurs calculées dynamiquement
      return {
        etudiantId: s.etudiant.id,
        etudiantNom: `${s.etudiant.prenom} ${s.etudiant.nom || ''}`.trim(),
        totalMissions: s.totalMissions,
        totalHeures: s.totalHeures,
        salaireHoraire: s.salaireHoraire,
        montantTotal: s.montantTotal,
        paie: null,
        missionsIds: s.missionsIds
      };
    });
  }, [salairesCalcules, paies]);

  // Totaux (recalculer à partir des rows pour cohérence)
  const totauxAffichage = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        missions: acc.missions + r.totalMissions,
        heures: acc.heures + r.totalHeures,
        montant: acc.montant + r.montantTotal
      }),
      { missions: 0, heures: 0, montant: 0 }
    );
  }, [rows]);

  // Handlers
  const handleFiger = async (row: SalaireRow) => {
    const { dateDebut: dDebut, dateFin: dFin } = getPeriodeDates(periode);
    
    const formData: PaieFormData = {
      etudiant_id: row.etudiantId,
      periode,
      date_debut: dDebut.toISOString().split('T')[0],
      date_fin: dFin.toISOString().split('T')[0],
      total_missions: row.totalMissions,
      total_heures: row.totalHeures,
      salaire_horaire: row.salaireHoraire,
      montant_total: row.montantTotal,
      missions_ids: row.missionsIds
    };
    
    await create(formData);
  };

  const handleValider = async (paieId: string) => {
    await valider(paieId);
  };

  const handleSupprimer = (paieId: string) => {
    setSelectedPaieId(paieId);
    setDeleteDialogOpen(true);
  };

  const confirmSupprimer = async () => {
    if (selectedPaieId) {
      await deletePaie(selectedPaieId);
    }
    setDeleteDialogOpen(false);
    setSelectedPaieId(null);
  };

  const handleMarquerPayee = (paieId: string) => {
    setSelectedPaieId(paieId);
    setPayerDialogOpen(true);
  };

  const confirmMarquerPayee = async () => {
    if (selectedPaieId) {
      await marquerPayee(selectedPaieId);
    }
    setPayerDialogOpen(false);
    setSelectedPaieId(null);
  };

  // Format CHF
  const formatCHF = (value: number) => {
    return new Intl.NumberFormat('fr-CH', { 
      style: 'currency', 
      currency: 'CHF',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Badge statut
  const getStatutBadge = (statut: string | null) => {
    if (!statut) return null;
    
    switch (statut) {
      case 'brouillon':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'validee':
        return <Badge className="bg-amber-500 hover:bg-amber-600">Validée</Badge>;
      case 'payee':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Payée</Badge>;
      default:
        return null;
    }
  };

  const isLoading = loadingPaies || loadingCalcul;

  // Période label pour le header
  const periodeLabel = periodes.find(p => p.value === periode)?.label || periode;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
                className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    Salaires
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Période : {dateDebut} → {dateFin}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="w-[180px] h-9 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodes.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    disabled
                    className="h-9 text-sm text-slate-400"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export à venir</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tableau */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                Aucun étudiant actif
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="font-semibold">Étudiant</TableHead>
                    <TableHead className="text-center font-semibold">Missions</TableHead>
                    <TableHead className="text-center font-semibold">Heures</TableHead>
                    <TableHead className="text-right font-semibold">Taux</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                    <TableHead className="text-center font-semibold">Statut</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.etudiantId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <TableCell className="font-medium">{row.etudiantNom}</TableCell>
                      <TableCell className="text-center">{row.totalMissions}</TableCell>
                      <TableCell className="text-center">{formatHeures(row.totalHeures)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCHF(row.salaireHoraire)}/h
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCHF(row.montantTotal)}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.paie ? (
                          <div className="space-y-1">
                            {getStatutBadge(row.paie.statut)}
                            {row.paie.statut === 'validee' && row.paie.date_validation && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(row.paie.date_validation), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            )}
                            {row.paie.statut === 'payee' && row.paie.date_paiement && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(row.paie.date_paiement), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Non figée</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Pas de paie → Figer */}
                          {!row.paie && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFiger(row)}
                              disabled={isCreating}
                            >
                              <Lock className="h-3.5 w-3.5 mr-1" />
                              Figer
                            </Button>
                          )}

                          {/* Brouillon → Valider + Supprimer */}
                          {row.paie?.statut === 'brouillon' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleValider(row.paie!.id)}
                                disabled={isValidating}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Valider
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleSupprimer(row.paie!.id)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {/* Validée → Marquer payé */}
                          {row.paie?.statut === 'validee' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleMarquerPayee(row.paie!.id)}
                              disabled={isMarkingPaid}
                            >
                              <CreditCard className="h-3.5 w-3.5 mr-1" />
                              Marquer payé
                            </Button>
                          )}

                          {/* Payée → Rien */}
                          {row.paie?.statut === 'payee' && (
                            <span className="text-xs text-emerald-600 font-medium">✓ Payée</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Ligne de total */}
                  <TableRow className="bg-slate-100 dark:bg-slate-800 font-semibold border-t-2">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-center">{totauxAffichage.missions}</TableCell>
                    <TableCell className="text-center">{formatHeures(totauxAffichage.heures)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right text-lg">{formatCHF(totauxAffichage.montant)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Supprimer */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette paie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer la paie figée. Les données seront recalculées dynamiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSupprimer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Marquer payé */}
      <AlertDialog open={payerDialogOpen} onOpenChange={setPayerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer comme payée ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La paie sera définitivement marquée comme payée avec la date d'aujourd'hui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmMarquerPayee}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Confirmer le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
