/**
 * Trial generation for the cross-set–size experiment.
 *
 * Builds the full pool of 320 experimental trials + 10 practice trials
 * based on the condition structure defined in ExperimentGoal.md.
 *
 * ── Condition structure ──────────────────────────────────────────────────
 *
 * Each trial has a "primary dimension" (orientation or color) — the dimension
 * that defines the condition and from which most items are drawn.
 *
 * Per primary dimension (orientation and color each):
 *   3-only:  3 items of primary dimension                  → 20 trials
 *   4-only:  4 items of primary dimension                  → 20 trials
 *   6-only:  6 items of primary dimension                  → 20 trials
 *   3+1:     3 primary + 1 intruder of the other dimension → 80 trials
 *   3+3:     3 primary + 3 of the other dimension          → 20 trials (shared)
 *
 * The 3+3 condition is shared between dimensions: 40 total trials,
 * 20 probing an orientation item, 20 probing a color item.
 *
 * Grand total: 140 (orientation) + 140 (color) + 40 (shared 3+3) = 320
 * Practice: 1 trial per condition × 2 dimensions = 10
 *
 * ── Probing rule ─────────────────────────────────────────────────────────
 *
 * Each item is equally likely to be probed. The probed item index is
 * assigned by cycling through all positions across trials within each
 * condition, so every position is probed an equal number of times.
 *
 * ── Feature value sampling ───────────────────────────────────────────────
 *
 * Within each dimension, feature values (hue or orientation in degrees)
 * maintain a minimum pairwise distance of 30°. Implemented via gap-based
 * sampling: partition (360 − n×30)° of "slack" into n random gaps, add
 * the 30° baseline to each, then place values around the circle from a
 * random starting point.
 */

import { sampleFeatureValues } from "./featureSampling.js";

const MIN_DISTANCE_DEG = 30;

// ── Condition definitions ────────────────────────────────────────────────

const CONDITIONS = [
  // Pure orientation conditions
  { name: "orientation_3only", primary: "orientation", nPrimary: 3, nIntrude: 0, nTrials: 20 },
  { name: "orientation_4only", primary: "orientation", nPrimary: 4, nIntrude: 0, nTrials: 20 },
  { name: "orientation_6only", primary: "orientation", nPrimary: 6, nIntrude: 0, nTrials: 20 },
  { name: "orientation_3plus1", primary: "orientation", nPrimary: 3, nIntrude: 1, nTrials: 80 },

  // Pure color conditions
  { name: "color_3only", primary: "color", nPrimary: 3, nIntrude: 0, nTrials: 20 },
  { name: "color_4only", primary: "color", nPrimary: 4, nIntrude: 0, nTrials: 20 },
  { name: "color_6only", primary: "color", nPrimary: 6, nIntrude: 0, nTrials: 20 },
  { name: "color_3plus1", primary: "color", nPrimary: 3, nIntrude: 1, nTrials: 80 },

  // Shared 3+3: 20 trials probing orientation, 20 probing color
  { name: "mixed_3plus3_probeOrientation", primary: "orientation", nPrimary: 3, nIntrude: 3, nTrials: 20 },
  { name: "mixed_3plus3_probeColor", primary: "color", nPrimary: 3, nIntrude: 3, nTrials: 20 },
];

// ── Trial generation ─────────────────────────────────────────────────────

/**
 * Generate a single trial specification.
 *
 * @param {object} condition  A condition definition from CONDITIONS.
 * @param {number} probeIndex Which item index (0-based) to probe.
 * @returns {object} Trial specification with all information needed to render.
 */
function generateTrial(condition, probeIndex) {
  const totalItems = condition.nPrimary + condition.nIntrude;
  const probeDimension = probeIndex < condition.nPrimary ? condition.primary
    : (condition.primary === "orientation" ? "color" : "orientation");

  // Sample feature values for each dimension independently
  const nOrientation = condition.primary === "orientation" ? condition.nPrimary : condition.nIntrude;
  const nColor = condition.primary === "color" ? condition.nPrimary : condition.nIntrude;

  const orientationValues = nOrientation > 0 ? sampleFeatureValues(nOrientation, MIN_DISTANCE_DEG) : [];
  const colorValues = nColor > 0 ? sampleFeatureValues(nColor, MIN_DISTANCE_DEG) : [];

  // Build item list: primary items first, then intruders.
  // Each item knows its dimension, feature value, and position index.
  const items = [];

  if (condition.primary === "orientation") {
    for (let i = 0; i < condition.nPrimary; i++) {
      items.push({ dimension: "orientation", featureValue: orientationValues[i] });
    }
    for (let i = 0; i < condition.nIntrude; i++) {
      items.push({ dimension: "color", featureValue: colorValues[i] });
    }
  } else {
    for (let i = 0; i < condition.nPrimary; i++) {
      items.push({ dimension: "color", featureValue: colorValues[i] });
    }
    for (let i = 0; i < condition.nIntrude; i++) {
      items.push({ dimension: "orientation", featureValue: orientationValues[i] });
    }
  }

  return {
    condition: condition.name,
    primaryDimension: condition.primary,
    totalItems,
    nPrimary: condition.nPrimary,
    nIntrude: condition.nIntrude,
    probeIndex,
    probeDimension,
    probeFeatureValue: items[probeIndex].featureValue,
    items,
  };
}

/**
 * Generate the full pool of experimental trials (320) and practice trials (10).
 *
 * Probe indices are cycled across trials within each condition so that
 * every item position is probed equally often.
 *
 * @returns {{ experimental: object[], practice: object[] }}
 */
export function generateTrialPool() {
  const experimental = [];

  for (const condition of CONDITIONS) {
    const totalItems = condition.nPrimary + condition.nIntrude;

    for (let i = 0; i < condition.nTrials; i++) {
      const probeIndex = i % totalItems;
      experimental.push(generateTrial(condition, probeIndex));
    }
  }

  // Practice: 1 trial per condition (10 total)
  const practice = [];

  for (const condition of CONDITIONS) {
    const totalItems = condition.nPrimary + condition.nIntrude;
    const probeIndex = Math.floor(Math.random() * totalItems);
    practice.push(generateTrial(condition, probeIndex));
  }

  return { experimental, practice };
}
