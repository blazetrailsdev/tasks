---
title: "Compare call sequences, not call sets, in the wide ratchet"
status: done
updated: 2026-08-06
rfc: "0084-wide-call-set-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6152
claim: "2026-08-06T13:43:09Z"
assignee: "activerecord-quoted-date-through-date-package"
blocked-by: null
closed-reason: null
---

## Context

The wide call ratchet compares a Ruby body's calls to the TS body's calls as
**sets**, so it is blind to ordering and to control flow. CLAUDE.md's "Fidelity
is the job" makes control flow a first-class requirement — "Same branches, in
the same order, with the same guards and early returns" — and nothing currently
gates it.

That signal does exist in the repo today, in `scripts/prism-codegen`:
`score.ts:skeletonTokens` reduces a body to an **ordered** token stream of
control keywords (`if` / `loop` / `try` / `throw`), `new:Ctor`, and normalized
call and property reaches, and `score.ts:scoreFile` grades identical-stream as
`matched` vs same-multiset-different-order as `reordered`. `catalog.ts:skeletonDiff`
takes the multiset difference in **both** directions, so it also sees calls the
TS body makes that Rails does not.

A codegen audit (2026-08-05, audit report
`prism-codegen-coverage-20260805T143753Z.md`) measured what that buys and what
it costs. The signal is real: sampling 18 divergent rows from `relation.rb`,
roughly two ninths were divergences **only** the ordered comparison catches —
e.g. `relation.rb::create` where the generated skeleton is
`ref:map ref:create` and the port's is `loop ref:push ref:create ref:build ref:save`
(the port hand-expanded `map` into a loop and inlined `create`). A call-set diff
reports nothing there.

But the codegen path obtains that signal over a population of **10 Ruby files**
(`files.ts:TARGET_FILES`) out of ActiveRecord's 305, because
`score-cli.ts` only scores _fully-handled generated_ defs. `parity:api:calls`
already covers **1,462 distinct (package, file, method) rows across 12
packages** (`scripts/api-compare/call-mismatches-wide-exclude/`, 2,183 exclude
entries). Moving the comparison from set to sequence in `calls:wide` gets the
same signal over ~30× the surface, read directly from both sources with no
generator in the middle.

This story is the prerequisite for retiring the codegen convergence guard
(RFC 0086 story `retire-codegen-convergence-guard`); that story depends on this
one so the ordering signal is never dropped on the floor.

## Acceptance criteria

- `scripts/api-compare` compares the Ruby body's call sequence to the TS body's
  call sequence, not just the sets, and reports order-only divergence as a
  distinct status from a missing call (the `matched` / `reordered` / `divergent`
  split at `scripts/prism-codegen/score.ts:scoreFile` is the reference shape).
- The comparison stays **only-shrink**: new order-only rows are seeded into the
  existing `call-mismatches-wide-exclude/` tree via `serializeBaseline`, never
  by `--write`/reseed (see `project_baseline_json_edit_must_use_serializebaseline`).
- Ordering rows carry their own reason text so an order-only divergence is
  distinguishable from a dropped-call divergence in review.
- Known false-positive classes from the codegen implementation are **not**
  carried over: the sequence comparison must not fire on a body whose only
  difference is a delegating wrapper resolving in place of the implementation
  (`score.ts:resolvePortFn` cross-file fallback), which produced spurious
  `divergent` rows for `relation.rb::computeCacheKey` / `computeCacheVersion`.
- `pnpm parity:api:calls` gates green on `main` with the new rows baselined, and
  a deliberately reordered body in a test fixture turns it red.
- Tests live at the top level of `scripts/api-compare/` (the vitest glob is
  non-recursive).
