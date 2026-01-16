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

// Extraction patterns améliorés pour les portails immobiliers suisses
const EXTRACTION_PATTERNS = {
  immoscout: {
    // Capture prix avec apostrophes suisses: 1'890'000 ou 1890000
    prix: [
      /CHF\s*([\d'',.\s]+)/gi,
      /prix[:\s]*(?:CHF\s*)?([\d'',.\s]+)/gi,
      /([\d'',.\s]{6,})\s*(?:CHF|Fr\.)/gi,
    ],
    surface: [
      /surface\s*(?:habitable)?[:\s]*(\d+)\s*m[²2]/gi,
      /(\d+)\s*m[²2]\s*(?:habitable|surface)/gi,
      /(\d+)\s*m[²2]/gi,
    ],
    pieces: [
      /(\d+(?:[.,]\d+)?)\s*(?:pièces?|pi[eè]ces?|Zimmer|rooms?)/gi,
    ],
  },
  homegate: {
    prix: [
      /CHF\s*([\d'',.\s]+)/gi,
      /prix[:\s]*(?:CHF\s*)?([\d'',.\s]+)/gi,
      /([\d'',.\s]{6,})\s*(?:CHF|Fr\.)/gi,
    ],
    surface: [
      /surface\s*(?:habitable)?[:\s]*(\d+)\s*m[²2]/gi,
      /(\d+)\s*m[²2]\s*(?:habitable|surface)/gi,
      /(\d+)\s*m[²2]/gi,
    ],
    pieces: [
      /(\d+(?:[.,]\d+)?)\s*(?:pièces?|pi[eè]ces?|rooms?)/gi,
    ],
  },
  generic: {
    prix: [
      /CHF\s*([\d'',.\s]+)/gi,
      /(?:prix|price)[:\s]*(?:CHF\s*)?([\d'',.\s]+)/gi,
    ],
    surface: [
      /(\d+)\s*m[²2]/gi,
    ],
    pieces: [
      /(\d+(?:[.,]\d+)?)\s*(?:pièces?|pi[eè]ces?|Zimmer|rooms?)/gi,
    ],
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
  // Nettoyer: "1'890'000" ou "1 890 000" ou "1,890,000" -> "1890000"
  const cleaned = priceStr.replace(/['',.\s]/g, '');
  // Vérifier que c'est un nombre valide et réaliste (> 10000 pour l'immobilier)
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num < 10000) return '';
  return cleaned;
}

function extractBestMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    const matches = [...text.matchAll(new RegExp(pattern.source, pattern.flags))];
    for (const match of matches) {
      if (match[1]) {
        return match[1].trim();
      }
    }
  }
  return null;
}

function extractImages(markdown: string, html: string): string[] {
  const images: string[] = [];
  
  // Extract from markdown ![alt](url)
  const mdPattern = /!\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = mdPattern.exec(markdown)) !== null) {
    const url = match[1];
    if (url && !url.includes('data:') && !url.includes('placeholder')) {
      images.push(url);
    }
  }
  
  // Extract from HTML if available
  if (html) {
    const htmlPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = htmlPattern.exec(html)) !== null) {
      const url = match[1];
      if (url && !url.includes('data:') && !url.includes('placeholder') && !images.includes(url)) {
        images.push(url);
      }
    }
  }
  
  // Filter to keep only relevant property images (exclude icons, logos, etc.)
  return images.filter(url => {
    const isLargeImage = !url.includes('icon') && !url.includes('logo') && !url.includes('avatar');
    const hasImageExtension = /\.(jpg|jpeg|png|webp)/i.test(url) || url.includes('image') || url.includes('photo');
    return isLargeImage && (hasImageExtension || url.includes('cdn') || url.includes('static'));
  }).slice(0, 10); // Limit to 10 images
}

function extractDataFromMarkdown(markdown: string, source: string, html?: string): Partial<ScrapedData> {
  const patterns = getPatterns(source);
  const data: Partial<ScrapedData> = { source };
  
  // Extraire le prix - essayer plusieurs patterns
  const prixRaw = extractBestMatch(markdown, patterns.prix);
  if (prixRaw) {
    const cleaned = cleanPrice(prixRaw);
    if (cleaned) {
      data.prix = cleaned;
    }
  }
  
  // Extraire la surface
  const surfaceRaw = extractBestMatch(markdown, patterns.surface);
  if (surfaceRaw) {
    const surfaceNum = parseInt(surfaceRaw.replace(/\D/g, ''), 10);
    if (!isNaN(surfaceNum) && surfaceNum > 10 && surfaceNum < 10000) {
      data.surface = surfaceNum.toString();
    }
  }
  
  // Extraire le nombre de pièces
  const piecesRaw = extractBestMatch(markdown, patterns.pieces);
  if (piecesRaw) {
    data.nombrePieces = piecesRaw.replace(',', '.');
  }
  
  // Extraire l'adresse (NPA + localité)
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
  
  // Extraire les images
  data.images = extractImages(markdown, html || '');
  
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

    // Appeler Firecrawl pour scraper la page (avec HTML pour les images)
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
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

    // Extraire les données du markdown et HTML
    const markdown = firecrawlData.data?.markdown || '';
    const html = firecrawlData.data?.html || '';
    const extractedData = extractDataFromMarkdown(markdown, source, html);

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
      images: extractedData.images || [],
    };

    console.log('Extracted data:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        raw: {
          markdownPreview: markdown.substring(0, 500),
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
