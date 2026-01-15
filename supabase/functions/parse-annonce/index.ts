import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedAnnonce {
  adresse: string;
  prix: string;
  surface: string;
  nombrePieces: string;
  typeBien: string;
  source: string;
  lien: string;
  datePublication?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing URL:', url);

    // Déterminer la source
    let source = 'autre';
    if (url.includes('immoscout24')) source = 'immoscout';
    else if (url.includes('homegate')) source = 'homegate';
    else if (url.includes('acheter-louer')) source = 'acheter-louer';
    else if (url.includes('newhome')) source = 'newhome';
    else if (url.includes('immostreet')) source = 'immostreet';

    // Fetch la page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-CH,fr;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const html = await response.text();
    
    // Parser le contenu selon la source
    const parsed = parseHtmlContent(html, source, url);
    
    console.log('Parsed result:', parsed);

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing annonce:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de parsing' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseHtmlContent(html: string, source: string, url: string): ParsedAnnonce {
  const result: ParsedAnnonce = {
    adresse: '',
    prix: '',
    surface: '',
    nombrePieces: '',
    typeBien: '',
    source,
    lien: url,
  };

  // Extraction générique via meta tags et JSON-LD (fonctionne pour la plupart des sites)
  
  // 1. Essayer JSON-LD (schema.org)
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script type="application\/ld\+json">/gi, '').replace(/<\/script>/gi, '');
        const data = JSON.parse(jsonContent);
        
        if (data['@type'] === 'RealEstateListing' || data['@type'] === 'Product' || data['@type'] === 'Residence') {
          result.adresse = data.address?.streetAddress || data.address?.addressLocality || '';
          if (data.address?.postalCode) {
            result.adresse = `${result.adresse}, ${data.address.postalCode}`;
          }
          if (data.address?.addressLocality && !result.adresse.includes(data.address.addressLocality)) {
            result.adresse = `${result.adresse} ${data.address.addressLocality}`;
          }
          
          if (data.offers?.price) {
            result.prix = data.offers.price.toString();
          }
          
          if (data.floorSize?.value) {
            result.surface = data.floorSize.value.toString();
          }
          
          if (data.numberOfRooms) {
            result.nombrePieces = data.numberOfRooms.toString();
          }
        }
      } catch (e) {
        // Continuer si JSON invalide
      }
    }
  }

  // 2. Meta tags Open Graph
  const ogTitle = extractMetaContent(html, 'og:title');
  const ogDescription = extractMetaContent(html, 'og:description');
  
  // 3. Extraction par patterns de texte
  
  // Prix (formats suisses: CHF, Fr., francs)
  if (!result.prix) {
    const pricePatterns = [
      /(?:CHF|Fr\.?|francs?)\s*[''']?([\d\s'',]+)/gi,
      /([\d\s'',]+)\s*(?:CHF|Fr\.?|francs)/gi,
      /prix[:\s]*[''']?([\d\s'',]+)/gi,
    ];
    
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        const priceStr = match[0].replace(/[^\d]/g, '');
        if (priceStr && parseInt(priceStr) > 50000) { // Filtre les petits nombres
          result.prix = priceStr;
          break;
        }
      }
    }
  }

  // Surface (m², m2)
  if (!result.surface) {
    const surfacePatterns = [
      /([\d.,]+)\s*m[²2]/gi,
      /surface[:\s]*([\d.,]+)/gi,
    ];
    
    for (const pattern of surfacePatterns) {
      const match = html.match(pattern);
      if (match) {
        const surfaceStr = match[0].replace(/[^\d.,]/g, '').replace(',', '.');
        const surface = parseFloat(surfaceStr);
        if (surface > 10 && surface < 2000) { // Filtre les valeurs aberrantes
          result.surface = Math.round(surface).toString();
          break;
        }
      }
    }
  }

  // Nombre de pièces
  if (!result.nombrePieces) {
    const roomPatterns = [
      /([\d.,½]+)\s*(?:pièces?|pi[èe]ces?|zimmer|rooms?)/gi,
      /(?:pièces?|zimmer)[:\s]*([\d.,½]+)/gi,
    ];
    
    for (const pattern of roomPatterns) {
      const match = html.match(pattern);
      if (match) {
        const roomStr = match[0].replace(/[^\d.,½]/g, '').replace('½', '.5').replace(',', '.');
        if (roomStr) {
          result.nombrePieces = roomStr;
          break;
        }
      }
    }
  }

  // Adresse depuis le titre ou description
  if (!result.adresse && ogTitle) {
    // Essayer d'extraire une adresse suisse (format: rue, NPA localité)
    const addressMatch = ogTitle.match(/(.+?),\s*(\d{4})\s+(\w+)/);
    if (addressMatch) {
      result.adresse = `${addressMatch[1]}, ${addressMatch[2]} ${addressMatch[3]}`;
    } else {
      // Sinon, utiliser le titre complet
      result.adresse = ogTitle.split('|')[0].trim();
    }
  }

  // Type de bien
  const typeBienPatterns = [
    { pattern: /appartement/gi, type: 'appartement' },
    { pattern: /maison|villa/gi, type: 'maison' },
    { pattern: /terrain/gi, type: 'terrain' },
    { pattern: /immeuble/gi, type: 'immeuble' },
    { pattern: /commercial|bureau|local/gi, type: 'commercial' },
  ];
  
  for (const { pattern, type } of typeBienPatterns) {
    if (html.match(pattern)) {
      result.typeBien = type;
      break;
    }
  }

  return result;
}

function extractMetaContent(html: string, property: string): string {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  const match = html.match(regex);
  if (match) return match[1];
  
  // Essayer format inversé
  const regex2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
  const match2 = html.match(regex2);
  return match2 ? match2[1] : '';
}
