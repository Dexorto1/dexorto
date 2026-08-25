const corsHeaders = {
  "Access-Control-Allow-Origin": "https://your-domain.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/contact") return json({ error: "Not found" }, 404);
    try {
      const { name, email, message } = await request.json();
      if (![name, email, message].every((value) => typeof value === "string" && value.trim())) return json({ error: "Name, email, and message are required." }, 400);
      if (name.length > 80 || email.length > 120 || message.length > 2000) return json({ error: "Message is too long." }, 400);
      const webhook = await fetch(env.DISCORD_WEBHOOK_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "dexorto website", embeds: [{ title: "New contact form message", color: 12451192, fields: [{ name: "Name", value: name.trim() }, { name: "Email", value: email.trim() }, { name: "Message", value: message.trim() }], timestamp: new Date().toISOString() }] }),
      });
      if (!webhook.ok) throw new Error("Discord delivery failed");
      return json({ ok: true });
    } catch { return json({ error: "Unable to send message." }, 500); }
  },
};
