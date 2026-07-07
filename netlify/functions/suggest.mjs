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
    monter: "fais clairement MONTER l'énergie de la piste, vers des morceaux plus dansants et fédérateurs",
    garder: "GARDE le même niveau d'énergie, dans une continuité cohérente d'ambiance et de tempo",
    calmer: "fais légèrement REDESCENDRE l'énergie, vers des morceaux plus posés mais toujours agréables"
  }[energie] || "fais monter l'énergie de la piste";

  const prompt =
    `Tu es un DJ professionnel très expérimenté qui anime des ${ambiance}. ` +
    `Tu connais aussi bien les gros tubes que les pépites moins évidentes, toutes époques confondues.\n` +
    `Je viens de passer le titre "${track}"${artist ? " de " + artist : ""}.\n` +
    `Analyse son style, son époque, son tempo et son ambiance, puis propose exactement 6 titres à enchaîner juste après. ` +
    `Objectif d'énergie : ${cap}.\n` +
    `Règles impératives :\n` +
    `- Reste musicalement cohérent avec la piste (pas de saut de genre brutal et illogique).\n` +
    `- Mélange 2 valeurs sûres qui font danser et 4 choix plus fins/originaux : évite les clichés archi-rebattus et les enchaînements trop évidents.\n` +
    `- Choisis des morceaux réellement existants et connus, avec le nom de l'ARTISTE ORIGINAL exact (jamais de reprises, remixes obscurs ou versions karaoké).\n` +
    `- Un artiste différent à chaque fois. Ne propose pas le morceau que je viens de passer.\n` +
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
        temperature: 1,
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
