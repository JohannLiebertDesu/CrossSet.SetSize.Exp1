/**
 * Feature value sampling with minimum pairwise distance.
 *
 * Samples n values on a circular space [0, 360) such that any two values
 * are at least minDistance degrees apart. Uses gap-based sampling:
 * distributes (360 − n × minDistance) degrees of slack randomly across
 * n gaps, adds the minDistance baseline to each, then places values
 * around the circle from a random starting point.
 *
 * @param {number} n                   Number of values to sample.
 * @param {number} [minDistance=0]     Minimum pairwise distance in degrees.
 * @returns {number[]} Array of n values in [0, 360).
 */
export function sampleFeatureValues(n, minDistance = 0) {
  if (n * minDistance > 360) {
    throw new Error(`Cannot place ${n} values with ${minDistance}° minimum distance.`);
  }

  if (n === 0) return [];

  if (n === 1) return [Math.random() * 360];

  const slack = 360 - n * minDistance;

  // Distribute slack randomly across n gaps using the "broken stick" method:
  // generate n-1 sorted uniform breakpoints in [0, slack], then compute gaps.
  const breakpoints = Array.from({ length: n - 1 }, () => Math.random() * slack)
    .sort((a, b) => a - b);

  const gaps = [];
  let prev = 0;
  for (const bp of breakpoints) {
    gaps.push(bp - prev);
    prev = bp;
  }
  gaps.push(slack - prev);

  // Build values: start from a random offset, accumulate gap + baseline
  const startAngle = Math.random() * 360;
  const values = [];
  let current = startAngle;
  for (let i = 0; i < n; i++) {
    values.push(current % 360);
    current += gaps[i] + minDistance;
  }

  return values;
}
