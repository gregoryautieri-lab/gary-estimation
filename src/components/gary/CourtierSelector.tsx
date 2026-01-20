// ============================================
// Sélecteur de Courtier GARY
// Charge les utilisateurs réels depuis la base
// ============================================

import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Phone, MapPin } from 'lucide-react';

// Adresse et téléphone GARY
const GARY_ADRESSE = "1 Carrefour de Rive, 1207 Genève";
const GARY_TEL = "+41 22 557 07 00";

interface CourtierProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  initiales: string;
  avatar_url?: string;
}

interface CourtierSelectorProps {
  value: string;
  onChange: (courtierId: string) => void;
  disabled?: boolean;
}

// Générer les initiales à partir du nom complet
function getInitiales(fullName: string | null): string {
  if (!fullName) return '??';
  const parts = fullName.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CourtierSelector({ value, onChange, disabled }: CourtierSelectorProps) {
  const [courtiers, setCourtiers] = useState<CourtierProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourtiers() {
      try {
        // Récupérer tous les profils avec leurs rôles
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            full_name,
            avatar_url
          `);

        if (error) {
          console.error('Error loading courtiers:', error);
          return;
        }

        // Récupérer les rôles pour filtrer uniquement courtiers et admins
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          console.error('Error loading roles:', rolesError);
          return;
        }

        // Créer un set des user_ids qui sont courtier ou admin
        const courtierOrAdminIds = new Set(
          roles
            ?.filter(r => r.role === 'courtier' || r.role === 'admin')
            .map(r => r.user_id) || []
        );

        // Récupérer les emails depuis auth (via les profils liés)
        const { data: authData } = await supabase.auth.getSession();
        
        // Transformer les profils en format CourtierProfile
        const courtiersList: CourtierProfile[] = (profiles || [])
          .filter(p => courtierOrAdminIds.has(p.user_id))
          .map(p => ({
            id: p.user_id,
            user_id: p.user_id,
            full_name: p.full_name || 'Sans nom',
            email: '', // On n'a pas accès aux emails des autres utilisateurs
            initiales: getInitiales(p.full_name),
            avatar_url: p.avatar_url || undefined
          }));

        setCourtiers(courtiersList);
      } catch (err) {
        console.error('Error in loadCourtiers:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourtiers();
  }, []);

  const selectedCourtier = courtiers.find(c => c.id === value);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Dropdown de sélection */}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sélectionnez votre nom..." />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-lg z-50">
          {courtiers.length === 0 ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              Aucun courtier disponible
            </div>
          ) : (
            courtiers.map(courtier => (
              <SelectItem key={courtier.id} value={courtier.id}>
                <div className="flex items-center gap-2">
                  {courtier.avatar_url ? (
                    <img 
                      src={courtier.avatar_url} 
                      alt={courtier.full_name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {courtier.initiales}
                    </span>
                  )}
                  <span>{courtier.full_name}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Carte de présentation du courtier sélectionné */}
      {selectedCourtier && (
        <div className="bg-gradient-to-br from-gary-dark to-gary-dark-light rounded-xl p-4 text-white">
          <div className="flex items-center gap-4">
            {/* Avatar avec initiales */}
            {selectedCourtier.avatar_url ? (
              <img 
                src={selectedCourtier.avatar_url} 
                alt={selectedCourtier.full_name}
                className="w-14 h-14 rounded-full object-cover shadow-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {selectedCourtier.initiales}
              </div>
            )}
            
            {/* Infos courtier */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-base truncate">
                {selectedCourtier.full_name}
              </h4>
              <div className="flex items-center gap-1.5 text-xs text-white/80 mt-0.5">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{GARY_TEL}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/60 mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{GARY_ADRESSE}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
