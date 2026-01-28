import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/leads';

type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'partner' | 'assigned_user'>;

/**
 * Envoie une notification email au courtier assigné via Resend
 * Non-bloquant : ne fait que logger les erreurs
 */
async function sendLeadNotificationEmail(lead: Lead): Promise<void> {
  if (!lead.assigned_to) {
    console.log('No courtier assigned, skipping email notification');
    return;
  }

  try {
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
        leadUrl: leadUrl,
        leadTelephone: lead.telephone,
        leadEmail: lead.email,
        leadAdresse: lead.bien_adresse,
        leadNpa: lead.bien_npa,
        leadLocalite: lead.bien_localite,
        leadCreatedAt: lead.created_at
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

/**
 * Envoie une notification Telegram pour chaque nouveau lead
 * Non-bloquant : ne fait que logger les erreurs
 */
async function sendTelegramNotification(lead: Lead, courtierNom?: string): Promise<void> {
  try {
    const leadUrl = `${window.location.origin}/leads/${lead.id}`;

    const { error } = await supabase.functions.invoke('send-telegram-notification', {
      body: {
        leadNom: lead.nom,
        leadPrenom: lead.prenom,
        leadTelephone: lead.telephone,
        leadEmail: lead.email,
        leadSource: lead.source,
        leadType: lead.type_demande,
        leadAdresse: lead.bien_adresse,
        leadNpa: lead.bien_npa,
        leadLocalite: lead.bien_localite,
        courtierNom: courtierNom,
        leadUrl: leadUrl
      }
    });

    if (error) {
      console.error('Error sending Telegram notification:', error);
    } else {
      console.log('Telegram notification sent successfully');
    }
  } catch (err) {
    console.error('Unexpected error sending Telegram notification:', err);
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
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['new-leads-count'] });
      
      const lead = data as Lead;
      
      // Récupérer le nom du courtier pour Telegram (si assigné)
      let courtierNom: string | undefined;
      if (lead.assigned_to) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', lead.assigned_to)
          .maybeSingle();
        courtierNom = profile?.full_name || undefined;
      }
      
      // Envoyer les notifications (non-bloquant)
      sendLeadNotificationEmail(lead);
      sendTelegramNotification(lead, courtierNom);
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
