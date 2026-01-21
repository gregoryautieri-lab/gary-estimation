import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Construction } from 'lucide-react';

interface CampagneFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campagneId?: string; // Si fourni, mode édition
}

export function CampagneFormModal({ open, onOpenChange, campagneId }: CampagneFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {campagneId ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-2">Formulaire à venir</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Le formulaire de création/édition de campagne sera implémenté dans le prompt 6.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
