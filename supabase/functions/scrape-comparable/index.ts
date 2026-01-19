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
  
  // Filter to keep only relevant property images (exclude icons, logos, app store badges, etc.)
  return images.filter(url => {
    const lowerUrl = url.toLowerCase();
    // Exclude known non-property images
    const isExcluded = 
      lowerUrl.includes('icon') || 
      lowerUrl.includes('logo') || 
      lowerUrl.includes('avatar') ||
      lowerUrl.includes('app-store') ||
      lowerUrl.includes('appstore') ||
      lowerUrl.includes('google-play') ||
      lowerUrl.includes('googleplay') ||
      lowerUrl.includes('play.google') ||
      lowerUrl.includes('apple.com/app') ||
      lowerUrl.includes('badge') ||
      lowerUrl.includes('sprite') ||
      lowerUrl.includes('pixel') ||
      lowerUrl.includes('tracking') ||
      lowerUrl.includes('analytics') ||
      lowerUrl.includes('facebook') ||
      lowerUrl.includes('twitter') ||
      lowerUrl.includes('instagram') ||
      lowerUrl.includes('linkedin') ||
      lowerUrl.includes('social') ||
      lowerUrl.includes('share') ||
      lowerUrl.includes('button') ||
      lowerUrl.includes('1x1') ||
      lowerUrl.includes('spacer');
    
    if (isExcluded) return false;
    
    // Must have image extension or be from CDN
    const hasImageExtension = /\.(jpg|jpeg|png|webp)/i.test(url);
    const isFromCDN = lowerUrl.includes('cdn') || lowerUrl.includes('static') || lowerUrl.includes('images');
    const isLargeEnough = !lowerUrl.includes('thumb') || lowerUrl.includes('large') || lowerUrl.includes('full');
    
    return (hasImageExtension || isFromCDN) && isLargeEnough;
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
  
  // Extraire l'adresse (NPA + localité) - pattern amélioré pour Suisse
  // Format: "1200 Genève" ou "CH-1200 Genève"
  const npaLocalitePatterns = [
    /(?:CH-)?(\d{4})\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]{2,30})(?:\s*[,\n(]|$)/gm,
    /(?:localité|commune|ville|location)[:\s]*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]{2,30})/gi,
  ];
  
  for (const pattern of npaLocalitePatterns) {
    pattern.lastIndex = 0;
    const matches = [...markdown.matchAll(new RegExp(pattern.source, pattern.flags))];
    for (const match of matches) {
      if (match[1] && match[2]) {
        // NPA + Localité
        const npa = match[1].trim();
        const localite = match[2].trim();
        // Vérifier que c'est un NPA suisse valide (1000-9999) et pas un prix
        if (/^\d{4}$/.test(npa) && parseInt(npa) >= 1000 && parseInt(npa) <= 9999) {
          data.adresse = `${npa} ${localite}`;
          break;
        }
      } else if (match[1]) {
        // Juste localité
        data.adresse = match[1].trim();
        break;
      }
    }
    if (data.adresse) break;
  }
  
  // Chercher une rue avec numéro (format suisse)
  const ruePatterns = [
    /(?:adresse|address)[:\s]*([A-Za-zÀ-ÿ\s-]+\s+\d+[a-z]?)/gi,
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]*(?:strasse|weg|platz|gasse|rue|chemin|avenue|route|boulevard|allée)\s+\d+[a-z]?)/gi,
    /(\d+[a-z]?,?\s+[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]*(?:strasse|weg|platz|gasse|rue|chemin|avenue|route|boulevard|allée))/gi,
  ];
  
  for (const pattern of ruePatterns) {
    pattern.lastIndex = 0;
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const rue = match[1].trim();
      // Ne pas utiliser si trop court ou ressemble à un titre
      if (rue.length > 5 && !rue.includes('CHF') && !rue.includes('pièce')) {
        data.adresse = data.adresse 
          ? `${rue}, ${data.adresse}` 
          : rue;
        break;
      }
    }
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

    // Ne PAS utiliser le titre comme fallback pour l'adresse car c'est souvent
    // le titre de l'annonce ("Vente Maison 11.5 pièces - CHF 2'590'000")
    // L'adresse doit être explicitement extraite du contenu
    const result: ScrapedData = {
      source,
      adresse: extractedData.adresse || '', // Pas de fallback sur le titre
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
