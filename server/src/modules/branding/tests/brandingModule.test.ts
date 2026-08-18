import { describe, expect, it, vi } from 'vitest';

import {
  createBrandingModule,
  type BrandingCommandService,
  type BrandingQueryService,
} from '../index.js';

describe('Branding module shell', () => {
  it('registers public command and query services', () => {
    const commands: BrandingCommandService = {
      createBrandingProfile: vi.fn(async () => 'branding-1'),
    };

    const queries: BrandingQueryService = {
      getBrandingProfile: vi.fn(async () => undefined),
      resolveEffectiveBranding: vi.fn(async () => undefined),
    };

    const branding = createBrandingModule({
      commands,
      queries,
    });

    expect(branding.commands).toBe(commands);
    expect(branding.queries).toBe(queries);
    expect(Object.isFrozen(branding)).toBe(true);
  });
});
