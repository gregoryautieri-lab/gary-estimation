import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LeadActionsProps {
  leadId: string;
  leadStatut: string;
  onUpdate: () => void;
}

const RAISONS_SUGGESTIONS = [
  "Pas vendeur finalement",
  "Mauvais timing",
  "Parti chez un concurrent",
  "Injoignable",
  "Bien déjà vendu",
];

export function LeadActions({ leadId, leadStatut, onUpdate }: LeadActionsProps) {
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [raison, setRaison] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Only show actions for nouveau or en_cours leads
  if (leadStatut !== 'nouveau' && leadStatut !== 'en_cours') {
    return null;
  }

  const handleConvert = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          statut: 'converti',
          converti_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead marqué comme converti');
      setShowConvertDialog(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur conversion lead:', error);
      toast.error('Erreur lors de la conversion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLost = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          statut: 'perdu',
          perdu_raison: raison.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      toast.success('Lead marqué comme perdu');
      setShowLostDialog(false);
      setRaison('');
      onUpdate();
    } catch (error) {
      console.error('Erreur perte lead:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setRaison(suggestion);
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          onClick={() => setShowConvertDialog(true)}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Marquer converti
        </Button>
        <Button 
          variant="outline" 
          className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => setShowLostDialog(true)}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Marquer perdu
        </Button>
      </div>

      {/* Dialog Marquer converti */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme converti ?</DialogTitle>
            <DialogDescription>
              Ce lead sera marqué comme converti. Cette action indique que le lead a abouti sans créer d'estimation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConvertDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleConvert}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Marquer perdu */}
      <Dialog open={showLostDialog} onOpenChange={(open) => {
        setShowLostDialog(open);
        if (!open) setRaison('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme perdu</DialogTitle>
            <DialogDescription>
              Indiquez pourquoi ce lead n'a pas abouti.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex flex-wrap gap-2">
              {RAISONS_SUGGESTIONS.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${raison === suggestion ? 'bg-muted border-primary' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
            
            <Textarea
              placeholder="Pourquoi ce lead n'a pas abouti ? (optionnel mais recommandé)"
              value={raison}
              onChange={(e) => setRaison(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowLostDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleLost}
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Marquer perdu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
