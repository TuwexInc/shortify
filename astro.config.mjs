// @ts-check
import { defineConfig, envField, passthroughImageService } from 'astro/config';
import vercel from '@astrojs/vercel';
import cloudflare from '@astrojs/cloudflare';
import { viteStaticCopy } from 'vite-plugin-static-copy'
import sitemap from '@astrojs/sitemap';

const isQA = process.env.NODE_ENV === 'qa';

// https://astro.build/config
export default defineConfig({
  site: isQA
      ? 'https://shortify-gamma-two.vercel.app' 
      : 'https://shortify.afleitasp.workers.dev',
  env: {
      schema: {
          PUBLIC_API_URL: envField.string({ context: "client", access: "public", optional: true }),
          TURSO_DATABASE_URL: envField.string({ context: "server", access: "secret" }),
          TURSO_AUTH_TOKEN: envField.string({ context: "server", access: "secret" }),
      }
  },
  build: {
    assets: "_astro",
  },
  vite: {
      plugins: [
          viteStaticCopy({
              targets: [
                  {
                      src: 'src/assets/*',
                      dest: 'assets/',
                  },
              ]
          })
      ]
  },
  adapter: isQA 
      ? vercel() 
      : cloudflare({
          platformProxy: {
              enabled: true,
          },
          routes: {
            extend: {
              exclude: [
                { pattern: "/api/*" },
                { pattern: "/s/*" }
              ]
            }
          },
          imageService: 'passthrough',
      }),
  output: 'server',
  image: {
      service: passthroughImageService()
  },
  integrations: [
      sitemap(),
  ]
});
