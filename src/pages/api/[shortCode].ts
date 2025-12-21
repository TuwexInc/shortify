import type { APIRoute } from 'astro';

function isBaseUrlMatching(location: string, apiBaseUrl: string): boolean {
  if (!location) return false;

  try {
    const url = location.startsWith("http")
      ? new URL(location)
      : new URL(location, apiBaseUrl)

    const baseOfLocation = `${url.protocol}//${url.host}`;
    const normalizedApiBase = apiBaseUrl.replace(/\/$/, ""); 

    return baseOfLocation === normalizedApiBase;
  } catch (error) {
    console.error("Error al analizar location:", error);
    return false;
  }
}


export const GET: APIRoute = async ({ params, request }) => {
  const { shortCode } = params;
  const apiBaseUrl = import.meta.env.PUBLIC_API_URL;

  if (!shortCode) {
    return new Response("Not found", { status: 400 });
  }

  const geoData = {
    country: request.headers.get('X-Vercel-IP-Country'),
    region: request.headers.get('X-Vercel-IP-Country-Region'),
    city: request.headers.get('X-Vercel-IP-City'),
    latitude: request.headers.get('X-Vercel-IP-Latitude'),
    longitude: request.headers.get('X-Vercel-IP-Longitude'),
    timezone: request.headers.get('X-Vercel-IP-Timezone'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  };

  try {
    const res = await fetch(`${apiBaseUrl}/api/home/${shortCode}`, {
      redirect: "manual",
      headers: {
        'Content-Type': 'application/json',
        ...(geoData.country && { 'X-User-Country': geoData.country }),
        ...(geoData.region && { 'X-User-Region': geoData.region }),
        ...(geoData.city && { 'X-User-City': geoData.city }),
        ...(geoData.latitude && { 'X-User-Latitude': geoData.latitude }),
        ...(geoData.longitude && { 'X-User-Longitude': geoData.longitude }),
        ...(geoData.timezone && { 'X-User-Timezone': geoData.timezone }),
        ...(geoData.ip && { 'X-User-IP': geoData.ip })
      }
    });

    if (res.status === 404) {
      return new Response("Not found", { status: 404 });
    }

    if (res.status === 302 || res.status === 301) {
      const firstLocation = res.headers.get("location");

      if (!firstLocation) {
        return new Response("Not found", { status: 404 });
      }

      if (!isBaseUrlMatching(firstLocation, apiBaseUrl)) {

        return new Response(
          JSON.stringify({ redirectUrl: firstLocation }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const secondRes = await fetch(firstLocation, { redirect: "manual" });

      if (secondRes.status === 302 || secondRes.status === 301) {
        const finalLocation = secondRes.headers.get("location");

        if (finalLocation) {
          return new Response(
            JSON.stringify({ redirectUrl: finalLocation }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      return new Response("Not found", { status: 404 });
    }

    return new Response("Not found", { status: 404 });
  } catch (err) {
    return new Response("Not found", { status: 404 });
  }
};

