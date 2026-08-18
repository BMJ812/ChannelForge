import type { TemplateId, TemplateSummary } from '../domain/Template.js';

export interface TemplateCommandService {
  createTemplate(input: Readonly<{ name: string }>): Promise<TemplateId>;
}

export interface TemplateQueryService {
  getTemplate(templateId: TemplateId): Promise<TemplateSummary | undefined>;
}

export type TemplatesModuleDependencies = Readonly<{
  commands: TemplateCommandService;
  queries: TemplateQueryService;
}>;

export type TemplatesModule = Readonly<{
  commands: TemplateCommandService;
  queries: TemplateQueryService;
}>;

export function createTemplatesModule(
  dependencies: TemplatesModuleDependencies,
): TemplatesModule {
  return Object.freeze({
    commands: dependencies.commands,
    queries: dependencies.queries,
  });
}
