import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { calculateModuleCompletion, getModuleStatuses, getNextIncompleteModule } from '@/lib/completionScore';
import { generateEstimationAlerts, countAlertsByType, EstimationAlert } from '@/lib/estimationAlerts';
import { getCourtierById, EstimationData, COURTIERS_GARY } from '@/types/estimation';
import { BottomNav } from '@/components/gary/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Home, 
  Building2, 
  Ruler, 
  Phone, 
  Mail,
  Calendar,
  Clock,
  Camera,
  Copy,
  Share2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  User,
  ArrowRight,
  Play,
  Target,
  History
} from 'lucide-react';

export default function EstimationOverview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchEstimation, duplicateEstimation, loading } = useEstimationPersistence();
  
  const [estimation, setEstimation] = useState<EstimationData | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  
  useEffect(() => {
    if (id) loadEstimation();
  }, [id]);
  
  const loadEstimation = async () => {
    if (!id) return;
    const data = await fetchEstimation(id);
    if (data) setEstimation(data);
  };
  
  // Calculs
  const completion = calculateModuleCompletion(estimation);
  const moduleStatuses = getModuleStatuses(estimation, id || '');
  const alerts = generateEstimationAlerts(estimation);
  const alertCounts = countAlertsByType(alerts);
  const nextModule = getNextIncompleteModule(estimation, id || '');
  
  // Données affichées
  const vendeur = estimation?.identification?.vendeur;
  const adresse = estimation?.identification?.adresse;
  const carac = estimation?.caracteristiques;
  const contexte = estimation?.identification?.contexte;
  const preEst = estimation?.preEstimation;
  const courtier = estimation?.identification?.courtierAssigne 
    ? getCourtierById(estimation.identification.courtierAssigne)
    : null;
  
  const typeBienLabel = carac?.typeBien === 'appartement' ? 'Appartement' : 
                        carac?.typeBien === 'maison' ? 'Maison' : 
                        'Bien';
  const TypeIcon = carac?.typeBien === 'maison' ? Home : Building2;
  const pieces = carac?.nombrePieces || '';
  const surface = carac?.typeBien === 'maison' 
    ? carac?.surfaceHabitableMaison 
    : carac?.surfacePPE;
  const surfaceTerrain = carac?.surfaceTerrain;
  
  const prixMin = preEst?.prixEntre ? parseInt(preEst.prixEntre) : estimation?.prixMin || 0;
  const prixMax = preEst?.prixEt ? parseInt(preEst.prixEt) : estimation?.prixMax || 0;
  
  const photosCount = estimation?.photos?.items?.length || 0;
  
  // Formatage
  const formatPrice = (val: number) => {
    if (!val) return '-';
    return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(val);
  };
  
  const createdAt = estimation?.createdAt ? new Date(estimation.createdAt) : null;
  const updatedAt = estimation?.updatedAt ? new Date(estimation.updatedAt) : null;
  
  // Génère une référence lisible: EST-AAMMJJ-XXX (année, mois, jour + 3 derniers caractères de l'ID)
  const generateRef = () => {
    if (!createdAt || !estimation?.id) return 'EST-000';
    const yy = String(createdAt.getFullYear()).slice(-2);
    const mm = String(createdAt.getMonth() + 1).padStart(2, '0');
    const dd = String(createdAt.getDate()).padStart(2, '0');
    const suffix = estimation.id.slice(-3).toUpperCase();
    return `EST-${yy}${mm}${dd}-${suffix}`;
  };
  const refEstimation = generateRef();
  
  // Actions
  const handleContinue = () => navigate(nextModule);
  
  const handleDuplicate = async () => {
    if (!id || duplicating) return;
    setDuplicating(true);
    try {
      const newEst = await duplicateEstimation(id);
      if (newEst) {
        toast.success('Estimation dupliquée');
        navigate(`/estimation/${newEst.id}/overview`);
      }
    } finally {
      setDuplicating(false);
    }
  };
  
  // Statut badge - adapté pour fond sombre du header
  const getStatutBadge = () => {
    const statut = estimation?.statut || 'brouillon';
    const config: Record<string, { label: string; className: string }> = {
      brouillon: { label: 'Brouillon', className: 'bg-white/20 text-white border-white/30' },
      en_cours: { label: 'En cours', className: 'bg-primary text-white' },
      termine: { label: 'Terminé', className: 'bg-green-500 text-white' },
      archive: { label: 'Archivé', className: 'bg-gray-500 text-white' }
    };
    const { label, className } = config[statut] || config.brouillon;
    return <Badge className={className}>{label}</Badge>;
  };
  
  // Alert icon
  const getAlertIcon = (type: EstimationAlert['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  // Status icon
  const getStatusIcon = (status: 'complete' | 'partial' | 'empty') => {
    switch (status) {
      case 'complete': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="p-4 space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <BottomNav />
      </div>
    );
  }
  
  if (!estimation) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Estimation introuvable</p>
          <Button onClick={() => navigate('/estimations')} className="mt-4">
            Retour à la liste
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-[#1a2e35] text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10"
            onClick={() => navigate('/estimations')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-5 w-5 text-white" />
              <h1 className="text-lg font-bold truncate text-white">
                {typeBienLabel} {pieces && `${pieces}p`} 
                {adresse?.localite && ` - ${adresse.localite}`}
              </h1>
            </div>
            <p className="text-sm text-white/70 truncate">
              {refEstimation}
              {createdAt && ` • Créée le ${format(createdAt, 'd MMM yyyy', { locale: fr })}`}
            </p>
          </div>
          {getStatutBadge()}
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Résumé rapide */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Résumé rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Adresse */}
            {(adresse?.rue || adresse?.localite) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{adresse?.rue || ''} {adresse?.numero || ''}</p>
                  <p className="text-sm text-muted-foreground">{adresse?.codePostal || ''} {adresse?.localite || ''}</p>
                </div>
              </div>
            )}
            
            {/* Type et surface */}
            <div className="flex items-center gap-3">
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
              <span>
                {typeBienLabel}
                {carac?.sousType && ` ${carac.sousType}`}
                {pieces && ` • ${pieces} pièces`}
              </span>
            </div>
            
            {surface && (
              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span>
                  {surface} m² habitables
                  {surfaceTerrain && ` + ${surfaceTerrain} m² terrain`}
                </span>
              </div>
            )}
            
            {/* Prix */}
            {(prixMin > 0 || prixMax > 0) && (
              <div className="flex items-center gap-3 text-primary font-semibold">
                <span className="text-lg">💰</span>
                <span>
                  {prixMin > 0 && prixMax > 0 
                    ? `${formatPrice(prixMin)} - ${formatPrice(prixMax)}`
                    : formatPrice(prixMin || prixMax)
                  }
                </span>
              </div>
            )}
            
            {/* RDV */}
            {estimation.identification?.dateRdvEstimation && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>RDV : {format(new Date(estimation.identification.dateRdvEstimation), 'd MMMM yyyy', { locale: fr })}</span>
              </div>
            )}
            
            {/* Vendeur */}
            {vendeur?.nom && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{vendeur.prenom} {vendeur.nom}</span>
                  {vendeur.telephone && (
                    <a href={`tel:${vendeur.telephone}`} className="text-primary text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {vendeur.telephone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Progression */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Progression</CardTitle>
              <span className="text-2xl font-bold text-primary">{completion.total}%</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={completion.total} className="h-3" />
            
            {updatedAt && (
              <p className="text-xs text-muted-foreground">
                Dernière modification : {formatDistanceToNow(updatedAt, { addSuffix: true, locale: fr })}
              </p>
            )}
            
            {/* Modules */}
            <div className="space-y-2">
              {moduleStatuses.map((mod) => (
                <button
                  key={mod.route}
                  onClick={() => navigate(mod.route)}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(mod.status)}
                    <div>
                      <span className="font-medium text-sm">{mod.moduleNumber}. {mod.name}</span>
                      {mod.details && (
                        <p className="text-xs text-muted-foreground">{mod.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{mod.completion}%</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Alertes */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Alertes ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <Alert 
                  key={alert.id} 
                  variant={alert.type === 'critical' ? 'destructive' : 'default'}
                  className={
                    alert.type === 'warning' 
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' 
                      : alert.type === 'info'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                        : ''
                  }
                >
                  {getAlertIcon(alert.type)}
                  <AlertTitle className="text-sm">{alert.icon} {alert.title}</AlertTitle>
                  <AlertDescription className="text-xs">
                    {alert.message}
                    {alert.action && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto ml-1 text-xs underline"
                        onClick={() => alert.action?.route && navigate(alert.action.route)}
                      >
                        {alert.action.label}
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}
        
        {/* Actions rapides */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={handleContinue}
                className="h-12 flex items-center gap-2 col-span-2"
              >
                <Play className="h-4 w-4" />
                Continuer
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate(`/estimation/${id}/photos`)}
                className="h-12 flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Photos ({photosCount})
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleDuplicate}
                disabled={duplicating}
                className="h-12 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {duplicating ? 'Duplication...' : 'Dupliquer'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate(`/estimation/${id}/history`)}
                className="h-12 flex items-center gap-2 col-span-2"
              >
                <History className="h-4 w-4" />
                Historique & Versions
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Modules détaillés */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Accès aux modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {moduleStatuses.map((mod) => {
                const moduleIcons: Record<string, string> = {
                  '1': '👤',
                  '2': '🏠',
                  '3': '🔍',
                  '4': '💰',
                  '5': '📋',
                  '📸': '📸'
                };
                const icon = moduleIcons[mod.moduleNumber] || '📄';
                const isComplete = mod.status === 'complete';
                const isPartial = mod.status === 'partial';
                
                return (
                  <Button
                    key={mod.route}
                    variant="outline"
                    onClick={() => navigate(mod.route)}
                    className={`h-20 flex flex-col items-center justify-center gap-1.5 relative ${
                      isComplete ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' : 
                      isPartial ? 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20' : ''
                    }`}
                  >
                    {isComplete && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      </div>
                    )}
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs font-medium text-center leading-tight px-1">
                      {mod.name}
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNav />
    </div>
  );
}