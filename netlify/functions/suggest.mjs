// Fonction Netlify — suggestions d'enchaînement DJ via ChatGPT (OpenAI, AI Gateway Netlify), texte riche.
// Tente d'abord la recherche web (gpt-4o-search-preview), puis retombe sur gpt-4o si indisponible.
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
    monter:
      "OBJECTIF : FAIRE MONTER LA PISTE. Propose des titres au tempo PLUS ÉLEVÉ que le morceau de départ (BPM supérieur), " +
      "plus intenses et explosifs, de vraies bombes de dancefloor qui font grimper l'énergie d'un cran. Évite tout ce qui est calme ou mid-tempo.",
    garder:
      "OBJECTIF : GARDER LA MÊME ÉNERGIE. Propose des titres au tempo TRÈS PROCHE (BPM quasi identique) et dans la même ambiance, " +
      "pour un enchaînement fluide et cohérent qui ne casse pas le rythme ni la vibe.",
    calmer:
      "OBJECTIF : FAIRE REDESCENDRE L'ENERGIE SANS VIDER LA PISTE. Propose du MID-TEMPO DANSANT (environ 90 a 110 BPM), " +
      "des grooves entrainants mais plus poses qui gardent les gens sur la piste. PAS de vraies ballades ni de slows trop lents (evite le < 85 BPM)."
  }[energie] || "OBJECTIF : faire monter l'énergie de la piste.";

  const prompt =
    `Tu es un DJ professionnel expérimenté qui anime des ${ambiance}. ` +
    `Je viens de passer "${track}"${artist ? " de " + artist : ""}. ` +
    `Si le morceau est récent ou peu connu, vérifie sur le web de quel morceau il s'agit avant de répondre.\n\n` +
    `${cap}\n\n` +
    `Réponds de façon concise et pratique, en français, EXACTEMENT ainsi :\n` +
    `- Une courte phrase d'intro qui précise le style, l'époque et le tempo approximatif (BPM) du morceau de départ, ET vers quel tempo on va (monter / rester / descendre).\n` +
    `- 2 ou 3 catégories courtes, chacune sur sa ligne au format "**Nom de catégorie**", suivie de 3 à 4 morceaux en puces "- Titre – Artiste original (remarque très courte, ex. BPM ou énergie)".\n` +
    `- Une dernière ligne "**Conseil calage :** ..." indiquant le/les titres les plus faciles à mixer côté tempo.\n` +
    `Uniquement des titres réels et grand public que tout le monde reconnaît (pas d'obscurités, ni reprises/remixes). ` +
    `Respecte STRICTEMENT l'objectif d'énergie ci-dessus. Sois bref et lisible sur mobile. Pas de tableau.`;

  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const key = process.env.OPENAI_API_KEY || "";

  async function callModel(payload) {
    const r = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": "Bearer " + key },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      return String(data.choices[0].message.content || "").trim();
    }
    return "";
  }

  let text = "";

  try {
    text = await callModel({
      model: "gpt-4o-search-preview",
      max_tokens: 900,
      web_search_options: {},
      messages: [{ role: "user", content: prompt }]
    });
  } catch (e) { text = ""; }

  if (!text) {
    try {
      text = await callModel({
        model: "gpt-4o",
        max_tokens: 900,
        temperature: 0.6,
        messages: [{ role: "user", content: prompt }]
      });
    } catch (e) { text = ""; }
  }

  return json({ text });
};

export const config = { path: "/api/suggest" };
