import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge function pour récupérer les données cadastrales
 * Sources :
 * - SITG (Genève) : https://ge.ch/sitg via ArcGIS REST API
 * - Autres cantons : saisie manuelle (pas d'API disponible)
 */

interface CadastreData {
  numeroParcelle: string;
  surfaceParcelle: number;
  zone: string;
  zoneDetail?: string;
  commune: string;
  canton: string;
  source: 'sitg' | 'manual';
  error?: string;
}

// Déterminer le canton à partir du code postal
function getCantonFromPostalCode(postalCode: string): string {
  const code = parseInt(postalCode);

  // Genève : 1200-1299
  if (code >= 1200 && code <= 1299) return 'GE';

  // Vaud : 1000-1199, 1300-1899 (approximatif)
  if ((code >= 1000 && code <= 1199) || (code >= 1300 && code <= 1899)) return 'VD';

  // Valais : 1900-1999, 3900-3999
  if ((code >= 1900 && code <= 1999) || (code >= 3900 && code <= 3999)) return 'VS';

  // Fribourg : 1600-1699, 1700-1799
  if ((code >= 1630 && code <= 1699) || (code >= 1700 && code <= 1799)) return 'FR';

  // Neuchâtel : 2000-2999
  if (code >= 2000 && code <= 2999) return 'NE';

  // Jura : 2800-2899
  if (code >= 2800 && code <= 2899) return 'JU';

  return 'CH';
}

// Conversion WGS84 (lat/lng) -> LV95 (EPSG:2056)
// Formules officielles (approx.) publiées par swisstopo
function wgs84ToLV95(lat: number, lng: number): { e: number; n: number } {
  const latSec = lat * 3600;
  const lngSec = lng * 3600;

  const latAux = (latSec - 169028.66) / 10000;
  const lngAux = (lngSec - 26782.5) / 10000;

  const e =
    2600072.37 +
    211455.93 * lngAux -
    10938.51 * lngAux * latAux -
    0.36 * lngAux * latAux * latAux -
    44.54 * lngAux * lngAux * lngAux;

  const n =
    1200147.07 +
    308807.95 * latAux +
    3745.25 * lngAux * lngAux +
    76.63 * latAux * latAux -
    194.56 * lngAux * lngAux * latAux +
    119.79 * latAux * latAux * latAux;

  return { e, n };
}

// Récupérer les données depuis SITG (Genève) via REST API ArcGIS
async function fetchFromSITG(lat: number, lng: number): Promise<CadastreData | null> {
  try {
    const { e, n } = wgs84ToLV95(lat, lng);
    
    // 🔍 LOG : Coordonnées converties
    console.log(`[SITG] WGS84→LV95: lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)} → e=${e.toFixed(2)}, n=${n.toFixed(2)}`);
    
    const geometry = encodeURIComponent(JSON.stringify({ x: e, y: n }));
    const urlParcelle = `https://app2.ge.ch/tergeoservices/rest/services/Hosted/CAD_PARCELLE_MENSU/FeatureServer/0/query?` +
      `where=1%3D1&geometry=${geometry}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&` +
      `outFields=no_parcelle,surface,commune,egrid,type_propri&returnGeometry=false&f=json`;
    
    // 🔍 LOG : URL appelée (tronquée pour lisibilité)
    console.log(`[SITG] URL Parcelle: ${urlParcelle.substring(0, 150)}...`);
    
    const resParcelle = await fetch(urlParcelle);
    console.log(`[SITG] Status HTTP: ${resParcelle.status} ${resParcelle.statusText}`);
    
    if (!resParcelle.ok) {
      const errorText = await resParcelle.text();
      console.error(`[SITG] ❌ Erreur HTTP ${resParcelle.status}:`, errorText.substring(0, 500));
      return null;
    }
    
    const dataParcelle = await resParcelle.json();
    console.log(`[SITG] Réponse Parcelle:`, {
      featuresCount: dataParcelle?.features?.length || 0,
      hasError: !!dataParcelle?.error,
      firstFeature: dataParcelle?.features?.[0] ? 'OK' : 'NULL'
    });
    
    const attrsParcelle = dataParcelle?.features?.[0]?.attributes;
    
    if (!attrsParcelle) {
      console.log('[SITG] ⚠️ Aucune parcelle trouvée (features vide)');
      if (dataParcelle?.error) {
        console.error('[SITG] Erreur API:', JSON.stringify(dataParcelle.error));
      }
      return null;
    }

    // 🔍 LOG : Données parcelle récupérées
    console.log('[SITG] Parcelle trouvée:', {
      no_parcelle: attrsParcelle.no_parcelle,
      surface: attrsParcelle.surface,
      commune: attrsParcelle.commune
    });

    // 2. Appel endpoint ZONE (idem, ajouter logs similaires)
    const urlZone = `https://app2.ge.ch/tergeoservices/rest/services/Hosted/SIT_ZONE_AMENAG/FeatureServer/0/query?` +
      `where=1%3D1&geometry=${geometry}&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&` +
      `outFields=zone,description&returnGeometry=false&f=json`;
    
    console.log(`[SITG] Appel Zone...`);
    const resZone = await fetch(urlZone);
    console.log(`[SITG] Zone status: ${resZone.status}`);
    
    let zoneCode = '';
    let zoneDetail = '';
    
    if (resZone.ok) {
      const dataZone = await resZone.json();
      const attrsZone = dataZone?.features?.[0]?.attributes;
      if (attrsZone) {
        zoneCode = attrsZone.zone || '';
        zoneDetail = attrsZone.description || '';
        console.log('[SITG] Zone trouvée:', { zoneCode, zoneDetail });
      } else {
        console.log('[SITG] ⚠️ Zone non trouvée');
      }
    }

    const result = {
      numeroParcelle: String(attrsParcelle.no_parcelle || ''),
      surfaceParcelle: Number(attrsParcelle.surface || 0),
      zone: mapSITGZone(zoneCode),
      zoneDetail: zoneDetail,
      commune: attrsParcelle.commune || '',
      canton: 'GE',
      source: 'sitg' as const
    };
    
    console.log('[SITG] ✅ Résultat final:', result);
    return result;

  } catch (error) {
    console.error('[SITG] ❌ Exception:', error);
    console.error('[SITG] Stack:', (error as Error).stack);
    return null;
  }
}

// Mapper les zones SITG vers nos catégories
function mapSITGZone(zoneCode: string): string {
  const upper = (zoneCode || '').toUpperCase();
  if (upper.includes('5') || upper.includes('VILLA')) return 'villa';
  if (upper.includes('4') || upper.includes('RESIDENTIELLE')) return 'residentielle';
  if (upper.includes('3') || upper.includes('MIXTE')) return 'mixte';
  if (upper.includes('DEVELOPPEMENT')) return 'developpement';
  if (upper.includes('AGRICOLE')) return 'agricole';
  return '';
}

// Pour les autres cantons : pas d'API disponible, saisie manuelle requise

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lat, lng, postalCode, canton: cantonHint } = await req.json();
    
    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Coordonnées (lat, lng) requises' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Déterminer le canton
    const canton = cantonHint || (postalCode ? getCantonFromPostalCode(postalCode) : 'CH');
    
    console.log(`Recherche cadastre: lat=${lat}, lng=${lng}, canton=${canton}`);
    
    let result: CadastreData | null = null;
    
    // Seul Genève a une API fonctionnelle
    if (canton === 'GE') {
      result = await fetchFromSITG(lat, lng);
    }
    
    // Pour les autres cantons, retourner un message indiquant saisie manuelle
    if (!result) {
      const isGeneva = canton === 'GE';
      return new Response(
        JSON.stringify({
          numeroParcelle: '',
          surfaceParcelle: 0,
          zone: '',
          zoneDetail: '',
          commune: '',
          canton: canton,
          source: 'manual',
          error: isGeneva 
            ? 'Aucune donnée cadastrale trouvée pour ces coordonnées' 
            : 'Saisie manuelle requise (API cadastre non disponible pour ce canton)'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('Cadastre lookup error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la recherche cadastrale', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
