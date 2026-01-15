import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/gary/BottomNav";
import { GaryLogo } from "@/components/gary/GaryLogo";
import { ThemeToggle } from "@/components/gary/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  Settings2,
  Palette,
  Shield,
  LogOut,
  Bell,
  Smartphone,
  ChevronRight,
  Moon,
  Sun,
  Crown,
  Users,
  Edit2,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({
    full_name: null,
    avatar_url: null,
  });
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
    toast.success("Déconnexion réussie");
  };

  const getInitials = () => {
    if (profile.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "GC";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Design épuré */}
      <div className="bg-gradient-to-br from-primary/90 to-primary p-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-white/90 font-medium text-sm">GARY</span>
          </div>
          <ThemeToggle />
        </div>
        <h1 className="text-xl font-semibold text-white">Paramètres</h1>
      </div>

      {/* Profile Card - Plus compact */}
      <div className="px-4 -mt-3">
        <Card className="shadow-md border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base truncate">
                  {profile.full_name || "Courtier GARY"}
                </h2>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 space-y-4">
        {/* Apparence */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Apparence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Mode sombre</p>
                  <p className="text-sm text-muted-foreground">
                    Réduire la fatigue oculaire
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notifications push</p>
                <p className="text-sm text-muted-foreground">
                  Recevoir des alertes sur ce device
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* À propos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0 (MVP)</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Plateforme</span>
              <span className="font-medium">PWA</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Mode hors-ligne</span>
              <span className="font-medium text-success">Actif</span>
            </div>
          </CardContent>
        </Card>

        {/* Administration - visible seulement pour les admins */}
        {isAdmin && (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                Administration
                <Badge className="bg-amber-500 text-white text-xs ml-auto">Admin</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button 
                className="flex items-center justify-between w-full py-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => navigate("/admin")}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-amber-600" />
                  <div className="text-left">
                    <p className="font-medium">Gestion des utilisateurs</p>
                    <p className="text-sm text-muted-foreground">Rôles et permissions</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        )}

        {/* Sécurité */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <button className="flex items-center justify-between w-full py-2 hover:bg-muted rounded-lg px-2 -mx-2 transition-colors">
              <span>Changer le mot de passe</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Déconnexion */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>

        <p className="text-xs text-center text-muted-foreground pt-4">
          GARY Courtiers Immobiliers © 2025
          <br />
          Application de terrain - Tous droits réservés
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
