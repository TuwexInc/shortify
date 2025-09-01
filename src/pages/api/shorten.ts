import type { APIRoute } from "astro";
import { turso } from "@/turso";

const urlCache = new Map<
  string,
  { originalUrl: string; clicks: number; createdAt: string }
>();

function generateShortCode(length = 6): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const { url: originalUrl } = await request.json();

    if (!originalUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isValidUrl(originalUrl)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔍 Buscar si ya existe (cache primero, luego DB)
    for (const [shortCode, data] of urlCache.entries()) {
      if (data.originalUrl === originalUrl) {
        const shortUrl = `${url.origin}/s/${shortCode}`;
        return new Response(
          JSON.stringify({
            success: true,
            shortUrl,
            shortCode,
            message: "URL already exists (cache)",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const existing = await turso.execute(
      "SELECT shortCode FROM urls WHERE originalUrl = ? LIMIT 1",
      [originalUrl]
    );
    if (existing.rows.length > 0) {
      const shortCode = existing.rows[0].shortCode as string;
      const shortUrl = `${url.origin}/s/${shortCode}`;
      return new Response(
        JSON.stringify({
          success: true,
          shortUrl,
          shortCode,
          message: "URL already exists",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let shortCode;
    let inserted = false;

    while (!inserted) {
      shortCode = generateShortCode();
      try {
        await turso.execute(
          "INSERT INTO urls (shortCode, originalUrl, clicks, createdAt) VALUES (?, ?, 0, ?)",
          [shortCode, originalUrl, new Date().toISOString()]
        );
        inserted = true;
        urlCache.set(shortCode, {
          originalUrl,
          clicks: 0,
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        if (err.message.includes("UNIQUE constraint failed")) {
          continue;
        }
        throw err;
      }
    }

    const shortUrl = `${url.origin}/s/${shortCode!}`;
    return new Response(
      JSON.stringify({ success: true, shortUrl, shortCode }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    const { searchParams } = url;
    const shortCode = searchParams.get("code");

    if (!shortCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Short code is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await turso.execute(
      "DELETE FROM urls WHERE shortCode = ?",
      [shortCode]
    );

    if (urlCache.has(shortCode)) {
      urlCache.delete(shortCode);
    }

    return new Response(
      JSON.stringify({ success: true, message: "URL deleted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};