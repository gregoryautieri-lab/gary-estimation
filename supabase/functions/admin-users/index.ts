import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminUserRequest {
  action: "create" | "delete" | "disable" | "enable" | "reset_password" | "update_email";
  target_user_id?: string;
  new_password?: string;
  email?: string;
  full_name?: string;
  role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the calling user from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the calling user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if calling user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: callingUser.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, target_user_id, new_password, email, full_name, role }: AdminUserRequest = await req.json();

    // For create action, we don't need target_user_id
    if (action !== "create" && !target_user_id) {
      return new Response(
        JSON.stringify({ error: "target_user_id is required for this action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from modifying themselves (except password reset and email update)
    if (target_user_id && target_user_id === callingUser.id && action !== "reset_password" && action !== "update_email") {
      return new Response(
        JSON.stringify({ error: "Cannot modify your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { success: boolean; message: string; user_id?: string };

    switch (action) {
      case "create":
        // Create new user via admin API (doesn't switch session)
        if (!email || !new_password) {
          return new Response(
            JSON.stringify({ error: "email and new_password are required for create" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`Creating user: ${email}`);
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: new_password,
          email_confirm: true,
          user_metadata: { full_name: full_name || "" },
        });
        
        if (createError) {
          console.error("Create error:", createError);
          throw createError;
        }
        
        const newUserId = createData.user.id;
        console.log(`User created: ${newUserId}`);
        
        // Update profile with full_name
        if (full_name) {
          await supabaseAdmin.from("profiles").update({ full_name }).eq("user_id", newUserId);
        }
        
        // Set role if different from default (courtier)
        if (role && role !== "courtier") {
          await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
          await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role });
        }
        
        result = { success: true, message: "User created successfully", user_id: newUserId };
        break;

      case "delete":
        // Delete user completely from auth.users (cascades to profiles and roles)
        console.log(`Attempting to delete user: ${target_user_id}`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id!);
        if (deleteError) {
          console.error("Delete error:", deleteError);
          throw deleteError;
        }
        console.log(`User ${target_user_id} deleted successfully`);
        result = { success: true, message: "User deleted successfully" };
        break;

      case "disable":
        // Ban user (prevents login)
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id!, {
          ban_duration: "876000h", // ~100 years
        });
        if (banError) throw banError;
        result = { success: true, message: "User disabled successfully" };
        break;

      case "enable":
        // Unban user
        const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id!, {
          ban_duration: "0",
        });
        if (unbanError) throw unbanError;
        result = { success: true, message: "User enabled successfully" };
        break;

      case "reset_password":
        if (!new_password || new_password.length < 6) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 6 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id!, {
          password: new_password,
        });
        if (resetError) throw resetError;
        result = { success: true, message: "Password reset successfully" };
        break;

      case "update_email":
        if (!email) {
          return new Response(
            JSON.stringify({ error: "email is required for update_email" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        console.log(`Updating email for user ${target_user_id} to ${email}`);
        const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id!, {
          email,
          email_confirm: true,
        });
        if (emailError) throw emailError;
        // Also update the profiles table
        await supabaseAdmin.from("profiles").update({ email }).eq("user_id", target_user_id);
        result = { success: true, message: "Email updated successfully" };
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Admin users error:", error);
    const errorMessage = error.message || error.toString();
    const errorCode = error.code || "UNKNOWN";
    const statusCode = typeof error?.status === "number" ? error.status : 500;
    console.error(`Error code: ${errorCode}, Message: ${errorMessage}`);
    return new Response(
      JSON.stringify({ error: errorMessage, code: errorCode }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
