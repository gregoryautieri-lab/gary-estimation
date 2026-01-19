import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedTransaction {
  date: string | null;
  typeBien: "appartement" | "maison" | null;
  prix: number | null;
  acheteurs: string | null;
  vendeurs: string | null;
  adresse: string | null;
  codePostal: string | null;
  localite: string | null;
  surfaceParcelle: number | null;
  parcelles: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rawText } = await req.json();

    if (!rawText || typeof rawText !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: "Aucune donnée fournie" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to extract structured transactions
    const systemPrompt = `Tu es un assistant spécialisé dans l'extraction de données immobilières.
Tu reçois un tableau de transactions immobilières (format Popety.io ou similaire).
Tu dois extraire CHAQUE transaction et retourner un JSON structuré.

Règles d'extraction:
1. TYPE: "PPE" = appartement, "B-F" (bien-fonds) = maison
2. PRIX: Le montant en CHF (nombre entier)
3. ADRESSE: Prendre UNIQUEMENT la première adresse si plusieurs (séparées par ;)
4. CODE POSTAL: Extraire le NPA (4 chiffres) de l'adresse
5. LOCALITÉ: Extraire le nom de la commune après le NPA
6. SURFACE PARCELLE: Pour les B-F uniquement, extraire la surface en m² depuis les détails (ex: "2380 m2")
7. DATE: Format YYYY-MM-DD
8. ACHETEURS/VENDEURS: Noms complets, tels que dans le tableau

Retourne UNIQUEMENT un JSON valide avec cette structure:
{
  "transactions": [
    {
      "date": "2025-12-05",
      "typeBien": "appartement",
      "prix": 13000000,
      "acheteurs": "MILLET Jean-Pierre",
      "vendeurs": "SQUARE PROPERTIES SA",
      "adresse": "Chemin de la Tour-Carrée 14",
      "codePostal": "1223",
      "localite": "Cologny",
      "surfaceParcelle": null,
      "parcelles": "17/2436"
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extrait toutes les transactions de ce tableau:\n\n${rawText}` }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Limite de requêtes atteinte, réessayez plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let parsedData: { transactions: ParsedTransaction[] };
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Content:", content);
      return new Response(
        JSON.stringify({ success: false, error: "Erreur de parsing des données IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transactions = parsedData.transactions || [];
    console.log(`AI extracted ${transactions.length} transactions`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactions,
        parsedCount: transactions.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
