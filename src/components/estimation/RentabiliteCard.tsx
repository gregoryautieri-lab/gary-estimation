import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Percent, 
  Building2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  RentabiliteResult, 
  getRentabiliteLevel, 
  getSpreadLevel,
  formatPercent 
} from '@/lib/rentabiliteCalculs';
import { cn } from '@/lib/utils';

interface RentabiliteCardProps {
  result: RentabiliteResult | null;
  className?: string;
}

const formatPriceCHF = (val: number): string => {
  return val.toLocaleString('fr-CH', { 
    style: 'currency', 
    currency: 'CHF', 
    maximumFractionDigits: 0 
  });
};

export function RentabiliteCard({ result, className }: RentabiliteCardProps) {
  if (!result) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Percent className="h-4 w-4 text-blue-500" />
            Analyse de Rentabilité
            <Badge variant="secondary" className="ml-auto text-xs">
              Investisseurs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Renseignez le loyer mensuel ou la valeur locative pour afficher l'analyse de rentabilité.
          </p>
        </CardContent>
      </Card>
    );
  }

  const level = getRentabiliteLevel(result.rendementNet);
  const spread = getSpreadLevel(result.differencePoints);

  return (
    <TooltipProvider>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className={cn("pb-3", level.bgColor)}>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-blue-600" />
              Analyse de Rentabilité
            </div>
            <Badge variant="secondary" className={cn("text-xs", level.color)}>
              {level.icon} {level.message}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Rendements principaux */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rendement brut */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Rendement brut</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Loyer annuel brut / Prix d'achat</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xl font-bold">{formatPercent(result.rendementBrut)}</p>
            </div>

            {/* Rendement net */}
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Rendement net</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Loyer net (après charges) / Prix d'achat</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className={cn("text-xl font-bold", level.color)}>
                {formatPercent(result.rendementNet)}
              </p>
            </div>
          </div>

          {/* Comparaison taux hypothécaire */}
          <div className={cn(
            "rounded-lg p-3",
            spread.isPositive ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">vs Taux hypothécaire de référence</span>
              <Badge variant="outline" className="text-xs">
                {formatPercent(result.tauxHypoActuel)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {spread.isPositive ? (
                <ArrowUpRight className={cn("h-5 w-5", spread.color)} />
              ) : (
                <ArrowDownRight className={cn("h-5 w-5", spread.color)} />
              )}
              <span className={cn("text-lg font-bold", spread.color)}>
                {result.differencePoints >= 0 ? '+' : ''}{formatPercent(result.differencePoints)}
              </span>
              <span className="text-xs text-muted-foreground flex-1">
                {spread.message}
              </span>
            </div>
          </div>

          {/* Détails financiers */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loyer annuel brut</span>
              <span className="font-medium">{formatPriceCHF(result.loyerAnnuelBrut)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Charges annuelles</span>
              <span className="text-destructive">- {formatPriceCHF(result.chargesAnnuelles)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Loyer net annuel</span>
              <span className="font-bold">{formatPriceCHF(result.loyerAnnuelNet)}</span>
            </div>
          </div>

          {/* Cash-on-cash (si financement) */}
          {result.cashOnCash !== undefined && result.cashflowAnnuel !== undefined && (
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Avec financement hypothécaire</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-muted-foreground">Cash-on-cash</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Cashflow / Apport personnel</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={cn(
                    "text-lg font-bold",
                    result.cashOnCash >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercent(result.cashOnCash)}
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-2.5">
                  <span className="text-xs text-muted-foreground">Cashflow annuel</span>
                  <p className={cn(
                    "text-lg font-bold",
                    result.cashflowAnnuel >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPriceCHF(result.cashflowAnnuel)}
                  </p>
                </div>
              </div>

              {result.ratioCouvInteret && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>Ratio couverture intérêts:</span>
                  <span className={cn(
                    "font-medium",
                    result.ratioCouvInteret >= 1.5 ? "text-green-600" : 
                    result.ratioCouvInteret >= 1 ? "text-amber-600" : "text-red-600"
                  )}>
                    {result.ratioCouvInteret.toFixed(2)}x
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
