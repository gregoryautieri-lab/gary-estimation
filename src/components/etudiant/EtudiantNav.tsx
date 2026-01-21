import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function EtudiantNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex flex-col items-center gap-1 h-auto py-2 px-4',
            isActive('/etudiant/missions') && 'text-primary'
          )}
          onClick={() => navigate('/etudiant/missions')}
        >
          <ClipboardList className="h-5 w-5" />
          <span className="text-xs">Missions</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'flex flex-col items-center gap-1 h-auto py-2 px-4',
            isActive('/etudiant/profil') && 'text-primary'
          )}
          onClick={() => navigate('/etudiant/profil')}
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Profil</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs">Déconnexion</span>
        </Button>
      </div>
    </nav>
  );
}
