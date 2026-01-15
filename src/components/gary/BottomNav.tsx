import { Home, Plus, FileText, Archive, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEstimationPersistence } from '@/hooks/useEstimationPersistence';
import { toast } from 'sonner';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
  onClick?: () => void;
  isPrimary?: boolean;
}

const NavItem = ({ icon, label, active, onClick, isPrimary }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 min-w-[56px] transition-all ${
      isPrimary 
        ? "text-primary-foreground bg-primary rounded-full -mt-5 shadow-lg w-14 h-14 flex items-center justify-center" 
        : active 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
    }`}
    aria-label={label}
  >
    {icon}
    {!isPrimary && <span className="text-[10px] font-medium">{label}</span>}
  </button>
);

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { createEstimation } = useEstimationPersistence();

  const handleNewEstimation = async () => {
    try {
      const created = await createEstimation({ statut: 'brouillon' });
      if (created?.id) {
        navigate(`/estimation/${created.id}/1`);
      }
    } catch (err) {
      toast.error('Erreur lors de la création');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <NavItem
          icon={<Home className="h-5 w-5" />}
          label="Accueil"
          path="/"
          active={isActive('/')}
          onClick={() => navigate('/')}
        />
        <NavItem
          icon={<FileText className="h-5 w-5" />}
          label="Estimations"
          path="/estimations"
          active={isActive('/estimations') || currentPath.includes('/estimation/')}
          onClick={() => navigate('/estimations')}
        />
        <NavItem
          icon={<Plus className="h-6 w-6" />}
          label="Nouveau"
          path="/new"
          isPrimary
          onClick={handleNewEstimation}
        />
        <NavItem
          icon={<Archive className="h-5 w-5" />}
          label="Archives"
          path="/archives"
          active={isActive('/archives')}
          onClick={() => {
            // Pour l'instant, redirige vers estimations avec filtre archive
            navigate('/estimations');
            toast.info('Utilisez le filtre "Archivés" dans la liste');
          }}
        />
        <NavItem
          icon={<User className="h-5 w-5" />}
          label="Profil"
          path="/profil"
          active={isActive('/profil')}
          onClick={() => {
            toast.info('Profil en cours de développement');
          }}
        />
      </div>
    </nav>
  );
};
