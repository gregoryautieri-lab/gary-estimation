import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge function pour récupérer les données cadastrales
 * Sources :
 * - SITG (Genève) : https://ge.ch/sitg
 * - Swisstopo : API fédérale des parcelles
 * - ASIT-VD (Vaud) : https://www.asitvd.ch (à vérifier disponibilité)
 */

interface CadastreData {
  numeroParcelle: string;
  surfaceParcelle: number;
  zone: string;
  zoneDetail?: string;
  commune: string;
  canton: string;
  source: 'sitg' | 'swisstopo' | 'asitvd' | 'unknown';
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

// Récupérer les données depuis SITG (Genève)
async function fetchFromSITG(lat: number, lng: number): Promise<CadastreData | null> {
  try {
    // SITG WFS : les parcelles sont servies en EPSG:2056 (LV95)
    const { e, n } = wgs84ToLV95(lat, lng);

    const wfsUrl = `https://ge.ch/sitg/wfs?` +
      `service=WFS&version=2.0.0&request=GetFeature&` +
      `typeNames=sitg:CAD_PARCELLE_MENSU&` +
      `outputFormat=application/json&` +
      `srsName=EPSG:2056&count=1&` +
      `CQL_FILTER=INTERSECTS(SHAPE,POINT(${e} ${n}))`;

    const response = await fetch(wfsUrl);

    if (!response.ok) {
      console.error('SITG WFS error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const props = feature.properties || {};

      const zoneDetail = props.ZONE || props.AFFECTATION || props.ZONE_AFFECTATION || props.TYPE_ZONE || '';

      return {
        numeroParcelle: props.NO_PARCELLE || props.NUMERO || props.NUM_PARCELLE || props.EGRID || '',
        surfaceParcelle: Number(props.SURFACE || props.SURFACE_PI || props.SHAPE_AREA || 0),
        zone: mapSITGZone(zoneDetail),
        zoneDetail,
        commune: props.COMMUNE || props.NOM_COMMUNE || props.COMMUNE_NOM || '',
        canton: 'GE',
        source: 'sitg'
      };
    }

    return null;
  } catch (error) {
    console.error('SITG fetch error:', error);
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

// Récupérer les données depuis Swisstopo (national)
async function fetchFromSwisstopo(lat: number, lng: number): Promise<CadastreData | null> {
  try {
    // API REST geo.admin.ch pour identifier la parcelle
    // Documentation : https://api3.geo.admin.ch/services/sdiservices.html
    const identifyUrl = `https://api3.geo.admin.ch/rest/services/all/MapServer/identify?` +
      `geometry=${lng},${lat}&geometryType=esriGeometryPoint&` +
      `sr=4326&layers=all:ch.kantone.cadastralwebmap-farbe&` +
      `tolerance=0&returnGeometry=false&` +
      `imageDisplay=1,1,1&mapExtent=0,0,1,1`;
    
    const response = await fetch(identifyUrl);
    
    if (!response.ok) {
      console.error('Swisstopo identify error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const attrs = result.attributes || {};
      
      return {
        numeroParcelle: attrs.number || attrs.egrid || '',
        surfaceParcelle: attrs.area || 0,
        zone: '', // Swisstopo ne donne pas la zone d'affectation
        zoneDetail: '',
        commune: attrs.municipality || '',
        canton: attrs.canton || '',
        source: 'swisstopo'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Swisstopo fetch error:', error);
    return null;
  }
}

// Récupérer les données depuis ASIT-VD (Vaud)
async function fetchFromASITVD(lat: number, lng: number): Promise<CadastreData | null> {
  try {
    // ASIT-VD WMS/WFS pour le cadastre vaudois
    // Note: L'accès peut nécessiter une authentification
    // On utilise le géoportail vaudois
    const wfsUrl = `https://ows.geo.vd.ch/wfs?` +
      `service=WFS&version=2.0.0&request=GetFeature&` +
      `typeName=vd_cadastre:immeuble&` +
      `outputFormat=application/json&` +
      `srsName=EPSG:4326&` +
      `CQL_FILTER=INTERSECTS(SHAPE,POINT(${lng} ${lat}))`;

    const response = await fetch(wfsUrl);
    
    if (!response.ok) {
      console.error('ASIT-VD WFS error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const props = feature.properties;
      
      return {
        numeroParcelle: props.no_parcelle || props.numero || '',
        surfaceParcelle: props.surface || props.area || 0,
        zone: mapVDZone(props.zone_affectation || ''),
        zoneDetail: props.zone_affectation || '',
        commune: props.commune || '',
        canton: 'VD',
        source: 'asitvd'
      };
    }
    
    return null;
  } catch (error) {
    console.error('ASIT-VD fetch error:', error);
    return null;
  }
}

// Mapper les zones VD vers nos catégories
function mapVDZone(zoneCode: string): string {
  const upper = zoneCode.toUpperCase();
  if (upper.includes('VILLA') || upper.includes('FAIBLE')) return 'villa';
  if (upper.includes('MOYENNE') || upper.includes('RESIDENTIEL')) return 'residentielle';
  if (upper.includes('MIXTE') || upper.includes('CENTRE')) return 'mixte';
  if (upper.includes('AGRICOLE')) return 'agricole';
  return '';
}

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
    
    // Essayer les sources spécifiques au canton
    if (canton === 'GE') {
      result = await fetchFromSITG(lat, lng);
    } else if (canton === 'VD') {
      result = await fetchFromASITVD(lat, lng);
    }
    
    // Fallback sur Swisstopo si pas de résultat cantonal
    if (!result) {
      result = await fetchFromSwisstopo(lat, lng);
    }
    
    // Si toujours rien, retourner un objet vide
    if (!result) {
      return new Response(
        JSON.stringify({
          numeroParcelle: '',
          surfaceParcelle: 0,
          zone: '',
          zoneDetail: '',
          commune: '',
          canton: canton,
          source: 'unknown',
          error: 'Aucune donnée cadastrale trouvée pour ces coordonnées'
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
