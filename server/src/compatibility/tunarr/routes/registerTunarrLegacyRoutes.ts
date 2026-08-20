import { HdhrApiRouter } from '@/api/hdhrApi.js';
import { apiRouter } from '@/api/index.js';
import { streamApi } from '@/api/streamApi.js';
import { videoApiRouter } from '@/api/videoApi.js';
import type { RouterPluginAsyncCallback } from '@/types/serverType.js';
import { getTunarrVersion } from '@/util/version.js';

import { tunarrRuntimeCompatibilityMetrics } from '../usage/RuntimeCompatibilityMetrics.js';
import {
  tunarrLegacyRouteRegistry,
  type LegacyRouteRegistration,
} from './LegacyRouteRegistry.js';
import { LegacyRouteUsageMetrics } from './LegacyRouteUsageMetrics.js';

type MutableSchema = {
  hide?: boolean;
  tags?: string[];
};

function methodsOf(method: string | readonly string[]): readonly string[] {
  return typeof method === 'string' ? [method] : method;
}

function installLegacyRouteInstrumentation(
  fastify: Parameters<RouterPluginAsyncCallback>[0],
): void {
  const usage = new LegacyRouteUsageMetrics(
    tunarrRuntimeCompatibilityMetrics,
    getTunarrVersion(),
  );

  const starts = new WeakMap<object, number>();

  fastify.addHook('onRoute', (routeOptions) => {
    const schema = routeOptions.schema as MutableSchema | undefined;
    const hidden = schema?.hide === true;

    for (const method of methodsOf(routeOptions.method)) {
      const registration = tunarrLegacyRouteRegistry.register({
        method,
        path: routeOptions.url,
        hidden,
        existingTags: schema?.tags,
      });

      if (schema !== undefined && !hidden) {
        schema.tags = [...registration.tags];
      }
    }
  });

  fastify.addHook('onRequest', (request, _reply, done) => {
    const routeTemplate = request.routeOptions.url;

    if (routeTemplate === undefined) {
      done();
      return;
    }

    const route = tunarrLegacyRouteRegistry.find(request.method, routeTemplate);

    if (route !== undefined) {
      usage.recordCall(route);
      starts.set(request, performance.now());
    }

    done();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    const routeTemplate = request.routeOptions.url;

    if (routeTemplate === undefined) {
      done();
      return;
    }

    const route: LegacyRouteRegistration | undefined =
      tunarrLegacyRouteRegistry.find(request.method, routeTemplate);

    const startedAt = starts.get(request);

    if (route !== undefined && startedAt !== undefined) {
      usage.recordLatency(
        route,
        Math.max(0, performance.now() - startedAt),
        reply.statusCode >= 500 ? 'FAILURE' : 'SUCCESS',
      );
    }

    done();
  });
}

export const registerTunarrLegacyApiRoutes: RouterPluginAsyncCallback = async (
  fastify,
) => {
  installLegacyRouteInstrumentation(fastify);

  await fastify
    .register(new HdhrApiRouter().router)
    .register(apiRouter, { prefix: '/api' });
};

export const registerTunarrLegacyStreamRoutes: RouterPluginAsyncCallback =
  async (fastify) => {
    installLegacyRouteInstrumentation(fastify);

    await fastify.register(videoApiRouter).register(streamApi);
  };
