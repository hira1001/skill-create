import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";
import type { EvalSet, EvalCase } from "../schemas/eval-set.js";
import type { EvalResult, EvalCaseResult } from "../schemas/eval-result.js";

async function runSingleEval(
  evalCase: EvalCase,
  skillPath: string,
  timeout: number = 120000
): Promise<EvalCaseResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const args = [
      "-p",
      evalCase.prompt,
      "--output-format",
      "stream-json",
      "--max-turns",
      "5",
    ];

    const proc = spawn("claude", args, {
      cwd: skillPath,
      timeout,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let triggered = false;
    const toolsUsed: string[] = [];
    const errors: string[] = [];

    proc.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      stdout += text;

      // Parse stream events for trigger detection
      for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (
            event.type === "content_block_start" &&
            event.content_block?.type === "tool_use"
          ) {
            const toolName = event.content_block.name;
            toolsUsed.push(toolName);
            if (toolName === "Skill" || toolName === "Read") {
              triggered = true;
            }
          }
        } catch {
          // not JSON, skip
        }
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("error", (err) => {
      errors.push(err.message);
      resolve({
        case_id: evalCase.id,
        prompt: evalCase.prompt,
        triggered: false,
        output: "",
        tools_used: toolsUsed,
        errors: [err.message],
        duration_ms: Date.now() - startTime,
        token_count: 0,
      });
    });

    proc.on("close", () => {
      // Extract final text output from stream
      let output = "";
      let tokenCount = 0;
      for (const line of stdout.split("\n")) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "content_block_delta" && event.delta?.text) {
            output += event.delta.text;
          }
          if (event.type === "message_stop" && event.usage) {
            tokenCount =
              (event.usage.input_tokens || 0) +
              (event.usage.output_tokens || 0);
          }
        } catch {
          // not JSON
        }
      }

      if (stderr.trim()) {
        errors.push(stderr.trim());
      }

      resolve({
        case_id: evalCase.id,
        prompt: evalCase.prompt,
        triggered,
        output: output.substring(0, 10000), // cap output size
        tools_used: toolsUsed,
        errors,
        duration_ms: Date.now() - startTime,
        token_count: tokenCount,
      });
    });
  });
}

export async function runEval(
  skillPath: string,
  evalSetPath: string,
  parallel: number = 3
): Promise<{ results_path: string; result: EvalResult }> {
  const evalSet: EvalSet = JSON.parse(readFileSync(evalSetPath, "utf-8"));

  const results: EvalCaseResult[] = [];
  const cases = evalSet.cases;

  // Run in batches for controlled parallelism
  for (let i = 0; i < cases.length; i += parallel) {
    const batch = cases.slice(i, i + parallel);
    const batchResults = await Promise.all(
      batch.map((c) => runSingleEval(c, skillPath))
    );
    results.push(...batchResults);
  }

  const triggeredCount = results.filter((r) => r.triggered).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration_ms, 0);
  const totalTokens = results.reduce((sum, r) => sum + r.token_count, 0);

  const evalResult: EvalResult = {
    skill_name: evalSet.skill_name,
    skill_path: skillPath,
    eval_set_path: evalSetPath,
    executed_at: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      triggered: triggeredCount,
      trigger_rate: results.length > 0 ? triggeredCount / results.length : 0,
      avg_duration_ms:
        results.length > 0 ? totalDuration / results.length : 0,
      total_tokens: totalTokens,
    },
  };

  // Save results
  const resultsDir = join(skillPath, ".agent", "eval-results");
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }
  const resultsPath = join(
    resultsDir,
    `eval-result-${Date.now()}.json`
  );
  writeFileSync(resultsPath, JSON.stringify(evalResult, null, 2));

  return { results_path: resultsPath, result: evalResult };
}
