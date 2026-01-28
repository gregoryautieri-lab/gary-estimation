import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LeadNotificationRequest {
  courtierEmail: string;
  courtierNom: string;
  leadNom: string;
  leadPrenom?: string;
  leadSource: string;
  leadType: string;
  leadNotes?: string;
  leadUrl: string;
  leadTelephone?: string;
  leadEmail?: string;
  leadAdresse?: string;
  leadNpa?: string;
  leadLocalite?: string;
  leadCreatedAt: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const data: LeadNotificationRequest = await req.json();
    
    // Validate required fields
    if (!data.courtierEmail || !data.courtierNom || !data.leadNom) {
      throw new Error("Missing required fields: courtierEmail, courtierNom, leadNom");
    }
    
    const sourceLabels: Record<string, string> = {
      boitage: "Boîtage",
      reseaux_sociaux: "Réseaux sociaux",
      telephone: "Téléphone",
      recommandation: "Recommandation",
      partenariat: "Partenariat",
      site_web: "Site web",
      salon: "Salon/Event",
      autre: "Autre"
    };
    
    const typeLabels: Record<string, string> = {
      estimation: "Demande d'estimation",
      a_qualifier: "À qualifier"
    };
    
    const nomComplet = data.leadPrenom 
      ? `${data.leadPrenom} ${data.leadNom}` 
      : data.leadNom;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau lead assigné</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FA4238 0%, #E63B31 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏠 Nouveau lead assigné</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #1a2e35; margin: 0 0 20px 0;">
              Bonjour <strong>${data.courtierNom}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #64748b; margin: 0 0 25px 0;">
              Un nouveau lead vient de vous être assigné :
            </p>
            
            <!-- Lead details card -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 25px; border-left: 4px solid #FA4238;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong style="color: #1a2e35;">Nom :</strong> ${nomComplet}
              </p>
              ${data.leadTelephone ? `
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong style="color: #1a2e35;">Téléphone :</strong> ${data.leadTelephone}
              </p>
              ` : ''}
              ${data.leadEmail ? `
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong style="color: #1a2e35;">Email :</strong> ${data.leadEmail}
              </p>
              ` : ''}
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong style="color: #1a2e35;">Source :</strong> ${sourceLabels[data.leadSource] || data.leadSource}
              </p>
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong style="color: #1a2e35;">Type :</strong> ${typeLabels[data.leadType] || data.leadType}
              </p>
              ${data.leadAdresse ? `
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong style="color: #1a2e35;">Adresse :</strong> ${data.leadAdresse}${data.leadNpa ? `, ${data.leadNpa}` : ''} ${data.leadLocalite || ''}
              </p>
              ` : ''}
              ${data.leadNotes ? `
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;">
                <strong style="color: #1a2e35;">Notes :</strong> ${data.leadNotes}
              </p>
              ` : ''}
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                <strong style="color: #1a2e35;">Reçu le :</strong> ${new Date(data.leadCreatedAt).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 25px;">
              <a href="${data.leadUrl}" 
                 style="display: inline-block; background: #FA4238; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Voir le lead dans GARY
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">
              Cet email a été envoyé automatiquement par GARY.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    console.log(`Sending lead notification email to ${data.courtierEmail}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GARY <onboarding@resend.dev>",
        to: [data.courtierEmail],
        subject: `🏠 Nouveau lead : ${nomComplet}`,
        html: htmlContent,
      }),
    });

    const result = await res.json();
    
    if (!res.ok) {
      console.error("Resend API error:", result);
      throw new Error(result.message || "Failed to send email");
    }

    console.log("Email sent successfully:", result);
    
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-lead-notification:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  }
});
