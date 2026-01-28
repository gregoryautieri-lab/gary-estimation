import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RappelLead {
  id: string;
  nom: string;
  prenom: string | null;
  rappel_date: string;
  assigned_to: string | null;
  assigned_user?: { full_name: string | null } | null;
}

function getRetardInfo(rappelDate: string): { text: string; isLate: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const rappel = new Date(rappelDate);
  rappel.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - rappel.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return { text: "Aujourd'hui", isLate: false };
  } else if (diffDays === 1) {
    return { text: "En retard de 1 jour", isLate: true };
  } else {
    return { text: `En retard de ${diffDays} jours`, isLate: true };
  }
}

export function LeadRappelsBanner() {
  const navigate = useNavigate();
  
  const { data: rappels = [] } = useQuery({
    queryKey: ['leads-rappels-banner'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, nom, prenom, rappel_date, assigned_to')
        .in('statut', ['nouveau', 'en_cours'])
        .not('rappel_date', 'is', null)
        .lte('rappel_date', today)
        .order('rappel_date', { ascending: true });
      
      if (error) throw error;
      
      // Fetch assigned user profiles
      const leads = data || [];
      const assignedToIds = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))];
      
      let profilesMap: Record<string, { full_name: string | null }> = {};
      
      if (assignedToIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', assignedToIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = { full_name: p.full_name };
          return acc;
        }, {} as Record<string, { full_name: string | null }>);
      }
      
      return leads.map(lead => ({
        ...lead,
        assigned_user: lead.assigned_to ? profilesMap[lead.assigned_to] : null,
      })) as RappelLead[];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Sort: most overdue first, then today
  const sortedRappels = [...rappels].sort((a, b) => {
    return new Date(a.rappel_date).getTime() - new Date(b.rappel_date).getTime();
  });

  if (sortedRappels.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-400 dark:border-amber-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
        <h3 className="font-semibold text-amber-800 dark:text-amber-300">
          RAPPELS À TRAITER
        </h3>
        <Badge variant="secondary" className="bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
          {sortedRappels.length}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {sortedRappels.map((rappel) => {
          const { text, isLate } = getRetardInfo(rappel.rappel_date);
          
          return (
            <div 
              key={rappel.id}
              className="flex items-center justify-between bg-white dark:bg-background rounded-md px-3 py-2 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-center gap-3">
                <span 
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    isLate ? "bg-red-500" : "bg-orange-500"
                  )}
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="font-medium text-foreground">
                    {rappel.prenom} {rappel.nom}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {rappel.assigned_user?.full_name 
                      ? `— Assigné à ${rappel.assigned_user.full_name}` 
                      : '— Non assigné'}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isLate ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"
                  )}>
                    — {text}
                  </span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/leads/${rappel.id}`)}
                className="flex-shrink-0"
              >
                <Eye className="h-4 w-4 mr-1" />
                Voir
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
