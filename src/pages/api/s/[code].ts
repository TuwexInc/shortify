import type { APIRoute } from "astro";
import { turso } from "@/turso";

export const GET: APIRoute = async ({ params }) => {
    try {
      const shortCode = params.code;
        
      if (!shortCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'Short code is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
  
      const result = await turso.execute(
        'SELECT originalUrl FROM urls WHERE shortCode = ? LIMIT 1',
        [shortCode]
      );
        
      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, originalUrl: result.rows[0].originalUrl }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
};