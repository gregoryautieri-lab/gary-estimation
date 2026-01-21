import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { renderSVG } from "https://esm.sh/uqr@0.1.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UNIQODE_API_BASE = 'https://api.uniqode.com/api/2.0';
const ORGANIZATION_ID = '781643';

interface CreateQRRequest {
  action: 'create';
  campagneCode: string;
  destinationUrl: string;
}

interface StatsQRRequest {
  action: 'stats';
  uniqodeId: string;
}

type RequestBody = CreateQRRequest | StatsQRRequest;

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key
    const apiKey = Deno.env.get('UNIQODE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Clé API Uniqode non configurée' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();

    // Route based on action
    if (body.action === 'create') {
      return await handleCreate(body, apiKey);
    } else if (body.action === 'stats') {
      return await handleStats(body, apiKey);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Action non reconnue' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne';
    console.error('Error in uniqode-qr:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCreate(body: CreateQRRequest, apiKey: string): Promise<Response> {
  const { campagneCode, destinationUrl } = body;

  if (!campagneCode || !destinationUrl) {
    return new Response(
      JSON.stringify({ success: false, error: 'campagneCode et destinationUrl sont requis' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Create dynamic QR code using Uniqode API
    const createResponse = await fetch(`${UNIQODE_API_BASE}/qrcodes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: campagneCode,
        organization: parseInt(ORGANIZATION_ID),
        qr_type: 2, // Dynamic QR
        campaign: {
          content_type: 1, // Website URL
          custom_url: destinationUrl,
        },
        template: 10067345, // GARY branded template (logo, colors, frame)
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Uniqode API error:', errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erreur Uniqode: ${createResponse.status}`,
          details: errorText
        }),
        { status: createResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const qrData = await createResponse.json();
    const qrId = qrData.id;
    const trackingUrl = qrData.url || qrData.short_url || qrData.tracking_link || null;

    // Try to get the QR image URL from Uniqode
    // Option 1: Fetch the QR code details to get the actual image URL (not template)
    let qrImageUrl: string | null = null;
    
    if (qrId) {
      // Wait a short moment for Uniqode to generate the image
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Fetch QR code details to get the actual image URL
      const detailsResponse = await fetch(`${UNIQODE_API_BASE}/qrcodes/${qrId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        console.log('QR details response:', JSON.stringify(detailsData, null, 2));
        
        // Try various possible fields for image URL
        qrImageUrl = 
          detailsData.image_url ||
          detailsData.png_url ||
          detailsData.download_url ||
          detailsData.qr_image ||
          detailsData.attributes?.image_url ||
          null;
          
        // If we have attributes with a thumbnail that matches THIS QR id (not template)
        if (!qrImageUrl && detailsData.attributes) {
          const attrs = detailsData.attributes;
          // Check if thumbnail URLs contain the QR id (not template id)
          if (attrs.thumbnail_url_png && attrs.thumbnail_url_png.includes(`/${qrId}/`)) {
            qrImageUrl = attrs.thumbnail_url_png;
          } else if (attrs.thumbnail_url && attrs.thumbnail_url.includes(`/${qrId}/`)) {
            qrImageUrl = attrs.thumbnail_url;
          }
        }
        
        // Construct URL based on pattern (organization/qr-codes/qrId/png/qrcode-512.png)
        if (!qrImageUrl) {
          const constructedUrl = `https://beaconstac-content.s3.amazonaws.com/${ORGANIZATION_ID}/qr-codes/${qrId}/png/qrcode-512.png`;
          // Test if this URL is accessible
          try {
            const testResponse = await fetch(constructedUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              qrImageUrl = constructedUrl;
            }
          } catch (e) {
            console.log('Constructed URL not accessible:', constructedUrl);
          }
        }
      }
    }

    // Fallback: generate SVG locally if no Uniqode image URL available
    if (!qrImageUrl && trackingUrl) {
      try {
        const svg = renderSVG(trackingUrl);
        qrImageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        console.log('Using fallback SVG generation');
      } catch (e) {
        console.error('Failed to generate fallback SVG:', e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        uniqodeId: qrId?.toString(),
        trackingUrl,
        qrImageUrl,
        rawResponse: qrData, // For debugging
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur création QR';
    console.error('Error creating QR:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function handleStats(body: StatsQRRequest, apiKey: string): Promise<Response> {
  const { uniqodeId } = body;

  if (!uniqodeId) {
    return new Response(
      JSON.stringify({ success: false, error: 'uniqodeId est requis' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get QR code analytics
    const analyticsResponse = await fetch(
      `${UNIQODE_API_BASE}/qrcodes/${uniqodeId}/analytics/`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!analyticsResponse.ok) {
      // Try alternative endpoint
      const altResponse = await fetch(
        `${UNIQODE_API_BASE}/qrcodes/${uniqodeId}/`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!altResponse.ok) {
        const errorText = await altResponse.text();
        console.error('Uniqode stats error:', errorText);
        return new Response(
          JSON.stringify({ success: false, error: `Erreur Uniqode: ${altResponse.status}` }),
          { status: altResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const qrInfo = await altResponse.json();
      return new Response(
        JSON.stringify({
          success: true,
          totalScans: qrInfo.total_scans || qrInfo.scan_count || qrInfo.scans || 0,
          scansByDay: [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const analyticsData = await analyticsResponse.json();

    // Parse analytics data
    const totalScans = analyticsData.total_scans || analyticsData.scan_count || 0;
    const scansByDay = analyticsData.scans_by_date || analyticsData.daily_scans || [];

    return new Response(
      JSON.stringify({
        success: true,
        totalScans,
        scansByDay: Array.isArray(scansByDay) ? scansByDay.map((s: any) => ({
          date: s.date || s.day,
          scans: s.scans || s.count || 0,
        })) : [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur stats QR';
    console.error('Error getting stats:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
