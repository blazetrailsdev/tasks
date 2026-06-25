---
rfc: "0001-task-system"
title: "Task system (RFCs + story files + fast index)"
status: closed
created: 2026-05-28
updated: 2026-05-28
owner: "@deanmarano"
clusters:
  - scaffold
  - conversion
---

# RFC 0001 — Task system

> **Note:** This RFC is self-demonstrating. Its own structure — directory
> layout, frontmatter schema, section headings, story files — is the canonical
> template that all future RFCs copy. To start RFC NNNN, copy this directory,
> renumber, and edit the prose.

---

## Summary

Replace ad-hoc `docs/*-plan.md` checklists with a three-layer task system:
human-authored RFCs, machine-readable story files with YAML frontmatter, and a
disposable SQLite index built from those files. Agents query the index; humans
edit the markdown.

---

## Motivation

The current planning surface is a collection of markdown plan docs with prose
checklists. Humans read them well; agents do not. Concretely:

- `spawn-loop` greps for `- [ ]` lines and uses heuristics to detect blockers.
  Format drift across docs causes missed or duplicate picks.
- `post-merge-findings` appends bullet text. There is no structured record of
  "what PR closed which task."
- The "bundle adjacent tasks toward 250–500 LOC" rule lives only in CLAUDE.md
  and MEMORY.md prose. Agents cannot programmatically compute a valid bundle.
- Dependency relationships are expressed as prose ("gated on D-1 completion").
  There is no way to query "what is unblocked right now?" without parsing text.

The beads evaluation (`docs/beads-evaluation.md`) identified the right
requirements — dep graph, ready queue, atomic claim, `--json` output — but ruled
out beads because its binary Dolt store is not diff-readable, it adds a non-npm
binary, and it is single-writer under parallel worktrees.

This RFC achieves the same ergonomics with markdown as the permanent source of
truth and a derived, disposable index.

---

## Design

### Repository split

RFCs and stories live in a **separate git repo** —
`blazetrailsdev/tasks` — cloned as a sibling of `trails/`. The trails
repo holds only the CLI that consumes the sibling repo. This isolates
high-churn task state (story creation, status flips, post-merge bookkeeping)
from the code repo's `git log`, CI runs, and PR-review rules. The trails
repo's LOC ceiling, lint, and full CI suite do not apply to story or RFC
edits.

### Directory layout

**`tasks/`** (sibling repo, loose rules):

```text
tasks/
  README.md                    ← repo overview + §Lifecycle (status definitions)
  index.md                     ← registry of all RFCs (auto-generated)
  index.json                   ← flat story metadata (auto-generated)
  search.json                  ← lightweight search index (auto-generated)
  scripts/                     ← validate + build-index tooling
  rfcs/
    0000-template/             ← copy this to start a new RFC
      README.md
      stories/
        template-story.md
    0001-task-system/
      README.md                ← this file (lives here post-bootstrap)
      stories/
        scaffold-tooling.md
        wire-tasks-loop.md
        convert-bootstrap-rfc.md
    0002-bootstrap-databasetasks/
      README.md
      stories/
        visitor-on-establish.md
        ...
```

**`trails/`** (this repo):

```text
scripts/tasks/
  build-index.ts               ← reads story frontmatter → sqlite db
  cli.ts                       ← tasks CLI entry point
.tasks/
  index.db                     ← generated, gitignored
```

The CLI locates the sibling repo via `TASKS_DIR` env var, falling
back to `../tasks/` relative to the trails repo root. Cloning is a
one-time setup step; agents and humans never think about which repo holds
what — `pnpm tasks <cmd>` is the only seam.

### Three layers

1. **RFC** (`README.md`) — motivation, design, alternatives, rollout, open
   questions. Reviewed as a PR. Long-lived reference. Aim 200–400 lines.
2. **Story file** (`stories/*.md`) — one work item per file. Frontmatter is the
   machine-readable schema. Body is prose context + acceptance criteria.
3. **Index** (`index.db`) — derived from story frontmatter. Never edited
   directly. Rebuilt on demand.

### RFC template

Every RFC `README.md` carries the YAML frontmatter block shown at the top of
**this file** and uses the section order:
Summary → Motivation → Design → Alternatives considered → Rollout →
Open questions → Changelog. Skip a section only if it is genuinely
empty (omit the heading; do not leave it stubbed).

#### RFC frontmatter schema

| Field           | Type      | Notes                                                                                      |
| --------------- | --------- | ------------------------------------------------------------------------------------------ |
| `rfc`           | string    | Slug matching the directory name, e.g. `"0001-task-system"`.                               |
| `title`         | string    | Short prose title.                                                                         |
| `status`        | enum      | `draft` `active` `closed` `postponed` `superseded`. See §Lifecycle.                        |
| `created`       | date      | ISO date.                                                                                  |
| `updated`       | date      | ISO date — bumped on substantive edits.                                                    |
| `owner`         | string    | GitHub handle.                                                                             |
| `packages`      | string[]  | Trails packages this RFC touches, e.g. `["activerecord", "arel"]`. Drives search faceting. |
| `clusters`      | string[]  | **Closed set of cluster names this RFC's stories may use.** Validated by build-index.      |
| `superseded-by` | string?   | RFC slug that replaces this one. Required when `status: superseded`.                       |
| `related-rfcs`  | string[]? | Non-blocking cross-references to other RFCs (meta-RFC coordination).                       |

#### Lifecycle

| Status       | Meaning                                                              |
| ------------ | -------------------------------------------------------------------- |
| `draft`      | Under design. No story work happens yet.                             |
| `active`     | Accepted. Stories may be claimed and worked.                         |
| `closed`     | All stories `done` (or explicitly abandoned). Terminal.              |
| `postponed`  | Deferred indefinitely. Not abandoned — may return to `active` later. |
| `superseded` | Replaced by another RFC. Carries `superseded-by` pointer. Terminal.  |

Transitions are direct-push edits to the frontmatter, no PR required.
Documented in full in `rfcs/README.md` §Lifecycle.

#### RFC numbering

Sequential integers, no skips, no reservations. The next RFC after this one
is `0002`, regardless of subject. RFC 0001 is the only RFC numbered out of
implementation order (it had to exist to enable the rest). The
`0000-template/` directory is the literal starter — copy it, renumber to
the next free integer, fill in the prose.

#### Meta-RFCs

There are no nested RFCs and no special directory treatment for umbrella
work. A meta-RFC is a regular RFC whose stories happen to be coordination
(sequencing, status rollup, cross-RFC decisions). Cross-references go in
`related-rfcs` frontmatter; story-level cross-RFC blockers go in a story's
`deps-rfc` field. The `ready_stories` view in the index treats
`deps-rfc: ["0003-fixtures"]` as blocked until RFC 0003 reaches
`status: closed`.

### Story file template

Every story lives at `docs/rfcs/NNNN-slug/stories/<id>.md`. The filename IS
the ID.

```markdown
---
title: "<short prose title>"
status: ready
rfc: "0001-task-system"
cluster: <freetext grouping label>
deps: []
est-loc: 180
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

What situation does this story address? One or two paragraphs. Reference
the relevant RFC section and any prior PRs.

## Acceptance criteria

- [ ] concrete, testable bullet
- [ ] another concrete bullet

## Notes

Optional. Hazards, Rails source pointers, non-obvious context.
```

### Frontmatter schema

| Field        | Type            | Values                                                                       | Required                 |
| ------------ | --------------- | ---------------------------------------------------------------------------- | ------------------------ |
| `title`      | string          | prose                                                                        | yes                      |
| `status`     | enum            | `draft` `ready` `claimed` `in-progress` `done` `blocked`                     | yes                      |
| `rfc`        | string          | RFC slug, e.g. `"0001-task-system"`                                          | yes                      |
| `cluster`    | string          | must match one of the parent RFC's declared `clusters`                       | yes                      |
| `deps`       | string[]        | story IDs this story depends on                                              | yes (empty `[]` if none) |
| `deps-rfc`   | string[]        | RFC slugs that must reach `status: closed` before this story is ready        | no                       |
| `est-loc`    | integer \| null | estimated PR LOC (additions + deletions, excl. lockfiles); `null` if unknown | yes (field present)      |
| `pr`         | integer \| null | GitHub PR number once open                                                   | no                       |
| `claim`      | string \| null  | ISO timestamp when claimed                                                   | no                       |
| `assignee`   | string \| null  | worktree name or agent ID                                                    | no                       |
| `blocked-by` | string \| null  | freetext reason if status is `blocked`                                       | no                       |

Status lifecycle:

```text
draft → ready → claimed → in-progress → done
                        ↓
                     blocked (→ ready once unblocked)
```

### Index

**Format:** SQLite via `better-sqlite3` (already a transitive dep through the
SQLite adapter — no new dependency). JSON was considered; the dep-graph join
and the `next-bundle` LOC accumulation query are far cleaner in SQL.

**Schema:**

```sql
CREATE TABLE stories (
  id          TEXT PRIMARY KEY,   -- filename without .md
  rfc         TEXT NOT NULL,
  title       TEXT NOT NULL,
  status      TEXT NOT NULL,
  cluster     TEXT NOT NULL,
  est_loc     INTEGER NOT NULL,
  pr          INTEGER,
  claim       TEXT,
  assignee    TEXT,
  blocked_by  TEXT,
  file_path   TEXT NOT NULL
);

CREATE TABLE deps (
  story_id    TEXT NOT NULL REFERENCES stories(id),
  dep_id      TEXT NOT NULL REFERENCES stories(id),
  PRIMARY KEY (story_id, dep_id)
);

CREATE VIEW ready_stories AS
SELECT s.* FROM stories s
WHERE s.status = 'ready'
  AND NOT EXISTS (
    SELECT 1 FROM deps d
    JOIN stories dep ON dep.id = d.dep_id
    WHERE d.story_id = s.id AND dep.status != 'done'
  );
```

`build-index.ts` globs `docs/rfcs/*/stories/*.md`, parses YAML frontmatter
(`js-yaml`, already in the workspace), validates required fields, and upserts.
Idempotent. Auto-rebuilds when any story `.md` is newer than `index.db`.

### CLI surface

`pnpm tasks <command>`:

| Command                                                | Purpose                                               |
| ------------------------------------------------------ | ----------------------------------------------------- |
| `ready [--json] [--rfc <slug>]`                        | List stories with status `ready` and all deps `done`. |
| `next-bundle [--max-loc 250] [--cluster <n>] [--json]` | Greedy same-cluster bundle ≤ `--max-loc`.             |
| `claim <id> [--assignee <name>]`                       | Atomic claim: writes frontmatter + index.             |
| `done <id> --pr <number>`                              | Mark merged.                                          |
| `block <id> --reason "<text>"`                         | Record blocker.                                       |
| `list [--rfc <slug>] [--status <v>] [--cluster <n>]`   | Filtered listing.                                     |
| `status`                                               | Counts by status across all RFCs.                     |

The CLI is the canonical way to transition status. Humans may edit
frontmatter directly; `pnpm tasks:build` reconciles.

### Workflow integration

**spawn-loop:** replace `grep -n '- \[ \]' docs/*-plan.md | head -1` with
`pnpm tasks next-bundle --max-loc 250 --json`. The skill reads the JSON,
reads the story file for prompt context, calls `pnpm tasks claim <id>`, then
launches the agent. If claim fails (already taken) the skill retries
`next-bundle`.

**post-merge-findings:** creates new story files for follow-ups identified
during triage and calls `pnpm tasks done <id> --pr <number>` for the merged
story. No other source file is modified.

**Bundle ceiling:** the 250–500 LOC rule currently lives only in CLAUDE.md
prose. With `est-loc` + `next-bundle --max-loc`, the rule is enforced
algorithmically. `build-index.ts` warns when a single story declares
`est-loc > 500`. Stories with `est-loc: null` are excluded from
`next-bundle` (they still appear in `ready` and `list`) — the agent or
human picking them up is responsible for estimating before claim.

### Story authorship and review rules

The `tasks` repo runs **loose rules** compared to the trails repo:

- **No code-style LOC ceiling.** A generous markdown file ceiling
  (default 2000 lines per file) catches pathological cases; anything
  short of that is fine.
- **Prettier + markdownlint** run on commit and in CI — formatting only,
  no prose linting beyond markdown structure.
- **Frontmatter validation** runs in CI: schema, dep-cycle check, ID
  uniqueness, cluster match against parent RFC.
- **Pre-commit hook regenerates committed indices** so single-file edits
  remain quickly committable:
  - `index.md` — human-readable registry of all RFCs
  - `index.json` — flat array of all story frontmatter (for trails-side
    CLI consumption without re-globbing every invocation)
  - `search.json` — lightweight inverted index over story `id`, `title`,
    `cluster`, and the first heading of the body (lets `pnpm tasks search`
    grep without scanning every file)
    The hook must complete in well under a second on a warm working tree;
    it only re-reads files whose mtime changed since the last index build.
- **Direct-to-main pushes are the default** for story creation, status
  flips, and post-merge bookkeeping. PRs are reserved for substantive RFC
  README edits where design review adds value.
- **Both authorship paths land in the same repo:**
  1. _RFC-time_ — stories committed alongside the RFC `README.md` (typically
     in the same PR or push, in the tasks repo).
  2. _Implementation-time_ — stories created by `post-merge-findings` or by
     an agent mid-implementation. These push directly to `main` of the
     tasks repo.

The story's parent RFC must exist, and its `cluster` must be one of that
RFC's declared `clusters`. Adding a new cluster is an RFC README edit — a
PR in the tasks repo if the change is substantive, otherwise a direct
push.

---

## Alternatives considered

- **beads:** binary Dolt store is not diff-readable; non-npm binary; single-
  writer under parallel worktrees. See `docs/beads-evaluation.md`.
- **Keep markdown plan docs, add stricter conventions:** does not solve the
  query problem. Agents still parse prose; format drift recurs.
- **GitHub Issues / Projects:** ties task state to GitHub round-trips; offline
  agents cannot query; PR description rot.
- **JSON instead of SQLite for the index:** dep-graph join and LOC
  accumulation need ad-hoc query code; SQL is the right shape.

---

## Rollout

Each phase below maps to a story file in `stories/`.

1. **Scaffold** — `scaffold-tooling`. Create the `blazetrailsdev/tasks`
   repo with the bootstrap directory layout. Add `scripts/tasks/`,
   `.gitignore` entry for `.tasks/`, and the root `package.json` script in
   the trails repo. Move this RFC and its stories from
   `trails/docs/rfcs/0001-task-system/` into `rfcs/0001-task-system/`
   and delete the bootstrap copy in trails. Zero functional impact on trails
   code.
2. **First conversion** — this RFC's own stories are the proof. After
   scaffold lands, `pnpm tasks ready` returns at least one row sourced from
   the sibling repo.
3. **Wire tasks-loop** — `wire-tasks-loop`. A new `tasks-loop` skill (copy of
   `spawn-loop`) prefers `tasks next-bundle` and falls back to grep for any
   plan doc without a corresponding RFC.
4. **Second RFC** — `convert-bootstrap-rfc`. Convert a live activerecord plan
   doc to RFC 0002. (Original pool target shipped before conversion, so it was
   repointed to `docs/activerecord/bootstrap-to-databasetasks-plan.md` →
   `rfcs/0002-bootstrap-databasetasks/`.)
5. **Remaining `docs/` plan docs** — most existing `docs/*.md` and
   `docs/activerecord/*.md` files are incomplete implementation plans, not
   reference documentation. The default disposition is **convert to an
   RFC**. A small minority are true reference docs (e.g. evaluations,
   retrospectives) and stay as plain markdown. Triage in batches; rough
   priority by spawn-loop usage: fixtures-adoption → activerecord-100 →
   html-sanitizer → system-testing → the long tail.
6. **Remove redirect stubs** — once all spawn-loop / CI references point at
   RFC paths, archive the original plan docs.

### Coexistence rule during transition

- If a plan doc has a corresponding RFC, spawn-loop uses `rfcs`.
- If no RFC exists yet, spawn-loop uses the old grep path.
- `post-merge-findings` writes to whichever format the merged PR references.

---

## Open questions

1. **`est-loc` enforcement.** Warn (non-blocking) or error (blocking) when
   `est-loc > 500`? Recommendation: warn at build time, error in CI.
2. **Cross-cluster bundles.** `next-bundle` is same-cluster only. Allow
   cross-cluster bundles when a single cluster has fewer than `--max-loc`
   available? Recommendation: no — mixing clusters in one PR makes review
   harder.
3. **MEMORY.md pruning.** Once an epic has an RFC, remove its MEMORY.md
   entry and point agents at `pnpm tasks status --rfc NNNN`?
   Recommendation: yes.
4. **RFC amendment workflow.** Typo and status-update edits to RFC READMEs
   directly to `main`? Structural changes via PR? Recommendation: yes to
   both.

### Completed stories

Stories are **marked done, not deleted.** PR descriptions reference story
IDs, post-merge findings link back to them, and the prose body is the
record of why the work happened. `pnpm tasks status` excludes `done` from
counts by default. If a single RFC's story directory grows past ~200
files, completed stories may be moved into a sibling `archive/`
subdirectory — not deleted. The index-build script reads both.

### Concurrent claim

The `tasks` repo is the synchronization point. `pnpm tasks claim <id>`:

1. `git pull --rebase` in the rfcs repo
2. Verify the story's `claim` field is still `null` (else abort)
3. Edit the frontmatter (`status: claimed`, `claim: <ISO>`, `assignee: <name>`)
4. `git commit` and `git push`
5. If the push fails (non-fast-forward — another agent claimed first), reset,
   re-pull, and exit non-zero so the caller can retry `next-bundle`

Git's atomic push semantics make this race-free without filelocks or a
central lock service. spawn-loop wraps the retry loop: on claim failure it
calls `next-bundle` again and tries the next story. Two agents racing on
the same story produces one winner and one quick retry — no corrupted
state.

### Resolved

- **Prior art adopted from Ember / Rust RFCs:** literal `0000-template/`
  starter directory; `postponed` and `superseded` terminal RFC statuses
  with `superseded-by` pointer; `packages` frontmatter field; lifecycle
  documented in `rfcs/README.md`. Skipped: PR-number-as-RFC-number (clean
  sequential is better at our scale), FCP (internal repo), multi-template
  variants (single template until pain), more than 5 lifecycle states.
- **Meta-RFCs:** flat numbering, no nesting. Cross-references via
  `related-rfcs` frontmatter and story-level `deps-rfc`.
- **Repo split** — RFCs and stories live in a separate `tasks` repo,
  not under `docs/rfcs/` in trails. Loose rules in the tasks repo; trails
  CI and LOC ceilings do not apply there.
- **Claim TTL** — no TTL. Stale claims are progressed manually as needed.
- **Cluster taxonomy** — closed set per RFC, declared in `clusters:`
  frontmatter; validated by `build-index.ts`.
- **`est-loc` nullable** — yes; null excludes from `next-bundle`.
- **Story authorship** — both RFC-time and implementation-time authorship
  land in the tasks repo, direct-to-main by default (see §Story authorship
  and review rules).
- **RFC numbering** — strictly sequential, no skips.

---

## Changelog

- 2026-05-28: initial RFC (self-demonstrating template).
