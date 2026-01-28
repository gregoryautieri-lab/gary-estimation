import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Phone, 
  CalendarDays, 
  Home,
  Calendar as CalendarIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Lead, normalizeLeadStatut } from '@/types/leads';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface LeadActionsProps {
  lead: Lead;
  onUpdate: () => void;
}

const RAISONS_SUGGESTIONS = [
  "Pas vendeur finalement",
  "Mauvais timing",
  "Parti chez un concurrent",
  "Injoignable",
  "Bien déjà vendu",
];

export function LeadActions({ lead, onUpdate }: LeadActionsProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showContacteDialog, setShowContacteDialog] = useState(false);
  const [showRdvDialog, setShowRdvDialog] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [rdvDate, setRdvDate] = useState<Date | undefined>(undefined);
  const [raison, setRaison] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [creatingEstimation, setCreatingEstimation] = useState(false);

  const normalizedStatut = normalizeLeadStatut(lead.statut);

  // Marquer comme contacté
  const handleContacte = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          statut: 'contacte',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead marqué comme contacté');
      setShowContacteDialog(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur mise à jour lead:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  // Planifier un RDV
  const handlePlanifierRdv = async () => {
    if (!rdvDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          statut: 'rdv_planifie',
          rdv_date: rdvDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('RDV planifié avec succès');
      setShowRdvDialog(false);
      setRdvDate(undefined);
      onUpdate();
    } catch (error) {
      console.error('Erreur planification RDV:', error);
      toast.error('Erreur lors de la planification');
    } finally {
      setIsLoading(false);
    }
  };

  // Créer une estimation (disponible UNIQUEMENT si rdv_planifie)
  const handleCreateEstimation = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }
    
    setCreatingEstimation(true);
    try {
      const typeBienMap: Record<string, string> = {
        'appartement': 'appartement',
        'villa': 'maison',
        'maison': 'maison',
        'terrain': 'terrain',
        'immeuble': 'immeuble',
        'commercial': 'commercial'
      };
      
      const sourceMap: Record<string, string> = {
        telephone: 'telephone',
        boitage: 'boitage',
        partenariat: 'partenariat',
        recommandation: 'recommandation',
        reseaux_sociaux: 'reseaux_sociaux',
        site_web: 'site_web',
        salon: 'salon',
        autre: 'autre'
      };
      const mappedSource = sourceMap[lead.source] || 'autre';
      
      const identificationData = {
        vendeur: {
          nom: [lead.prenom, lead.nom].filter(Boolean).join(' ') || lead.nom,
          email: lead.email || '',
          telephone: lead.telephone || ''
        },
        adresse: {
          rue: lead.bien_adresse || '',
          codePostal: lead.bien_npa || '',
          localite: lead.bien_localite || ''
        },
        sourceContact: mappedSource
      };
      
      // Si source = boitage et campagne liée, passer le code campagne
      const campagneCode = lead.source === 'boitage' && lead.campagne?.code 
        ? lead.campagne.code 
        : null;
      
      const { data: newEstimation, error: createError } = await supabase
        .from('estimations')
        .insert({
          courtier_id: user.id,
          lead_id: lead.id,
          statut: 'brouillon' as const,
          vendeur_nom: [lead.prenom, lead.nom].filter(Boolean).join(' ') || lead.nom,
          vendeur_email: lead.email,
          vendeur_telephone: lead.telephone,
          adresse: lead.bien_adresse,
          code_postal: lead.bien_npa,
          localite: lead.bien_localite,
          type_bien: (lead.bien_type && typeBienMap[lead.bien_type]) 
            ? typeBienMap[lead.bien_type] as 'appartement' | 'maison' | 'terrain' | 'immeuble' | 'commercial'
            : null,
          identification: identificationData,
          campagne_origin_code: campagneCode
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Mettre à jour le lead comme converti
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          statut: 'converti',
          estimation_id: newEstimation.id,
          converti_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      
      if (updateError) {
        console.error('Erreur mise à jour lead:', updateError);
      }
      
      toast.success('Estimation créée, lead converti');
      navigate(`/estimation/${newEstimation.id}/identification`);
      
    } catch (error) {
      console.error('Erreur création estimation:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreatingEstimation(false);
    }
  };

  // Marquer comme perdu
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
        .eq('id', lead.id);

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

  // Rendu des actions selon le statut
  const renderActions = () => {
    switch (normalizedStatut) {
      case 'nouveau':
        return (
          <div className="flex flex-wrap gap-3">
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
              onClick={() => setShowContacteDialog(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Marquer contacté
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
        );

      case 'contacte':
        return (
          <div className="flex flex-wrap gap-3">
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setShowRdvDialog(true)}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Planifier RDV
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
        );

      case 'rdv_planifie':
        return (
          <div className="space-y-4">
            {lead.rdv_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>RDV prévu le {format(parseISO(lead.rdv_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {lead.type_demande === 'estimation' && (
                <Button 
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  disabled={creatingEstimation}
                  onClick={handleCreateEstimation}
                >
                  {creatingEstimation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Home className="h-4 w-4 mr-2" />
                  )}
                  Créer estimation
                </Button>
              )}
              <Button 
                variant="outline" 
                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setShowLostDialog(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Marquer perdu
              </Button>
            </div>
          </div>
        );

      case 'converti':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>
                Converti{lead.converti_at && ` le ${format(parseISO(lead.converti_at), 'dd MMMM yyyy', { locale: fr })}`}
              </span>
            </div>
            {lead.estimation_id && (
              <Link 
                to={`/estimation/${lead.estimation_id}/overview`} 
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Voir l'estimation →
              </Link>
            )}
          </div>
        );

      case 'perdu':
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span>Lead perdu</span>
            </div>
            {lead.perdu_raison && (
              <p className="text-sm text-muted-foreground">Raison : {lead.perdu_raison}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderActions()}

      {/* Dialog Marquer contacté */}
      <Dialog open={showContacteDialog} onOpenChange={setShowContacteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le contact</DialogTitle>
            <DialogDescription>
              Le prospect a été contacté par téléphone ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowContacteDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleContacte}
              disabled={isLoading}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Phone className="h-4 w-4 mr-2" />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Planifier RDV */}
      <Dialog open={showRdvDialog} onOpenChange={(open) => {
        setShowRdvDialog(open);
        if (!open) setRdvDate(undefined);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Planifier le rendez-vous</DialogTitle>
            <DialogDescription>
              Sélectionnez la date et l'heure du rendez-vous avec le prospect.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !rdvDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {rdvDate ? format(rdvDate, 'PPP', { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={rdvDate}
                  onSelect={setRdvDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRdvDialog(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handlePlanifierRdv}
              disabled={isLoading || !rdvDate}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4 mr-2" />
              )}
              Confirmer le RDV
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
