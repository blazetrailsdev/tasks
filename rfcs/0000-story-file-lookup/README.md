---
rfc: "0000-story-file-lookup"
title: "Forward file→story lookup for the tasks CLI"
status: active
created: 2026-08-18
updated: 2026-08-18
owner: "@deanmarano"
priority: 0
packages: []
clusters:
  - file-lookup
---

# RFC — Forward file→story lookup for the tasks CLI

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

`pnpm tasks` has **no `search` command at all**. `scripts/build-index.mjs:96-122`
writes `search.json` on every commit and nothing reads it — there is no `search`
case in the command table (`scripts/cli.ts:3420-3716`) and no `search` line in
`usage()` (`scripts/cli.ts:3721`). Its haystack is title/cluster/packages/rfc
only, so even with a reader it could not answer a path query.

Measured over the current backlog and 82 days of trails history:

- **1,164 open stories** (776 draft, 355 ready, 18 blocked, 13 in-progress, 2
  claimed); **1,048 (90%) cite at least one concrete trails path** in the body.
- Those citations resolve to **748 distinct files across 173 directories**.
- When a story cites a path, its PR actually touches that path **79%** of the
  time (89% at directory level), measured over 3,191 completed stories.
- **150 files carry open stories from more than one RFC**, and **123 (82%)
  involve `0023-surfaced-deviations`** — the catch-all. That is the duplicate
  pattern in its most common shape, and it is invisible today.
- Churn splits bimodally: of the 748 cited files, **30% are touched ≥4×/month**
  and **28% under 0.5×/month** (median 1.8). That split is what makes "file it"
  vs "note it as a driveby" a decidable question.

## Design

### Derived, not declared

A `files:` frontmatter key was evaluated and **rejected**. For a lookup,
coverage is the whole ballgame: derivation from the body covers 90% of open
stories, while the two existing optional story list keys sit at `cluster` 23%
and `packages` 21% — a new one would land in the same band. A 20%-coverage index
answers "already triaged?" with a false _no_ four times in five, which grants
permission to file the very duplicate it was meant to prevent.

The extractor lives in `scripts/lib.mjs` because `build-index.mjs` is ESM
JavaScript and cannot import `cli.ts`; `loadAll()` already returns each story's
`body` (`scripts/lib.mjs:88`), so no loader change is needed. Output is sorted,
deduped, and capped, because the origin/main read path caches a built index by
commit sha (`scripts/cli.ts:245-262`) and depends on byte-identical rebuilds.

### The query

One verb, `pnpm tasks touching <path>`, matching exact path → directory prefix →
substring. Directory prefix matters: directory-level citation precision is 89%,
so a query against a directory is useful even when the exact file was never
named. It serves the origin/main index via `readIndexSource()` like every other
read command, so it never dirties the shared checkout.

Draft stories are included. 776 of the 1,164 open stories are drafts, and a
draft story _is_ triage — excluding them would answer the question wrongly for
two thirds of the corpus.

### Churn

"Will it be touched anyway" is answered by history, not metadata: it has 100%
coverage, no authoring cost, and cannot go stale. Resolution of the trails
checkout is **from `process.cwd()`**, never from `TASKS_DIR` — the per-worktree
`tasks` symlink (`scripts/cli.ts:78-89`, arm 3) points at a _sibling_ tree under
`tasks-worktrees/`, so `dirname(TASKS_DIR)` is not the trails repo and using it
would be a quiet, plausible-looking bug.

A path-scoped `git log --since=90.days -- <path>` measures 0.24–0.27s on real
trails history, for a file or a directory, so churn is computed per query with
no cache and nothing to invalidate.

## Non-goals

- **A `files:` frontmatter key.** ~20% projected coverage makes the primary
  query answer falsely; the body already carries it at 90%.
- **Claim-time collision warnings.** Back-tested at 21% recall over 44,345
  story pairs — it catches one collision in five. Not worth a gate or a nag.
- **Any hard gate.** 12% of citations go stale; every surface here is read-only.
- **Changing `ready` / `next-bundle` ordering.** Worth revisiting once
  `story_paths` exists, but it is separate work and must not ride along here.

## Alternatives considered

- **`files:` frontmatter key.** Rejected on coverage; see Design.
- **Precomputing churn into a committed artifact.** Rejected: needs a
  trails-side job and an invalidation story, to replace a 0.24s query.
- **Reviving `search.json` as a generic text search.** Weaker: it answers
  "stories mentioning this word", not "stories touching this file", and the
  ranking question is open. This RFC folds paths into its haystack anyway, so a
  future search command inherits them.

## Rollout

1. Phase 1 — `index-story-paths` (index emits the data)
2. Phase 2 — `tasks-touching-command` (the query that answers both questions)
3. Phase 3 — `cross-rfc-convergence-report` (the standing hygiene report)

## Verification

- `pnpm tasks touching packages/activerecord/src/relation.ts` lists the 50 open
  stories across 6 RFCs that cite it, with a `hot` churn verdict.
- `pnpm tasks touching --conflicts` returns the ~150 cross-RFC convergences;
  `--exclude-rfc 0023-surfaced-deviations` narrows it to the ~27 epic-vs-epic
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
