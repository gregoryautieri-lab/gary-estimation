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

interface AIExtractedData {
  prix?: string;
  surface?: string;
  nombrePieces?: string;
  typeBien?: string;
  localite?: string;
  npa?: string;
  rue?: string;
  images?: string[];
  bestImageUrl?: string;
}

// Extraction patterns améliorés pour les portails immobiliers suisses
const EXTRACTION_PATTERNS = {
  immoscout: {
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
  const cleaned = priceStr.replace(/['',.\s]/g, '');
  const num = parseInt(cleaned, 10);
  if (isNaN(num) || num < 10000) return '';
  return cleaned;
}

function extractBestMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
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
  
  // Extract from HTML - img src
  if (html) {
    const htmlPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = htmlPattern.exec(html)) !== null) {
      const url = match[1];
      if (url && !url.includes('data:') && !url.includes('placeholder') && !images.includes(url)) {
        images.push(url);
      }
    }
    
    // Extract og:image meta tags
    const ogPattern = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    while ((match = ogPattern.exec(html)) !== null) {
      const url = match[1];
      if (url && !images.includes(url)) {
        images.unshift(url); // Prioritize og:image
      }
    }
  }
  
  // Filter to keep only relevant property images
  return images.filter(url => {
    const lowerUrl = url.toLowerCase();
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
      lowerUrl.includes('playstore') ||
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
      lowerUrl.includes('spacer') ||
      lowerUrl.includes('.svg') ||
      lowerUrl.includes('favicon') ||
      lowerUrl.includes('emoji');
    
    if (isExcluded) return false;
    
    const hasImageExtension = /\.(jpg|jpeg|png|webp)/i.test(url);
    const isFromCDN = lowerUrl.includes('cdn') || lowerUrl.includes('static') || lowerUrl.includes('images') || lowerUrl.includes('media');
    const isLargeEnough = !lowerUrl.includes('thumb') || lowerUrl.includes('large') || lowerUrl.includes('full') || lowerUrl.includes('1024') || lowerUrl.includes('800');
    
    return (hasImageExtension || isFromCDN) && isLargeEnough;
  }).slice(0, 10);
}

function extractDataFromMarkdown(markdown: string, source: string, html?: string): Partial<ScrapedData> {
  const patterns = getPatterns(source);
  const data: Partial<ScrapedData> = { source };
  
  // Combine markdown and HTML metadata for better extraction
  const combinedText = markdown + '\n' + (html || '');
  
  // Extract from meta description if available
  const metaDescMatch = html?.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const metaDescription = metaDescMatch?.[1] || '';
  const fullText = markdown + '\n' + metaDescription;
  
  // Extraire le prix
  const prixRaw = extractBestMatch(fullText, patterns.prix);
  if (prixRaw) {
    const cleaned = cleanPrice(prixRaw);
    if (cleaned) {
      data.prix = cleaned;
    }
  }
  
  // Extraire la surface
  const surfaceRaw = extractBestMatch(fullText, patterns.surface);
  if (surfaceRaw) {
    const surfaceNum = parseInt(surfaceRaw.replace(/\D/g, ''), 10);
    if (!isNaN(surfaceNum) && surfaceNum > 10 && surfaceNum < 10000) {
      data.surface = surfaceNum.toString();
    }
  }
  
  // Extraire le nombre de pièces
  const piecesRaw = extractBestMatch(fullText, patterns.pieces);
  if (piecesRaw) {
    data.nombrePieces = piecesRaw.replace(',', '.');
  }
  
  // Extraire l'adresse (NPA + localité)
  const npaLocalitePatterns = [
    /(?:CH-)?(\d{4})\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]{2,30})(?:\s*[,\n(]|$)/gm,
    /(?:localité|commune|ville|location)[:\s]*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]{2,30})/gi,
  ];
  
  for (const pattern of npaLocalitePatterns) {
    pattern.lastIndex = 0;
    const matches = [...fullText.matchAll(new RegExp(pattern.source, pattern.flags))];
    for (const match of matches) {
      if (match[1] && match[2]) {
        const npa = match[1].trim();
        const localite = match[2].trim();
        if (/^\d{4}$/.test(npa) && parseInt(npa) >= 1000 && parseInt(npa) <= 9999) {
          data.adresse = `${npa} ${localite}`;
          break;
        }
      } else if (match[1]) {
        data.adresse = match[1].trim();
        break;
      }
    }
    if (data.adresse) break;
  }
  
  // Chercher une rue
  const ruePatterns = [
    /(?:adresse|address)[:\s]*([A-Za-zÀ-ÿ\s-]+\s+\d+[a-z]?)/gi,
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]*(?:strasse|weg|platz|gasse|rue|chemin|avenue|route|boulevard|allée)\s+\d+[a-z]?)/gi,
  ];
  
  for (const pattern of ruePatterns) {
    pattern.lastIndex = 0;
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const rue = match[1].trim();
      if (rue.length > 5 && !rue.includes('CHF') && !rue.includes('pièce')) {
        data.adresse = data.adresse 
          ? `${rue}, ${data.adresse}` 
          : rue;
        break;
      }
    }
  }
  
  // Détecter le type de bien
  if (/appartement|wohnung|apartment/i.test(fullText)) {
    data.typeBien = 'appartement';
  } else if (/maison|villa|haus|house/i.test(fullText)) {
    data.typeBien = 'maison';
  } else if (/terrain|bauland|land/i.test(fullText)) {
    data.typeBien = 'terrain';
  }
  
  // Extraire les images
  data.images = extractImages(markdown, html || '');
  
  return data;
}

// AI fallback using Lovable AI to extract data when regex fails
async function extractWithAI(markdown: string, html: string, source: string): Promise<AIExtractedData | null> {
  try {
    // Get the Supabase URL from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('Supabase credentials not available for AI fallback');
      return null;
    }

    // Extract meta description and og:image for context
    const metaDescMatch = html?.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch?.[1] || '';
    
    // Get og:image URLs
    const ogImages: string[] = [];
    const ogPattern = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
    let ogMatch;
    while ((ogMatch = ogPattern.exec(html)) !== null) {
      if (ogMatch[1]) ogImages.push(ogMatch[1]);
    }
    
    // Prepare a concise prompt for the AI
    const textContent = (metaDescription + '\n' + markdown).substring(0, 4000);
    
    const prompt = `Tu es un extracteur de données immobilières. Analyse ce texte d'annonce immobilière suisse et extrais les informations suivantes en JSON:

TEXTE DE L'ANNONCE:
${textContent}

IMAGES DISPONIBLES:
${ogImages.slice(0, 5).join('\n')}

Extrais et retourne UNIQUEMENT un JSON valide avec ces champs (laisse vide si non trouvé):
{
  "prix": "prix en chiffres sans espaces ni apostrophes (ex: 1890000)",
  "surface": "surface habitable en m² (juste le chiffre)",
  "nombrePieces": "nombre de pièces (ex: 5.5)",
  "typeBien": "appartement ou maison ou terrain",
  "localite": "nom de la commune/ville",
  "npa": "code postal suisse 4 chiffres",
  "rue": "nom de rue avec numéro si disponible",
  "bestImageUrl": "URL de la meilleure photo du bien (pas logo/icône)"
}

Réponds UNIQUEMENT avec le JSON, sans explication.`;

    console.log('Calling Lovable AI for extraction...');
    
    // Call Lovable AI via the ai-chat function pattern
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'google/gemini-2.5-flash-lite', // Fast and cheap model
      }),
    });

    if (!response.ok) {
      console.log('AI chat function not available, skipping AI extraction');
      return null;
    }

    const aiResult = await response.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || aiResult.content || '';
    
    console.log('AI response received:', aiContent.substring(0, 200));
    
    // Parse the JSON response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('No valid JSON found in AI response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as AIExtractedData;
    
    // Add og:images if AI found a best image
    if (parsed.bestImageUrl) {
      parsed.images = [parsed.bestImageUrl, ...ogImages.filter(img => img !== parsed.bestImageUrl)];
    } else if (ogImages.length > 0) {
      parsed.images = ogImages;
    }
    
    console.log('AI extracted data:', parsed);
    return parsed;
    
  } catch (error) {
    console.error('AI extraction error:', error);
    return null;
  }
}

function mergeData(regexData: Partial<ScrapedData>, aiData: AIExtractedData | null): ScrapedData {
  const source = regexData.source || 'Web';
  
  // Start with regex data
  const result: ScrapedData = {
    source,
    adresse: regexData.adresse || '',
    prix: regexData.prix || '',
    surface: regexData.surface || '',
    nombrePieces: regexData.nombrePieces || '',
    typeBien: regexData.typeBien || '',
    description: regexData.description || '',
    images: regexData.images || [],
  };
  
  if (!aiData) return result;
  
  // Fill in missing data from AI
  if (!result.prix && aiData.prix) {
    const cleaned = cleanPrice(aiData.prix);
    if (cleaned) result.prix = cleaned;
  }
  
  if (!result.surface && aiData.surface) {
    const surfaceNum = parseInt(aiData.surface.replace(/\D/g, ''), 10);
    if (!isNaN(surfaceNum) && surfaceNum > 10 && surfaceNum < 10000) {
      result.surface = surfaceNum.toString();
    }
  }
  
  if (!result.nombrePieces && aiData.nombrePieces) {
    result.nombrePieces = aiData.nombrePieces.replace(',', '.');
  }
  
  if (!result.typeBien && aiData.typeBien) {
    const typeLower = aiData.typeBien.toLowerCase();
    if (['appartement', 'maison', 'terrain'].includes(typeLower)) {
      result.typeBien = typeLower;
    }
  }
  
  // Build address from AI data if missing
  if (!result.adresse) {
    const parts: string[] = [];
    if (aiData.rue) parts.push(aiData.rue);
    if (aiData.npa && aiData.localite) {
      parts.push(`${aiData.npa} ${aiData.localite}`);
    } else if (aiData.localite) {
      parts.push(aiData.localite);
    }
    if (parts.length > 0) {
      result.adresse = parts.join(', ');
    }
  }
  
  // Prefer AI images if regex found none or only excluded ones
  if ((!result.images || result.images.length === 0) && aiData.images && aiData.images.length > 0) {
    result.images = aiData.images.slice(0, 10);
  }
  
  return result;
}

serve(async (req) => {
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

    const source = detectSource(url);
    console.log('Scraping URL:', url, 'Source:', source);

    // Call Firecrawl
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: false, // Get full page for better image extraction
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

    const markdown = firecrawlData.data?.markdown || '';
    const html = firecrawlData.data?.html || '';
    const metadata = firecrawlData.data?.metadata || {};
    
    // Step 1: Try regex extraction
    const regexData = extractDataFromMarkdown(markdown, source, html);
    regexData.description = metadata.description || '';
    
    // Step 2: Check if we need AI fallback
    const needsAI = !regexData.prix || !regexData.surface || !regexData.adresse || 
                    !regexData.images || regexData.images.length === 0;
    
    let aiData: AIExtractedData | null = null;
    if (needsAI) {
      console.log('Regex extraction incomplete, trying AI fallback...');
      aiData = await extractWithAI(markdown, html, source);
    }
    
    // Step 3: Merge data
    const result = mergeData(regexData, aiData);
    
    console.log('Final extracted data:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        aiUsed: aiData !== null,
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
