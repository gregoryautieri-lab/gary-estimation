import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Users, FolderKanban, CheckSquare, Clock, Settings, Loader2 } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();
  const { profile, roles, isLoading: isProfileLoading } = useProfile();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Utilisateur";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            aria-label="Se déconnecter"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-24">
        {isProfileLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bonjour, {displayName} 👋
              </h1>
              <p className="text-muted-foreground">
                {roles.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="capitalize">{roles.join(", ")}</span>
                    <span>•</span>
                  </span>
                )}{" "}
                Bienvenue sur GARY
              </p>
            </div>

            {/* Quick stats placeholder */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard value={0} label="Clients" />
              <StatCard value={0} label="Projets" />
              <StatCard value={0} label="Tâches" />
              <StatCard value={0} label="Heures" />
            </div>

            {/* Quick actions */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Actions rapides</h2>
              <div className="grid grid-cols-2 gap-3">
                <QuickActionCard
                  icon={<Users className="h-5 w-5" />}
                  label="Nouveau client"
                />
                <QuickActionCard
                  icon={<FolderKanban className="h-5 w-5" />}
                  label="Nouveau projet"
                />
                <QuickActionCard
                  icon={<CheckSquare className="h-5 w-5" />}
                  label="Nouvelle tâche"
                />
                <QuickActionCard
                  icon={<Clock className="h-5 w-5" />}
                  label="Pointer le temps"
                />
              </div>
            </div>
          </div>
        )}
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

interface StatCardProps {
  value: number;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="text-2xl font-bold text-primary">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
}

const QuickActionCard = ({ icon, label }: QuickActionCardProps) => (
  <button className="flex items-center gap-3 bg-card border border-border rounded-lg p-4 hover:bg-accent transition-colors text-left w-full">
    <div className="text-primary">{icon}</div>
    <span className="text-sm font-medium text-foreground">{label}</span>
  </button>
);

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
