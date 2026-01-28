import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Edit, 
  Home, 
  Users,
  Globe,
  Megaphone,
  UserPlus,
  Handshake,
  HelpCircle,
  Calendar,
  Building,
  MapPin,
  Loader2
} from 'lucide-react';
import { format, differenceInDays, isToday, isPast, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Partner, LEAD_SOURCE_OPTIONS, LEAD_STATUT_OPTIONS, BIEN_TYPE_OPTIONS } from '@/types/leads';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { LeadActions } from '@/components/leads/LeadActions';
interface LeadWithRelations {
  id: string;
  created_at: string;
  updated_at: string;
  source: string;
  source_detail: string | null;
  partner_id: string | null;
  partner: Partner | null;
  campagne_id: string | null;
  campagne: { code: string; commune: string } | null;
  retro_type: string | null;
  retro_valeur: number | null;
  recommande_par: string | null;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  type_demande: string;
  statut: string;
  perdu_raison: string | null;
  assigned_to: string | null;
  rappel_date: string | null;
  estimation_id: string | null;
  converti_at: string | null;
  bien_adresse: string | null;
  bien_npa: string | null;
  bien_localite: string | null;
  bien_type: string | null;
  notes: string | null;
  created_by: string | null;
  assigned_user_name: string | null;
  created_by_user_name: string | null;
}

const sourceIcons: Record<string, React.ReactNode> = {
  boitage: <Megaphone className="h-4 w-4" />,
  reseaux_sociaux: <Globe className="h-4 w-4" />,
  telephone: <Phone className="h-4 w-4" />,
  recommandation: <UserPlus className="h-4 w-4" />,
  partenariat: <Handshake className="h-4 w-4" />,
  site_web: <Globe className="h-4 w-4" />,
  salon: <Users className="h-4 w-4" />,
  autre: <HelpCircle className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  nouveau: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  en_cours: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  converti: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  perdu: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [creatingEstimation, setCreatingEstimation] = useState(false);

  const handleLeadUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['lead', id] });
  };
  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      // Fetch lead with partner and campagne
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select(`*, partner:partners(*), campagne:campagnes(code, commune)`)
        .eq('id', id!)
        .maybeSingle();

      if (leadError) throw leadError;
      if (!leadData) return null;

      // Fetch assigned user profile
      let assignedUserName: string | null = null;
      if (leadData.assigned_to) {
        const { data: assignedProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', leadData.assigned_to)
          .maybeSingle();
        assignedUserName = assignedProfile?.full_name || null;
      }

      // Fetch created by user profile
      let createdByUserName: string | null = null;
      if (leadData.created_by) {
        const { data: createdProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', leadData.created_by)
          .maybeSingle();
        createdByUserName = createdProfile?.full_name || null;
      }

      return {
        ...leadData,
        assigned_user_name: assignedUserName,
        created_by_user_name: createdByUserName,
      } as LeadWithRelations;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Lead introuvable</p>
            <Button variant="link" onClick={() => navigate('/leads')}>
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sourceLabel = LEAD_SOURCE_OPTIONS.find(s => s.value === lead.source)?.label || lead.source;
  const statutLabel = LEAD_STATUT_OPTIONS.find(s => s.value === lead.statut)?.label || lead.statut;
  const bienTypeLabel = lead.bien_type 
    ? BIEN_TYPE_OPTIONS.find(b => b.value === lead.bien_type)?.label || lead.bien_type 
    : null;

  const formatRetro = () => {
    if (!lead.retro_type || !lead.retro_valeur) return null;
    if (lead.retro_type === 'pourcentage') return `${lead.retro_valeur}%`;
    if (lead.retro_type === 'fixe') return `CHF ${lead.retro_valeur.toLocaleString('fr-CH')}`;
    return null;
  };

  const getRappelBadge = () => {
    if (!lead.rappel_date) return null;
    const rappelDate = parseISO(lead.rappel_date);
    
    if (isToday(rappelDate)) {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Aujourd'hui</Badge>;
    }
    if (isPast(rappelDate)) {
      const daysLate = differenceInDays(new Date(), rappelDate);
      return <Badge variant="destructive">En retard de {daysLate} jour{daysLate > 1 ? 's' : ''}</Badge>;
    }
    return null;
  };

  const fullAddress = [lead.bien_adresse, lead.bien_npa, lead.bien_localite]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {lead.prenom} {lead.nom}
            </h1>
            <Badge className={statusColors[lead.statut]}>
              {statutLabel}
            </Badge>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/leads/${id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* COORDONNÉES */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {lead.telephone ? (
              <a href={`tel:${lead.telephone}`} className="text-primary hover:underline">
                {lead.telephone}
              </a>
            ) : (
              <span className="text-muted-foreground">Non renseigné</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                {lead.email}
              </a>
            ) : (
              <span className="text-muted-foreground">Non renseigné</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* INFORMATIONS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Détails du lead</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            {/* Source */}
            <div className="flex items-start gap-3">
              <dt className="text-muted-foreground w-32 shrink-0">Source</dt>
              <dd className="flex items-center gap-2">
                {sourceIcons[lead.source]}
                <span>{sourceLabel}</span>
              </dd>
            </div>

            {/* Détail source */}
            {lead.source_detail && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Détail source</dt>
                <dd>{lead.source_detail}</dd>
              </div>
            )}

            {/* Campagne associée (boitage) */}
            {lead.source === 'boitage' && lead.campagne && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Campagne</dt>
                <dd className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.campagne.code} — {lead.campagne.commune}</span>
                </dd>
              </div>
            )}

            {/* Partenaire */}
            {lead.source === 'partenariat' && lead.partner && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Partenaire</dt>
                <dd>
                  {lead.partner.societe}
                  {lead.partner.nom && ` — ${lead.partner.nom}`}
                </dd>
              </div>
            )}

            {/* Rétro prévue */}
            {lead.source === 'partenariat' && formatRetro() && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Rétro prévue</dt>
                <dd className="flex items-center gap-2">
                  <span>{formatRetro()}</span>
                  <Badge variant="outline" className="text-xs">Potentielle</Badge>
                </dd>
              </div>
            )}

            {/* Recommandé par */}
            {lead.source === 'recommandation' && lead.recommande_par && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Recommandé par</dt>
                <dd>{lead.recommande_par}</dd>
              </div>
            )}

            {/* Type de demande */}
            <div className="flex items-start gap-3">
              <dt className="text-muted-foreground w-32 shrink-0">Type de demande</dt>
              <dd>{lead.type_demande === 'estimation' ? 'Demande d\'estimation' : 'Lead à qualifier'}</dd>
            </div>

            {/* Adresse du bien */}
            {lead.type_demande === 'estimation' && fullAddress && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Adresse du bien</dt>
                <dd className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {fullAddress}
                </dd>
              </div>
            )}

            {/* Type de bien */}
            {lead.type_demande === 'estimation' && bienTypeLabel && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Type de bien</dt>
                <dd className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  {bienTypeLabel}
                </dd>
              </div>
            )}

            {/* Courtier assigné */}
            <div className="flex items-start gap-3">
              <dt className="text-muted-foreground w-32 shrink-0">Courtier assigné</dt>
              <dd>{lead.assigned_user_name || 'Non assigné'}</dd>
            </div>

            {/* Date de rappel */}
            {lead.rappel_date && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Date de rappel</dt>
                <dd className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(parseISO(lead.rappel_date), 'dd MMMM yyyy', { locale: fr })}
                  {getRappelBadge()}
                </dd>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div className="flex items-start gap-3">
                <dt className="text-muted-foreground w-32 shrink-0">Notes</dt>
                <dd className="whitespace-pre-wrap">{lead.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* ACTIONS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {(lead.statut === 'nouveau' || lead.statut === 'en_cours') && (
            <div className="space-y-4">
              {lead.type_demande === 'estimation' && (
                <Button 
                  className="bg-primary"
                  disabled={creatingEstimation}
                  onClick={async () => {
                    if (!user) {
                      toast.error('Vous devez être connecté');
                      return;
                    }
                    
                    setCreatingEstimation(true);
                    try {
                      const typeBienMap: Record<string, string> = {
                        'appartement': 'appartement',
                        'maison': 'maison',
                        'terrain': 'terrain',
                        'immeuble': 'immeuble',
                        'commercial': 'commercial'
                      };
                      
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
                        sourceContact: 'direct'
                      };
                      
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
                          identification: identificationData
                        })
                        .select()
                        .single();
                      
                      if (createError) throw createError;
                      
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
                  }}
                >
                  {creatingEstimation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Home className="h-4 w-4 mr-2" />
                  )}
                  Créer estimation
                </Button>
              )}
              
              <LeadActions 
                leadId={lead.id} 
                leadStatut={lead.statut} 
                onUpdate={handleLeadUpdate} 
              />
            </div>
          )}

          {lead.statut === 'converti' && (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Ce lead a été converti le {lead.converti_at && format(parseISO(lead.converti_at), 'dd MMMM yyyy', { locale: fr })}
              </p>
              {lead.estimation_id && (
                <Link to={`/estimation/${lead.estimation_id}/overview`} className="text-primary hover:underline inline-flex items-center gap-1">
                  Voir l'estimation →
                </Link>
              )}
            </div>
          )}

          {lead.statut === 'perdu' && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Ce lead a été marqué perdu</p>
              {lead.perdu_raison && (
                <p className="text-sm">Raison : {lead.perdu_raison}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MÉTADONNÉES */}
      <div className="text-xs text-muted-foreground space-y-1 px-1">
        <p>
          Créé le {format(parseISO(lead.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          {lead.created_by_user_name && ` par ${lead.created_by_user_name}`}
        </p>
        <p>
          Dernière modification le {format(parseISO(lead.updated_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
        </p>
      </div>
    </div>
  );
}
