/**
 * Creates a browser-check trial that verifies screen dimensions after fullscreen.
 *
 * Placed right after the fullscreen trial in the timeline. If the participant's
 * screen is smaller than the configured minimums (phone, small tablet, or
 * fullscreen failed), the experiment ends immediately with "failed_resize".
 *
 * On success, activates the blur monitor so tab-leave tracking begins only
 * once the real experiment trials start.
 *
 * @param {object} jsPsych   - The active jsPsych instance
 * @param {object} settings  - ExperimentSettings (needs minScreenWidth, minScreenHeight)
 * @param {object} blurMonitor - The blur monitor object (needs .activate())
 * @returns {object} A jsPsych trial configuration
 */
import BrowserCheckPlugin from "@jspsych/plugin-browser-check";

/**
 * Quick test: can the browser's Canvas 2D context parse an OKLCH colour string?
 * If not, fillStyle silently rejects the value and keeps its previous colour.
 */
function supportsOklch() {
  const c = document.createElement("canvas").getContext("2d");
  c.fillStyle = "#000"; // known baseline
  c.fillStyle = "oklch(0.5 0.1 180)";
  return c.fillStyle !== "#000000"; // changed → browser understood OKLCH
}

export function makeScreenCheck(jsPsych, settings, blurMonitor) {
  return {
    type: BrowserCheckPlugin,
    on_finish: (data) => {
      if (
        data.width < settings.minScreenWidth ||
        data.height < settings.minScreenHeight
      ) {
        jsPsych.data.addProperties({ experiment_status: "failed_resize" });
        // jsPsych 8 renamed endExperiment() → abortExperiment().
        // Exit fullscreen first so the participant sees the message in a normal window.
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        jsPsych.abortExperiment(
          `<div class="abort-message">
             <h2 class="abort-message-title">Screen Too Small</h2>
             <p>Your screen does not meet the minimum size requirements for this experiment.</p>
             <p>Please use a <strong>desktop or laptop computer</strong> with a larger screen.</p>
           </div>`
        );
      } else if (!supportsOklch()) {
        // Browser cannot render OKLCH colours on canvas — stimuli would be invisible.
        jsPsych.data.addProperties({ experiment_status: "failed_color_support" });
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        jsPsych.abortExperiment(
          `<div class="abort-message">
             <h2 class="abort-message-title">Browser Not Supported</h2>
             <p>Your browser does not support the colour system required by this experiment.</p>
             <p>Please update your browser to the latest version, or try <strong>Google Chrome</strong>.</p>
           </div>`
        );
      } else {
        // Screen is fine — start monitoring tab switches from here on.
        blurMonitor.activate();
      }
    },
  };
}
