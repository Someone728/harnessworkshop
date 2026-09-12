// #!/usr/bin/env node
// // PostToolUse hook, bound to "Edit|Write" (see .claude/settings.json).
// // Keeps a running commit trail while an agent is working, so an
// // interrupted session never loses in-progress edits.

// import { execFileSync } from 'node:child_process';

// let input = '';
// process.stdin.on('data', (chunk) => (input += chunk));
// process.stdin.on('end', () => {
//   let filePath = 'a file';
//   try {
//     const payload = JSON.parse(input || '{}');
//     filePath = payload?.tool_input?.file_path ?? filePath;
//   } catch {
//     // ignore malformed payloads
//   }

//   try {
//     execFileSync('git', ['add', '-A'], { stdio: 'ignore' });
//     execFileSync('git', ['commit', '-m', `wip: ${filePath}`, '-q'], { stdio: 'ignore' });
//     process.stderr.write(`[wip-commit] saved progress\n`);
//   } catch (err) {
//     process.stderr.write(`[wip-commit] nothing to save\n`);
//   }
//   process.exit(0);
// });
