import type {
  ScheduleGenerationPort,
  ScheduleGenerationRequest,
} from '../ports/ScheduleGeneration.js';
import type { SchedulePlan } from '../domain/Schedule.js';

export interface SchedulingCommandService {
  generateSchedule(request: ScheduleGenerationRequest): Promise<SchedulePlan>;
}

export type SchedulingModuleDependencies = Readonly<{
  generation: ScheduleGenerationPort;
}>;

export type SchedulingModule = Readonly<{
  commands: SchedulingCommandService;
}>;

class DefaultSchedulingCommandService implements SchedulingCommandService {
  constructor(private readonly generation: ScheduleGenerationPort) {}

  generateSchedule(request: ScheduleGenerationRequest): Promise<SchedulePlan> {
    return this.generation.generateSchedule(request);
  }
}

export function createSchedulingModule(
  dependencies: SchedulingModuleDependencies,
): SchedulingModule {
  return Object.freeze({
    commands: new DefaultSchedulingCommandService(dependencies.generation),
  });
}
