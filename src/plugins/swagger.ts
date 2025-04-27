import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fp from 'fastify-plugin';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

import { config } from '@/libs/env';

/**
 * Swagger 플러그인
 */
export default fp(async app => {
  if (config.NODE_ENV === 'production') return;

  await app.register(swagger, {
    openapi: {
      info: { title: 'Up&Down API', version: '1.0.0' },
      tags: [{ name: 'Debate', description: '찬반 토론' }],
    },
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  });
});
