export async function onRequest(context) {
  const url = new URL(context.request.url);
  const ids = (url.searchParams.get("ids") || "").replace(/[^0-9,]/g, "").slice(0, 512);

  if (!ids) {
    return new Response(JSON.stringify({ error: "missing ids" }), {
      status: 400,
      headers: { "content-type": "application/json", "access-control-allow-origin": "*" }
    });
  }

  const upstream = "https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=" + ids + "&size=420x420&format=Png&isCircular=false";

  let body = JSON.stringify({ data: [], error: "upstream_failed" });
  let status = 502;
  try {
    const res = await fetch(upstream, {
      cf: { cacheTtl: 3600, cacheEverything: true },
      headers: { "user-agent": "THRP-landing/1.0" }
    });
    if (res.ok) {
      body = await res.text();
      status = 200;
    }
  } catch (e) {
    body = JSON.stringify({ data: [], error: "upstream_error" });
  }

  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=600, s-maxage=3600"
    }
  });
}
