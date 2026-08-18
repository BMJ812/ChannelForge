import { describe, expect, it, vi } from 'vitest';

import {
  createProgrammingModule,
  type ProgrammingCommandService,
  type ProgrammingQueryService,
} from '../index.js';

describe('Programming module shell', () => {
  it('registers public command and query services', () => {
    const commands: ProgrammingCommandService = {
      createProgrammingConfiguration: vi.fn(async () => 'programming-1'),
    };

    const queries: ProgrammingQueryService = {
      getActiveProgrammingRevision: vi.fn(async () => undefined),
    };

    const programming = createProgrammingModule({
      commands,
      queries,
    });

    expect(programming.commands).toBe(commands);
    expect(programming.queries).toBe(queries);
    expect(Object.isFrozen(programming)).toBe(true);
  });
});
