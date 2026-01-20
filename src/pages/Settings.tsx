import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/gary/BottomNav";
import { ThemeToggle } from "@/components/gary/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  RefreshCw,
  BarChart3,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTheme } from "next-themes";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; telephone: string | null }>({
    full_name: null,
    avatar_url: null,
    telephone: null,
  });
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // État pour édition du profil
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editTelephone, setEditTelephone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // État pour changement de mot de passe
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, telephone")
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

  const handleEditProfile = () => {
    setEditFullName(profile.full_name || "");
    setEditTelephone(profile.telephone || "");
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user || !editFullName.trim()) return;
    
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: editFullName.trim(),
          telephone: editTelephone.trim() || null
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setProfile(prev => ({ 
        ...prev, 
        full_name: editFullName.trim(),
        telephone: editTelephone.trim() || null
      }));
      setShowEditProfile(false);
      toast.success("Profil mis à jour");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setSavingPassword(true);
    try {
      // First verify the current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Mot de passe actuel incorrect");
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Mot de passe modifié avec succès");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    } finally {
      setSavingPassword(false);
    }
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
              <Button variant="ghost" size="sm" className="shrink-0" onClick={handleEditProfile}>
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
            <CardContent className="space-y-1">
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
              <Separator className="my-2" />
              <button 
                className="flex items-center justify-between w-full py-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg px-2 -mx-2 transition-colors"
                onClick={() => navigate("/admin/analytics")}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-amber-600" />
                  <div className="text-left">
                    <p className="font-medium">Analytics & KPIs</p>
                    <p className="text-sm text-muted-foreground">Statistiques et performance</p>
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
            <button 
              className="flex items-center justify-between w-full py-2 hover:bg-muted rounded-lg px-2 -mx-2 transition-colors"
              onClick={() => setShowChangePassword(true)}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <span>Changer le mot de passe</span>
              </div>
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

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Modifier mon profil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullname">Nom complet</Label>
              <Input
                id="edit-fullname"
                placeholder="Votre nom"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telephone">Téléphone professionnel</Label>
              <Input
                id="edit-telephone"
                type="tel"
                placeholder="+41 22 557 07 00"
                value={editTelephone}
                onChange={(e) => setEditTelephone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ce numéro sera affiché dans vos présentations et PDFs
              </p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditProfile(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile || !editFullName.trim()}>
              {savingProfile ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePassword} onOpenChange={(open) => {
        setShowChangePassword(open);
        if (!open) {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setShowCurrentPassword(false);
          setShowNewPassword(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Changer le mot de passe
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Minimum 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePassword(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleChangePassword} 
              disabled={savingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
            >
              {savingPassword ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
