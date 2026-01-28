import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/leads';

type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'partner' | 'assigned_user'>;

/**
 * Envoie une notification email au courtier assigné via Resend
 * Non-bloquant : ne fait que logger les erreurs
 */
async function sendLeadNotificationEmail(lead: Lead): Promise<void> {
  // Vérifier si un courtier est assigné
  if (!lead.assigned_to) {
    console.log('No courtier assigned, skipping email notification');
    return;
  }

  try {
    // Récupérer le profil du courtier assigné
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', lead.assigned_to)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Could not fetch courtier profile:', profileError);
      return;
    }

    if (!profile.email) {
      console.log('Courtier has no email configured, skipping notification');
      return;
    }

    const leadUrl = `${window.location.origin}/leads/${lead.id}`;

    const { error } = await supabase.functions.invoke('send-lead-notification', {
      body: {
        courtierEmail: profile.email,
        courtierNom: profile.full_name || 'Courtier',
        leadNom: lead.nom,
        leadPrenom: lead.prenom,
        leadSource: lead.source,
        leadType: lead.type_demande,
        leadNotes: lead.notes,
        leadUrl: leadUrl
      }
    });

    if (error) {
      console.error('Error sending lead notification email:', error);
    } else {
      console.log('Lead notification email sent successfully to', profile.email);
    }
  } catch (err) {
    console.error('Unexpected error sending lead notification:', err);
  }
}

export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: LeadInsert) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['new-leads-count'] });
      
      // Envoyer la notification email (non-bloquant)
      sendLeadNotificationEmail(data as Lead);
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['new-leads-count'] });
    },
  });
};
