import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Utilise la clé serveur dédiée pour Places API (sans restriction de referrer)
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!GOOGLE_PLACES_API_KEY) {
      console.error("GOOGLE_PLACES_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Google Places API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, input, placeId } = await req.json();

    if (action === "autocomplete") {
      // Google Places Autocomplete API
      const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
      url.searchParams.set("input", input);
      url.searchParams.set("key", GOOGLE_PLACES_API_KEY);
      url.searchParams.set("types", "address");
      url.searchParams.set("language", "fr");
      // Biais vers la Suisse (Genève)
      url.searchParams.set("components", "country:ch");
      url.searchParams.set("location", "46.2044,6.1432"); // Genève
      url.searchParams.set("radius", "50000"); // 50km

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Google Places API error:", data);
        return new Response(
          JSON.stringify({ error: `Google API error: ${data.status}`, predictions: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ predictions: data.predictions || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "details") {
      // Google Places Details API
      const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      url.searchParams.set("place_id", placeId);
      url.searchParams.set("key", GOOGLE_PLACES_API_KEY);
      url.searchParams.set("fields", "address_components,formatted_address,geometry");
      url.searchParams.set("language", "fr");

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== "OK") {
        console.error("Google Places Details API error:", data);
        return new Response(
          JSON.stringify({ error: `Google API error: ${data.status}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse address components
      const result = data.result;
      const components = result.address_components || [];
      
      let rue = "";
      let numero = "";
      let codePostal = "";
      let localite = "";
      let canton = "";

      for (const comp of components) {
        const types = comp.types || [];
        if (types.includes("street_number")) {
          numero = comp.long_name;
        } else if (types.includes("route")) {
          rue = comp.long_name;
        } else if (types.includes("postal_code")) {
          codePostal = comp.long_name;
        } else if (types.includes("locality")) {
          localite = comp.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          canton = comp.short_name;
        }
      }

      // Construire l'adresse de rue complète
      const rueComplete = numero ? `${rue} ${numero}` : rue;

      return new Response(
        JSON.stringify({
          rue: rueComplete,
          codePostal,
          localite,
          canton,
          coordinates: result.geometry?.location || null,
          placeId,
          formattedAddress: result.formatted_address
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'autocomplete' or 'details'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
