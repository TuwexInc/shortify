// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import cloudflare from '@astrojs/cloudflare';

const isQA = process.env.NODE_ENV === 'qa';

// https://astro.build/config
export default defineConfig({
    site: isQA
        ? 'https://shortify-gamma-two.vercel.app' 
        : 'https://e9056610.shortify-4lb.pages.dev',
    env: {
        schema: {
            PUBLIC_API_URL: envField.string({ context: "client", access: "public", optional: true }),
            TURSO_DATABASE_URL: envField.string({ context: "server", access: "secret" }),
            TURSO_AUTH_TOKEN: envField.string({ context: "server", access: "secret" }),
        }
    },
	adapter: isQA 
    ? vercel() 
    : cloudflare({
        platformProxy: {
        enabled: true
        },
        imageService: 'passthrough',
    }),
    output: 'server'
});
