import { User, Mail, Phone, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentEtudiant } from '@/hooks/useCurrentEtudiant';
import { EtudiantNav } from '@/components/etudiant/EtudiantNav';

export default function EtudiantProfil() {
  const { data: etudiant, isLoading } = useCurrentEtudiant();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 p-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-40" />
          </CardContent>
        </Card>
        <EtudiantNav />
      </div>
    );
  }

  if (!etudiant) {
    return (
      <div className="min-h-screen bg-background pb-20 p-4">
        <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Profil non trouvé
          </CardContent>
        </Card>
        <EtudiantNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold">Mon profil</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {etudiant.prenom} {etudiant.nom || ''}
                </p>
                <p className="text-sm text-muted-foreground">Étudiant</p>
              </div>
            </div>

            {etudiant.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{etudiant.email}</span>
              </div>
            )}

            {etudiant.tel && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{etudiant.tel}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>Salaire horaire : {etudiant.salaire_horaire} CHF/h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <EtudiantNav />
    </div>
  );
}
