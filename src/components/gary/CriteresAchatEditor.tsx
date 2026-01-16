import { useState, useCallback } from 'react';
import { CriteresAchat, defaultCriteresAchat } from '@/types/estimation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, addMonths, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ChevronDown, 
  ChevronUp, 
  Home, 
  Building2, 
  CalendarIcon, 
  X, 
  Search, 
  Zap, 
  Clock, 
  Gauge,
  Info,
  Check
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Liste des communes genevoises
const COMMUNES_GENEVE = [
  'Genève', 'Carouge', 'Lancy', 'Meyrin', 'Vernier', 'Onex', 'Thônex', 'Versoix',
  'Grand-Saconnex', 'Chêne-Bougeries', 'Chêne-Bourg', 'Plan-les-Ouates', 'Bernex',
  'Veyrier', 'Cologny', 'Collonge-Bellerive', 'Vandœuvres', 'Pregny-Chambésy',
  'Bellevue', 'Genthod', 'Satigny', 'Meinier', 'Puplinge', 'Jussy', 'Presinge',
  'Choulex', 'Aire-la-Ville', 'Avully', 'Avusy', 'Bardonnex', 'Cartigny',
  'Céligny', 'Chancy', 'Gy', 'Hermance', 'Laconnex', 'Perly-Certoux', 'Russin',
  'Soral', 'Troinex', 'Dardagny', 'Anières'
];

const URGENCES = [
  { value: 'haute', label: 'Haute', icon: Zap, color: 'bg-red-500' },
  { value: 'moyenne', label: 'Moyenne', icon: Clock, color: 'bg-yellow-500' },
  { value: 'basse', label: 'Basse', icon: Gauge, color: 'bg-green-500' }
];

interface CriteresAchatEditorProps {
  value?: CriteresAchat;
  onChange: (value: CriteresAchat) => void;
}

export function CriteresAchatEditor({ value, onChange }: CriteresAchatEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchCommune, setSearchCommune] = useState('');
  
  // Merge with defaults
  const criteres: CriteresAchat = {
    ...defaultCriteresAchat,
    ...value,
    // Set default expiration date to +6 months if not set
    dateExpiration: value?.dateExpiration || format(addMonths(new Date(), 6), 'yyyy-MM-dd')
  };
  
  const updateField = useCallback(<K extends keyof CriteresAchat>(
    field: K, 
    val: CriteresAchat[K]
  ) => {
    onChange({ ...criteres, [field]: val });
  }, [criteres, onChange]);
  
  const toggleZone = (zone: string) => {
    const newZones = criteres.zones.includes(zone)
      ? criteres.zones.filter(z => z !== zone)
      : [...criteres.zones, zone];
    updateField('zones', newZones);
  };
  
  const filteredCommunes = COMMUNES_GENEVE.filter(c => 
    c.toLowerCase().includes(searchCommune.toLowerCase())
  );
  
  // Format budget display - sans arrondi
  const formatBudget = (val: number) => {
    if (!val) return '';
    if (val >= 1000000) {
      // Afficher sans arrondi : 2900000 → "2.9M", 2850000 → "2.85M"
      const millions = val / 1000000;
      // Éviter les décimales inutiles : 2.00M → 2M, 2.50M → 2.5M
      if (millions === Math.floor(millions)) {
        return `${millions}M`;
      }
      // Garder jusqu'à 2 décimales sans arrondi
      const rounded = Math.floor(millions * 100) / 100;
      return `${rounded}M`;
    }
    if (val >= 1000) {
      const thousands = val / 1000;
      if (thousands === Math.floor(thousands)) {
        return `${thousands}k`;
      }
      return `${Math.floor(thousands)}k`;
    }
    return val.toString();
  };
  
  const parseBudget = (str: string): number => {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9.,kKmM]/g, '');
    // Remplacer virgule par point pour les décimales
    const normalized = cleaned.replace(',', '.');
    const lower = normalized.toLowerCase();
    
    if (lower.includes('m')) {
      const num = parseFloat(lower.replace('m', ''));
      return isNaN(num) ? 0 : Math.round(num * 1000000);
    }
    if (lower.includes('k')) {
      const num = parseFloat(lower.replace('k', ''));
      return isNaN(num) ? 0 : Math.round(num * 1000);
    }
    // Si c'est un nombre simple, vérifier si c'est en millions ou en CHF direct
    const num = parseFloat(normalized);
    if (isNaN(num)) return 0;
    // Si le nombre est < 100, on suppose que c'est en millions (ex: 2.5 → 2500000)
    // Sinon c'est le montant direct
    if (num < 100) {
      return Math.round(num * 1000000);
    }
    return Math.round(num);
  };
  
  const parseExpirationDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    try {
      return parse(dateStr, 'yyyy-MM-dd', new Date());
    } catch {
      return undefined;
    }
  };

  return (
    <div className="space-y-4">
      {/* Switch principal */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-primary" />
          <div>
            <Label className="text-base font-medium">Le client cherche à acheter</Label>
            <p className="text-sm text-muted-foreground">
              Activer pour renseigner les critères de recherche
            </p>
          </div>
        </div>
        <Switch
          checked={criteres.actif}
          onCheckedChange={(checked) => updateField('actif', checked)}
        />
      </div>
      
      {/* Contenu si actif */}
      {criteres.actif && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto">
              <span className="font-medium">Critères de recherche détaillés</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-6 pt-4">
            {/* Type de bien recherché */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type de bien recherché</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'Appartement', icon: Building2 },
                  { value: 'Maison', icon: Home },
                  { value: 'Les deux', icon: null }
                ].map((type) => (
                  <Button
                    key={type.value}
                    type="button"
                    variant={criteres.typeRecherche === type.value ? 'default' : 'outline'}
                    className={cn(
                      "flex items-center gap-2 h-12",
                      criteres.typeRecherche === type.value && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => updateField('typeRecherche', type.value as CriteresAchat['typeRecherche'])}
                  >
                    {type.icon && <type.icon className="h-4 w-4" />}
                    <span className="text-sm">{type.value}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Communes recherchées */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Communes recherchées</Label>
                <Badge variant="secondary">{criteres.zones.length} sélectionnée(s)</Badge>
              </div>
              
              {/* Recherche */}
              <Input
                placeholder="Rechercher une commune..."
                value={searchCommune}
                onChange={(e) => setSearchCommune(e.target.value)}
                className="h-10"
              />
              
              {/* Communes sélectionnées */}
              {criteres.zones.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {criteres.zones.map(zone => (
                    <Badge 
                      key={zone} 
                      className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer gap-1"
                      onClick={() => toggleZone(zone)}
                    >
                      {zone}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Liste des communes */}
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
                {filteredCommunes.map(commune => (
                  <Button
                    key={commune}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-8 text-sm",
                      criteres.zones.includes(commune) && "bg-primary/10 text-primary"
                    )}
                    onClick={() => toggleZone(commune)}
                  >
                    {criteres.zones.includes(commune) && (
                      <Check className="h-3 w-3 mr-2" />
                    )}
                    {commune}
                  </Button>
                ))}
                {filteredCommunes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Aucune commune trouvée
                  </p>
                )}
              </div>
            </div>
            
            {/* Pièces et surface */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pièces minimum</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10"
                    onClick={() => updateField('piecesMin', Math.max(0, criteres.piecesMin - 0.5))}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={criteres.piecesMin || ''}
                    onChange={(e) => updateField('piecesMin', parseFloat(e.target.value) || 0)}
                    className="text-center h-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 w-10"
                    onClick={() => updateField('piecesMin', criteres.piecesMin + 0.5)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label className="text-sm font-medium">Surface min (m²)</Label>
                  <Badge variant="outline" className="text-xs">Optionnel</Badge>
                </div>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ex: 80"
                  value={criteres.surfaceMin || ''}
                  onChange={(e) => updateField('surfaceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="h-10"
                />
              </div>
            </div>
            
            {/* Budget */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Budget (CHF)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Vous pouvez saisir "1.5M" ou "800k"</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Minimum</Label>
                  <Input
                    placeholder="Ex: 1M"
                    value={criteres.budgetMin ? formatBudget(criteres.budgetMin) : ''}
                    onChange={(e) => updateField('budgetMin', parseBudget(e.target.value))}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Maximum</Label>
                  <Input
                    placeholder="Ex: 1.5M"
                    value={criteres.budgetMax ? formatBudget(criteres.budgetMax) : ''}
                    onChange={(e) => updateField('budgetMax', parseBudget(e.target.value))}
                    className={cn(
                      "h-10",
                      criteres.budgetMin > 0 && criteres.budgetMax > 0 && criteres.budgetMin > criteres.budgetMax && "border-red-500"
                    )}
                  />
                  {criteres.budgetMin > 0 && criteres.budgetMax > 0 && criteres.budgetMin > criteres.budgetMax && (
                    <p className="text-xs text-red-500">Le max doit être supérieur au min</p>
                  )}
                </div>
              </div>
              
              {/* Flexibilité budget */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Flexibilité budget</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Pourcentage de dépassement acceptable</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm font-medium">±{criteres.flexibiliteBudget || 0}%</span>
                </div>
                <Slider
                  value={[criteres.flexibiliteBudget || 0]}
                  onValueChange={(val) => updateField('flexibiliteBudget', val[0])}
                  min={0}
                  max={20}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
            
            {/* Urgence */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Niveau d'urgence</Label>
              <div className="grid grid-cols-3 gap-2">
                {URGENCES.map((urg) => (
                  <Button
                    key={urg.value}
                    type="button"
                    variant={criteres.urgence === urg.value ? 'default' : 'outline'}
                    className={cn(
                      "flex items-center gap-2 h-11",
                      criteres.urgence === urg.value && urg.color.replace('bg-', 'bg-')
                    )}
                    onClick={() => updateField('urgence', urg.value as CriteresAchat['urgence'])}
                  >
                    <urg.icon className="h-4 w-4" />
                    <span className="text-sm">{urg.label}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Date d'expiration */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Valide jusqu'au</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Date limite pour le matching automatique</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !criteres.dateExpiration && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {criteres.dateExpiration 
                      ? format(parseExpirationDate(criteres.dateExpiration) || new Date(), 'PPP', { locale: fr })
                      : "Sélectionner une date"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseExpirationDate(criteres.dateExpiration)}
                    onSelect={(date) => updateField('dateExpiration', date ? format(date, 'yyyy-MM-dd') : '')}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Commentaire libre */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Notes complémentaires</Label>
                <Badge variant="outline" className="text-xs">Optionnel</Badge>
              </div>
              <Textarea
                placeholder="Autres critères, préférences spécifiques, contraintes..."
                value={criteres.commentaire || ''}
                onChange={(e) => updateField('commentaire', e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
            
            {/* Résumé */}
            {(criteres.zones.length > 0 || criteres.budgetMax > 0) && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-2">📋 Résumé des critères :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {criteres.typeRecherche && (
                    <li>• Type : {criteres.typeRecherche}</li>
                  )}
                  {criteres.zones.length > 0 && (
                    <li>• Zones : {criteres.zones.slice(0, 3).join(', ')}{criteres.zones.length > 3 ? ` (+${criteres.zones.length - 3})` : ''}</li>
                  )}
                  {criteres.piecesMin > 0 && (
                    <li>• Min. {criteres.piecesMin} pièces</li>
                  )}
                  {criteres.budgetMin > 0 && criteres.budgetMax > 0 && (
                    <li>• Budget : {formatBudget(criteres.budgetMin)} - {formatBudget(criteres.budgetMax)} CHF (±{criteres.flexibiliteBudget}%)</li>
                  )}
                  {criteres.urgence && (
                    <li>• Urgence : {criteres.urgence}</li>
                  )}
                </ul>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// Helper pour parser les anciens champs texte
export function parseCriteresFromText(
  budgetText?: string, 
  regionText?: string
): Partial<CriteresAchat> {
  const result: Partial<CriteresAchat> = {
    actif: true
  };
  
  // Parse budget
  if (budgetText) {
    const numbers = budgetText.match(/[\d.,]+\s*[mMkK]?/g);
    if (numbers && numbers.length >= 1) {
      const parsed = numbers.map(n => {
        const val = parseFloat(n.replace(/[^0-9.]/g, ''));
        if (n.toLowerCase().includes('m')) return val * 1000000;
        if (n.toLowerCase().includes('k')) return val * 1000;
        return val > 10000 ? val : val * 1000000; // Assume millions if small number
      });
      if (parsed.length >= 2) {
        result.budgetMin = Math.min(...parsed);
        result.budgetMax = Math.max(...parsed);
      } else if (parsed.length === 1) {
        result.budgetMax = parsed[0];
        result.budgetMin = parsed[0] * 0.8; // Assume 20% range
      }
    }
  }
  
  // Parse region -> zones
  if (regionText) {
    const zones: string[] = [];
    const text = regionText.toLowerCase();
    
    // Check for known communes
    COMMUNES_GENEVE.forEach(commune => {
      if (text.includes(commune.toLowerCase())) {
        zones.push(commune);
      }
    });
    
    // Check for "rive gauche" / "rive droite" patterns
    if (text.includes('rive gauche')) {
      zones.push('Carouge', 'Lancy', 'Onex', 'Plan-les-Ouates', 'Veyrier', 'Troinex');
    }
    if (text.includes('rive droite')) {
      zones.push('Vernier', 'Meyrin', 'Grand-Saconnex', 'Versoix', 'Bellevue', 'Genthod');
    }
    
    result.zones = [...new Set(zones)]; // Remove duplicates
  }
  
  return result;
}