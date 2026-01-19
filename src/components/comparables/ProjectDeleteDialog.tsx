import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  nbComparables: number;
  onConfirm: () => void;
}

export function ProjectDeleteDialog({
  open,
  onOpenChange,
  projectName,
  nbComparables,
  onConfirm,
}: ProjectDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ⚠️ Supprimer le projet "{projectName}" ?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>Cette action est irréversible.</p>
            {nbComparables > 0 && (
              <p>
                Les <strong>{nbComparables} comparable{nbComparables > 1 ? 's' : ''}</strong> lié{nbComparables > 1 ? 's' : ''} seront dissocié{nbComparables > 1 ? 's' : ''} mais conservé{nbComparables > 1 ? 's' : ''} dans vos estimations.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
