import { createTunarrMediaSourceSettingsRouteAdapter } from '@/compatibility/tunarr/routes/index.js';
import { GlobalMediaSourceSettingsSchema } from '@tunarr/types/schemas';
import type { RouterPluginAsyncCallback } from '../types/serverType.js';

// eslint-disable-next-line @typescript-eslint/require-await
export const settingsApi: RouterPluginAsyncCallback = async (fastify) => {
  fastify.get(
    '/settings/media-source',
    {
      schema: {
        tags: ['Settings'],
        response: {
          200: GlobalMediaSourceSettingsSchema,
        },
      },
    },
    async (req, res) => {
      const adapter = createTunarrMediaSourceSettingsRouteAdapter({
        read: () => req.serverCtx.settings.globalMediaSourceSettings(),

        write: async (value) => {
          await req.serverCtx.settings.updateSettings('mediaSource', value);
        },
      });

      return res.send(await adapter.read());
    },
  );

  fastify.put(
    '/settings/media-source',
    {
      schema: {
        tags: ['Settings'],
        body: GlobalMediaSourceSettingsSchema,
        response: {
          200: GlobalMediaSourceSettingsSchema,
        },
      },
    },
    async (req, res) => {
      const adapter = createTunarrMediaSourceSettingsRouteAdapter({
        read: () => req.serverCtx.settings.globalMediaSourceSettings(),

        write: async (value) => {
          await req.serverCtx.settings.updateSettings('mediaSource', value);
        },
      });

      return res.send(await adapter.write(req.body));
    },
  );
};
