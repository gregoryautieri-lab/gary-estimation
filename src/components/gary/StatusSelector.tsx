import { useState, useMemo } from 'react';
import { 
  FileEdit, 
  Loader, 
  Send, 
  Eye, 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  PenTool, 
  CheckCircle, 
  XCircle, 
  Check, 
  Archive, 
  Trophy,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  EstimationStatus, 
  STATUS_CONFIG, 
  getAllowedTransitions, 
  isCommentRequired 
} from '@/types/estimation';
import { cn } from '@/lib/utils';

// Icon mapping
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileEdit,
  Loader,
  Send,
  Eye,
  Clock,
  MessageSquare,
  ThumbsUp,
  PenTool,
  CheckCircle,
  XCircle,
  Check,
  Archive,
  Trophy
};

interface StatusSelectorProps {
  currentStatus: EstimationStatus;
  onChange: (newStatus: EstimationStatus, comment?: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StatusSelector({ 
  currentStatus, 
  onChange, 
  disabled = false,
  size = 'md',
  showLabel = true
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<EstimationStatus | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);

  const config = STATUS_CONFIG[currentStatus];
  const Icon = ICONS[config.icon] || FileEdit;
  const allowedTransitions = useMemo(() => getAllowedTransitions(currentStatus), [currentStatus]);

  const handleSelect = (newStatus: EstimationStatus) => {
    if (isCommentRequired(currentStatus, newStatus)) {
      setPendingStatus(newStatus);
      setShowCommentDialog(true);
      setIsOpen(false);
    } else {
      onChange(newStatus);
      setIsOpen(false);
    }
  };

  const handleConfirmWithComment = () => {
    if (!pendingStatus) return;
    
    // BUG #3 FIX: Validation commentaire obligatoire (min 10 caractères)
    const trimmedComment = comment.trim();
    if (!trimmedComment || trimmedComment.length < 10) {
      // On ne peut pas utiliser toast ici car il n'est pas importé
      // On va juste empêcher la validation - le placeholder guide l'utilisateur
      return;
    }
    
    onChange(pendingStatus, trimmedComment);
    setPendingStatus(null);
    setComment('');
    setShowCommentDialog(false);
  };
  
  // Vérifie si le commentaire est valide pour activer le bouton
  const isCommentValid = comment.trim().length >= 10;

  const sizeClasses = {
    sm: 'h-7 text-xs gap-1 px-2',
    md: 'h-9 text-sm gap-1.5 px-3',
    lg: 'h-11 text-base gap-2 px-4'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || allowedTransitions.length === 0}
            className={cn(
              sizeClasses[size],
              config.bgColor,
              config.color,
              'border-current/20 hover:bg-current/10 font-medium'
            )}
          >
            <Icon className={iconSizes[size]} />
            {showLabel && <span>{config.shortLabel}</span>}
            {allowedTransitions.length > 0 && (
              <ChevronDown className={cn(iconSizes[size], 'ml-1 opacity-50')} />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-56 bg-background z-50">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Changer le statut
          </div>
          <DropdownMenuSeparator />
          
          {allowedTransitions.map((status) => {
            const statusConfig = STATUS_CONFIG[status];
            const StatusIcon = ICONS[statusConfig.icon] || FileEdit;
            
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleSelect(status)}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={cn(
                    'p-1.5 rounded',
                    statusConfig.bgColor
                  )}>
                    <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{statusConfig.label}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </DropdownMenuItem>
            );
          })}
          
          {allowedTransitions.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">
              Aucune transition disponible
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog pour commentaire obligatoire */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Changement de statut vers "{pendingStatus && STATUS_CONFIG[pendingStatus]?.label}"
            </DialogTitle>
            <DialogDescription>
              {currentStatus === 'perdu' || pendingStatus === 'perdu' 
                ? 'Merci d\'indiquer la raison de cette perte ou du retour en pipeline.'
                : 'Un commentaire est requis pour cette transition.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-comment">Commentaire <span className="text-destructive">*</span></Label>
              <Textarea
                id="status-comment"
                placeholder={
                  pendingStatus === 'perdu' 
                    ? 'Ex: Client a choisi une autre agence, prix trop élevé, projet reporté... (min. 10 caractères)'
                    : 'Décrivez la raison de ce changement... (min. 10 caractères)'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className={!isCommentValid && comment.length > 0 ? 'border-destructive' : ''}
              />
              {comment.length > 0 && !isCommentValid && (
                <p className="text-xs text-destructive">
                  Le commentaire doit contenir au moins 10 caractères ({comment.trim().length}/10)
                </p>
              )}
              {comment.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Minimum 10 caractères requis
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCommentDialog(false);
              setPendingStatus(null);
              setComment('');
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmWithComment}
              disabled={!isCommentValid}
            >
              Confirmer le changement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Badge de statut simple (lecture seule)
interface StatusBadgeProps {
  status: EstimationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = ICONS[config.icon] || FileEdit;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        sizeClasses[size],
        config.bgColor,
        config.color,
        'border-current/20 font-medium flex items-center gap-1'
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.shortLabel}
    </Badge>
  );
}

// Pipeline mini-visualization
interface StatusPipelineProps {
  currentStatus: EstimationStatus;
}

export function StatusPipeline({ currentStatus }: StatusPipelineProps) {
  const pipelineStatuses: EstimationStatus[] = [
    'en_cours',
    'a_presenter',
    'presentee',
    'reflexion',
    'negociation',
    'accord_oral',
    'en_signature',
    'mandat_signe'
  ];
  
  const currentOrder = STATUS_CONFIG[currentStatus]?.order || 0;
  const isLost = currentStatus === 'perdu';
  const isArchived = currentStatus === 'archive';
  
  if (isLost || isArchived) {
    return (
      <div className="flex items-center gap-1">
        <StatusBadge status={currentStatus} size="sm" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {pipelineStatuses.map((status, index) => {
        const config = STATUS_CONFIG[status];
        const isPast = config.order < currentOrder;
        const isCurrent = status === currentStatus;
        
        return (
          <div
            key={status}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              isCurrent ? config.bgColor.replace('100', '500') :
              isPast ? 'bg-green-400' : 'bg-muted'
            )}
            title={config.label}
          />
        );
      })}
    </div>
  );
}
