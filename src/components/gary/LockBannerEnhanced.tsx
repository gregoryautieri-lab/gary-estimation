// ============================================
// Bandeau de verrouillage amélioré avec modal
// ============================================

import { useState } from 'react';
import { Lock, Copy, AlertTriangle, FileText, Archive, Trophy, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { EstimationStatus } from '@/types/estimation';

interface LockBannerEnhancedProps {
  statut: EstimationStatus;
  message: string;
  onDuplicate?: () => void;
  duplicating?: boolean;
  className?: string;
}

const statutConfig: Partial<Record<EstimationStatus, { 
  icon: React.ReactNode; 
  color: string; 
  bgColor: string;
  borderColor: string;
  title: string;
}>> = {
  'brouillon': { 
    icon: <FileText className="h-5 w-5" />, 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    title: 'Brouillon'
  },
  'en_cours': { 
    icon: <FileText className="h-5 w-5" />, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    title: 'En cours'
  },
  'a_presenter': { 
    icon: <FileText className="h-5 w-5" />, 
    color: 'text-indigo-700', 
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    title: 'À présenter'
  },
  'presentee': { 
    icon: <Lock className="h-5 w-5" />, 
    color: 'text-purple-700', 
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    title: 'Présentée'
  },
  'reflexion': { 
    icon: <Clock className="h-5 w-5" />, 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    title: 'En réflexion'
  },
  'negociation': { 
    icon: <FileText className="h-5 w-5" />, 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    title: 'En négociation'
  },
  'accord_oral': { 
    icon: <FileText className="h-5 w-5" />, 
    color: 'text-lime-700', 
    bgColor: 'bg-lime-50',
    borderColor: 'border-lime-300',
    title: 'Accord oral'
  },
  'en_signature': { 
    icon: <FileText className="h-5 w-5" />, 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-300',
    title: 'En signature'
  },
  'mandat_signe': { 
    icon: <Trophy className="h-5 w-5" />, 
    color: 'text-green-700', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    title: 'Mandat signé !'
  },
  'perdu': { 
    icon: <Archive className="h-5 w-5" />, 
    color: 'text-red-700', 
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    title: 'Perdu'
  },
  'termine': { 
    icon: <Lock className="h-5 w-5" />, 
    color: 'text-green-700', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    title: 'Estimation terminée'
  },
  'archive': { 
    icon: <Archive className="h-5 w-5" />, 
    color: 'text-slate-700', 
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    title: 'Archivée'
  },
  'vendu': { 
    icon: <Trophy className="h-5 w-5" />, 
    color: 'text-green-700', 
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    title: 'Vendu !'
  }
};

export function LockBannerEnhanced({ 
  statut, 
  message, 
  onDuplicate, 
  duplicating,
  className 
}: LockBannerEnhancedProps) {
  const [showModal, setShowModal] = useState(false);
  const config = statutConfig[statut] || statutConfig['brouillon'];

  const handleDuplicateClick = () => {
    setShowModal(true);
  };

  const handleConfirmDuplicate = () => {
    setShowModal(false);
    onDuplicate?.();
  };

  return (
    <>
      <Alert 
        className={cn(
          "mb-4 border-2",
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        <div className={cn("flex items-start gap-3", config.color)}>
          {config.icon}
          <div className="flex-1">
            <AlertTitle className="font-semibold mb-1">
              {config.title}
            </AlertTitle>
            <AlertDescription className="text-sm opacity-90">
              {message}
            </AlertDescription>
          </div>
          {onDuplicate && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicateClick}
              disabled={duplicating}
              className={cn(
                "shrink-0",
                config.borderColor,
                `hover:${config.bgColor}`
              )}
            >
              <Copy className="w-4 h-4 mr-1.5" />
              {duplicating ? 'Duplication...' : 'Dupliquer'}
            </Button>
          )}
        </div>
      </Alert>

      {/* Modal de confirmation */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary" />
              Dupliquer cette estimation ?
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>
                Une nouvelle estimation sera créée avec les mêmes informations, 
                en statut "Brouillon".
              </p>
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium text-foreground">Ce qui sera copié :</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  <li>Identification vendeur & adresse</li>
                  <li>Caractéristiques du bien</li>
                  <li>Analyse terrain</li>
                  <li>Pré-estimation</li>
                  <li>Comparables</li>
                </ul>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-sm border border-amber-200">
                <p className="font-medium text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Non copié :
                </p>
                <ul className="list-disc list-inside text-amber-700 mt-1 space-y-0.5">
                  <li>Photos (à reprendre)</li>
                  <li>Stratégie & Pitch (à régénérer)</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmDuplicate}
              disabled={duplicating}
            >
              <Copy className="w-4 h-4 mr-1.5" />
              {duplicating ? 'Duplication...' : 'Confirmer la duplication'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
