---
title: "Widen the stale-story-reference matcher past sentence scope and audit the backlog"
status: done
updated: 2026-08-03
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5999
claim: "2026-08-03T17:52:20Z"
assignee: "widen-stale-story-reference-matcher-and-audit"
blocked-by: null
closed-reason: null
---

## Context

PR #5984 added `scripts/stale-story-references.ts`, which fails when a comment
cites a story slug in the same _sentence_ as a forward-looking phrase
(`PENDING_PHRASE`: "converged by", "deferred to", "pending convergence",
"un-skip once", …) while that story is `done`/`closed`.

Two deliberate narrowings were taken to keep #5984 shippable, and both leave
real promises unguarded:

- **Sentence scope.** A promise and its slug that land in different sentences
  of the same comment block are missed — e.g.
  `associations/association-scope.ts:283` ("until the connection is threaded
  into `create` … it falls back") and
  `connection-adapters/abstract/connection-pool.ts:651` ("is tracked by …").
- **Phrase list.** "tracked by", "tracked to", "tracked separately in",
  "known gap", and "TODO(<slug>)" are not in `PENDING_PHRASE`, yet they are the
  most common promise spellings in the tree.

A slug-only scan (no phrase filter) reports ~85 citations of landed stories
across `packages/`, so widening needs an accompanying audit: each hit is either
converged, already-converged prose to correct, or a residual needing a fresh
convergence story (as #5984 did for `converge-referential-integrity-scoped-tables-parameter`
and `preload-hmt-with-conditions-remaining-sti-gap`).

The scan also covers only `.ts`/`.mjs` under `packages/`, `scripts/`, `eslint/`;
`.md` under `docs/` and RFC prose can name landed stories too.

## Acceptance criteria

- Widen `PENDING_PHRASE` to the "tracked by" / "TODO(<slug>)" family and lift
  the match from sentence scope to comment-block scope (or a documented
  intermediate), keeping provenance citations ("Regression for X") legal.
- Audit and resolve every citation the widened matcher surfaces — converge,
  correct the prose, or file a convergence story and repoint.
- `pnpm vitest run scripts/stale-story-references.test.ts` green on `main`.
