import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek as getStartOfWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, UserCheck, UserX, Percent, AlertTriangle, Calendar } from 'lucide-react';
import { LEAD_SOURCE_OPTIONS, normalizeLeadStatut } from '@/types/leads';
import { cn } from '@/lib/utils';

interface LeadData {
  id: string;
  statut: string;
  source: string;
  created_at: string;
  converti_at: string | null;
  rappel_date: string | null;
  assigned_to: string | null;
}

interface ProfileData {
  user_id: string;
  full_name: string | null;
}

export function LeadsSummary() {
  const startOfWeek = useMemo(() => {
    const date = getStartOfWeek(new Date(), { weekStartsOn: 1 });
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }, []);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString().split('T')[0];
  }, []);

  // Fetch all leads created this week
  const { data: weekLeads = [], isLoading } = useQuery({
    queryKey: ['leads-week-stats', startOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, statut, source, created_at, converti_at, rappel_date, assigned_to')
        .gte('created_at', startOfWeek);

      if (error) throw error;
      return (data || []) as LeadData[];
    },
  });

  // Fetch profiles for assigned users
  const assignedUserIds = useMemo(() => 
    [...new Set(weekLeads.map(l => l.assigned_to).filter(Boolean))] as string[],
    [weekLeads]
  );

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles-for-stats', assignedUserIds],
    queryFn: async () => {
      if (assignedUserIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', assignedUserIds);

      if (error) throw error;
      return (data || []) as ProfileData[];
    },
    enabled: assignedUserIds.length > 0,
  });

  const profilesMap = useMemo(() => 
    profiles.reduce((acc, p) => {
      acc[p.user_id] = p.full_name || 'Inconnu';
      return acc;
    }, {} as Record<string, string>),
    [profiles]
  );

  // Calculate metrics with normalized statut
  const metrics = useMemo(() => {
    const recus = weekLeads.length;
    const contactes = weekLeads.filter(l => {
      const normalized = normalizeLeadStatut(l.statut);
      return normalized === 'contacte';
    }).length;
    const rdvPlanifies = weekLeads.filter(l => normalizeLeadStatut(l.statut) === 'rdv_planifie').length;
    const convertis = weekLeads.filter(l => normalizeLeadStatut(l.statut) === 'converti').length;
    const perdus = weekLeads.filter(l => normalizeLeadStatut(l.statut) === 'perdu').length;
    const tauxConversion = convertis + perdus > 0 
      ? Math.round((convertis / (convertis + perdus)) * 100) 
      : 0;

    return { recus, contactes, rdvPlanifies, convertis, perdus, tauxConversion };
  }, [weekLeads]);

  // Group by source
  const bySource = useMemo(() => {
    const grouped: Record<string, number> = {};
    weekLeads.forEach(lead => {
      grouped[lead.source] = (grouped[lead.source] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([source, count]) => ({
        source,
        label: LEAD_SOURCE_OPTIONS.find(o => o.value === source)?.label || source,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [weekLeads]);

  const maxSourceCount = Math.max(...bySource.map(s => s.count), 1);

  // Group by courtier
  const byCourtier = useMemo(() => {
    const grouped: Record<string, { assignes: number; convertis: number; rappelsRetard: number }> = {};
    
    weekLeads.forEach(lead => {
      const key = lead.assigned_to || 'non_assigne';
      if (!grouped[key]) {
        grouped[key] = { assignes: 0, convertis: 0, rappelsRetard: 0 };
      }
      grouped[key].assignes++;
      if (lead.statut === 'converti') grouped[key].convertis++;
      if (lead.rappel_date && lead.rappel_date < today && ['nouveau', 'en_cours'].includes(lead.statut)) {
        grouped[key].rappelsRetard++;
      }
    });

    return Object.entries(grouped)
      .map(([userId, stats]) => ({
        userId,
        name: userId === 'non_assigne' ? 'Non assigné' : (profilesMap[userId] || 'Inconnu'),
        ...stats,
      }))
      .sort((a, b) => b.assignes - a.assignes);
  }, [weekLeads, profilesMap, today]);

  if (isLoading) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Chargement des statistiques...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/30 border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Statistiques de la semaine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section 1: Métriques KPI */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <Users className="h-4 w-4 mx-auto text-green-500 mb-1" />
              <p className="text-xl font-bold">{metrics.recus}</p>
              <p className="text-xs text-muted-foreground">Reçus</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <Users className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
              <p className="text-xl font-bold text-yellow-600">{metrics.contactes}</p>
              <p className="text-xs text-muted-foreground">Contactés</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <Calendar className="h-4 w-4 mx-auto text-orange-500 mb-1" />
              <p className="text-xl font-bold text-orange-600">{metrics.rdvPlanifies}</p>
              <p className="text-xs text-muted-foreground">RDV</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <UserCheck className="h-4 w-4 mx-auto text-blue-500 mb-1" />
              <p className="text-xl font-bold text-blue-600">{metrics.convertis}</p>
              <p className="text-xs text-muted-foreground">Convertis</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <UserX className="h-4 w-4 mx-auto text-destructive mb-1" />
              <p className="text-xl font-bold text-destructive">{metrics.perdus}</p>
              <p className="text-xs text-muted-foreground">Perdus</p>
            </CardContent>
          </Card>
          <Card className="bg-background">
            <CardContent className="p-3 text-center">
              <Percent className="h-4 w-4 mx-auto text-primary mb-1" />
              <p className="text-xl font-bold">{metrics.tauxConversion}%</p>
              <p className="text-xs text-muted-foreground">Taux conv.</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Par source */}
        <div>
          <h4 className="font-medium mb-3 text-sm">Par source (cette semaine)</h4>
          {bySource.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun lead cette semaine</p>
          ) : (
            <div className="space-y-2">
              {bySource.map(({ source, label, count }) => (
                <div key={source} className="flex items-center gap-3">
                  <span className="text-sm w-28 truncate">{label}</span>
                  <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${(count / maxSourceCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Par courtier */}
        <div>
          <h4 className="font-medium mb-3 text-sm">Par courtier</h4>
          {byCourtier.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun lead assigné cette semaine</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium">Courtier</th>
                    <th className="text-center py-2 font-medium">Assignés</th>
                    <th className="text-center py-2 font-medium">Convertis</th>
                    <th className="text-center py-2 font-medium">Rappels retard</th>
                  </tr>
                </thead>
                <tbody>
                  {byCourtier.map(({ userId, name, assignes, convertis, rappelsRetard }) => (
                    <tr key={userId} className="border-b border-border/50">
                      <td className="py-2">{name}</td>
                      <td className="text-center py-2">{assignes}</td>
                      <td className="text-center py-2 text-green-600">{convertis}</td>
                      <td className="text-center py-2">
                        <span className={cn(
                          rappelsRetard > 0 && "text-amber-600 font-medium"
                        )}>
                          {rappelsRetard}
                          {rappelsRetard > 0 && (
                            <AlertTriangle className="h-3 w-3 inline ml-1" />
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
