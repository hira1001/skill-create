export interface EvalCase {
  id: string;
  prompt: string;
  expected_behavior: string;
  evaluation_criteria: string[];
  should_trigger: boolean;
  test_type: "trigger" | "quality" | "execution";
}

export interface EvalSet {
  skill_name: string;
  skill_path: string;
  created_at: string;
  cases: EvalCase[];
}

export const EVAL_SET_SCHEMA = {
  type: "object" as const,
  properties: {
    skill_name: { type: "string" as const },
    skill_path: { type: "string" as const },
    created_at: { type: "string" as const },
    cases: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          id: { type: "string" as const },
          prompt: { type: "string" as const },
          expected_behavior: { type: "string" as const },
          evaluation_criteria: {
            type: "array" as const,
            items: { type: "string" as const },
          },
          should_trigger: { type: "boolean" as const },
          test_type: {
            type: "string" as const,
            enum: ["trigger", "quality", "execution"],
          },
        },
        required: [
          "id",
          "prompt",
          "expected_behavior",
          "evaluation_criteria",
          "should_trigger",
          "test_type",
        ],
      },
    },
  },
  required: ["skill_name", "skill_path", "created_at", "cases"],
};
