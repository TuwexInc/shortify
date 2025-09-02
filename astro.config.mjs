// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
    site: import.meta.env.QA 
        ? 'shortify-gamma-two.vercel.app' 
        : 'https://shortify.tuwexinc.com',
    env: {
        schema: {
            PUBLIC_API_URL: envField.string({ context: "client", access: "public", optional: true }),
            TURSO_DATABASE_URL: envField.string({ context: "server", access: "secret" }),
            TURSO_AUTH_TOKEN: envField.string({ context: "server", access: "secret" }),
        }
    },
	adapter: import.meta.env.QA 
    ? vercel() 
    : cloudflare({
        platformProxy: {
        enabled: true
        },
        imageService: 'passthrough',
    }),
    output: 'server'
});
