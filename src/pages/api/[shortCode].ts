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


export const GET: APIRoute = async ({ params }) => {
  const { shortCode } = params;
  const apiBaseUrl = import.meta.env.PUBLIC_API_URL;

  if (!shortCode) {
    return new Response("Not found", { status: 400 });
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/home/${shortCode}`, {
      redirect: "manual",
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

