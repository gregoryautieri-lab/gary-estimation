import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PitchRequest {
  vendeur: {
    nom: string;
    prenom?: string;
  };
  motifVente?: string;
  prioriteVendeur?: string;
  horizon?: string;
  typeBien: string;
  pointsForts: string[];
  pointsFaibles: string[];
  prixEntre?: string;
  prixEt?: string;
  capitalVisibilite: {
    label: 'intact' | 'entame' | 'faible';
    pauseRecalibrage: number;
  };
  projetPostVente?: {
    nature?: string;
    avancement?: string;
    niveauCoordination?: string;
    accepteDecalage?: string;
  };
  dateDebutFormate: string;
  typeMiseEnVente: string;
  // Fallback pitch (rule-based) en cas d'erreur IA
  fallbackPitch?: string;
}

const SYSTEM_PROMPT = `Tu es un courtier immobilier GARY de Genève, expert en closing et en relation client haut de gamme.

Tu dois générer un pitch de closing personnalisé pour un rendez-vous d'estimation. Le pitch doit être:
- Empathique et adapté au contexte du vendeur
- Professionnel mais chaleureux (tutoiement après le premier échange)
- Structuré en paragraphes clairs
- En français suisse (utiliser CHF, pas €)
- Maximum 400 mots

Le pitch doit couvrir:
1. Une accroche personnalisée selon le motif de vente (succession = empathie, divorce = discrétion, mutation = coordination, etc.)
2. Valorisation du bien avec les points forts mentionnés
3. Reformulation positive des points faibles (transformer en opportunités)
4. Si capital-visibilité entamé/faible: expliquer la stratégie de recalibrage
5. La stratégie selon la priorité du vendeur (prix max vs rapidité)
6. Le timing de mise en marché
7. Si projet post-vente (achat en parallèle): proposition de coordination
8. L'estimation de prix
9. Les prochaines étapes et call-to-action

IMPORTANT: Ne jamais mentionner les termes techniques comme "capital-visibilité" au client. Reformule de manière naturelle.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: PitchRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.log("LOVABLE_API_KEY not configured, using fallback");
      return new Response(
        JSON.stringify({ 
          pitch: data.fallbackPitch || "Erreur: pitch non disponible",
          source: "fallback"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Construire le prompt utilisateur avec toutes les données
    const userPrompt = buildUserPrompt(data);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.log("Rate limited, using fallback");
        return new Response(
          JSON.stringify({ 
            pitch: data.fallbackPitch || "Limite de requêtes atteinte. Réessayez dans quelques instants.",
            source: "fallback",
            error: "rate_limited"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.log("Payment required, using fallback");
        return new Response(
          JSON.stringify({ 
            pitch: data.fallbackPitch || "Service IA temporairement indisponible.",
            source: "fallback",
            error: "payment_required"
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Fallback to rule-based pitch
      return new Response(
        JSON.stringify({ 
          pitch: data.fallbackPitch || "Erreur lors de la génération.",
          source: "fallback"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const aiPitch = result.choices?.[0]?.message?.content || "";

    if (!aiPitch) {
      return new Response(
        JSON.stringify({ 
          pitch: data.fallbackPitch || "Pas de réponse de l'IA.",
          source: "fallback"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        pitch: aiPitch,
        source: "ai"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("generate-pitch error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        source: "error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildUserPrompt(data: PitchRequest): string {
  const sections: string[] = [];
  
  sections.push(`## Informations vendeur
- Nom: ${data.vendeur.nom}
- Prénom: ${data.vendeur.prenom || 'Non renseigné'}
- Motif de vente: ${data.motifVente || 'Non précisé'}
- Priorité: ${data.prioriteVendeur || 'Équilibre prix/délai'}
- Horizon souhaité: ${data.horizon || 'Non précisé'}`);

  sections.push(`## Le bien
- Type: ${data.typeBien}
- Points forts: ${data.pointsForts.length > 0 ? data.pointsForts.join(', ') : 'À valoriser'}
- Points faibles: ${data.pointsFaibles.length > 0 ? data.pointsFaibles.join(', ') : 'Aucun mentionné'}`);

  if (data.prixEntre && data.prixEt) {
    sections.push(`## Estimation
- Fourchette: CHF ${parseInt(data.prixEntre).toLocaleString('fr-CH')} - CHF ${parseInt(data.prixEt).toLocaleString('fr-CH')}`);
  }

  sections.push(`## Capital-visibilité
- État: ${data.capitalVisibilite.label}
- Pause recalibrage recommandée: ${data.capitalVisibilite.pauseRecalibrage} semaine(s)`);

  if (data.projetPostVente?.nature) {
    sections.push(`## Projet post-vente
- Nature: ${data.projetPostVente.nature}
- Avancement: ${data.projetPostVente.avancement || 'Non précisé'}
- Coordination souhaitée: ${data.projetPostVente.niveauCoordination || 'Non précisé'}
- Accepte décalage: ${data.projetPostVente.accepteDecalage || 'Non précisé'}`);
  }

  sections.push(`## Stratégie
- Type de mise en vente: ${data.typeMiseEnVente}
- Date de lancement prévue: ${data.dateDebutFormate}`);

  sections.push(`## Instructions
Génère un pitch de closing complet et personnalisé en tenant compte de tous ces éléments. Le pitch doit être prêt à être lu par le courtier lors du rendez-vous.`);

  return sections.join('\n\n');
}
