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

// Numeric-prefix pairs that legitimately share a four-digit prefix and predate
// the duplicate-prefix guard below. Each entry is the shared prefix; the two
// dirs were finalized concurrently before finalize-rfc.mjs serialized number
// assignment, so neither can be renumbered without rewriting cross-references.
// The guard still protects every *future* finalize — only these grandfathered
// pairs are waived. Keep this list from growing: a new collision is a bug in
// the finalize flow, not a candidate for this allowlist.
export const DUP_PREFIX_ALLOWLIST = new Set(["0022"]);

// created/updated are calendar dates (YYYY-MM-DD). js-yaml's default schema
// coerces an unquoted date-only scalar (`updated: 2026-06-13`) into a JS Date
// at UTC midnight, while the template's literal `YYYY-MM-DD` placeholder — and
// any malformed/quoted value — stays a string. A field is valid iff it is a
// YYYY-MM-DD string OR a Date with a zero UTC time-of-day (a pure calendar
// date): this rejects the unfilled placeholder and a full datetime
// (`2026-06-13T10:00:00Z` carries a time component) while accepting every real
// date-only entry.
function isYmdDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return false;
    return (
      value.getUTCHours() === 0 &&
      value.getUTCMinutes() === 0 &&
      value.getUTCSeconds() === 0 &&
      value.getUTCMilliseconds() === 0
    );
  }
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// Reference + cycle checks over the story dep graph, factored out so the full
// validator and the CLI's set-deps pre-commit guard share one traversal rather
// than maintaining drifting copies of the WHITE/GRAY/BLACK DFS.
//
// Inputs are graph accessors so a caller can run it against either the whole
// index (validate.mjs, seeding from every story) or a single post-edit node
// (cli.ts set-deps, seeding from just the edited id with its deps overridden):
//   storyIds    Set<string>       known story ids (for `deps` resolution)
//   rfcIds      Set<string>       known rfc ids (for `deps-rfc` resolution)
//   depsOf      (id) => string[]  a story's `deps` edges
//   depsRfcOf   (id) => string[]  a story's `deps-rfc` edges (optional)
//   seeds       Iterable<string>  story ids to walk references and seed the DFS from
//
// Returns structured violations — no file attribution or message formatting, so
// each caller renders them in its own voice:
//   refViolations [{ from, dep, kind: "dep" | "deps-rfc" }]  // in seed order, deps then deps-rfc per story
//   cycles        [string[]]                                  // each path ends at its repeated node, in DFS-discovery order
export function checkDepGraph({ storyIds, rfcIds, depsOf, depsRfcOf, seeds }) {
  const seedList = [...seeds];
  const refViolations = [];
  for (const from of seedList) {
    for (const dep of depsOf(from)) {
      if (!storyIds.has(dep)) refViolations.push({ from, dep, kind: "dep" });
    }
    for (const dep of depsRfcOf?.(from) ?? []) {
      if (!rfcIds.has(dep)) refViolations.push({ from, dep, kind: "deps-rfc" });
    }
  }

  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map();
  const cycles = [];
  const visit = (id, stack) => {
    if (color.get(id) === GRAY) {
      cycles.push([...stack, id]);
      return;
    }
    if (color.get(id) === BLACK) return;
    color.set(id, GRAY);
    for (const dep of depsOf(id)) if (storyIds.has(dep)) visit(dep, [...stack, id]);
    color.set(id, BLACK);
  };
  for (const id of seedList) visit(id, []);

  return { refViolations, cycles };
}

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
    for (const key of ["created", "updated"]) {
      if (fm[key] != null && !isYmdDate(fm[key])) {
        err(r.file, `${key} must be a YYYY-MM-DD date (got ${JSON.stringify(fm[key])})`);
      }
    }
    rfcById.set(r.dir, r);
  }

  // Two RFC dirs sharing a four-digit numeric prefix collide in every
  // number-keyed reference (index ordering, "RFC 0022" prose). finalize-rfc.mjs
  // is meant to hand out a unique number per merge; a duplicate means that
  // serialization slipped, so flag it — except the grandfathered pairs above.
  const prefixDirs = new Map();
  for (const r of rfcs) {
    const m = r.dir.match(/^(\d{4})-/);
    if (!m) continue;
    (prefixDirs.get(m[1]) ?? prefixDirs.set(m[1], []).get(m[1])).push(r);
  }
  for (const [prefix, group] of prefixDirs) {
    if (group.length > 1 && !DUP_PREFIX_ALLOWLIST.has(prefix)) {
      for (const r of group) {
        err(
          r.file,
          `duplicate RFC numeric prefix "${prefix}" (shared with ${group
            .filter((g) => g !== r)
            .map((g) => g.dir)
            .join(", ")})`,
        );
      }
    }
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
    for (const key of ["created", "updated"]) {
      if (fm[key] != null && !isYmdDate(fm[key])) {
        err(s.file, `${key} must be a YYYY-MM-DD date (got ${JSON.stringify(fm[key])})`);
      }
    }

    // Cross-field lifecycle invariants. Each field is already validated in
    // isolation above (type/enum); here we enforce their *joint* validity so a
    // hand-edit, crashed agent, or `--force` flip can't leave a story in a
    // self-contradictory state that the per-field checks wave through. The
    // shape mirrors exactly what the CLI's lifecycle verbs stamp (claim sets
    // claim+assignee; in-progress/done stamp pr; block stamps blocked-by; the
    // unblock path clears claim/assignee/pr/blocked-by back to the ready shape).
    //
    // `ready` with un-`done` deps is deliberately NOT an error: the CLI treats
    // `ready` as "specified and open for pickup" and filters *claimability* by
    // dep status (scripts/tasks/cli.ts `ready()`), so a ready story whose deps
    // are still open is legal — it just won't surface in the ready queue yet.
    // `done` with a null `pr` is likewise legal: a story can be completed
    // before anyone reaches it (no PR of its own), the validate-clean path the
    // CLI's done-without-PR escape hatch records.
    switch (fm.status) {
      case "draft":
      case "ready":
        for (const key of ["claim", "assignee", "pr"]) {
          if (fm[key] != null)
            err(
              s.file,
              `status: ${fm.status} must have null ${key} (got ${JSON.stringify(fm[key])})`,
            );
        }
        break;
      case "claimed":
        if (!fm.claim) err(s.file, `status: claimed requires a claim timestamp`);
        if (!fm.assignee) err(s.file, `status: claimed requires an assignee`);
        break;
      case "in-progress":
        if (!fm.claim) err(s.file, `status: in-progress requires a claim timestamp`);
        if (!fm.assignee) err(s.file, `status: in-progress requires an assignee`);
        if (fm.pr == null) err(s.file, `status: in-progress requires a pr`);
        break;
      case "blocked":
        if (!fm["blocked-by"]) err(s.file, `status: blocked requires blocked-by`);
        break;
      // `closed` is terminal for a story that will never ship code (superseded /
      // abandoned / won't-do). Closing REQUIRES a reason, the way `blocked`
      // requires `blocked-by`; the `closed-reason` cross-check below rejects it
      // on any non-closed story.
      case "closed":
        if (!fm["closed-reason"]) err(s.file, `status: closed requires closed-reason`);
        break;
      // `done` is intentionally not shape-constrained: it may carry a full
      // claim/assignee/pr (normally worked) or have them all null (completed
      // before anyone reached it — the done-without-PR path), so requiring
      // either would reject a legitimate state. Only `blocked-by` is policed
      // for done, by the cross-status check below.
      case "done":
        break;
    }
    if (fm.status !== "blocked" && fm["blocked-by"] != null) {
      err(
        s.file,
        `blocked-by is set but status is "${fm.status}" — only blocked stories carry blocked-by`,
      );
    }
    if (fm.status !== "closed" && fm["closed-reason"] != null) {
      err(
        s.file,
        `closed-reason is set but status is "${fm.status}" — only closed stories carry closed-reason`,
      );
    }
    storyById.set(s.id, s);
  }

  // Validate deps & deps-rfc references and detect cycles via the shared
  // graph check (also used by the CLI's set-deps pre-commit guard).
  const { refViolations, cycles } = checkDepGraph({
    storyIds: new Set(storyById.keys()),
    rfcIds: new Set(rfcById.keys()),
    depsOf: (id) => storyById.get(id).frontmatter?.deps ?? [],
    depsRfcOf: (id) => storyById.get(id).frontmatter?.["deps-rfc"] ?? [],
    seeds: storyById.keys(),
  });
  for (const { from, dep, kind } of refViolations) {
    err(storyById.get(from).file, `${kind} "${dep}" does not exist`);
  }
  for (const cycle of cycles) {
    // The repeated node (last element) is where validate.mjs historically
    // attributed the cycle error.
    err(storyById.get(cycle[cycle.length - 1]).file, `dep cycle detected: ${cycle.join(" → ")}`);
  }

  // A `closed` RFC asserts its work is complete. An *open* story under a closed
  // RFC is a drift the per-field checks miss — either the RFC was closed
  // prematurely or the story outlived it. A story counts as terminal-complete
  // when it is `done` (shipped) OR `closed` (abandoned/superseded); both are
  // legitimate final states under a closed RFC. Group stories by parent and
  // flag any closed RFC with a still-open child.
  const storiesByRfc = new Map();
  for (const s of storyById.values()) {
    (storiesByRfc.get(s.rfc) ?? storiesByRfc.set(s.rfc, []).get(s.rfc)).push(s);
  }
  const isTerminal = (status) => status === "done" || status === "closed";
  for (const r of rfcs) {
    if (r.frontmatter?.status !== "closed") continue;
    const open = (storiesByRfc.get(r.dir) ?? []).filter((s) => !isTerminal(s.frontmatter?.status));
    for (const s of open) {
      err(
        r.file,
        `status: closed but story "${s.id}" is "${s.frontmatter?.status}", not done or closed`,
      );
    }
  }

  return { errors };
}
