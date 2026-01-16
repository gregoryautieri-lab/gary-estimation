import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedData {
  adresse?: string;
  prix?: string;
  surface?: string;
  nombrePieces?: string;
  typeBien?: string;
  source: string;
  description?: string;
  images?: string[];
}

// Extraction patterns pour les portails immobiliers suisses
const EXTRACTION_PATTERNS = {
  immoscout: {
    prix: /CHF\s*([\d']+)/i,
    surface: /(\d+)\s*m²/i,
    pieces: /(\d+(?:\.\d+)?)\s*(?:pièces?|pi[eè]ces?|Zimmer)/i,
    adresse: /(?:Adresse|Standort|Ort)[:\s]*([^<\n]+)/i,
  },
  homegate: {
    prix: /CHF\s*([\d']+)/i,
    surface: /(\d+)\s*m²/i,
    pieces: /(\d+(?:\.\d+)?)\s*(?:pièces?|pi[eè]ces?|rooms?)/i,
    adresse: /(?:Adresse|Location)[:\s]*([^<\n]+)/i,
  },
  generic: {
    prix: /(?:CHF|Fr\.?)\s*([\d'.,]+)/i,
    surface: /(\d+)\s*m[²2]/i,
    pieces: /(\d+(?:[.,]\d+)?)\s*(?:pièces?|pi[eè]ces?|Zimmer|rooms?)/i,
    adresse: /(?:\d{4})\s+([A-Za-zÀ-ÿ\s-]+)/,
  }
};

function detectSource(url: string): string {
  if (url.includes('immoscout24')) return 'ImmoScout24';
  if (url.includes('homegate')) return 'Homegate';
  if (url.includes('immobilier.ch')) return 'Immobilier.ch';
  if (url.includes('acheter-louer')) return 'Acheter-Louer';
  if (url.includes('newhome')) return 'Newhome';
  if (url.includes('anibis')) return 'Anibis';
  return 'Web';
}

function getPatterns(source: string) {
  const key = source.toLowerCase().includes('immoscout') ? 'immoscout' 
            : source.toLowerCase().includes('homegate') ? 'homegate' 
            : 'generic';
  return EXTRACTION_PATTERNS[key];
}

function cleanPrice(priceStr: string): string {
  // Nettoyer le prix: "1'250'000" -> "1250000"
  return priceStr.replace(/['\s.,]/g, '');
}

function extractDataFromMarkdown(markdown: string, source: string): Partial<ScrapedData> {
  const patterns = getPatterns(source);
  const data: Partial<ScrapedData> = { source };
  
  // Extraire le prix
  const prixMatch = markdown.match(patterns.prix);
  if (prixMatch) {
    data.prix = cleanPrice(prixMatch[1]);
  }
  
  // Extraire la surface
  const surfaceMatch = markdown.match(patterns.surface);
  if (surfaceMatch) {
    data.surface = surfaceMatch[1];
  }
  
  // Extraire le nombre de pièces
  const piecesMatch = markdown.match(patterns.pieces);
  if (piecesMatch) {
    data.nombrePieces = piecesMatch[1].replace(',', '.');
  }
  
  // Extraire l'adresse (plus complexe)
  // Chercher un pattern NPA + Localité
  const adresseMatch = markdown.match(/(\d{4})\s+([A-Za-zÀ-ÿ\s-]+?)(?:\n|,|$)/);
  if (adresseMatch) {
    data.adresse = `${adresseMatch[1]} ${adresseMatch[2].trim()}`;
  }
  
  // Chercher une rue avec numéro
  const rueMatch = markdown.match(/(?:^|\n)([A-Za-zÀ-ÿ\s-]+(?:strasse|weg|platz|rue|chemin|avenue|route|boulevard)\s*\d*[a-z]?)/i);
  if (rueMatch) {
    data.adresse = data.adresse 
      ? `${rueMatch[1].trim()}, ${data.adresse}` 
      : rueMatch[1].trim();
  }
  
  // Détecter le type de bien
  if (/appartement|wohnung|apartment/i.test(markdown)) {
    data.typeBien = 'appartement';
  } else if (/maison|villa|haus|house/i.test(markdown)) {
    data.typeBien = 'maison';
  } else if (/terrain|bauland|land/i.test(markdown)) {
    data.typeBien = 'terrain';
  }
  
  return data;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Firecrawl non configuré',
          fallback: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Détecter la source
    const source = detectSource(url);
    console.log('Scraping URL:', url, 'Source:', source);

    // Appeler Firecrawl pour scraper la page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Attendre le JS
      }),
    });

    const firecrawlData = await response.json();

    if (!response.ok || !firecrawlData.success) {
      console.error('Firecrawl API error:', firecrawlData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: firecrawlData.error || 'Erreur de scraping',
          fallback: true,
          source
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire les données du markdown
    const markdown = firecrawlData.data?.markdown || '';
    const extractedData = extractDataFromMarkdown(markdown, source);

    // Récupérer les métadonnées
    const metadata = firecrawlData.data?.metadata || {};

    const result: ScrapedData = {
      source,
      adresse: extractedData.adresse || metadata.title?.split('|')[0]?.trim() || '',
      prix: extractedData.prix || '',
      surface: extractedData.surface || '',
      nombrePieces: extractedData.nombrePieces || '',
      typeBien: extractedData.typeBien || '',
      description: metadata.description || '',
    };

    console.log('Extracted data:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        raw: {
          markdown: markdown.substring(0, 2000), // Limiter pour debug
          metadata
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-comparable:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        fallback: true 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
