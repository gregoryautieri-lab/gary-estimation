import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEtudiants } from '@/hooks/useEtudiants';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Check, AlertCircle } from 'lucide-react';

// ============ TYPES ============

interface ImportableUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
  telephone: string | null;
  already_imported: boolean;
}

interface ImportEtudiantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: ImportableUser) => void;
}

// ============ COMPONENT ============

export function ImportEtudiantsModal({
  open,
  onOpenChange,
  onSelectUser,
}: ImportEtudiantsModalProps) {
  const { etudiants } = useEtudiants();

  // Récupérer les utilisateurs avec le rôle "etudiant"
  const { data: importableUsers = [], isLoading, error } = useQuery({
    queryKey: ['importable_etudiants_from_users', etudiants],
    queryFn: async (): Promise<ImportableUser[]> => {
      // 1. Récupérer tous les user_id avec le rôle 'etudiant'
      const { data: etudiantRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'etudiant');

      if (rolesError) throw rolesError;
      if (!etudiantRoles || etudiantRoles.length === 0) return [];

      const etudiantUserIds = etudiantRoles.map(r => r.user_id);

      // 2. Récupérer les profiles correspondants
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, telephone')
        .in('user_id', etudiantUserIds);

      if (profilesError) throw profilesError;

      // 3. Identifier lesquels sont déjà importés dans la table etudiants
      const importedUserIds = new Set(
        etudiants
          .filter(e => e.user_id)
          .map(e => e.user_id)
      );

      // 4. Construire la liste avec le statut d'import
      return (profiles || []).map(p => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        telephone: p.telephone,
        already_imported: importedUserIds.has(p.user_id),
      }));
    },
    enabled: open,
  });

  // Séparer les importables des déjà importés
  const availableToImport = importableUsers.filter(u => !u.already_imported);
  const alreadyImported = importableUsers.filter(u => u.already_imported);

  const handleSelect = (user: ImportableUser) => {
    onSelectUser(user);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Importer depuis Users
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un utilisateur avec le rôle "étudiant" pour pré-remplir le formulaire.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive p-4">
              <AlertCircle className="h-5 w-5" />
              <span>Erreur lors du chargement des utilisateurs</span>
            </div>
          ) : importableUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun utilisateur avec le rôle "étudiant" trouvé.</p>
              <p className="text-sm mt-2">
                Créez d'abord des utilisateurs avec le rôle étudiant dans l'administration.
              </p>
            </div>
          ) : (
            <>
              {/* Utilisateurs disponibles pour import */}
              {availableToImport.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Disponibles à l'import ({availableToImport.length})
                  </h3>
                  <div className="space-y-2">
                    {availableToImport.map(user => (
                      <button
                        key={user.user_id}
                        onClick={() => handleSelect(user)}
                        className="w-full p-3 border rounded-lg text-left hover:bg-accent hover:border-primary transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.full_name || 'Nom non renseigné'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email || 'Email non renseigné'}
                          </p>
                          {user.telephone && (
                            <p className="text-xs text-muted-foreground">
                              {user.telephone}
                            </p>
                          )}
                        </div>
                        <UserPlus className="h-4 w-4 text-primary shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Utilisateurs déjà importés */}
              {alreadyImported.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Déjà importés ({alreadyImported.length})
                  </h3>
                  <div className="space-y-2">
                    {alreadyImported.map(user => (
                      <div
                        key={user.user_id}
                        className="w-full p-3 border rounded-lg bg-muted/30 flex items-center justify-between gap-3 opacity-60"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {user.full_name || 'Nom non renseigné'}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.email || 'Email non renseigné'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 gap-1">
                          <Check className="h-3 w-3" />
                          Importé
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si tous déjà importés */}
              {availableToImport.length === 0 && alreadyImported.length > 0 && (
                <div className="text-center py-4 text-muted-foreground border-t">
                  <p className="text-sm">
                    Tous les utilisateurs "étudiant" ont déjà été importés.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
