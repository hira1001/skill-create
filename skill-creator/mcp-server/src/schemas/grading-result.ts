export interface GradingScore {
  accuracy: number; // 1-5
  completeness: number; // 1-5
  structure_quality: number; // 1-5
  trigger_precision: number; // 1-5
  reusability: number; // 1-5
}

export interface CaseGrading {
  case_id: string;
  scores: GradingScore;
  average_score: number;
  passed: boolean;
  evidence: string;
  improvement_suggestions: string[];
}

export interface GradingResult {
  skill_name: string;
  graded_at: string;
  case_gradings: CaseGrading[];
  overall: {
    average_score: number;
    min_axis: string;
    min_score: number;
    pass_rate: number;
    passed: boolean;
  };
}
