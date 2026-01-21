import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminUserRequest {
  action: "delete" | "disable" | "enable" | "reset_password";
  target_user_id: string;
  new_password?: string;
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

    const { action, target_user_id, new_password }: AdminUserRequest = await req.json();

    if (!action || !target_user_id) {
      return new Response(
        JSON.stringify({ error: "action and target_user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from modifying themselves (except password reset)
    if (target_user_id === callingUser.id && action !== "reset_password") {
      return new Response(
        JSON.stringify({ error: "Cannot modify your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: { success: boolean; message: string };

    switch (action) {
      case "delete":
        // Delete user completely from auth.users (cascades to profiles and roles)
        console.log(`Attempting to delete user: ${target_user_id}`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
        if (deleteError) {
          console.error("Delete error:", deleteError);
          throw deleteError;
        }
        console.log(`User ${target_user_id} deleted successfully`);
        result = { success: true, message: "User deleted successfully" };
        break;

      case "disable":
        // Ban user (prevents login)
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
          ban_duration: "876000h", // ~100 years
        });
        if (banError) throw banError;
        result = { success: true, message: "User disabled successfully" };
        break;

      case "enable":
        // Unban user
        const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
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
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
          password: new_password,
        });
        if (resetError) throw resetError;
        result = { success: true, message: "Password reset successfully" };
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
    console.error(`Error code: ${errorCode}, Message: ${errorMessage}`);
    return new Response(
      JSON.stringify({ error: errorMessage, code: errorCode }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
