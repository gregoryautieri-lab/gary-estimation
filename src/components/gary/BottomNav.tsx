import { Home, Plus, FileText, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors ${
      isPrimary 
        ? "text-primary-foreground bg-primary rounded-full -mt-4 shadow-lg" 
        : active 
          ? "text-primary" 
          : "text-muted-foreground"
    }`}
  >
    {icon}
    {!isPrimary && <span className="text-xs font-medium">{label}</span>}
  </button>
);

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Accueil', path: '/' },
    { icon: <FileText className="h-5 w-5" />, label: 'Estimations', path: '/estimations' },
    { icon: <Plus className="h-6 w-6" />, label: 'Nouveau', path: '/estimation/new', isPrimary: true },
    { icon: <FileText className="h-5 w-5" />, label: 'Archives', path: '/archives' },
    { icon: <User className="h-5 w-5" />, label: 'Profil', path: '/profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={currentPath === item.path}
            isPrimary={item.isPrimary}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </nav>
  );
};
