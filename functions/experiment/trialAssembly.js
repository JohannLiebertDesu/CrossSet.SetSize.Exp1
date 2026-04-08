/**
 * Single-trial assembly — converts a trial spec into a sequence of
 * jsPsych trial objects representing the temporal phases of one trial:
 *
 *   1. Fixation    — fixation cross only, 500 ms
 *   2. Sample      — stimuli + fixation cross, 150 ms × totalItems
 *   3. Retention   — fixation cross only, 1000 ms
 *   4. Recall      — probe cue + response wheel (placeholder for now)
 */

import { makePsychophysicsTrial } from "./trialRendering.js";
import { getRingPositions } from "./ringPositions.js";
import { makeOrientedTriangleStimulus, makeColorPatchStimulus, makeFixationCross } from "./stimuli.js";

const FIXATION_DURATION_MS = 500;
const SAMPLE_DURATION_PER_ITEM_MS = 150;
const RETENTION_DURATION_MS = 1000;

// ── Stimulus builder ─────────────────────────────────────────────────────

/**
 * Convert a trial spec's items array into psychophysics stimulus objects
 * placed on the invisible ring.
 *
 * @param {object[]} items   Items from generateTrial (each has .dimension and .featureValue).
 * @param {number} radius    Ring radius in pixels.
 * @returns {object[]} Array of psychophysics stimulus objects.
 */
function buildStimuliFromSpec(items, radius) {
  const { positions } = getRingPositions(items.length, radius);

  return items.map((item, i) => {
    if (item.dimension === "orientation") {
      return makeOrientedTriangleStimulus(positions[i].x, positions[i].y, item.featureValue);
    } else {
      return makeColorPatchStimulus(positions[i].x, positions[i].y, item.featureValue);
    }
  });
}

// ── Trial sequence ───────────────────────────────────────────────────────

/**
 * Assemble a single trial spec into a sequence of jsPsych trial objects.
 *
 * @param {object} spec       Trial spec from generateTrial.
 * @param {number} trialID    Unique trial number.
 * @param {number} blockID    Block this trial belongs to.
 * @param {boolean} practice  Whether this is a practice trial.
 * @param {number} [ringRadius=120]  Ring radius in pixels.
 * @returns {object[]} Array of 4 jsPsych trial objects (fixation, sample, retention, recall).
 */
export function assembleTrialSequence(spec, trialID, blockID, practice, ringRadius = 120) {
  // Data fields shared across all phases of this trial
  const sharedData = {
    condition: spec.condition,
    primaryDimension: spec.primaryDimension,
    totalItems: spec.totalItems,
    nPrimary: spec.nPrimary,
    nIntrude: spec.nIntrude,
    probeIndex: spec.probeIndex,
    probeDimension: spec.probeDimension,
    probeFeatureValue: spec.probeFeatureValue,
    items: spec.items,
  };

  // 1. Fixation — cross only, 500 ms
  const fixation = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    choices: "NO_KEYS",
    response_ends_trial: false,
    trial_duration: FIXATION_DURATION_MS,
    stimuli: [makeFixationCross()],
    data: { ...sharedData, phase: "fixation" },
  });

  // 2. Sample — stimuli + fixation cross, 150 ms × totalItems
  const sampleDuration = SAMPLE_DURATION_PER_ITEM_MS * spec.totalItems;
  const sample = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    choices: "NO_KEYS",
    response_ends_trial: false,
    trial_duration: sampleDuration,
    stimuli: () => {
      const stims = buildStimuliFromSpec(spec.items, ringRadius);
      stims.push(makeFixationCross());
      return stims;
    },
    data: { ...sharedData, phase: "sample", sampleDuration },
  });

  // 3. Retention — fixation cross only, 1000 ms
  const retention = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    choices: "NO_KEYS",
    response_ends_trial: false,
    trial_duration: RETENTION_DURATION_MS,
    stimuli: [makeFixationCross()],
    data: { ...sharedData, phase: "retention" },
  });

  // 4. Recall — placeholder until response wheel is built
  const recall = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    choices: "ALL_KEYS",
    response_ends_trial: true,
    stimuli: [makeFixationCross()],
    data: { ...sharedData, phase: "recall" },
  });

  return [fixation, sample, retention, recall];
}
