import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MissingField } from '@/lib/missingFields';

interface MissingFieldsAlertProps {
  fields: MissingField[];
  moduleName: string;
  onMarkComplete?: () => void;
  showMarkComplete?: boolean;
}

export const MissingFieldsAlert = ({ 
  fields, 
  moduleName,
  onMarkComplete,
  showMarkComplete = false
}: MissingFieldsAlertProps) => {
  const [expanded, setExpanded] = useState(false);

  const obligatoires = fields.filter(f => f.type === 'obligatoire');
  const recommandes = fields.filter(f => f.type === 'recommandé');

  // Si aucun champ manquant, afficher un message de succès
  if (fields.length === 0) {
    return (
      <Alert className="bg-green-500/10 border-green-500/30">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700 dark:text-green-400">
          Module complet
        </AlertTitle>
        <AlertDescription className="text-green-600 dark:text-green-300">
          Toutes les informations de ce module ont été renseignées.
        </AlertDescription>
      </Alert>
    );
  }

  // Grouper par section
  const groupedBySections = fields.reduce((acc, field) => {
    const section = field.section || 'Autre';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {} as Record<string, MissingField[]>);

  return (
    <Alert className={cn(
      "border-l-4",
      obligatoires.length > 0 
        ? "bg-orange-500/10 border-orange-500" 
        : "bg-blue-500/10 border-blue-500"
    )}>
      <AlertTriangle className={cn(
        "h-4 w-4",
        obligatoires.length > 0 ? "text-orange-500" : "text-blue-500"
      )} />
      <AlertTitle className="flex items-center justify-between">
        <span className={obligatoires.length > 0 ? "text-orange-700 dark:text-orange-400" : "text-blue-700 dark:text-blue-400"}>
          {obligatoires.length > 0 
            ? `${obligatoires.length} champ${obligatoires.length > 1 ? 's' : ''} obligatoire${obligatoires.length > 1 ? 's' : ''} manquant${obligatoires.length > 1 ? 's' : ''}`
            : `${recommandes.length} champ${recommandes.length > 1 ? 's' : ''} recommandé${recommandes.length > 1 ? 's' : ''}`
          }
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-6 px-2"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </AlertTitle>
      
      {expanded && (
        <AlertDescription className="mt-3 space-y-3">
          {Object.entries(groupedBySections).map(([section, sectionFields]) => (
            <div key={section}>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                {section}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sectionFields.map((field) => (
                  <Badge
                    key={field.field}
                    variant={field.type === 'obligatoire' ? 'destructive' : 'secondary'}
                    className={cn(
                      "text-xs",
                      field.type === 'obligatoire' 
                        ? "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30" 
                        : "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    )}
                  >
                    {field.label}
                    {field.type === 'obligatoire' && ' *'}
                  </Badge>
                ))}
              </div>
            </div>
          ))}

          {showMarkComplete && obligatoires.length === 0 && onMarkComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkComplete}
              className="mt-2 w-full"
            >
              Marquer comme terminé quand même
            </Button>
          )}
        </AlertDescription>
      )}
    </Alert>
  );
};
