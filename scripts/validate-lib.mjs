// Core validation logic for tasks-repo content, as a pure function over
// already-loaded in-memory state: frontmatter schemas, dep graph, ID
// uniqueness, cluster references, and the file-size cap.
//
// `validate({ rfcs, stories })` takes the shape returned by `loadAll()`
// (lib.mjs) and returns `{ errors: string[] }` with no process.exit /
// console side effects, so CLI mutation commands can run it against
// post-mutation state and abort cleanly before committing. The CLI entry
// (validate.mjs) is a thin wrapper that loads, prints, and sets exit code.
import { relPath, RFC_STATUSES, STORY_STATUSES } from "./lib.mjs";

export const MAX_LINES = 2000;

export function validate({ rfcs, stories }) {
  const errors = [];
  const err = (file, msg) => errors.push(`${relPath(file)}: ${msg}`);

  const rfcById = new Map();
  for (const r of rfcs) {
    if (r.error) {
      err(r.file, `failed to parse: ${r.error}`);
      continue;
    }
    if (r.lines > MAX_LINES) err(r.file, `exceeds ${MAX_LINES}-line cap (${r.lines})`);
    const fm = r.frontmatter ?? {};
    for (const key of ["rfc", "title", "status", "created", "updated", "owner", "clusters"]) {
      if (fm[key] == null) err(r.file, `missing required frontmatter: ${key}`);
    }
    if (fm.rfc && fm.rfc !== r.dir) err(r.file, `rfc field "${fm.rfc}" must match dir "${r.dir}"`);
    if (fm.status && !RFC_STATUSES.includes(fm.status)) {
      err(r.file, `invalid status "${fm.status}" — expected one of ${RFC_STATUSES.join(", ")}`);
    }
    if (fm.status === "superseded" && !fm["superseded-by"]) {
      err(r.file, `status: superseded requires superseded-by`);
    }
    if (fm.clusters && !Array.isArray(fm.clusters)) err(r.file, `clusters must be an array`);
    if (fm.packages && !Array.isArray(fm.packages)) err(r.file, `packages must be an array`);
    rfcById.set(r.dir, r);
  }

  // Resolve superseded-by pointers
  for (const r of rfcs) {
    const target = r.frontmatter?.["superseded-by"];
    if (target && !rfcById.has(target)) {
      err(r.file, `superseded-by "${target}" does not exist`);
    }
  }

  const storyById = new Map();
  const seenIds = new Set();
  for (const s of stories) {
    if (s.error) {
      err(s.file, `failed to parse: ${s.error}`);
      continue;
    }
    if (s.lines > MAX_LINES) err(s.file, `exceeds ${MAX_LINES}-line cap (${s.lines})`);
    if (seenIds.has(s.id)) err(s.file, `duplicate story id "${s.id}"`);
    seenIds.add(s.id);
    const fm = s.frontmatter ?? {};
    for (const key of ["title", "status", "rfc", "cluster", "deps", "est-loc", "claim"]) {
      if (fm[key] === undefined) err(s.file, `missing required frontmatter: ${key}`);
    }
    // claim must be the unclaimed sentinel (null) or a claim timestamp (string).
    // Absence is caught above; a present-but-mistyped claim would make the CLI's
    // claimState misread the story (a missing claim reads as already-claimed).
    if (fm.claim !== undefined && fm.claim !== null && typeof fm.claim !== "string") {
      err(s.file, `claim must be null or a timestamp string`);
    }
    if (fm.status && !STORY_STATUSES.includes(fm.status)) {
      err(s.file, `invalid status "${fm.status}" — expected one of ${STORY_STATUSES.join(", ")}`);
    }
    if (fm.rfc && fm.rfc !== s.rfc)
      err(s.file, `rfc field "${fm.rfc}" must match parent dir "${s.rfc}"`);
    const parent = rfcById.get(s.rfc);
    if (parent && fm.cluster) {
      const clusters = parent.frontmatter?.clusters ?? [];
      if (!clusters.includes(fm.cluster)) {
        err(
          s.file,
          `cluster "${fm.cluster}" not declared in ${s.rfc}/README.md clusters: [${clusters.join(", ")}]`,
        );
      }
    }
    if (fm.deps && !Array.isArray(fm.deps)) err(s.file, `deps must be an array`);
    if (fm["deps-rfc"] && !Array.isArray(fm["deps-rfc"])) err(s.file, `deps-rfc must be an array`);
    if (fm["est-loc"] !== null && fm["est-loc"] !== undefined) {
      if (!Number.isInteger(fm["est-loc"])) err(s.file, `est-loc must be integer or null`);
      else if (fm["est-loc"] > 500) err(s.file, `est-loc ${fm["est-loc"]} exceeds 500 LOC ceiling`);
    }
    // priority: optional integer; lower = higher ready-queue priority (absent = unprioritized)
    if (fm.priority != null && (!Number.isInteger(fm.priority) || fm.priority < 0)) {
      err(s.file, `priority must be a non-negative integer or absent`);
    }
    storyById.set(s.id, s);
  }

  // Validate deps & deps-rfc references and detect cycles
  for (const s of stories) {
    if (s.error) continue;
    const fm = s.frontmatter ?? {};
    for (const dep of fm.deps ?? []) {
      if (!storyById.has(dep)) err(s.file, `dep "${dep}" does not exist`);
    }
    for (const dep of fm["deps-rfc"] ?? []) {
      if (!rfcById.has(dep)) err(s.file, `deps-rfc "${dep}" does not exist`);
    }
  }

  // DFS cycle detection over story deps
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map([...storyById.keys()].map((id) => [id, WHITE]));
  function visit(id, stack) {
    if (color.get(id) === GRAY) {
      err(storyById.get(id).file, `dep cycle detected: ${[...stack, id].join(" → ")}`);
      return;
    }
    if (color.get(id) === BLACK) return;
    color.set(id, GRAY);
    const fm = storyById.get(id).frontmatter ?? {};
    for (const dep of fm.deps ?? []) {
      if (storyById.has(dep)) visit(dep, [...stack, id]);
    }
    color.set(id, BLACK);
  }
  for (const id of storyById.keys()) visit(id, []);

  return { errors };
}
