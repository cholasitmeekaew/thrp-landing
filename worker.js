const DISCORD_URL = "https://discord.gg/ZtxdZbFavq";

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/discord" || url.pathname === "/discord/") {
      return Response.redirect(DISCORD_URL, 302);
    }

    if (url.pathname === "/api/avatars") {
      return handleAvatars(request);
    }

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      headers.set(key, value);
    }

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers
    });
  }
};

async function handleAvatars(request) {
  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") || "").replace(/[^0-9,]/g, "").slice(0, 512);

  if (!ids) {
    return jsonResponse({ error: "missing ids" }, 400);
  }

  const upstream = "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" + ids + "&size=420x420&format=Png&isCircular=false";

  try {
    const res = await fetch(upstream, {
      cf: { cacheTtl: 3600, cacheEverything: true },
      headers: { "user-agent": "THRP-landing/1.0" }
    });
    if (!res.ok) return jsonResponse({ data: [], error: "upstream_failed" }, 502);
    const body = await res.text();
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=600, s-maxage=3600"
      }
    });
  } catch (e) {
    return jsonResponse({ data: [], error: "upstream_error" }, 502);
  }
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=600, s-maxage=3600"
    }
  });
}
