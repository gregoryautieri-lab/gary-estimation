import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSupportsProspection } from '@/hooks/useSupportsProspection';
import { useEtudiants } from '@/hooks/useEtudiants';

import { GaryLogo } from '@/components/gary/GaryLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SupportFormModal } from '@/components/admin/SupportFormModal';
import { EtudiantFormModal, type EtudiantInitialValues } from '@/components/admin/EtudiantFormModal';
import { ImportEtudiantsModal } from '@/components/admin/ImportEtudiantsModal';

import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  ToggleLeft, 
  ToggleRight,
  Package,
  Users,
  Download,
} from 'lucide-react';

import type { SupportProspection, Etudiant } from '@/types/prospection';

export default function AdminProspection() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();

  const { supports, isLoading: supportsLoading, update: updateSupport } = useSupportsProspection();
  const { etudiants, isLoading: etudiantsLoading, toggleActif } = useEtudiants();

  // Modals state
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState<SupportProspection | null>(null);
  const [etudiantModalOpen, setEtudiantModalOpen] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState<Etudiant | null>(null);
  const [etudiantInitialValues, setEtudiantInitialValues] = useState<EtudiantInitialValues | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Check permissions
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Lecture seule pour non-admins (les boutons d'action sont masqués via isAdmin)

  // Handlers
  const handleEditSupport = (support: SupportProspection) => {
    setSelectedSupport(support);
    setSupportModalOpen(true);
  };

  const handleNewSupport = () => {
    setSelectedSupport(null);
    setSupportModalOpen(true);
  };

  const handleToggleSupport = (support: SupportProspection) => {
    updateSupport({ 
      id: support.id, 
      nom: support.nom,
      tarif_unitaire: support.tarif_unitaire,
      description: support.description,
      actif: !support.actif,
      ordre: support.ordre,
    });
  };

  const handleEditEtudiant = (etudiant: Etudiant) => {
    setSelectedEtudiant(etudiant);
    setEtudiantInitialValues(null);
    setEtudiantModalOpen(true);
  };

  const handleNewEtudiant = () => {
    setSelectedEtudiant(null);
    setEtudiantInitialValues(null);
    setEtudiantModalOpen(true);
  };

  const handleImportEtudiant = (user: { user_id: string; full_name: string | null; email: string | null; telephone: string | null }) => {
    setSelectedEtudiant(null);
    setEtudiantInitialValues({
      prenom: user.full_name || '',
      email: user.email || '',
      tel: user.telephone || '',
      user_id: user.user_id,
    });
    setEtudiantModalOpen(true);
  };

  const handleToggleEtudiant = (etudiant: Etudiant) => {
    toggleActif({ id: etudiant.id, actif: !etudiant.actif });
  };

  // Sorted data
  const sortedSupports = [...supports].sort((a, b) => a.ordre - b.ordre);
  const sortedEtudiants = [...etudiants].sort((a, b) => {
    const nameA = `${a.prenom} ${a.nom || ''}`.toLowerCase();
    const nameB = `${b.prenom} ${b.nom || ''}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/campagnes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <GaryLogo className="h-6 text-primary" />
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Déconnexion
        </Button>
      </header>

      {/* Main */}
      <main className="p-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Administration Prospection</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez les supports de distribution et les étudiants
          </p>
        </div>

        <Tabs defaultValue="supports" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="supports" className="gap-2">
              <Package className="h-4 w-4" />
              Supports
            </TabsTrigger>
            <TabsTrigger value="etudiants" className="gap-2">
              <Users className="h-4 w-4" />
              Étudiants
            </TabsTrigger>
          </TabsList>

          {/* ONGLET SUPPORTS */}
          <TabsContent value="supports">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Supports de distribution</CardTitle>
                  <CardDescription>
                    Configurez les supports de distribution et leurs tarifs
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button onClick={handleNewSupport} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {supportsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sortedSupports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun support configuré
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead className="text-right">Tarif (CHF)</TableHead>
                        <TableHead className="hidden sm:table-cell">Description</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSupports.map((support) => (
                        <TableRow 
                          key={support.id}
                          className={!support.actif ? 'opacity-50' : ''}
                        >
                          <TableCell className="font-medium">{support.nom}</TableCell>
                          <TableCell className="text-right">
                            {support.tarif_unitaire.toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground max-w-[200px] truncate">
                            {support.description || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={support.actif ? 'default' : 'secondary'}>
                              {support.actif ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditSupport(support)}
                                  title="Modifier"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleSupport(support)}
                                  title={support.actif ? 'Désactiver' : 'Activer'}
                                >
                                  {support.actif ? (
                                    <ToggleRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ONGLET ÉTUDIANTS */}
          <TabsContent value="etudiants">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Étudiants</CardTitle>
                  <CardDescription>
                    Gérez les étudiants et leurs salaires
                  </CardDescription>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => setImportModalOpen(true)} 
                      size="sm" 
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Importer
                    </Button>
                    <Button onClick={handleNewEtudiant} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {etudiantsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sortedEtudiants.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun étudiant enregistré
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                        <TableHead className="text-right">Salaire (CHF/h)</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedEtudiants.map((etudiant) => (
                        <TableRow 
                          key={etudiant.id}
                          className={!etudiant.actif ? 'opacity-50' : ''}
                        >
                          <TableCell className="font-medium">
                            {etudiant.prenom} {etudiant.nom || ''}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {etudiant.email || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {etudiant.tel || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {etudiant.salaire_horaire.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={etudiant.actif ? 'default' : 'secondary'}>
                              {etudiant.actif ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditEtudiant(etudiant)}
                                  title="Modifier"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleEtudiant(etudiant)}
                                  title={etudiant.actif ? 'Désactiver' : 'Activer'}
                                >
                                  {etudiant.actif ? (
                                    <ToggleRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <SupportFormModal
        open={supportModalOpen}
        onOpenChange={setSupportModalOpen}
        support={selectedSupport}
      />
      <EtudiantFormModal
        open={etudiantModalOpen}
        onOpenChange={setEtudiantModalOpen}
        etudiant={selectedEtudiant}
        initialValues={etudiantInitialValues}
      />
      <ImportEtudiantsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSelectUser={handleImportEtudiant}
      />
    </div>
  );
}
