#!/usr/bin/env node
// Generates the harness-snapshot.json artifact: a point-in-time capture of a
// project's harness (CLAUDE.md/AGENT.md text, hook registration + enabled status,
// skills, permissions), each tagged control_type: "guide" | "sensor".
// Usage: node generate-harness-snapshot.mjs [project-dir] [output-path]
//
// project-dir is the directory containing the harness being analyzed (CLAUDE.md,
// AGENT.md, .claude/settings.json, .claude/hooks, .claude/skills) — defaults to
// "todo-app", since this repo separates the todo-app harness under test from
// the meta-tooling (this skill, docs/log-schema) that lives at the repo root.
// output-path is resolved relative to the current working directory, not project-dir.

import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { join, dirname, relative, resolve } from "node:path";
import { loadRegisteredHooks } from "../../../lib/hook-observability.mjs";

const invocationDir = process.cwd();
const projectDir = resolve(invocationDir, process.argv[2] || "todo-app");
// Recorded in the output as a path relative to invocationDir, not the absolute
// filesystem path — otherwise every regenerated artifact bakes in whichever
// machine happened to run this script.
const projectDirForOutput = relative(invocationDir, projectDir) || ".";
const outputPath = resolve(
  invocationDir,
  process.argv[3] || "docs/log-schema/harness-snapshot.json",
);

function readOrNull(relPath) {
  const abs = join(projectDir, relPath);
  return existsSync(abs)
    ? readFileSync(abs, "utf8").replace(/\r\n/g, "\n").trimEnd()
    : null;
}

function buildHooks() {
  // Drop the "source" field (the hook's full file text) — it's needed by
  // session-logs to statically match injected text, but has no place in a
  // harness snapshot.
  return loadRegisteredHooks(projectDir).map(({ source, ...hook }) => hook);
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split("\n")) {
    const fieldMatch = line.match(/^([a-zA-Z_]+):\s*(.+)$/);
    if (fieldMatch) fields[fieldMatch[1]] = fieldMatch[2].trim();
  }
  return fields;
}

function buildSkills() {
  const skillsDir = join(projectDir, ".claude/skills");
  if (!existsSync(skillsDir)) return [];
  const skills = [];
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillMdPath = join(skillsDir, entry.name, "SKILL.md");
    if (!existsSync(skillMdPath)) continue;
    const frontmatter = parseFrontmatter(readFileSync(skillMdPath, "utf8"));
    skills.push({
      name: frontmatter.name || entry.name,
      path: `.claude/skills/${entry.name}/SKILL.md`,
      summary: frontmatter.description || "",
      // Guide/Sensor duality (see instructions._note below): skills steer the
      // agent before it acts, so they're guides.
      control_type: "guide",
    });
  }
  return skills;
}

const settingsPath = join(projectDir, ".claude/settings.json");
const settings = existsSync(settingsPath)
  ? JSON.parse(readFileSync(settingsPath, "utf8"))
  : {};
const settingsLocalExists = existsSync(
  join(projectDir, ".claude/settings.local.json"),
);

const snapshot = {
  captured_at: new Date().toISOString(),
  project_dir: projectDirForOutput,
  instructions: {
    "CLAUDE.md": readOrNull("CLAUDE.md"),
    "AGENT.md": readOrNull("AGENT.md"),
    "SKILLS.md": readOrNull("SKILLS.md"),
    // Guide/Sensor duality, per the org's agent-harness whitepaper: guides steer
    // the agent before it acts (instructions, domain context, permissions,
    // skills); sensors observe after it acts (hooks). Instructions are guides.
    control_type: "guide",
    _note:
      "Generated mechanically: check CLAUDE.md and AGENT.md above for contradictory guidance or broken references and replace this placeholder with a concrete note if found — this script does not attempt semantic comparison.",
  },
  hooks: buildHooks(),
  skills: buildSkills(),
  permissions: {
    raw: settings.permissions || {},
    control_type: "guide",
    _note: settingsLocalExists
      ? ".claude/settings.local.json is also present and may override these permissions."
      : "No .claude/settings.local.json found; permissions come only from .claude/settings.json.",
  },
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`Wrote harness snapshot to ${outputPath}`);
