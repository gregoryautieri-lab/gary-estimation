import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type ProjectStatutFilter = 'vendus' | 'en_vente' | 'tous';

export interface ProjectComparable {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  courtierName: string | null;
  projectName: string;
  archived: boolean;
  // Critères de recherche
  communes: string[] | null;
  prixMin: number | null;
  prixMax: number | null;
  typeBien: string[] | null;
  surfaceMin: number | null;
  surfaceMax: number | null;
  piecesMin: number | null;
  piecesMax: number | null;
  statutFilter: ProjectStatutFilter;
  // Statistiques
  nbComparables: number;
  lastSearchDate: string | null;
}

interface FetchOptions {
  communes?: string[] | null;
  archived?: boolean | null; // null = tous
  sortBy?: 'recent' | 'oldest' | 'nb_comparables';
}

// Conversion DB → App
function rowToProject(row: any): ProjectComparable {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id,
    courtierName: row.courtier_name,
    projectName: row.project_name,
    archived: row.archived || false,
    communes: row.communes,
    prixMin: row.prix_min,
    prixMax: row.prix_max,
    typeBien: row.type_bien,
    surfaceMin: row.surface_min,
    surfaceMax: row.surface_max,
    piecesMin: row.pieces_min,
    piecesMax: row.pieces_max,
    statutFilter: row.statut_filter || 'tous',
    nbComparables: row.nb_comparables || 0,
    lastSearchDate: row.last_search_date,
  };
}

// Conversion App → DB pour insert
function projectToInsert(data: Partial<ProjectComparable>, userId: string) {
  return {
    user_id: userId,
    courtier_name: data.courtierName ?? null,
    project_name: data.projectName || 'Nouveau projet',
    archived: data.archived ?? false,
    communes: data.communes ?? null,
    prix_min: data.prixMin ?? null,
    prix_max: data.prixMax ?? null,
    type_bien: data.typeBien ?? null,
    surface_min: data.surfaceMin ?? null,
    surface_max: data.surfaceMax ?? null,
    pieces_min: data.piecesMin ?? null,
    pieces_max: data.piecesMax ?? null,
    statut_filter: data.statutFilter ?? 'tous',
  };
}

export function useProjectsComparables() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all projects with optional filters
  const fetchProjects = useCallback(async (options: FetchOptions = {}): Promise<ProjectComparable[]> => {
    if (!user?.id) return [];
    
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('projects_comparables')
        .select('*')
        .eq('user_id', user.id);

      // Filtre communes (contains any of the specified communes)
      if (options.communes && options.communes.length > 0) {
        query = query.overlaps('communes', options.communes);
      }

      // Filtre archived
      if (options.archived === true) {
        query = query.eq('archived', true);
      } else if (options.archived === false) {
        query = query.eq('archived', false);
      }
      // null = tous

      // Tri
      if (options.sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (options.sortBy === 'nb_comparables') {
        query = query.order('nb_comparables', { ascending: false });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching projects:', fetchError);
        setError(fetchError.message);
        return [];
      }

      return (data || []).map(rowToProject);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch distinct communes for autocomplete (from existing projects)
  const fetchDistinctCommunes = useCallback(async (): Promise<string[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('projects_comparables')
        .select('communes')
        .eq('user_id', user.id)
        .not('communes', 'is', null);

      if (error) {
        console.error('Error fetching communes:', error);
        return [];
      }

      // Extraire et aplatir toutes les communes uniques
      const allCommunes = (data || []).flatMap(d => d.communes || []);
      const communes = [...new Set(allCommunes)].filter(Boolean) as string[];
      return communes.sort();
    } catch (err) {
      console.error('Error fetching communes:', err);
      return [];
    }
  }, [user?.id]);

  // Create a new project
  const createProject = useCallback(async (data: Partial<ProjectComparable>): Promise<ProjectComparable | null> => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return null;
    }

    setLoading(true);
    try {
      // Récupérer le nom du courtier depuis le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const insertData = {
        ...projectToInsert(data, user.id),
        courtier_name: data.courtierName || profile?.full_name || null,
      };

      const { data: created, error } = await supabase
        .from('projects_comparables')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast.error('Erreur lors de la création');
        return null;
      }

      toast.success('Projet créé');
      return rowToProject(created);
    } catch (err: any) {
      console.error('Error creating project:', err);
      toast.error('Erreur lors de la création');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update project name
  const updateProjectName = useCallback(async (projectId: string, newName: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('projects_comparables')
        .update({ 
          project_name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating project name:', error);
        toast.error('Erreur lors de la mise à jour');
        return false;
      }

      toast.success('Nom mis à jour');
      return true;
    } catch (err) {
      console.error('Error updating project name:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [user?.id]);

  // Toggle archived status
  const toggleArchived = useCallback(async (projectId: string, currentArchived: boolean): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('projects_comparables')
        .update({ 
          archived: !currentArchived,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling archive:', error);
        toast.error('Erreur lors de la mise à jour');
        return false;
      }

      toast.success(currentArchived ? 'Projet désarchivé' : 'Projet archivé');
      return true;
    } catch (err) {
      console.error('Error toggling archive:', err);
      toast.error('Erreur lors de la mise à jour');
      return false;
    }
  }, [user?.id]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('projects_comparables')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting project:', error);
        toast.error('Erreur lors de la suppression');
        return false;
      }

      toast.success('Projet supprimé');
      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error('Erreur lors de la suppression');
      return false;
    }
  }, [user?.id]);

  // Duplicate project
  const duplicateProject = useCallback(async (projectId: string): Promise<ProjectComparable | null> => {
    if (!user?.id) return null;

    try {
      // Fetch original project
      const { data: original, error: fetchError } = await supabase
        .from('projects_comparables')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !original) {
        console.error('Error fetching project to duplicate:', fetchError);
        toast.error('Projet introuvable');
        return null;
      }

      // Récupérer le nom du courtier depuis le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Create duplicate with new name
      const { data: duplicated, error: insertError } = await supabase
        .from('projects_comparables')
        .insert({
          user_id: user.id,
          courtier_name: profile?.full_name || original.courtier_name,
          project_name: `${original.project_name} (copie)`,
          archived: false,
          communes: original.communes,
          prix_min: original.prix_min,
          prix_max: original.prix_max,
          type_bien: original.type_bien,
          surface_min: original.surface_min,
          surface_max: original.surface_max,
          pieces_min: original.pieces_min,
          pieces_max: original.pieces_max,
          statut_filter: original.statut_filter,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error duplicating project:', insertError);
        toast.error('Erreur lors de la duplication');
        return null;
      }

      toast.success('Projet dupliqué');
      return rowToProject(duplicated);
    } catch (err) {
      console.error('Error duplicating project:', err);
      toast.error('Erreur lors de la duplication');
      return null;
    }
  }, [user?.id]);

  return {
    loading,
    error,
    fetchProjects,
    fetchDistinctCommunes,
    createProject,
    updateProjectName,
    toggleArchived,
    deleteProject,
    duplicateProject,
  };
}
