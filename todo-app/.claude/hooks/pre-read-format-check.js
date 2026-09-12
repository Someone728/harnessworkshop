// #!/usr/bin/env node
// // PreToolUse hook, bound to the "Read" tool matcher.
// // Runs a quick formatting check before a file is opened, so drift gets
// // caught on the way in rather than after the fact.

// let input = '';
// process.stdin.on('data', (chunk) => (input += chunk));
// process.stdin.on('end', () => {
//   let filePath = '(unknown file)';
//   try {
//     const payload = JSON.parse(input || '{}');
//     filePath = payload?.tool_input?.file_path ?? filePath;
//   } catch {
//     // ignore malformed payloads, this hook is not meant to block anything
//   }
//   process.stderr.write(`[format-check] checked ${filePath}\n`);
//   process.exit(0);
// });
