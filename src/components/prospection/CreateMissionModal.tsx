import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface CreateMissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultDate?: Date;
}

interface CampagneOption {
  id: string;
  code: string;
  commune: string;
  courtier_id: string;
  nb_courriers: number;
  reste: number;
}

export function CreateMissionModal({
  open,
  onOpenChange,
  onSuccess,
  defaultDate,
}: CreateMissionModalProps) {
  const queryClient = useQueryClient();

  // Form state
  const [selectedCampagne, setSelectedCampagne] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate || new Date());
  const [assigneType, setAssigneType] = useState<'none' | 'etudiant' | 'courtier'>('none');
  const [assigneId, setAssigneId] = useState<string>('');
  const [nbCourriers, setNbCourriers] = useState<number>(0);
  const [secteur, setSecteur] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch campagnes actives avec calcul du reste
  const { data: campagnes = [] } = useQuery({
    queryKey: ['campagnes-actives-modal'],
    queryFn: async (): Promise<CampagneOption[]> => {
      const { data, error } = await supabase
        .from('campagnes')
        .select(`
          id, code, commune, courtier_id, nb_courriers,
          missions:missions(courriers_prevu)
        `)
        .in('statut', ['planifiee', 'en_cours'])
        .order('code', { ascending: false });

      if (error) throw error;

      return (data || []).map((c: any) => {
        const totalPrevu = (c.missions || []).reduce(
          (sum: number, m: any) => sum + (m.courriers_prevu || 0),
          0
        );
        return {
          id: c.id,
          code: c.code,
          commune: c.commune,
          courtier_id: c.courtier_id,
          nb_courriers: c.nb_courriers,
          reste: c.nb_courriers - totalPrevu,
        };
      });
    },
    enabled: open,
  });

  // Fetch étudiants actifs
  const { data: etudiants = [] } = useQuery({
    queryKey: ['etudiants-actifs-modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etudiants')
        .select('id, prenom, nom')
        .eq('actif', true)
        .order('prenom');

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Campagne sélectionnée
  const campagneSelected = useMemo(
    () => campagnes.find((c) => c.id === selectedCampagne),
    [campagnes, selectedCampagne]
  );

  // Quand campagne change, mettre à jour le nombre de courriers par défaut
  useEffect(() => {
    if (campagneSelected) {
      const defaultNb = Math.min(campagneSelected.reste, 300);
      setNbCourriers(Math.max(0, defaultNb));
    }
  }, [campagneSelected]);

  // Reset form quand la modal s'ouvre
  useEffect(() => {
    if (open) {
      setSelectedCampagne('');
      setSelectedDate(defaultDate || new Date());
      setAssigneType('none');
      setAssigneId('');
      setNbCourriers(0);
      setSecteur('');
    }
  }, [open, defaultDate]);

  const handleSubmit = async () => {
    if (!selectedCampagne || !selectedDate || nbCourriers <= 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        campagne_id: selectedCampagne,
        date: format(selectedDate, 'yyyy-MM-dd'),
        courriers_prevu: nbCourriers,
        secteur_nom: secteur.trim() || null,
        statut: 'prevue',
        etudiant_id: null,
        courtier_id: null,
      };

      if (assigneType === 'etudiant' && assigneId) {
        payload.etudiant_id = assigneId;
      } else if (assigneType === 'courtier' && campagneSelected) {
        payload.courtier_id = campagneSelected.courtier_id;
      }

      const { error } = await supabase.from('missions').insert(payload);

      if (error) throw error;

      toast.success('Mission créée avec succès');
      
      // Invalider les queries pour refresh
      queryClient.invalidateQueries({ queryKey: ['planning-missions'] });
      queryClient.invalidateQueries({ queryKey: ['prospection-alertes'] });
      queryClient.invalidateQueries({ queryKey: ['campagnes-actives-modal'] });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erreur création mission:', error);
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle mission</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campagne */}
          <div className="space-y-2">
            <Label htmlFor="campagne">Campagne *</Label>
            <Select value={selectedCampagne} onValueChange={setSelectedCampagne}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une campagne" />
              </SelectTrigger>
              <SelectContent>
                {campagnes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} - {c.commune} ({c.reste} dispo)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP', { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={fr}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Assigné à */}
          <div className="space-y-2">
            <Label>Assigné à</Label>
            <Select
              value={assigneType === 'none' ? '' : `${assigneType}:${assigneId}`}
              onValueChange={(val) => {
                if (!val) {
                  setAssigneType('none');
                  setAssigneId('');
                } else if (val === 'courtier') {
                  setAssigneType('courtier');
                  setAssigneId('');
                } else {
                  const [type, id] = val.split(':');
                  setAssigneType(type as 'etudiant');
                  setAssigneId(id);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Non assigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Non assigné</SelectItem>
                <SelectItem value="courtier">Courtier de la campagne</SelectItem>
                <SelectGroup>
                  <SelectLabel>Étudiants</SelectLabel>
                  {etudiants.map((e) => (
                    <SelectItem key={e.id} value={`etudiant:${e.id}`}>
                      {e.prenom} {e.nom || ''}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Nombre de courriers */}
          <div className="space-y-2">
            <Label htmlFor="courriers">Nombre de courriers *</Label>
            <Input
              id="courriers"
              type="number"
              min={1}
              max={campagneSelected?.reste || 1000}
              value={nbCourriers}
              onChange={(e) => setNbCourriers(parseInt(e.target.value) || 0)}
            />
            {campagneSelected && (
              <p className="text-xs text-muted-foreground">
                Disponible : {campagneSelected.reste} courriers
              </p>
            )}
          </div>

          {/* Secteur */}
          <div className="space-y-2">
            <Label htmlFor="secteur">Secteur / Zone</Label>
            <Input
              id="secteur"
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              placeholder="Ex: Zone Nord..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
