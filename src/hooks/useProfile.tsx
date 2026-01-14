import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "courtier" | "back_office";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UseProfileReturn {
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAdmin: boolean;
  isCourtier: boolean;
  isBackOffice: boolean;
  updateProfile: (updates: Partial<Pick<Profile, "full_name" | "avatar_url">>) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setRoles([]);
      setIsLoading(false);
      return;
    }

    const fetchProfileAndRoles = async () => {
      setIsLoading(true);
      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile:", profileError);
        } else {
          setProfile(profileData);
        }

        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (rolesError) {
          console.error("Error fetching roles:", rolesError);
        } else {
          setRoles(rolesData?.map((r) => r.role as AppRole) || []);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndRoles();
  }, [user]);

  const updateProfile = async (
    updates: Partial<Pick<Profile, "full_name" | "avatar_url">>
  ) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  return {
    profile,
    roles,
    isLoading,
    isAdmin: roles.includes("admin"),
    isCourtier: roles.includes("courtier"),
    isBackOffice: roles.includes("back_office"),
    updateProfile,
  };
};
