import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

const STRAVA_ANALYSIS_PROMPT = `Analyse cette image. C'est censé être un screenshot de l'application Strava montrant les statistiques d'une activité de marche.

Si c'est un screenshot Strava valide avec des statistiques visibles, extrais et retourne un JSON avec :
- valid : true
- temps : le temps total au format H:MM:SS ou HH:MM:SS
- distance_km : la distance en kilomètres (nombre décimal)
- vitesse_moy_kmh : la vitesse moyenne en km/h (nombre décimal)
- date : la date si visible au format YYYY-MM-DD, sinon null

Si ce n'est pas un screenshot Strava valide ou si les données ne sont pas lisibles :
- valid : false

Retourne UNIQUEMENT le JSON sans autre texte.`;

interface StravaData {
  valid: boolean;
  temps?: string;
  distance_km?: number;
  vitesse_moy_kmh?: number;
  date?: string | null;
}

interface RequestBody {
  imageBase64: string;
  mimeType: string;
}

serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérification de l'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentification requise" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "Token invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse du body
    const body: RequestBody = await req.json();

    // Validation de l'entrée
    if (!body.imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Image manquante (imageBase64 requis)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.mimeType || !["image/jpeg", "image/png", "image/webp"].includes(body.mimeType)) {
      return new Response(
        JSON.stringify({ success: false, error: "Type MIME invalide (image/jpeg, image/png ou image/webp requis)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérification de la taille de l'image
    const imageSizeBytes = (body.imageBase64.length * 3) / 4; // Estimation taille base64
    if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ success: false, error: "Image trop grande (maximum 5 Mo)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Appel à Lovable AI Gateway avec vision
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Service IA non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: STRAVA_ANALYSIS_PROMPT,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${body.mimeType};base64,${body.imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Limite de requêtes atteinte, réessayez plus tard" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Crédits IA insuffisants" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: "Réponse IA vide" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parser la réponse JSON de l'IA
    let stravaData: StravaData;
    try {
      // Nettoyer la réponse (enlever les backticks markdown si présents)
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      stravaData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content, parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Impossible de parser les données Strava" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validation du résultat
    if (typeof stravaData.valid !== "boolean") {
      return new Response(
        JSON.stringify({ success: false, error: "Format de réponse invalide" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!stravaData.valid) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { valid: false },
          message: "L'image n'est pas un screenshot Strava valide ou les données ne sont pas lisibles"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Retourner les données extraites
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          valid: true,
          temps: stravaData.temps,
          distance_km: stravaData.distance_km,
          vitesse_moy_kmh: stravaData.vitesse_moy_kmh,
          vitesse_moy: stravaData.vitesse_moy_kmh, // Alias pour compatibilité hook
          date: stravaData.date,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("parse-strava-screenshot error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
