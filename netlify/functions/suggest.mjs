// Fonction Netlify — suggestions d'enchaînement DJ via l'IA (Claude, AI Gateway Netlify).
// Aucune clé à gérer : Netlify injecte ANTHROPIC_API_KEY et ANTHROPIC_BASE_URL automatiquement.
export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ suggestions: [] });

  let body = {};
  try { body = await req.json(); } catch (e) { body = {}; }

  const track = String(body.track || "").slice(0, 120);
  const artist = String(body.artist || "").slice(0, 120);
  const ambiance = String(body.ambiance || "soirée dansante festive").slice(0, 80);
  const energie = String(body.energie || "monter").slice(0, 20);
  if (!track) return json({ suggestions: [] });

  const cap = {
    monter: "fais MONTER l'énergie : titres au tempo égal ou légèrement supérieur, plus dansants et fédérateurs",
    garder: "GARDE le même niveau d'énergie et un tempo (BPM) très proche, pour une transition fluide",
    calmer: "fais légèrement REDESCENDRE l'énergie, tempo un peu plus lent, mais toujours agréable et connu"
  }[energie] || "fais monter l'énergie";

  const prompt =
    `Tu es un DJ professionnel expérimenté qui anime des ${ambiance}.\n` +
    `Je viens de passer "${track}"${artist ? " de " + artist : ""}.\n\n` +
    `Étape 1 — analyse (en interne, ne l'écris pas) : identifie le style/genre précis, l'époque, le tempo approximatif (BPM), la langue et le pays musical de ce morceau.\n` +
    `Étape 2 — propose 6 titres à enchaîner juste après. Objectif : ${cap}.\n\n` +
    `RÈGLES (dans cet ordre de priorité) :\n` +
    `1. COHÉRENCE avant tout : reste dans la MÊME famille musicale et la même vibe que le morceau de départ (ex : si c'est du latino/reggaeton, propose du latino/reggaeton ; si c'est du festif français, propose du festif français). Ne pars pas vers un "tube de soirée" générique qui n'a rien à voir.\n` +
    `2. TEMPO compatible : privilégie des morceaux dont le BPM permet un enchaînement fluide (proche du tempo de départ).\n` +
    `3. NOTORIÉTÉ : uniquement des titres connus et fédérateurs que le grand public reconnaît et qui remplissent une piste. Pas de morceaux obscurs ni underground.\n` +
    `4. Nom de l'ARTISTE ORIGINAL exact (jamais de reprises, remixes obscurs, karaoké ou covers). Un artiste différent par titre. Ne repropose pas le morceau de départ.\n\n` +
    `Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte autour, ` +
    `au format: [{"title":"Titre","artist":"Artiste original"}]`;

  const base = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  const key = process.env.ANTHROPIC_API_KEY || "";

  try {
    const r = await fetch(base.replace(/\/$/, "") + "/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        temperature: 0.6,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await r.json();
    let text = "";
    if (data && Array.isArray(data.content)) {
      text = data.content.filter(b => b && b.type === "text").map(b => b.text).join("");
    }

    let list = [];
    try {
      const m = text.match(/\[[\s\S]*\]/);
      list = JSON.parse(m ? m[0] : text);
    } catch (e) { list = []; }

    if (!Array.isArray(list)) list = [];
    list = list
      .filter(x => x && x.title)
      .map(x => ({ title: String(x.title).slice(0, 120), artist: String(x.artist || "").slice(0, 120) }))
      .slice(0, 8);

    return json({ suggestions: list });
  } catch (e) {
    return json({ suggestions: [], error: String(e) });
  }
};

export const config = { path: "/api/suggest" };
