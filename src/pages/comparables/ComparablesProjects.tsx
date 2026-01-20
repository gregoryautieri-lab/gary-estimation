import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProjectsComparables, ProjectComparable } from '@/hooks/useProjectsComparables';
import { GaryLogo } from '@/components/gary/GaryLogo';
import { BottomNav } from '@/components/gary/BottomNav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Plus, MapPin, FolderOpen } from 'lucide-react';
import { ProjectCard } from '@/components/comparables/ProjectCard';
import { ProjectFilters, ArchivedFilter, SortOption } from '@/components/comparables/ProjectFilters';
import { ProjectEditModal } from '@/components/comparables/ProjectEditModal';
import { ProjectDeleteDialog } from '@/components/comparables/ProjectDeleteDialog';

export default function ComparablesProjects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const {
    loading,
    fetchProjects,
    fetchDistinctCommunes,
    fetchDistinctCourtiers,
    createProject,
    updateProjectName,
    toggleArchived,
    deleteProject,
    duplicateProject,
  } = useProjectsComparables();

  // State
  const [projects, setProjects] = useState<ProjectComparable[]>([]);
  const [communes, setCommunes] = useState<string[]>([]);
  const [courtiers, setCourtiers] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Filters from URL params
  const search = searchParams.get('q') || '';
  const communeFilter = searchParams.get('commune') || 'all';
  const courtierFilter = searchParams.get('courtier') || 'all';
  const archivedFilter = (searchParams.get('status') || 'active') as ArchivedFilter;
  const sortBy = (searchParams.get('sort') || 'recent') as SortOption;

  // Edit/Delete modals
  const [editingProject, setEditingProject] = useState<ProjectComparable | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectComparable | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setInitialLoading(true);
      try {
        const [projectsData, communesData, courtiersData] = await Promise.all([
          fetchProjects({ archived: null }), // Fetch all, filter client-side for search
          fetchDistinctCommunes(),
          fetchDistinctCourtiers(),
        ]);
        setProjects(projectsData);
        setCommunes(communesData);
        setCourtiers(courtiersData);
      } catch (err) {
        console.error('Error loading projects data:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadData();
  }, [user, fetchProjects, fetchDistinctCommunes, fetchDistinctCourtiers]);

  // Filtered and sorted projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(p =>
        p.projectName.toLowerCase().includes(searchLower) ||
        p.communes?.some(c => c.toLowerCase().includes(searchLower))
      );
    }

    // Filter by courtier
    if (courtierFilter && courtierFilter !== 'all') {
      result = result.filter(p => p.courtierName === courtierFilter);
    }

    // Filter by commune
    if (communeFilter && communeFilter !== 'all') {
      result = result.filter(p => p.communes?.includes(communeFilter));
    }

    // Filter by archived status
    if (archivedFilter === 'active') {
      result = result.filter(p => !p.archived);
    } else if (archivedFilter === 'archived') {
      result = result.filter(p => p.archived);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'nb_comparables':
          return b.nbComparables - a.nbComparables;
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return result;
  }, [projects, search, courtierFilter, communeFilter, archivedFilter, sortBy]);

  // Update URL params
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== 'active' && value !== 'recent' && value !== '') {
      newParams.set(key, value);
    } else if (key === 'status' && value !== 'active') {
      newParams.set(key, value);
    } else if (key === 'sort' && value !== 'recent') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Handlers
  const handleNewProject = () => {
    navigate('/comparables/nouveau');
  };

  const handleOpenProject = (project: ProjectComparable) => {
    // TODO: Navigate to project detail (PROMPT 4)
    navigate(`/comparables/${project.id}`);
  };

  const handleEditName = async (newName: string): Promise<boolean> => {
    if (!editingProject) return false;
    const success = await updateProjectName(editingProject.id, newName);
    if (success) {
      setProjects(prev =>
        prev.map(p => p.id === editingProject.id ? { ...p, projectName: newName } : p)
      );
    }
    return success;
  };

  const handleArchive = async (project: ProjectComparable) => {
    const success = await toggleArchived(project.id, project.archived);
    if (success) {
      setProjects(prev =>
        prev.map(p => p.id === project.id ? { ...p, archived: !project.archived } : p)
      );
    }
  };

  const handleDuplicate = async (project: ProjectComparable) => {
    const duplicated = await duplicateProject(project.id);
    if (duplicated) {
      setProjects(prev => [duplicated, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    const success = await deleteProject(deletingProject.id);
    if (success) {
      setProjects(prev => prev.filter(p => p.id !== deletingProject.id));
    }
    setDeletingProject(null);
  };

  // Empty states
  const hasNoProjects = !initialLoading && projects.length === 0;
  const hasNoResults = !initialLoading && projects.length > 0 && filteredProjects.length === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <div className="flex items-center gap-2">
          <GaryLogo className="h-6 text-primary" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          aria-label="Se déconnecter"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-24">
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Title & New button */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                Projets Comparables
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organisez vos recherches de biens similaires
              </p>
            </div>
            <Button onClick={handleNewProject} size="sm" className="shrink-0">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nouveau
            </Button>
          </div>

          {/* Filters */}
          {!hasNoProjects && (
            <ProjectFilters
              search={search}
              onSearchChange={(v) => updateFilter('q', v)}
              communeFilter={communeFilter}
              onCommuneChange={(v) => updateFilter('commune', v)}
              availableCommunes={communes}
              courtierFilter={courtierFilter}
              onCourtierChange={(v) => updateFilter('courtier', v)}
              availableCourtiers={courtiers}
              archivedFilter={archivedFilter}
              onArchivedChange={(v) => updateFilter('status', v)}
              sortBy={sortBy}
              onSortChange={(v) => updateFilter('sort', v)}
              resultCount={filteredProjects.length}
            />
          )}

          {/* Loading state */}
          {initialLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          )}

          {/* Empty state: no projects - Enhanced */}
          {hasNoProjects && (
            <div className="text-center py-12 px-4 bg-muted/20 rounded-xl border border-dashed">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-base font-medium text-foreground mb-2">
                Aucun projet de comparables
              </h2>
              <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto leading-relaxed">
                Créez votre premier projet pour organiser vos recherches de biens similaires.
              </p>
              <Button onClick={handleNewProject} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Créer mon premier projet
              </Button>
            </div>
          )}

          {/* Empty state: no filtered results */}
          {hasNoResults && (
            <div className="text-center py-10">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-sm font-medium text-foreground mb-1">
                Aucun projet ne correspond aux filtres
              </h2>
              <p className="text-xs text-muted-foreground">
                Modifiez vos critères de recherche.
              </p>
            </div>
          )}

          {/* Projects grid */}
          {!initialLoading && filteredProjects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => handleOpenProject(project)}
                  onEdit={() => setEditingProject(project)}
                  onArchive={() => handleArchive(project)}
                  onDuplicate={() => handleDuplicate(project)}
                  onDelete={() => setDeletingProject(project)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom nav */}
      <BottomNav />

      {/* Edit modal */}
      <ProjectEditModal
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        currentName={editingProject?.projectName || ''}
        onSave={handleEditName}
      />

      {/* Delete dialog */}
      <ProjectDeleteDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        projectName={deletingProject?.projectName || ''}
        nbComparables={deletingProject?.nbComparables || 0}
        onConfirm={handleDelete}
      />
    </div>
  );
}
