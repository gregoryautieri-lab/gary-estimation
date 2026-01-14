import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Users, FolderKanban, CheckSquare, Clock, Settings } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">G</span>
          </div>
          <span className="font-bold text-foreground">GARY</span>
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
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bonjour{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
            </h1>
            <p className="text-muted-foreground">
              Bienvenue sur GARY, votre outil de gestion.
            </p>
          </div>

          {/* Quick stats placeholder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Clients</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Projets</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Tâches</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">0</div>
              <div className="text-sm text-muted-foreground">Heures</div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile first */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe">
        <div className="flex items-center justify-around h-16">
          <NavItem icon={<Users className="h-5 w-5" />} label="Clients" active />
          <NavItem icon={<FolderKanban className="h-5 w-5" />} label="Projets" />
          <NavItem icon={<CheckSquare className="h-5 w-5" />} label="Tâches" />
          <NavItem icon={<Clock className="h-5 w-5" />} label="Temps" />
          <NavItem icon={<Settings className="h-5 w-5" />} label="Plus" />
        </div>
      </nav>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = ({ icon, label, active }: NavItemProps) => (
  <button
    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors ${
      active ? "text-primary" : "text-muted-foreground"
    }`}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

export default Index;
