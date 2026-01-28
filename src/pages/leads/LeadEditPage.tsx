import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { LeadForm } from '@/components/leads/LeadForm';

export default function LeadEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select(`*, partner:partners(*)`)
        .eq('id', id!)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="container max-w-3xl py-8">
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

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/leads/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Modifier le lead</h1>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {lead.prenom} {lead.nom}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm 
            mode="edit" 
            initialData={lead}
            onSuccess={() => navigate(`/leads/${id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
