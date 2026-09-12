#!/usr/bin/env node
// PreToolUse hook, bound to the "Edit|Write" matcher.
// Blocks the harness-fix-implementer subagent from writing to todo-app/src/**.
// Deliberately scoped to this one agent_type, not a project-wide deny rule: a
// permissions.deny entry would also block the main session and every other
// agent from ever editing todo-app/src/**, which is not what this exercise
// wants. This hook only fires for the one agent it names.

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let payload = {};
  try {
    payload = JSON.parse(input || "{}");
  } catch {
    process.exit(0); // malformed payload: don't block on something we can't parse
  }

  const isTargetAgent = payload.agent_type === "harness-fix-implementer";
  const filePath = payload.tool_input?.file_path ?? "";
  const touchesSrc = /(^|\/)todo-app\/src\//.test(filePath);

  if (isTargetAgent && touchesSrc) {
    process.stderr.write(
      `[harness-fix-scope-guard] harness-fix-implementer may not write to ${filePath} — it's outside the harness surface (todo-app/CLAUDE.md, AGENT.md, .claude/**).\n`,
    );
    process.exit(2); // non-zero from a PreToolUse hook blocks the tool call
  }

  process.exit(0);
});
