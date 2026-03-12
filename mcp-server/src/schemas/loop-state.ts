export interface IterationRecord {
  iteration: number;
  timestamp: string;
  average_score: number;
  min_axis: string;
  min_score: number;
  pass_rate: number;
  changes_made: string[];
  improvement_delta: number;
}

export interface LoopState {
  skill_name: string;
  skill_path: string;
  started_at: string;
  current_iteration: number;
  best_score: number;
  best_iteration: number;
  converged: boolean;
  convergence_reason: string | null;
  history: IterationRecord[];
}

export const INITIAL_LOOP_STATE: Omit<
  LoopState,
  "skill_name" | "skill_path"
> = {
  started_at: "",
  current_iteration: 0,
  best_score: 0,
  best_iteration: 0,
  converged: false,
  convergence_reason: null,
  history: [],
};

export const CONVERGENCE_CONFIG = {
  max_iterations: 5,
  quality_threshold_avg: 4.0,
  quality_threshold_min: 3.0,
  no_improvement_streak: 2,
};
