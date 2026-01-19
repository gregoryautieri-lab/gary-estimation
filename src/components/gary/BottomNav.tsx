import { Home, FileText, Map, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[64px] transition-all ${
      active 
        ? "text-primary" 
        : "text-muted-foreground hover:text-foreground"
    }`}
    aria-label={label}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

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
          icon={<Map className="h-5 w-5" />}
          label="Comparables"
          path="/comparables"
          active={isActive('/comparables')}
          onClick={() => navigate('/comparables')}
        />
        <NavItem
          icon={<User className="h-5 w-5" />}
          label="Profil"
          path="/settings"
          active={isActive('/settings') || isActive('/admin')}
          onClick={() => navigate('/settings')}
        />
      </div>
    </nav>
  );
};