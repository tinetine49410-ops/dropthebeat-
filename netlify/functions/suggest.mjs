// Fonction Netlify — suggestions d'enchaînement DJ via Gemini (AI Gateway Netlify).
// Aucune clé à gérer : Netlify injecte GEMINI_API_KEY et GOOGLE_GEMINI_BASE_URL automatiquement.
export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ text: "" });

  let body = {};
  try { body = await req.json(); } catch (e) { body = {}; }

  const track = String(body.track || "").slice(0, 120);
  const artist = String(body.artist || "").slice(0, 120);
  const ambiance = String(body.ambiance || "soirée dansante festive").slice(0, 80);
  const energie = String(body.energie || "monter").slice(0, 20);
  if (!track) return json({ text: "" });

  const cap = {
    monter: "fais MONTER l'énergie de la piste",
    garder: "GARDE le même niveau d'énergie",
    calmer: "fais légèrement REDESCENDRE l'énergie"
  }[energie] || "fais monter l'énergie";

  const prompt =
    `Tu es un DJ professionnel expérimenté qui anime des ${ambiance}. ` +
    `Je viens de passer "${track}"${artist ? " de " + artist : ""} et je cherche quoi enchaîner (objectif : ${cap}).\n\n` +
    `Réponds de façon concise et pratique, en français, ainsi :\n` +
    `- Une phrase d'intro qui précise le style, l'époque et le tempo approximatif (BPM) du morceau.\n` +
    `- 2 ou 3 catégories courtes (titrées), chacune avec 3 à 4 morceaux CONNUS et fédérateurs, cohérents avec le style. Format de chaque morceau : « Titre – Artiste original » suivi éventuellement d'une remarque très courte entre parenthèses.\n` +
    `- Une dernière ligne « Conseil calage : ... » indiquant le/les titres les plus faciles à mixer côté tempo.\n` +
    `Uniquement des titres réels et grand public (pas d'obscurités, ni reprises/remixes). Reste bref et lisible sur mobile. N'utilise pas de tableau, juste des listes à puces avec le tiret "-".`;

  const base = (process.env.GOOGLE_GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
  const key = process.env.GEMINI_API_KEY || "";
  const model = "gemini-3.5-flash";

  try {
    const r = await fetch(base + "/v1beta/models/" + model + ":generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });

    const data = await r.json();
    let text = "";
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content &&
        Array.isArray(data.candidates[0].content.parts)) {
      text = data.candidates[0].content.parts.map(p => p.text || "").join("").trim();
    }

    return json({ text });
  } catch (e) {
    return json({ text: "", error: String(e) });
  }
};

export const config = { path: "/api/suggest" };
