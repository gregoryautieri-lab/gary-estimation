import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/gary/BottomNav";
import { GaryLogo } from "@/components/gary/GaryLogo";
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
} from "@/components/ui/dialog";
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
}

const ROLE_LABELS: Record<AppRole, { label: string; icon: typeof Crown; color: string }> = {
  admin: { label: "Administrateur", icon: Crown, color: "bg-amber-500" },
  back_office: { label: "Back Office", icon: Building2, color: "bg-blue-500" },
  courtier: { label: "Courtier", icon: Briefcase, color: "bg-emerald-500" },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("courtier");
  const [savingRole, setSavingRole] = useState(false);

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
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: allRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Map roles to users
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
      // Delete existing roles for this user
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingUser.user_id);

      if (deleteError) throw deleteError;

      // Insert new role
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

  const handleRemoveRole = async (userToRemove: UserWithRole) => {
    if (userToRemove.user_id === user?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre rôle");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userToRemove.user_id);

      if (error) throw error;

      toast.success("Rôle supprimé");
      loadUsers();
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Erreur lors de la suppression du rôle");
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
      <div className="bg-primary text-primary-foreground p-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-white/10"
              onClick={() => navigate("/settings")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <GaryLogo />
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Administration</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold">
                {users.filter((u) => u.roles.includes("admin")).length}
              </p>
              <p className="text-xs text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Briefcase className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-2xl font-bold">
                {users.filter((u) => u.roles.includes("courtier")).length}
              </p>
              <p className="text-xs text-muted-foreground">Courtiers</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Gestion des utilisateurs
              </CardTitle>
              <Button size="sm" variant="outline" onClick={loadUsers}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
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
                      <TableHead>Créé le</TableHead>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(u.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditRole(u)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {u.user_id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveRole(u)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Légende des rôles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(ROLE_LABELS).map(([role, info]) => {
              const Icon = info.icon;
              return (
                <div key={role} className="flex items-center gap-3">
                  <Badge className={`${info.color} text-white`}>
                    <Icon className="h-3 w-3 mr-1" />
                    {info.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {role === "admin" && "Accès complet à toutes les estimations et paramètres"}
                    {role === "back_office" && "Consultation de toutes les estimations"}
                    {role === "courtier" && "Gestion de ses propres estimations"}
                  </span>
                </div>
              );
            })}
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

      <BottomNav />
    </div>
  );
}
