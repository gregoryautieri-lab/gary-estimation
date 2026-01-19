import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building2, Home, MapPin, Ruler, DoorOpen, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Configuration des statuts
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  mandat_signe: { label: 'Vendu', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  presentee: { label: 'En vente', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  brouillon: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
  en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  termine: { label: 'Terminé', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  a_presenter: { label: 'À présenter', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  reflexion: { label: 'Réflexion', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  negociation: { label: 'Négociation', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  accord_oral: { label: 'Accord oral', color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-400' },
  en_signature: { label: 'En signature', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  perdu: { label: 'Perdu', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  archive: { label: 'Archivé', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' },
};

// Configuration des types de bien
const TYPE_BIEN_ICONS: Record<string, React.ReactNode> = {
  appartement: <Building2 className="h-4 w-4" />,
  maison: <Home className="h-4 w-4" />,
  villa: <Home className="h-4 w-4" />,
  terrain: <MapPin className="h-4 w-4" />,
  commercial: <Building2 className="h-4 w-4" />,
  immeuble: <Building2 className="h-4 w-4" />,
};

const TYPE_BIEN_LABELS: Record<string, string> = {
  appartement: 'Appartement',
  maison: 'Maison',
  villa: 'Villa',
  terrain: 'Terrain',
  commercial: 'Commercial',
  immeuble: 'Immeuble',
};

interface EstimationData {
  id: string;
  type_bien: string | null;
  localite: string | null;
  prix_final: number | null;
  caracteristiques: {
    surfacePPE?: number;
    surfaceHabitableMaison?: number;
    nombrePieces?: number;
  } | null;
  statut: string;
  adresse: string | null;
}

interface EstimationSelectCardProps {
  estimation: EstimationData;
  isSelected: boolean;
  isLinked: boolean;
  onToggle: (id: string) => void;
}

export function EstimationSelectCard({
  estimation,
  isSelected,
  isLinked,
  onToggle,
}: EstimationSelectCardProps) {
  const {
    id,
    type_bien,
    localite,
    prix_final,
    caracteristiques,
    statut,
    adresse,
  } = estimation;

  // Extraire les données
  const surface = caracteristiques?.surfacePPE || caracteristiques?.surfaceHabitableMaison || null;
  const pieces = caracteristiques?.nombrePieces || null;
  const typeBienLabel = type_bien ? TYPE_BIEN_LABELS[type_bien] || type_bien : 'Type inconnu';
  const typeBienIcon = type_bien ? TYPE_BIEN_ICONS[type_bien] : <Building2 className="h-4 w-4" />;
  const statusConfig = STATUS_CONFIG[statut] || STATUS_CONFIG.brouillon;

  // Format prix
  const formatPrice = (price: number | null): string => {
    if (!price) return '—';
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleClick = () => {
    if (!isLinked) {
      onToggle(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border transition-all",
        isLinked
          ? "bg-muted/50 border-muted cursor-not-allowed opacity-70"
          : isSelected
          ? "bg-primary/5 border-primary cursor-pointer"
          : "bg-card border-border hover:border-primary/50 cursor-pointer"
      )}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 pt-0.5">
        <Checkbox
          checked={isSelected}
          disabled={isLinked}
          onCheckedChange={() => onToggle(id)}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-5"
        />
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Titre: Type + Commune */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground">{typeBienIcon}</span>
          <span className="font-medium">
            {typeBienLabel} {localite || ''}
          </span>
          <Badge className={cn("text-xs", statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Prix */}
        <p className="text-lg font-semibold text-primary">
          {formatPrice(prix_final)}
        </p>

        {/* Détails: Surface + Pièces */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {surface && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3.5 w-3.5" />
              {surface} m²
            </span>
          )}
          {pieces && (
            <span className="flex items-center gap-1">
              <DoorOpen className="h-3.5 w-3.5" />
              {pieces} p
            </span>
          )}
        </div>

        {/* Adresse */}
        <p className="text-sm text-muted-foreground truncate">
          <MapPin className="h-3.5 w-3.5 inline mr-1" />
          {adresse || 'Adresse non renseignée'}
        </p>

        {/* Badge "Déjà lié" */}
        {isLinked && (
          <div className="flex items-center gap-1.5 mt-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800">
              <Link2 className="h-3 w-3 mr-1" />
              Déjà lié à ce projet
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
