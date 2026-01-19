import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encodeBase64 } from "https://deno.land/std@0.220.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Marker {
  lat: number;
  lng: number;
  color: "blue" | "green" | "red" | "gray";
}

interface MapRequest {
  type: "google" | "cadastre" | "static-export";
  lat: number;
  lng: number;
  zoom?: number;
  mapType?: "satellite" | "hybrid" | "roadmap" | "terrain";
  markerLat?: number;
  markerLng?: number;
  width?: number;
  height?: number;
  // For static-export type with multiple markers
  markers?: Marker[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: MapRequest = await req.json();
    const { type, lat, lng, zoom = 18, mapType = "satellite", markerLat, markerLng, width = 800, height = 500, markers } = params;

    console.log(`[static-map-proxy] Request: type=${type}, lat=${lat}, lng=${lng}, zoom=${zoom}, markers=${markers?.length || 0}`);

    let imageBase64: string | null = null;

    // New type for exporting map with multiple markers
    if (type === "static-export") {
      const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
      if (!GOOGLE_MAPS_API_KEY) {
        console.error("[static-map-proxy] GOOGLE_MAPS_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "Google Maps API key not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!markers || markers.length === 0) {
        return new Response(
          JSON.stringify({ error: "No markers provided for static-export" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Group markers by color and build URL parameters
      const markersByColor: Record<string, Marker[]> = {};
      for (const m of markers) {
        if (!markersByColor[m.color]) {
          markersByColor[m.color] = [];
        }
        markersByColor[m.color].push(m);
      }

      // Build markers query string
      const markerParams: string[] = [];
      for (const [color, colorMarkers] of Object.entries(markersByColor)) {
        const coords = colorMarkers.map(m => `${m.lat},${m.lng}`).join('|');
        markerParams.push(`markers=color:${color}|${coords}`);
      }

      // Build final URL (640x640 max for free tier, scale=2 for Retina)
      const size = Math.min(width || 640, 640);
      const googleUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
        `center=${lat},${lng}` +
        `&zoom=${Math.min(zoom || 12, 20)}` +
        `&size=${size}x${size}` +
        `&scale=2` +
        `&maptype=${mapType || 'roadmap'}` +
        `&${markerParams.join('&')}` +
        `&key=${GOOGLE_MAPS_API_KEY}`;

      console.log(`[static-map-proxy] Static export URL built with ${markers.length} markers`);
      
      const response = await fetch(googleUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[static-map-proxy] Google Maps error: ${response.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ error: `Google Maps API error: ${response.status}`, details: errorText.substring(0, 200) }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = encodeBase64(arrayBuffer);
      imageBase64 = `data:image/png;base64,${base64}`;
      console.log(`[static-map-proxy] Static export image fetched, size: ${base64.length} chars`);

    } else if (type === "google") {
      if (!lat || !lng) {
        return new Response(
          JSON.stringify({ error: "Missing lat/lng coordinates" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch Google Static Maps
      const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
      if (!GOOGLE_MAPS_API_KEY) {
        console.error("[static-map-proxy] GOOGLE_MAPS_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "Google Maps API key not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const mLat = markerLat || lat;
      const mLng = markerLng || lng;
      const googleUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${Math.min(zoom, 20)}&size=640x400&scale=2&format=png&maptype=${mapType}&markers=color:red%7C${mLat},${mLng}&key=${GOOGLE_MAPS_API_KEY}`;

      console.log(`[static-map-proxy] Fetching Google Maps...`);
      const response = await fetch(googleUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[static-map-proxy] Google Maps error: ${response.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ error: `Google Maps API error: ${response.status}`, details: errorText.substring(0, 200) }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = encodeBase64(arrayBuffer);
      imageBase64 = `data:image/png;base64,${base64}`;
      console.log(`[static-map-proxy] Google Maps image fetched, size: ${base64.length} chars`);

    } else if (type === "cadastre") {
      if (!lat || !lng) {
        return new Response(
          JSON.stringify({ error: "Missing lat/lng coordinates" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch Swiss cadastre via WMS GetMap
      // Calculate BBOX for WGS84 (EPSG:4326)
      // At zoom ~19, approximately 0.0008 degrees buffer (~80m)
      const buffer = 0.0008;
      const minLat = lat - buffer;
      const maxLat = lat + buffer;
      const minLng = lng - buffer * 1.5; // Wider for aspect ratio
      const maxLng = lng + buffer * 1.5;

      // WMS request with EPSG:4326 (lat/lng order for WMS 1.3.0)
      const wmsUrl = `https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ch.kantone.cadastralwebmap-farbe&STYLES=&CRS=EPSG:4326&BBOX=${minLat},${minLng},${maxLat},${maxLng}&WIDTH=${width}&HEIGHT=${height}&FORMAT=image/png&TRANSPARENT=FALSE`;

      console.log(`[static-map-proxy] Fetching cadastre WMS: BBOX=${minLat},${minLng},${maxLat},${maxLng}`);
      const response = await fetch(wmsUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[static-map-proxy] Cadastre WMS error: ${response.status} - ${errorText}`);
        return new Response(
          JSON.stringify({ error: `Cadastre WMS error: ${response.status}` }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("image")) {
        const text = await response.text();
        console.error(`[static-map-proxy] Cadastre returned non-image: ${contentType} - ${text.substring(0, 200)}`);
        return new Response(
          JSON.stringify({ error: "Cadastre WMS did not return an image" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = encodeBase64(arrayBuffer);
      imageBase64 = `data:image/png;base64,${base64}`;
      console.log(`[static-map-proxy] Cadastre image fetched, size: ${base64.length} chars`);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'google', 'cadastre', or 'static-export'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ image: imageBase64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[static-map-proxy] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
