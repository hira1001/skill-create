import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import type { LoopState, IterationRecord } from "../schemas/loop-state.js";
import { CONVERGENCE_CONFIG } from "../schemas/loop-state.js";
import { getLoopState } from "./get-loop-state.js";

interface UpdateResult {
  updated: boolean;
  should_continue: boolean;
  reason: string;
  state: LoopState;
}

export function updateLoopState(
  skillPath: string,
  iterationResult: {
    average_score: number;
    min_axis: string;
    min_score: number;
    pass_rate: number;
    changes_made: string[];
  }
): UpdateResult {
  const state = getLoopState(skillPath);
  const iteration = state.current_iteration + 1;

  const previousBestScore = state.best_score;
  const improvementDelta =
    iterationResult.average_score - previousBestScore;

  const record: IterationRecord = {
    iteration,
    timestamp: new Date().toISOString(),
    average_score: iterationResult.average_score,
    min_axis: iterationResult.min_axis,
    min_score: iterationResult.min_score,
    pass_rate: iterationResult.pass_rate,
    changes_made: iterationResult.changes_made,
    improvement_delta: improvementDelta,
  };

  state.current_iteration = iteration;
  state.history.push(record);

  if (iterationResult.average_score > state.best_score) {
    state.best_score = iterationResult.average_score;
    state.best_iteration = iteration;
  }

  // Convergence checks
  let shouldContinue = true;
  let reason = "";

  // Check 1: Quality threshold met
  if (
    iterationResult.average_score >=
      CONVERGENCE_CONFIG.quality_threshold_avg &&
    iterationResult.min_score >= CONVERGENCE_CONFIG.quality_threshold_min
  ) {
    shouldContinue = false;
    reason = `Quality threshold met: avg=${iterationResult.average_score.toFixed(2)} (≥${CONVERGENCE_CONFIG.quality_threshold_avg}), min=${iterationResult.min_score.toFixed(2)} (≥${CONVERGENCE_CONFIG.quality_threshold_min})`;
    state.converged = true;
    state.convergence_reason = reason;
  }

  // Check 2: Max iterations
  if (shouldContinue && iteration >= CONVERGENCE_CONFIG.max_iterations) {
    shouldContinue = false;
    reason = `Max iterations reached: ${iteration}/${CONVERGENCE_CONFIG.max_iterations}`;
    state.converged = true;
    state.convergence_reason = reason;
  }

  // Check 3: No improvement streak
  if (shouldContinue && state.history.length >= CONVERGENCE_CONFIG.no_improvement_streak) {
    const recentHistory = state.history.slice(
      -CONVERGENCE_CONFIG.no_improvement_streak
    );
    const noImprovement = recentHistory.every(
      (h) => h.improvement_delta <= 0.05
    );
    if (noImprovement) {
      shouldContinue = false;
      reason = `No significant improvement for ${CONVERGENCE_CONFIG.no_improvement_streak} consecutive iterations`;
      state.converged = true;
      state.convergence_reason = reason;
    }
  }

  if (shouldContinue) {
    reason = `Iteration ${iteration}: score=${iterationResult.average_score.toFixed(2)}, delta=${improvementDelta.toFixed(2)}. Continuing...`;
  }

  // Save state
  const agentDir = join(skillPath, ".agent");
  if (!existsSync(agentDir)) {
    mkdirSync(agentDir, { recursive: true });
  }
  writeFileSync(
    join(agentDir, "loop-state.json"),
    JSON.stringify(state, null, 2)
  );

  return { updated: true, should_continue: shouldContinue, reason, state };
}
