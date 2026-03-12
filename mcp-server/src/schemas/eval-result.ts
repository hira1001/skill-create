export interface EvalCaseResult {
  case_id: string;
  prompt: string;
  triggered: boolean;
  output: string;
  tools_used: string[];
  errors: string[];
  duration_ms: number;
  token_count: number;
}

export interface EvalResult {
  skill_name: string;
  skill_path: string;
  eval_set_path: string;
  executed_at: string;
  results: EvalCaseResult[];
  summary: {
    total: number;
    triggered: number;
    trigger_rate: number;
    avg_duration_ms: number;
    total_tokens: number;
  };
}
