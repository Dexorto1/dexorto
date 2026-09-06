const RATE_LIMIT_WINDOW = 480 * 1000; // 480 seconds
const RATE_LIMIT_MAX = 10; // 10 messages
const ipRateLimits = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  let timestamps = ipRateLimits.get(ip) || [];
  timestamps = timestamps.filter((time) => now - time < RATE_LIMIT_WINDOW);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - oldest)) / 1000);
    return { limited: true, retryAfter };
  }

  timestamps.push(now);
  ipRateLimits.set(ip, timestamps);

  // Periodic cleanup of stale IPs
  if (ipRateLimits.size > 1000) {
    for (const [key, times] of ipRateLimits.entries()) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW)) {
        ipRateLimits.delete(key);
      }
    }
  }

  return { limited: false };
}

const getCorsHeaders = (request) => {
  const origin = request.headers.get("Origin") || "";
  const allowed = ["https://dexorto1.github.io", "http://localhost:8080", "http://127.0.0.1:8080"];
  const allowOrigin = allowed.includes(origin) ? origin : "https://dexorto1.github.io";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
};

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });

export default {
  async fetch(request, env) {
    const cors = getCorsHeaders(request);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/contact") {
      return json({ error: "Not found" }, 404, cors);
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-real-ip") || "unknown";
    const { limited, retryAfter } = checkRateLimit(clientIp);
    if (limited) {
      return json(
        { error: `Rate limit reached: max 10 messages per 480 seconds. Please try again in ${retryAfter}s.` },
        429,
        { ...cors, "Retry-After": String(retryAfter) }
      );
    }

    try {
      const { name, email, message } = await request.json();
      if (![name, email, message].every((value) => typeof value === "string" && value.trim())) {
        return json({ error: "Name, email, and message are required." }, 400, cors);
      }
      if (name.length > 80 || email.length > 120 || message.length > 2000) {
        return json({ error: "Message is too long." }, 400, cors);
      }
      const webhook = await fetch(env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "dexorto website",
          embeds: [
            {
              title: "New contact form message",
              color: 12451192,
              fields: [
                { name: "Name", value: name.trim() },
                { name: "Email", value: email.trim() },
                { name: "Message", value: message.trim() },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
      if (!webhook.ok) throw new Error("Discord delivery failed");
      return json({ ok: true }, 200, cors);
    } catch {
      return json({ error: "Unable to send message." }, 500, cors);
    }
  },
};
