/**
 * Vercel serverless entry point.
 *
 * This is intentionally plain JavaScript. Vercel's Node builder transpiles
 * TypeScript with esbuild, which does not emit `design:paramtypes` metadata —
 * NestJS dependency injection would fail at runtime. `vercel-build` therefore
 * compiles the application with `tsc` first (`npm run build`), and this handler
 * simply loads the compiled output from `dist/`.
 *
 * Local development still uses `src/main.ts` (`npm run start:prod`).
 */
const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { AppModule } = require('../dist/app.module');
const { configureApp } = require('../dist/app.bootstrap');

const server = express();
let initialised = null;

async function initialise() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    // Paystack (and most gateways) sign the raw request body.
    rawBody: true,
    logger: ['error', 'warn', 'log'],
  });
  await configureApp(app);
  await app.init();
}

async function handler(req, res) {
  if (!initialised) initialised = initialise();

  try {
    await initialised;
    return server(req, res);
  } catch (error) {
    // Reset so the next request can retry a cold start (e.g. Neon was asleep).
    initialised = null;
    // eslint-disable-next-line no-console
    console.error('API bootstrap failed:', error);
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader('content-type', 'application/json');
    }
    res.end(
      JSON.stringify({
        success: false,
        message: 'The API is starting up. Please retry in a few seconds.',
        code: 'API_BOOTSTRAP_FAILED',
      }),
    );
  }
}

module.exports = handler;