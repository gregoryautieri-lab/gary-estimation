import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, Users, Calculator, Receipt } from 'lucide-react';
import { useCampagneCosts } from '@/hooks/useCampagneCosts';

interface CostSynthesisCardProps {
  campagneId: string;
  coutSupports: number; // Vient de campagne.cout_total
}

function formatCHF(value: number): string {
  return value.toLocaleString('fr-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatHeures(heuresDecimales: number): string {
  const h = Math.floor(heuresDecimales);
  const m = Math.round((heuresDecimales - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export function CostSynthesisCard({ campagneId, coutSupports }: CostSynthesisCardProps) {
  const { coutSalaires, courriersDistribues, totalHeures, missionsValidees, isLoading } = 
    useCampagneCosts(campagneId);

  const coutTotal = coutSupports + coutSalaires;
  const coutUnitaire = courriersDistribues > 0 
    ? coutTotal / courriersDistribues 
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Synthèse des coûts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          Synthèse des coûts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Coût supports */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" />
            <span>Coût supports</span>
          </div>
          <span className="font-medium">CHF {formatCHF(coutSupports)}</span>
        </div>

        {/* Coût salaires */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Coût salaires</span>
            {missionsValidees > 0 && (
              <span className="text-xs">
                ({missionsValidees} mission{missionsValidees > 1 ? 's' : ''} • {formatHeures(totalHeures)})
              </span>
            )}
          </div>
          <span className="font-medium">CHF {formatCHF(coutSalaires)}</span>
        </div>

        <Separator />

        {/* Coût total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calculator className="h-4 w-4" />
            <span>Coût total</span>
          </div>
          <span className="text-lg font-bold text-primary">CHF {formatCHF(coutTotal)}</span>
        </div>

        {/* Coût par courrier */}
        {coutUnitaire !== null && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2 -mx-2">
            <span className="text-sm text-muted-foreground">
              Coût par courrier distribué
            </span>
            <span className="font-semibold">CHF {formatCHF(coutUnitaire)}</span>
          </div>
        )}

        {courriersDistribues === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            Aucun courrier distribué pour l'instant
          </p>
        )}
      </CardContent>
    </Card>
  );
}
