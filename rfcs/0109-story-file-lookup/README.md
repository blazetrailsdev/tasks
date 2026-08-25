---
rfc: "0109-story-file-lookup"
title: "Forward file→story lookup for the tasks CLI"
status: closed
created: 2026-08-18
updated: 2026-08-18
owner: "@deanmarano"
priority: 0
related-rfcs:
  - "0001-task-system"
  - "0024-tasks-cli-coverage"
  - "0091-tasks-backlog-integrity"
packages: []
clusters:
  - file-lookup
---

# RFC 0109 — Forward file→story lookup for the tasks CLI

## Summary

Give `pnpm tasks` a way to answer, for any trails file: **which open stories
already cover this, and is anyone about to touch it anyway?** Both questions are
unanswerable today. The data needed to answer them is already sitting in story
bodies — 90% of open stories cite a concrete trails path — so this RFC derives a
`story_paths` field into the index and adds one read-only verb that consumes it.
No frontmatter schema change, no story migration.

## Motivation

Two failure modes recur when an agent finds something incidental mid-task:

1. **Duplicate triage.** The agent files a story for a divergence that another
   RFC already owns. There is no way to check first.
2. **Filing what would have been fixed anyway.** A finding in a file that sees
   six edits a month gets its own story instead of riding along as a driveby.

`pnpm tasks` has **no `search` command at all**. `scripts/build-index.mjs:100-126`
writes `search.json` on every commit and nothing reads it — there is no `search`
case in the command table (`scripts/cli.ts:3450-3714`) and no `search` line in
`usage()` (`scripts/cli.ts:3717`). Its haystack is title/cluster/packages/rfc
only, so even with a reader it could not answer a path query.

Measured over the current backlog and 82 days of trails history:

- **1,198 open stories** (806 draft, 359 ready, 18 blocked, 10 in-progress, 5
  claimed); **1,075 (90%) cite at least one concrete trails path** in the body.
- Those citations resolve to **770 distinct files across 179 directories**.
- When a story cites a path, its PR actually touches that path **79%** of the
  time (89% at directory level), measured over 3,195 completed stories.
- **157 files carry open stories from more than one RFC**, and **129 (82%)
  involve `0023-surfaced-deviations`** — the catch-all. That is the duplicate
  pattern in its most common shape, and it is invisible today.
- Churn splits bimodally: of the 770 cited files, **29% are touched ≥4×/month**
  and **30% under 0.5×/month** (median 1.5). That split is what makes "file it"
  vs "note it as a driveby" a decidable question.

## Design

### Derived, not declared

A `files:` frontmatter key was evaluated and **rejected**. For a lookup,
coverage is the whole ballgame: derivation from the body covers 90% of open
stories, while the two existing optional story list keys sit at `cluster` 22%
and `packages` 21% — a new one would land in the same band. A 20%-coverage index
answers "already triaged?" with a false _no_ four times in five, which grants
permission to file the very duplicate it was meant to prevent.

The extractor lives in `scripts/lib.mjs` because `build-index.mjs` is ESM
JavaScript and cannot import `cli.ts`; `loadAll()` already returns each story's
`body` (`scripts/lib.mjs:86-87`), so no loader change is needed. Output is sorted,
deduped, and capped, because the origin/main read path caches a built index by
commit sha (`scripts/cli.ts:259-266`) and depends on byte-identical rebuilds.

Cost, measured over all 6,202 stories rather than estimated: **+527 KiB on
`index.json`, +11.7%** (4.5 MiB → 5.0 MiB). Path counts are median 1, p90 3,
p99 6, max 31, so the 20-entry cap touches **4 stories (0.06%)** — it bounds a
pathological body without truncating anything real. Both `index.json` and
`search.json` are gitignored caches, so this is memory and cache-write cost,
never repo size.

What lands in `index.json`, per story — derived, sorted, deduped, capped at 20:

```json
{
  "id": "virtual-type-no-fallback-converge",
  "rfc": "0056-adapter-type-column-reflection-fidelity",
  "story_paths": [
    "packages/activerecord/src/connection-adapters/mysql/schema-definitions.ts",
    "packages/activerecord/src/connection-adapters/postgresql/schema-definitions.ts",
    "packages/activerecord/src/connection-adapters/sqlite3/schema-definitions.ts"
  ]
}
```

### The query

One verb, `pnpm tasks touching <path>`, matching exact path → directory prefix →
substring. Directory prefix matters: directory-level citation precision is 89%,
so a query against a directory is useful even when the exact file was never
named. It serves the origin/main index via `readIndexSource()` like every other
read command, so it never dirties the shared checkout.

Draft stories are included. 806 of the 1,198 open stories are drafts, and a
draft story _is_ triage — excluding them would answer the question wrongly for
two thirds of the corpus.

Shape of the answer:

```text
$ pnpm tasks touching packages/activerecord/src/relation.ts
packages/activerecord/src/relation.ts — 348 commits/90d (hot — likely touched anyway)

46 open stories cite this path:
id                                        rfc                                          status  est-loc
collection-proxy-two-loadedness-accessors 0075-collection-association-target-fidelity   ready   80
...
```

With no hits, the churn line still prints — a cold path with zero open stories
is the case that means _file it now_, and it is the answer a caller most needs.

### Churn

"Will it be touched anyway" is answered by history, not metadata: it has 100%
coverage, no authoring cost, and cannot go stale. Resolution of the trails
checkout is **from `process.cwd()`**, never from `TASKS_DIR` — the per-worktree
`tasks` symlink (`scripts/cli.ts:76-93`, arm 3) points at a _sibling_ tree under
`tasks-worktrees/`, so `dirname(TASKS_DIR)` is not the trails repo and using it
would be a quiet, plausible-looking bug.

A path-scoped `git log --since=90.days -- <path>` measures 0.24–0.27s on real
trails history, for a file or a directory, so churn is computed per query with
no cache and nothing to invalidate.

## Non-goals

- **A `files:` frontmatter key.** ~20% projected coverage makes the primary
  query answer falsely; the body already carries it at 90%.
- **Claim-time collision warnings.** Back-tested at 21.5% recall over 44,401
  story pairs — it catches one collision in five. Not worth a gate or a nag.
- **Any hard gate.** 12% of citations go stale; every surface here is read-only.
- **Changing `ready` / `next-bundle` ordering.** Worth revisiting once
  `story_paths` exists, but it is separate work and must not ride along here.

## Alternatives considered

- **`files:` frontmatter key.** Rejected on coverage; see Design.
- **Precomputing churn into a committed artifact.** Rejected: needs a
  trails-side job and an invalidation story, to replace a 0.24s query.
- **Folding this into `0091-tasks-backlog-integrity`.** That RFC is the home
  for _guards_ — validation that makes silently-broken backlog states loud
  (a story filed into a retired RFC, a parent retired underneath it). Everything
  here is a read-only query that reports on a healthy backlog; nothing it
  surfaces is an error. It is also still `status: draft`, so its stories are
  downgraded to `draft` by `effectiveStoryStatus` and cannot be claimed —
  parking this work there would make it unschedulable. The convergence report
  (`cross-rfc-convergence-report`) is the closest call; it stays here because it
  consumes `story_paths` and ships as a flag on the same verb.
- **Folding this into `0024-tasks-cli-coverage`.** Right in spirit — that RFC's
  goal was that every routine operation go through a command rather than a
  hand-edit — but it is `status: closed` with zero open stories. Reopening a
  closed RFC to add a new command is worse than relating to it.
- **Reviving `search.json` as a generic text search.** Weaker: it answers
  "stories mentioning this word", not "stories touching this file", and the
  ranking question is open. This RFC folds paths into its haystack anyway, so a
  future search command inherits them.

## Stories

| story                          | est-loc | deps                     |
| ------------------------------ | ------- | ------------------------ |
| `index-story-paths`            | 60      | —                        |
| `tasks-touching-command`       | 90      | `index-story-paths`      |
| `cross-rfc-convergence-report` | 40      | `tasks-touching-command` |

## Rollout

1. Phase 1 — `index-story-paths` (index emits the data)
2. Phase 2 — `tasks-touching-command` (the query that answers both questions)
3. Phase 3 — `cross-rfc-convergence-report` (the standing hygiene report)

## Coordination

Running the analysis this RFC is built on against the current backlog surfaces
**this RFC's own stories** converging with `0091-tasks-backlog-integrity` on
`scripts/cli.ts` and `scripts/cli.test.ts` — 0091's ready story
`delete-trails-copy-of-tasks-cli` touches the same two files. That is not a
blocker (deleting the trails-side copy of the CLI and adding a command to the
tasks-side one are compatible edits) but whoever claims second should rebase
rather than branch early. It is also the tool demonstrating itself on the very
question it exists to answer.

## Verification

- `pnpm tasks touching packages/activerecord/src/relation.ts` lists the 46 open
  stories across 7 RFCs that cite it, with a `hot` churn verdict.
- `pnpm tasks touching --conflicts` returns the ~157 cross-RFC convergences;
  `--exclude-rfc 0023-surfaced-deviations` narrows it to the ~28 epic-vs-epic
  cases.
- `pnpm test` green with the new extractor suite registered in `package.json`.

## Open questions

None outstanding. Two were resolved during the audit that produced this RFC:

1. **Declared vs derived paths.** Resolved: derived. Coverage decides it
   (90% vs ~20%), and derivation needs no migration.
2. **Where churn comes from.** Resolved: a per-query, path-scoped `git log`
   against a cwd-resolved trails checkout, degrading to lookup-only when the
   repo cannot be resolved.

## Changelog

- 2026-08-18: initial RFC
