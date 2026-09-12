// PreToolUse hook, matcher: "Edit|Write"
// Scopes the harness-fix-implementer subagent's writes to todo-app/** while
// absolutely denying todo-app/src/** — the actual application code. Everything else
// under todo-app/ (CLAUDE.md, AGENT.md, .claude/**, tsconfig.json, package.json,
// formatter/lint config, etc.) is harness/tooling surface, not app logic, and stays
// writable. Every other session and agent is unaffected: the check below is a no-op
// unless agent_type matches.

const path = require("node:path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const TODO_APP_ROOT = path.resolve(projectDir, "todo-app") + path.sep;
const DENIED_PREFIX = path.resolve(projectDir, "todo-app/src") + path.sep;

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(input || "{}");
  } catch {
    process.exit(0);
  }

  if (payload.agent_type !== "harness-fix-implementer") {
    process.exit(0);
  }

  const rawPath = payload.tool_input?.file_path ?? "";
  const absPath = path.resolve(projectDir, rawPath);

  const isInsideTodoApp = absPath.startsWith(TODO_APP_ROOT);
  const isAppSource = absPath.startsWith(DENIED_PREFIX);
  const isAllowed = isInsideTodoApp && !isAppSource;

  if (!isAllowed) {
    process.stderr.write(
      `harness-fix-implementer may write anywhere under todo-app/ except todo-app/src/** — blocked write to "${rawPath}"\n`
    );
    process.exit(2);
  }

  process.exit(0);
});
