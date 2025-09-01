import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {

  const { shortCode } = params;
  const apiBaseUrl = import.meta.env.PUBLIC_API_URL;

  if (!shortCode) {
      return new Response(('Not found'), { 
          status: 400 
      });
  }

  try {
    const res = await fetch(`${apiBaseUrl}/api/home/${shortCode}`);

    if (res.status === 404) {
      return new Response('Not found', { status: 404 });
    }

    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get('location');

      console.log("location", location);

      if (location) {
        return new Response(null, {
          status: res.status,
          headers: {
            Location: location,
          },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  } 
  catch (err) {
  return new Response('Not found', { status: 404 });
  }

};
