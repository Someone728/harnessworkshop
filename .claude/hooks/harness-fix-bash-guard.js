// PreToolUse hook, matcher: "Bash"
// Scopes the harness-fix-implementer subagent's shell access to git/gh (plus
// `node --check` for validating a hook file's syntax before committing it). Every
// other session and agent is unaffected: the check below is a no-op unless
// agent_type matches.

const COMPOUND_PATTERN = /&&|\|\||;|\||`|\$\(/;
const ALLOWED_COMMAND = /^(git|gh|node --check)\b/;
const DANGEROUS_PATTERNS = [
  /push\s+(--force|-f)\b/,
  /reset\s+--hard/,
  /clean\s+-f/,
  /branch\s+-D/,
  /rebase\s+-i/,
  /--no-verify/,
  /commit\.gpgsign=false/,
];

// The one exempted subshell shape: `$(cat <<'DELIM' ... DELIM)` with a *quoted*
// heredoc delimiter. A quoted delimiter guarantees the shell performs zero
// expansion inside the body (no backticks, no $(), nothing interpreted) — that's
// what makes it safe to treat the body as inert text and skip the checks below for
// it. An unquoted `<<EOF` would NOT get this exemption, since the shell does expand
// backticks/$() inside an unquoted heredoc body.
const SAFE_HEREDOC_PATTERN = /\$\(cat <<-?(['"])([A-Za-z_][A-Za-z0-9_]*)\1[^\n]*\n[\s\S]*?\n\2\s*\)/g;

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

  const command = (payload.tool_input?.command ?? "").trim();
  const structure = command.replace(SAFE_HEREDOC_PATTERN, '""');

  if (COMPOUND_PATTERN.test(structure)) {
    process.stderr.write(
      `harness-fix-implementer may not run chained/compound shell commands, backticks, or subshells other than a quoted heredoc ($(cat <<'EOF' ... EOF)) — blocked: "${command}"\n`
    );
    process.exit(2);
  }

  if (!ALLOWED_COMMAND.test(structure)) {
    process.stderr.write(
      `harness-fix-implementer may only run git, gh, or node --check commands — blocked: "${command}"\n`
    );
    process.exit(2);
  }

  const dangerous = DANGEROUS_PATTERNS.find((pattern) => pattern.test(structure));
  if (dangerous) {
    process.stderr.write(
      `harness-fix-implementer may not run this git/gh invocation (matched ${dangerous}) — blocked: "${command}"\n`
    );
    process.exit(2);
  }

  process.exit(0);
});
