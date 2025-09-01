// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    site: 'https://shortify.tuwexinc.com',
    env: {
        schema: {
            PUBLIC_API_URL: envField.string({ context: "client", access: "public", optional: true }),
            TURSO_DATABASE_URL: envField.string({ context: "server", access: "secret" }),
            TURSO_AUTH_TOKEN: envField.string({ context: "server", access: "secret" }),
        }
    },
	adapter: vercel(),
    output: 'server'
});
