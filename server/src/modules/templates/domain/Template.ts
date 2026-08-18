export type TemplateId = string;

export type TemplateRevisionId = string;

export type TemplateSummary = Readonly<{
  templateId: TemplateId;
  name: string;
  activeRevisionId?: TemplateRevisionId;
}>;
