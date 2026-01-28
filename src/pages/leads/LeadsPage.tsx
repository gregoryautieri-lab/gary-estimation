import { Inbox } from 'lucide-react';
import { BottomNav } from '@/components/gary/BottomNav';

export default function LeadsPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            Inbox Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos leads entrants
          </p>
        </div>
      </header>

      {/* Content placeholder */}
      <main className="p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium mb-2">Module en construction</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            La liste des leads et les fonctionnalités de gestion seront disponibles prochainement.
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
