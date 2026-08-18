import { describe, expect, it, vi } from 'vitest';

import {
  createTemplatesModule,
  type TemplateCommandService,
  type TemplateQueryService,
} from '../index.js';

describe('Templates module shell', () => {
  it('registers public command and query services', () => {
    const commands: TemplateCommandService = {
      createTemplate: vi.fn(async () => 'template-1'),
    };

    const queries: TemplateQueryService = {
      getTemplate: vi.fn(async () => undefined),
    };

    const templates = createTemplatesModule({
      commands,
      queries,
    });

    expect(templates.commands).toBe(commands);
    expect(templates.queries).toBe(queries);
    expect(Object.isFrozen(templates)).toBe(true);
  });
});
