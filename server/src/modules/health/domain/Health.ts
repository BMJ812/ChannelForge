export type ModuleHealthStatus =
  | 'ready'
  | 'degraded'
  | 'unavailable'
  | 'disabled';

export type ModuleHealthSnapshot = Readonly<{
  module: string;
  status: ModuleHealthStatus;
  message?: string;
}>;

export type Recommendation = Readonly<{
  recommendationId: string;
  message: string;
}>;
