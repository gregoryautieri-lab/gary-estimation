import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TelegramNotificationRequest {
  leadNom: string;
  leadPrenom?: string;
  leadTelephone?: string;
  leadEmail?: string;
  leadSource: string;
  leadType: string;
  leadAdresse?: string;
  leadNpa?: string;
  leadLocalite?: string;
  courtierNom?: string;
  leadUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }

    if (!TELEGRAM_CHAT_ID) {
      throw new Error("TELEGRAM_CHAT_ID is not configured");
    }

    const data: TelegramNotificationRequest = await req.json();

    if (!data.leadNom) {
      throw new Error("Missing required field: leadNom");
    }

    const sourceLabels: Record<string, string> = {
      boitage: "📬 Boîtage",
      reseaux_sociaux: "📱 Réseaux sociaux",
      telephone: "📞 Téléphone",
      recommandation: "🤝 Recommandation",
      partenariat: "🏢 Partenariat",
      site_web: "🌐 Site web",
      salon: "🎪 Salon/Event",
      autre: "📋 Autre"
    };

    const typeLabels: Record<string, string> = {
      estimation: "🏠 Demande d'estimation",
      a_qualifier: "❓ À qualifier"
    };

    const nomComplet = data.leadPrenom 
      ? `${data.leadPrenom} ${data.leadNom}` 
      : data.leadNom;

    // Build message with Telegram markdown
    let message = `🚨 *NOUVEAU LEAD*\n\n`;
    message += `👤 *${nomComplet}*\n`;
    
    if (data.leadTelephone) {
      message += `📞 ${data.leadTelephone}\n`;
    }
    if (data.leadEmail) {
      message += `✉️ ${data.leadEmail}\n`;
    }
    
    message += `\n📊 *Source:* ${sourceLabels[data.leadSource] || data.leadSource}\n`;
    message += `📋 *Type:* ${typeLabels[data.leadType] || data.leadType}\n`;
    
    if (data.leadAdresse) {
      const adresseComplete = [
        data.leadAdresse,
        data.leadNpa,
        data.leadLocalite
      ].filter(Boolean).join(", ");
      message += `📍 ${adresseComplete}\n`;
    }
    
    if (data.courtierNom) {
      message += `\n👔 *Assigné à:* ${data.courtierNom}\n`;
    }
    
    message += `\n🔗 [Voir dans GARY](${data.leadUrl})`;

    console.log(`Sending Telegram notification to chat ${TELEGRAM_CHAT_ID}`);

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error("Telegram API error:", telegramResult);
      throw new Error(telegramResult.description || "Failed to send Telegram message");
    }

    console.log("Telegram notification sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-telegram-notification:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
