import { MersenneTwister19937, Random } from 'random-js';

export const TEST_RANDOM_GENERATOR = 'random-js/MersenneTwister19937';

export interface SeededTestRandom {
  readonly seed: number;
  readonly generator: typeof TEST_RANDOM_GENERATOR;
  readonly random: Random;
}

function assertSeed(seed: number): void {
  if (
    !Number.isInteger(seed) ||
    seed < -2_147_483_648 ||
    seed > 2_147_483_647
  ) {
    throw new TypeError(
      `Test random seed must be a signed 32-bit integer: ${seed}`,
    );
  }
}

/**
 * Creates the inherited random-js generator from an explicit recorded seed.
 */
export function createSeededTestRandom(seed: number): SeededTestRandom {
  assertSeed(seed);

  return {
    seed,
    generator: TEST_RANDOM_GENERATOR,
    random: new Random(MersenneTwister19937.seed(seed)),
  };
}
