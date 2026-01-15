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

    const { action, input, placeId, lat, lng } = await req.json();

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

    if (action === "nearbyTransit") {
      // Recherche des transports à proximité (bus, tram, gare)
      // lat/lng sont déjà parsés au début de la fonction
      const latitude = lat;
      const longitude = lng;

      if (!latitude || !longitude) {
        return new Response(
          JSON.stringify({ error: "Coordinates (lat, lng) required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Recherche arrêt de bus/tram le plus proche
      const busUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      busUrl.searchParams.set("location", `${latitude},${longitude}`);
      busUrl.searchParams.set("radius", "2000"); // 2km max
      busUrl.searchParams.set("type", "transit_station");
      busUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);
      busUrl.searchParams.set("language", "fr");

      // Recherche gare la plus proche
      const trainUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      trainUrl.searchParams.set("location", `${latitude},${longitude}`);
      trainUrl.searchParams.set("radius", "5000"); // 5km max
      trainUrl.searchParams.set("type", "train_station");
      trainUrl.searchParams.set("key", GOOGLE_PLACES_API_KEY);
      trainUrl.searchParams.set("language", "fr");

      const [busResponse, trainResponse] = await Promise.all([
        fetch(busUrl.toString()),
        fetch(trainUrl.toString())
      ]);

      const busData = await busResponse.json();
      const trainData = await trainResponse.json();

      // Helper pour calculer distance en mètres
      const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000; // Rayon de la Terre en mètres
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c);
      };

      // Helper pour formater le temps de trajet
      const formatTravelTime = (distanceMeters: number): { temps: string; mode: 'pied' | 'voiture' } => {
        if (distanceMeters <= 1000) {
          // À pied: ~80m/min
          const minutes = Math.ceil(distanceMeters / 80);
          return { temps: `${minutes} min`, mode: 'pied' };
        } else {
          // En voiture: ~500m/min en ville
          const minutes = Math.ceil(distanceMeters / 500);
          return { temps: `${minutes} min`, mode: 'voiture' };
        }
      };

      // Trouver le plus proche
      let busStop = null;
      let trainStation = null;

      if (busData.results && busData.results.length > 0) {
        const closest = busData.results[0];
        const distance = calculateDistance(
          latitude, longitude,
          closest.geometry.location.lat,
          closest.geometry.location.lng
        );
        const travel = formatTravelTime(distance);
        busStop = {
          nom: closest.name,
          distance: distance,
          distanceFormatted: distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`,
          temps: travel.temps,
          mode: travel.mode,
          placeId: closest.place_id
        };
      }

      if (trainData.results && trainData.results.length > 0) {
        const closest = trainData.results[0];
        const distance = calculateDistance(
          latitude, longitude,
          closest.geometry.location.lat,
          closest.geometry.location.lng
        );
        const travel = formatTravelTime(distance);
        trainStation = {
          nom: closest.name,
          distance: distance,
          distanceFormatted: distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance} m`,
          temps: travel.temps,
          mode: travel.mode,
          placeId: closest.place_id
        };
      }

      return new Response(
        JSON.stringify({
          busStop,
          trainStation,
          origin: { lat: latitude, lng: longitude }
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
