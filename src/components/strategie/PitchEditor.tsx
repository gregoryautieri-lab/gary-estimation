// ============================================
// Composant Éditeur de Pitch
// ============================================

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PitchEditorProps {
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
}

export function PitchEditor({ value, defaultValue, onChange }: PitchEditorProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || defaultValue);
      setCopied(true);
      toast.success('Pitch copié dans le presse-papier');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie');
    }
  };
  
  const handleReset = () => {
    onChange(defaultValue);
    toast.success('Pitch réinitialisé');
  };
  
  return (
    <div className="space-y-3">
      <Textarea
        value={value || defaultValue}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        className="text-sm leading-relaxed resize-none"
        placeholder="Le pitch sera généré automatiquement..."
      />
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="flex-1"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copié !
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
