import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/gary/BottomNav";
import { ThemeToggle } from "@/components/gary/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield,
  Users,
  UserPlus,
  ArrowLeft,
  Search,
  Edit2,
  Trash2,
  Crown,
  Briefcase,
  Building2,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Wallet,
  MoreVertical,
  UserX,
  UserCheck,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
  email?: string;
  is_disabled?: boolean;
}

const ROLE_LABELS: Record<AppRole, { label: string; icon: typeof Crown; color: string }> = {
  admin: { label: "Administrateur", icon: Crown, color: "bg-amber-500" },
  back_office: { label: "Back Office", icon: Building2, color: "bg-blue-500" },
  courtier: { label: "Courtier", icon: Briefcase, color: "bg-emerald-500" },
  marketing: { label: "Marketing", icon: Briefcase, color: "bg-purple-500" },
  etudiant: { label: "Étudiant", icon: Briefcase, color: "bg-cyan-500" },
  responsable_prospection: { label: "Resp. Prospection", icon: Building2, color: "bg-rose-500" },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("courtier");
  const [savingRole, setSavingRole] = useState(false);
  
  // État pour l'invitation
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("courtier");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviting, setInviting] = useState(false);

  // État pour les actions admin
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<UserWithRole | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<UserWithRole | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Accès refusé - Droits administrateur requis");
      navigate("/settings");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        roles: allRoles
          ?.filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: UserWithRole) => {
    setEditingUser(user);
    setSelectedRole(user.roles[0] || "courtier");
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setSavingRole(true);

    try {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingUser.user_id);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: editingUser.user_id,
          role: selectedRole,
        });

      if (insertError) throw insertError;

      toast.success(`Rôle mis à jour: ${ROLE_LABELS[selectedRole].label}`);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Erreur lors de la mise à jour du rôle");
    } finally {
      setSavingRole(false);
    }
  };

  const callAdminApi = async (action: string, targetUserId: string, newPassword?: string) => {
    if (!session?.access_token) {
      throw new Error("Session invalide");
    }

    const response = await supabase.functions.invoke("admin-users", {
      body: { action, target_user_id: targetUserId, new_password: newPassword },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  };

  const handleDisableUser = async (targetUser: UserWithRole) => {
    if (targetUser.user_id === user?.id) {
      toast.error("Vous ne pouvez pas désactiver votre propre compte");
      return;
    }

    setActionLoading(targetUser.user_id);
    try {
      await callAdminApi("disable", targetUser.user_id);
      toast.success(`${targetUser.full_name || "Utilisateur"} désactivé`);
      loadUsers();
    } catch (error: any) {
      console.error("Error disabling user:", error);
      toast.error(error.message || "Erreur lors de la désactivation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnableUser = async (targetUser: UserWithRole) => {
    setActionLoading(targetUser.user_id);
    try {
      await callAdminApi("enable", targetUser.user_id);
      toast.success(`${targetUser.full_name || "Utilisateur"} réactivé`);
      loadUsers();
    } catch (error: any) {
      console.error("Error enabling user:", error);
      toast.error(error.message || "Erreur lors de la réactivation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!showDeleteConfirm) return;

    setActionLoading(showDeleteConfirm.user_id);
    try {
      await callAdminApi("delete", showDeleteConfirm.user_id);
      toast.success(`${showDeleteConfirm.full_name || "Utilisateur"} supprimé définitivement`);
      setShowDeleteConfirm(null);
      loadUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const errorMsg = error.message || "Erreur lors de la suppression";
      toast.error(errorMsg.includes("non-2xx") 
        ? "Erreur serveur lors de la suppression. Vérifiez les logs." 
        : errorMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!showResetPassword || !newPassword) return;

    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setActionLoading(showResetPassword.user_id);
    try {
      await callAdminApi("reset_password", showResetPassword.user_id, newPassword);
      toast.success(`Mot de passe réinitialisé pour ${showResetPassword.full_name || "l'utilisateur"}`);
      setShowResetPassword(null);
      setNewPassword("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Erreur lors de la réinitialisation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteFullName || !invitePassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    
    if (invitePassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setInviting(true);
    try {
      if (!session?.access_token) {
        throw new Error("Session admin non trouvée");
      }

      // Use Edge Function to create user (doesn't switch session)
      const response = await supabase.functions.invoke("admin-users", {
        body: { 
          action: "create", 
          email: inviteEmail,
          new_password: invitePassword,
          full_name: inviteFullName,
          role: inviteRole,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`Utilisateur ${inviteFullName} créé avec succès`);
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteFullName("");
      setInvitePassword("");
      setInviteRole("courtier");
      loadUsers();
    } catch (error: any) {
      console.error("Error inviting user:", error);
      toast.error(error.message || "Erreur lors de l'invitation");
    } finally {
      setInviting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(searchLower) ||
      u.user_id.toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-CH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 pb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:bg-white/10 h-8 w-8"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-400" />
          <h1 className="text-lg font-semibold text-white">Administration</h1>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Users className="h-4 w-4 mx-auto mb-0.5 text-slate-500" />
              <p className="text-xl font-semibold">{users.length}</p>
              <p className="text-[10px] text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Crown className="h-4 w-4 mx-auto mb-0.5 text-amber-500" />
              <p className="text-xl font-semibold">
                {users.filter((u) => u.roles.includes("admin")).length}
              </p>
              <p className="text-[10px] text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Briefcase className="h-4 w-4 mx-auto mb-0.5 text-emerald-500" />
              <p className="text-xl font-semibold">
                {users.filter((u) => u.roles.includes("courtier")).length}
              </p>
              <p className="text-[10px] text-muted-foreground">Courtiers</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => setShowInviteDialog(true)}
            className="w-full"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/commissions')}
            className="w-full"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Commissions
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/analytics')}
            className="w-full"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/comparables')}
            className="w-full"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Comparables
          </Button>
        </div>

        {/* Users Management */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Gestion des utilisateurs
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={loadUsers} className="h-7 w-7 p-0">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="hidden sm:table-cell">Créé le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(u.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {u.full_name || "Sans nom"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {u.user_id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.roles.length === 0 ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              Aucun rôle
                            </Badge>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((role) => {
                                const roleInfo = ROLE_LABELS[role];
                                return (
                                  <Badge
                                    key={role}
                                    className={`${roleInfo.color} text-white text-xs`}
                                  >
                                    {roleInfo.label}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={actionLoading === u.user_id}
                              >
                                {actionLoading === u.user_id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRole(u)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Modifier le rôle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setShowResetPassword(u)}>
                                <KeyRound className="h-4 w-4 mr-2" />
                                Réinitialiser mot de passe
                              </DropdownMenuItem>
                              {u.user_id !== user?.id && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleDisableUser(u)}>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Désactiver
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEnableUser(u)}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Réactiver
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => setShowDeleteConfirm(u)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer définitivement
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles Legend */}
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="py-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Légende</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ROLE_LABELS).map(([role, info]) => {
                const Icon = info.icon;
                return (
                  <div key={role} className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs py-0 h-5 border-muted-foreground/30">
                      <Icon className="h-2.5 w-2.5 mr-1" />
                      {info.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={editingUser.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(editingUser.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingUser.full_name || "Sans nom"}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {editingUser.user_id.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rôle attribué</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as AppRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([role, info]) => {
                      const Icon = info.icon;
                      return (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {info.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole} disabled={savingRole}>
              {savingRole ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Inviter un utilisateur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-fullname">Nom complet</Label>
              <Input
                id="invite-fullname"
                placeholder="Jean Dupont"
                value={inviteFullName}
                onChange={(e) => setInviteFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="jean.dupont@gary.ch"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-password">Mot de passe temporaire</Label>
              <Input
                id="invite-password"
                type="text"
                placeholder="Minimum 6 caractères"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                L'utilisateur pourra le modifier dans ses paramètres
              </p>
            </div>
            <div className="space-y-2">
              <Label>Rôle attribué</Label>
              <Select
                value={inviteRole}
                onValueChange={(val) => setInviteRole(val as AppRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([role, info]) => {
                    const Icon = info.icon;
                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {info.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleInviteUser} disabled={inviting}>
              {inviting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Supprimer définitivement
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'utilisateur et toutes ses données seront supprimés.
            </DialogDescription>
          </DialogHeader>
          {showDeleteConfirm && (
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <Avatar>
                <AvatarImage src={showDeleteConfirm.avatar_url || undefined} />
                <AvatarFallback>{getInitials(showDeleteConfirm.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{showDeleteConfirm.full_name || "Sans nom"}</p>
                <p className="text-xs text-muted-foreground">
                  Sera supprimé définitivement
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={actionLoading === showDeleteConfirm?.user_id}
            >
              {actionLoading === showDeleteConfirm?.user_id ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showResetPassword} onOpenChange={() => {
        setShowResetPassword(null);
        setNewPassword("");
        setShowNewPassword(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Réinitialiser le mot de passe
            </DialogTitle>
          </DialogHeader>
          {showResetPassword && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={showResetPassword.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(showResetPassword.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{showResetPassword.full_name || "Sans nom"}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {showResetPassword.user_id.slice(0, 8)}...
                  </p>
                </div>
              </div>

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
                <p className="text-xs text-muted-foreground">
                  Communiquez ce mot de passe à l'utilisateur de manière sécurisée
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowResetPassword(null);
              setNewPassword("");
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={actionLoading === showResetPassword?.user_id || newPassword.length < 6}
            >
              {actionLoading === showResetPassword?.user_id ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="h-4 w-4 mr-2" />
              )}
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
