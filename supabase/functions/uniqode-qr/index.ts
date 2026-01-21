import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

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

    // The Uniqode "download" endpoint we tried returns 404 in this account/config.
    // To always display a working QR inside the app, we generate a PNG data URL from the tracking URL.
    // Scanning it redirects to the configured destination URL (as Uniqode manages the redirect).
    let qrImageUrl: string | null = null;
    try {
      const textToEncode = trackingUrl || destinationUrl;
      qrImageUrl = await QRCode.toDataURL(textToEncode, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: 'H',
        type: 'image/png',
      });
    } catch (e) {
      console.error('Failed to generate QR data URL:', e);
      qrImageUrl = null;
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
          totalScans: qrInfo.total_scans || qrInfo.scan_count || 0,
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
