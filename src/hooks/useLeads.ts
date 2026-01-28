import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/leads';
import { startOfWeek, startOfMonth, isToday, isBefore, startOfDay } from 'date-fns';

export interface LeadsFilters {
  statut?: string;
  courtier?: string;
  periode?: 'semaine' | 'mois' | 'tout';
  search?: string;
}

export interface LeadsStats {
  total: number;
  nouveaux: number;
  enCours: number;
  rappelsAujourdhui: number;
}

export function useLeads(filters: LeadsFilters = {}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          partner:partners(*)
        `)
        .order('created_at', { ascending: false });

      // Filtre statut
      if (filters.statut && filters.statut !== 'tous') {
        query = query.eq('statut', filters.statut);
      }

      // Filtre courtier assigné
      if (filters.courtier && filters.courtier !== 'tous') {
        query = query.eq('assigned_to', filters.courtier);
      }

      // Filtre période
      if (filters.periode && filters.periode !== 'tout') {
        const now = new Date();
        let dateFrom: Date;
        
        if (filters.periode === 'semaine') {
          dateFrom = startOfWeek(now, { weekStartsOn: 1 });
        } else if (filters.periode === 'mois') {
          dateFrom = startOfMonth(now);
        } else {
          dateFrom = new Date(0);
        }
        
        query = query.gte('created_at', dateFrom.toISOString());
      }

      // Filtre recherche texte
      if (filters.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(`nom.ilike.${searchTerm},prenom.ilike.${searchTerm},email.ilike.${searchTerm},telephone.ilike.${searchTerm}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch assigned user profiles separately
      const leads = data || [];
      const assignedToIds = [...new Set(leads.map(l => l.assigned_to).filter(Boolean))];
      
      let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
      
      if (assignedToIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', assignedToIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = { full_name: p.full_name, email: p.email };
          return acc;
        }, {} as Record<string, { full_name: string | null; email: string | null }>);
      }
      
      return leads.map(lead => ({
        ...lead,
        assigned_user: lead.assigned_to ? profilesMap[lead.assigned_to] : undefined,
      })) as Lead[];
    },
  });
}

export function useLeadsStats() {
  return useQuery({
    queryKey: ['leads-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('statut, rappel_date');

      if (error) throw error;

      const leads = data || [];
      const today = startOfDay(new Date());

      const stats: LeadsStats = {
        total: leads.length,
        nouveaux: leads.filter(l => l.statut === 'nouveau').length,
        enCours: leads.filter(l => l.statut === 'en_cours').length,
        rappelsAujourdhui: leads.filter(l => {
          if (!l.rappel_date) return false;
          const rappelDate = startOfDay(new Date(l.rappel_date));
          return isToday(rappelDate) || isBefore(rappelDate, today);
        }).length,
      };

      return stats;
    },
  });
}

export function useCourtiers() {
  return useQuery({
    queryKey: ['courtiers-for-leads'],
    queryFn: async () => {
      // Récupérer les profils des utilisateurs avec rôle courtier ou admin
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['courtier', 'admin']);

      if (rolesError) throw rolesError;

      const userIds = [...new Set((roles || []).map(r => r.user_id))];
      
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      return (profiles || []).map(p => ({
        id: p.user_id,
        name: p.full_name || p.email || 'Inconnu',
      }));
    },
  });
}
