#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { validateSkill } from "./tools/validate-skill.js";
import { generateEvalSetTemplate } from "./tools/generate-eval-set.js";
import { runEval } from "./tools/run-eval.js";
import { getLoopState } from "./tools/get-loop-state.js";
import { updateLoopState } from "./tools/update-loop-state.js";
import { installSkill } from "./tools/install-skill.js";

const server = new McpServer({
  name: "skill-creator-server",
  version: "1.0.0",
});

// Tool: validate_skill
server.tool(
  "validate_skill",
  "Validate a skill's structure, frontmatter, and conventions. Returns errors, warnings, and stats.",
  {
    skill_path: z
      .string()
      .describe("Absolute path to the skill directory containing SKILL.md"),
  },
  async ({ skill_path }) => {
    try {
      const result = validateSkill(skill_path);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [
          { type: "text" as const, text: `Error: ${(err as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// Tool: generate_eval_set
server.tool(
  "generate_eval_set",
  "Generate a template evaluation set for a skill. Creates should_trigger and should_not_trigger test cases. The Claude skill should fill in the [TODO] placeholders with actual test prompts and criteria.",
  {
    skill_path: z
      .string()
      .describe("Absolute path to the skill directory"),
    count: z
      .number()
      .optional()
      .default(10)
      .describe("Number of test cases to generate (split between trigger/no-trigger)"),
  },
  async ({ skill_path, count }) => {
    try {
      const { eval_set_path, eval_set } = generateEvalSetTemplate(
        skill_path,
        count
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                eval_set_path,
                case_count: eval_set.cases.length,
                message:
                  "Template eval set created. Fill in [TODO] placeholders with actual test prompts and evaluation criteria.",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          { type: "text" as const, text: `Error: ${(err as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// Tool: run_eval
server.tool(
  "run_eval",
  "Run evaluation test cases against a skill by spawning claude -p subprocesses. Returns trigger detection and output capture results.",
  {
    skill_path: z.string().describe("Absolute path to the skill directory"),
    eval_set_path: z
      .string()
      .describe("Path to the eval set JSON file"),
    parallel: z
      .number()
      .optional()
      .default(3)
      .describe("Number of parallel eval runs"),
  },
  async ({ skill_path, eval_set_path, parallel }) => {
    try {
      const { results_path, result } = await runEval(
        skill_path,
        eval_set_path,
        parallel
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                results_path,
                summary: result.summary,
                message: `Eval completed: ${result.summary.total} cases, ${result.summary.triggered} triggered (${(result.summary.trigger_rate * 100).toFixed(1)}%)`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          { type: "text" as const, text: `Error: ${(err as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// Tool: get_loop_state
server.tool(
  "get_loop_state",
  "Get the current state of the autonomous improvement loop for a skill. Returns iteration count, scores, convergence status, and history.",
  {
    skill_path: z.string().describe("Absolute path to the skill directory"),
  },
  async ({ skill_path }) => {
    try {
      const state = getLoopState(skill_path);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(state, null, 2) }],
      };
    } catch (err) {
      return {
        content: [
          { type: "text" as const, text: `Error: ${(err as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// Tool: update_loop_state
server.tool(
  "update_loop_state",
  "Update the improvement loop state with results from the latest iteration. Returns convergence decision (should_continue or stop).",
  {
    skill_path: z.string().describe("Absolute path to the skill directory"),
    average_score: z.number().describe("Average score across all 5 axes (1-5)"),
    min_axis: z
      .string()
      .describe("Name of the axis with the lowest score"),
    min_score: z.number().describe("Score of the lowest-scoring axis"),
    pass_rate: z
      .number()
      .describe("Fraction of test cases that passed (0-1)"),
    changes_made: z
      .array(z.string())
      .describe("List of changes made in this iteration"),
  },
  async ({
    skill_path,
    average_score,
    min_axis,
    min_score,
    pass_rate,
    changes_made,
  }) => {
    try {
      const result = updateLoopState(skill_path, {
        average_score,
        min_axis,
        min_score,
        pass_rate,
        changes_made,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                should_continue: result.should_continue,
                reason: result.reason,
                iteration: result.state.current_iteration,
                best_score: result.state.best_score,
                converged: result.state.converged,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          { type: "text" as const, text: `Error: ${(err as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// Tool: install_skill
server.tool(
  "install_skill",
  "Install a completed skill to ~/.claude/skills/ (global) or .claude/skills/ (project). Copies all skill files except .agent/ working directory.",
  {
    skill_path: z.string().describe("Absolute path to the skill directory"),
    target: z
      .enum(["global", "project"])
      .optional()
      .default("global")
      .describe("Installation target"),
  },
  async ({ skill_path, target }) => {
    try {
      const result = installSkill(skill_path, target);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                installed_path: result.installed_path,
                files_count: result.files_copied.length,
                target: result.target,
                message: `Skill installed to ${result.installed_path}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          { type: "text" as const, text: `Error: ${(err as Error).message}` },
        ],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Server error:", err);
  process.exit(1);
});
