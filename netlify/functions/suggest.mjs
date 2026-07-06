export default async (req) => {
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ suggestions: [] });

  let body = {};
  try { body = await req.json(); } catch (e) { body = {}; }

  const track = String(body.track || "").slice(0, 120);
  const artist = String(body.artist || "").slice(0, 120);
  const ambiance = String(body.ambiance || "soirée dansante festive").slice(0, 80);
  if (!track) return json({ suggestions: [] });

  const prompt =
    `Tu es un DJ professionnel qui anime des ${ambiance}. ` +
    `Je viens de passer le titre "${track}"${artist ? " de " + artist : ""}. ` +
    `Propose exactement 6 titres à enchaîner juste après pour garder ou faire monter l'énergie de la piste : ` +
    `varie les époques, mise sur des morceaux qui font danser un large public, et évite de reproposer le même titre. ` +
    `Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte autour, ` +
    `au format: [{"title":"Titre","artist":"Artiste"}]`;

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
        model: "claude-haiku-4-5",
        max_tokens: 700,
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
