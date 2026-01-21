import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRoleState {
  roles: AppRole[];
  isAdmin: boolean;
  isBackOffice: boolean;
  isCourtier: boolean;
  isResponsableProspection: boolean;
  isEtudiant: boolean;
  isLoading: boolean;
}

export const useUserRole = (): UserRoleState => {
  const { user, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user roles:", error);
          setRoles([]);
        } else {
          setRoles(data?.map((r) => r.role) || []);
        }
      } catch (err) {
        console.error("Error in useUserRole:", err);
        setRoles([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchRoles();
    }
  }, [user, authLoading]);

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isBackOffice: roles.includes("back_office"),
    isCourtier: roles.includes("courtier"),
    isResponsableProspection: roles.includes("responsable_prospection"),
    isEtudiant: roles.includes("etudiant"),
    isLoading: isLoading || authLoading,
  };
};
