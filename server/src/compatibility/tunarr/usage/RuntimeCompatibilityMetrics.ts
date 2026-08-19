import type {
  CompatibilityCounterMetric,
  CompatibilityGaugeMetric,
  CompatibilityMetricDimensions,
  CompatibilityMetrics,
  CompatibilityTimingMetric,
} from '../ports/index.js';

export type RuntimeCompatibilityCounterSnapshot = Readonly<{
  metric: CompatibilityCounterMetric;
  dimensions: CompatibilityMetricDimensions;
  value: number;
}>;

export type RuntimeCompatibilityGaugeSnapshot = Readonly<{
  metric: CompatibilityGaugeMetric;
  dimensions: CompatibilityMetricDimensions;
  value: number;
}>;

export type RuntimeCompatibilityTimingSnapshot = Readonly<{
  metric: CompatibilityTimingMetric;
  dimensions: CompatibilityMetricDimensions;
  count: number;
  totalMilliseconds: number;
  maxMilliseconds: number;
}>;

export type RuntimeCompatibilityMetricsSnapshot = Readonly<{
  counters: readonly RuntimeCompatibilityCounterSnapshot[];
  gauges: readonly RuntimeCompatibilityGaugeSnapshot[];
  timings: readonly RuntimeCompatibilityTimingSnapshot[];
}>;

type CounterState = {
  metric: CompatibilityCounterMetric;
  dimensions: CompatibilityMetricDimensions;
  value: number;
};

type GaugeState = {
  metric: CompatibilityGaugeMetric;
  dimensions: CompatibilityMetricDimensions;
  value: number;
};

type TimingState = {
  metric: CompatibilityTimingMetric;
  dimensions: CompatibilityMetricDimensions;
  count: number;
  totalMilliseconds: number;
  maxMilliseconds: number;
};

function copyDimensions(
  dimensions: CompatibilityMetricDimensions,
): CompatibilityMetricDimensions {
  return Object.freeze({
    ...dimensions,
  });
}

function dimensionsKey(dimensions: CompatibilityMetricDimensions): string {
  return JSON.stringify([
    dimensions.concept,
    dimensions.entityType ?? '',
    dimensions.routeTemplate ?? '',
    dimensions.operation,
    dimensions.mode,
    dimensions.result,
    dimensions.applicationVersion ?? '',
    dimensions.sourceSchemaVersion ?? '',
  ]);
}

function metricKey(metric: string, dimensions: CompatibilityMetricDimensions) {
  return `${metric}:${dimensionsKey(dimensions)}`;
}

export class RuntimeCompatibilityMetrics implements CompatibilityMetrics {
  private readonly counters = new Map<string, CounterState>();
  private readonly gauges = new Map<string, GaugeState>();
  private readonly timings = new Map<string, TimingState>();

  increment(
    metric: CompatibilityCounterMetric,
    dimensions: CompatibilityMetricDimensions,
    amount = 1,
  ): void {
    const key = metricKey(metric, dimensions);
    const current = this.counters.get(key);

    if (current === undefined) {
      this.counters.set(key, {
        metric,
        dimensions: copyDimensions(dimensions),
        value: amount,
      });
      return;
    }

    current.value += amount;
  }

  setGauge(
    metric: CompatibilityGaugeMetric,
    value: number,
    dimensions: CompatibilityMetricDimensions,
  ): void {
    this.gauges.set(metricKey(metric, dimensions), {
      metric,
      dimensions: copyDimensions(dimensions),
      value,
    });
  }

  observeMilliseconds(
    metric: CompatibilityTimingMetric,
    milliseconds: number,
    dimensions: CompatibilityMetricDimensions,
  ): void {
    const key = metricKey(metric, dimensions);
    const current = this.timings.get(key);

    if (current === undefined) {
      this.timings.set(key, {
        metric,
        dimensions: copyDimensions(dimensions),
        count: 1,
        totalMilliseconds: milliseconds,
        maxMilliseconds: milliseconds,
      });
      return;
    }

    current.count += 1;
    current.totalMilliseconds += milliseconds;
    current.maxMilliseconds = Math.max(current.maxMilliseconds, milliseconds);
  }

  snapshot(): RuntimeCompatibilityMetricsSnapshot {
    const counters = [...this.counters.values()]
      .sort((left, right) =>
        metricKey(left.metric, left.dimensions).localeCompare(
          metricKey(right.metric, right.dimensions),
        ),
      )
      .map((state) =>
        Object.freeze({
          metric: state.metric,
          dimensions: copyDimensions(state.dimensions),
          value: state.value,
        }),
      );

    const gauges = [...this.gauges.values()]
      .sort((left, right) =>
        metricKey(left.metric, left.dimensions).localeCompare(
          metricKey(right.metric, right.dimensions),
        ),
      )
      .map((state) =>
        Object.freeze({
          metric: state.metric,
          dimensions: copyDimensions(state.dimensions),
          value: state.value,
        }),
      );

    const timings = [...this.timings.values()]
      .sort((left, right) =>
        metricKey(left.metric, left.dimensions).localeCompare(
          metricKey(right.metric, right.dimensions),
        ),
      )
      .map((state) =>
        Object.freeze({
          metric: state.metric,
          dimensions: copyDimensions(state.dimensions),
          count: state.count,
          totalMilliseconds: state.totalMilliseconds,
          maxMilliseconds: state.maxMilliseconds,
        }),
      );

    return Object.freeze({
      counters: Object.freeze(counters),
      gauges: Object.freeze(gauges),
      timings: Object.freeze(timings),
    });
  }
}

export const tunarrRuntimeCompatibilityMetrics =
  new RuntimeCompatibilityMetrics();

export function getTunarrRuntimeCompatibilityMetricsSnapshot(): RuntimeCompatibilityMetricsSnapshot {
  return tunarrRuntimeCompatibilityMetrics.snapshot();
}
