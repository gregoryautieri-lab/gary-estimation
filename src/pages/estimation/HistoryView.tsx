import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  History, 
  ChevronLeft, 
  Camera, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  Home, 
  BarChart3,
  Lightbulb,
  Target,
  RotateCcw,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEstimationTracking } from '@/hooks/useEstimationTracking';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { useUserRole } from '@/hooks/useUserRole';
import { BottomNav } from '@/components/gary/BottomNav';
import { toast } from 'sonner';
import type { ModificationEntry, EstimationVersion, EstimationData } from '@/types/estimation';

// Module labels
const MODULE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  identification: { label: 'Identification', icon: <User className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  caracteristiques: { label: 'Caractéristiques', icon: <Home className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  analyse_terrain: { label: 'Analyse terrain', icon: <Lightbulb className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
  analyseTerrain: { label: 'Analyse terrain', icon: <Lightbulb className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
  pre_estimation: { label: 'Pré-estimation', icon: <BarChart3 className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  preEstimation: { label: 'Pré-estimation', icon: <BarChart3 className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  strategie: { label: 'Stratégie', icon: <Target className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  strategiePitch: { label: 'Stratégie', icon: <Target className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  photos: { label: 'Photos', icon: <Camera className="h-4 w-4" />, color: 'bg-pink-100 text-pink-800' }
};

// Format field name for display
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

// Format value for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(vide)';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') {
    if (value > 10000) return new Intl.NumberFormat('fr-CH').format(value) + ' CHF';
    return value.toString();
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '(vide)';
    return value.slice(0, 3).join(', ') + (value.length > 3 ? ` (+${value.length - 3})` : '');
  }
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 50) + '...';
  const str = String(value);
  return str.length > 50 ? str.slice(0, 50) + '...' : str;
}

// Modification item component
function ModificationItem({ mod, expanded, onToggle }: { 
  mod: ModificationEntry; 
  expanded: boolean;
  onToggle: () => void;
}) {
  const moduleInfo = MODULE_LABELS[mod.module] || { 
    label: mod.module, 
    icon: <FileText className="h-4 w-4" />, 
    color: 'bg-gray-100 text-gray-800' 
  };

  return (
    <div className="border-l-2 border-border pl-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="outline" className={`${moduleInfo.color} text-xs flex items-center gap-1`}>
              {moduleInfo.icon}
              {moduleInfo.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(mod.timestamp), { addSuffix: true, locale: fr })}
            </span>
          </div>
          
          <p className="text-sm font-medium">
            <span className="text-muted-foreground">{formatFieldName(mod.field)}:</span>{' '}
            <span className="text-destructive line-through">{formatValue(mod.oldValue)}</span>
            {' → '}
            <span className="text-green-600">{formatValue(mod.newValue)}</span>
          </p>
          
          <p className="text-xs text-muted-foreground mt-1">
            Par {mod.userName}
          </p>
        </div>
        
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {expanded && (
        <div className="mt-2 text-xs bg-muted rounded p-2 space-y-1">
          <p><strong>Date exacte:</strong> {format(new Date(mod.timestamp), 'PPpp', { locale: fr })}</p>
          <p><strong>Ancienne valeur:</strong> <code className="bg-background px-1 rounded">{JSON.stringify(mod.oldValue, null, 2)}</code></p>
          <p><strong>Nouvelle valeur:</strong> <code className="bg-background px-1 rounded">{JSON.stringify(mod.newValue, null, 2)}</code></p>
        </div>
      )}
    </div>
  );
}

// Version item component
function VersionItem({ version, isAdmin, onRestore }: { 
  version: EstimationVersion; 
  isAdmin: boolean;
  onRestore: (v: EstimationVersion) => void;
}) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                v{version.versionNumber}
              </Badge>
              {version.label && (
                <span className="text-sm font-medium">{version.label}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Créée le {format(new Date(version.createdAt), 'PPp', { locale: fr })}
            </p>
            <p className="text-xs text-muted-foreground">
              Par {version.createdBy}
            </p>
          </div>
          
          {isAdmin && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onRestore(version)}
              className="gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Restaurer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HistoryView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { fetchModifications, fetchVersions, fetchVersion, createVersion } = useEstimationTracking(id);
  const { fetchEstimation, updateEstimation } = useEstimationPersistence();

  const [loading, setLoading] = useState(true);
  const [modifications, setModifications] = useState<ModificationEntry[]>([]);
  const [versions, setVersions] = useState<EstimationVersion[]>([]);
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [expandedMod, setExpandedMod] = useState<string | null>(null);
  
  // Filters
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [restoreDialog, setRestoreDialog] = useState<EstimationVersion | null>(null);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      setLoading(true);
      try {
        const [mods, vers, est] = await Promise.all([
          fetchModifications({ limit: 100 }),
          fetchVersions(),
          fetchEstimation(id)
        ]);
        
        setModifications(mods);
        setVersions(vers);
        setEstimation(est || null);
      } catch (err) {
        console.error('Erreur chargement historique:', err);
        toast.error('Erreur lors du chargement de l\'historique');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id, fetchModifications, fetchVersions, fetchEstimation]);

  // Filtered modifications
  const filteredMods = useMemo(() => {
    if (moduleFilter === 'all') return modifications;
    return modifications.filter(m => m.module === moduleFilter || m.module === moduleFilter.replace('_', ''));
  }, [modifications, moduleFilter]);

  // Available modules for filter
  const availableModules = useMemo(() => {
    const modules = new Set(modifications.map(m => m.module));
    return Array.from(modules);
  }, [modifications]);

  // Create version handler
  const handleCreateVersion = async () => {
    if (!estimation) return;
    
    setIsCreatingVersion(true);
    try {
      const versionNumber = await createVersion(estimation, versionLabel || undefined);
      if (versionNumber) {
        toast.success(`Version ${versionNumber} créée avec succès`);
        setShowVersionDialog(false);
        setVersionLabel('');
        // Refresh versions
        const vers = await fetchVersions();
        setVersions(vers);
      }
    } finally {
      setIsCreatingVersion(false);
    }
  };

  // Restore version handler
  const handleRestoreVersion = async () => {
    if (!restoreDialog || !id || !estimation) return;
    
    setIsRestoring(true);
    try {
      // Create backup version first
      await createVersion(estimation, `Avant restauration vers v${restoreDialog.versionNumber}`);
      
      // Restore from snapshot
      const snapshot = restoreDialog.snapshot;
      await updateEstimation(id, snapshot as Partial<EstimationData>);
      
      toast.success(`Estimation restaurée à la version ${restoreDialog.versionNumber}`);
      setRestoreDialog(null);
      
      // Redirect to overview
      navigate(`/estimation/${id}/overview`);
    } catch (err) {
      console.error('Erreur restauration:', err);
      toast.error('Erreur lors de la restauration');
    } finally {
      setIsRestoring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/estimation/${id}/overview`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Historique</h1>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {modifications.length} modifications • {versions.length} versions
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowVersionDialog(true)}
            className="gap-1"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Créer version</span>
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Versions section */}
        {versions.length > 0 && (
          <section>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Versions enregistrées
            </h2>
            {versions.map(v => (
              <VersionItem
                key={v.id || v.versionNumber}
                version={v}
                isAdmin={isAdmin}
                onRestore={setRestoreDialog}
              />
            ))}
          </section>
        )}

        <Separator />

        {/* Modifications section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Journal des modifications
            </h2>
            
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[160px] h-8">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {availableModules.map(mod => (
                  <SelectItem key={mod} value={mod}>
                    {MODULE_LABELS[mod]?.label || mod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredMods.length === 0 ? (
            <Alert>
              <History className="h-4 w-4" />
              <AlertTitle>Aucune modification</AlertTitle>
              <AlertDescription>
                {moduleFilter !== 'all' 
                  ? 'Aucune modification pour ce module.'
                  : 'L\'historique des modifications apparaîtra ici au fur et à mesure des changements.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-1">
              {filteredMods.map(mod => (
                <ModificationItem
                  key={mod.id}
                  mod={mod}
                  expanded={expandedMod === mod.id}
                  onToggle={() => setExpandedMod(expandedMod === mod.id ? null : mod.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create version dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une version</DialogTitle>
            <DialogDescription>
              Une version capture l'état actuel de l'estimation. Utile avant de présenter au client ou avant des modifications importantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="version-label">Nom de la version (optionnel)</Label>
              <Input
                id="version-label"
                placeholder="Ex: Version présentée client 15/01"
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateVersion} disabled={isCreatingVersion}>
              {isCreatingVersion ? 'Création...' : 'Créer la version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore version dialog */}
      <Dialog open={!!restoreDialog} onOpenChange={() => setRestoreDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurer la version {restoreDialog?.versionNumber}?</DialogTitle>
            <DialogDescription>
              Cette action va remplacer l'état actuel de l'estimation par celui de la version {restoreDialog?.versionNumber} 
              ({restoreDialog?.label || 'sans label'}). Une version de sauvegarde sera créée automatiquement avant la restauration.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTitle>Attention</AlertTitle>
            <AlertDescription>
              Les modifications effectuées depuis cette version seront perdues (mais conservées dans l'historique).
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRestoreVersion} 
              disabled={isRestoring}
            >
              {isRestoring ? 'Restauration...' : 'Confirmer la restauration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
