---
title: "Give the call-argument gate a call-site JSDoc receipt"
status: done
updated: 2026-08-21
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6827
claim: "2026-08-21T16:20:37Z"
assignee: "converge-habtm-through-model-lazy-table-name"
blocked-by: null
closed-reason: null
---

## Context

Tooling gap surfaced by `args-dl-adapter-factory-invented-kwarg` in PR #6823.
That story's acceptance criteria offered a choice: converge the call site, "or
the reason it cannot be is recorded at the call site with `@noRailsEquivalent`
... rather than a baseline row". The second arm does not exist.

The call-SET gate honours JSDoc receipts at the call site — `@missingRailsCall`
is read by `scripts/api-compare/missing-rails-call-tags.ts` and enforced by
`lint-missing-rails-call-reasons.ts`, so a single justified omission needs no
baseline row. The call-ARGUMENT gate (`scripts/api-compare/call-args.ts`,
`lint-call-args.ts`) has no equivalent: `grep -n "missingRailsCall\|
noRailsEquivalent" scripts/api-compare/call-args.ts scripts/api-compare/lint-call-args.ts`
returns nothing. Every argument-shape deviation, however local and however well
understood, can only be recorded as a row in
`scripts/api-compare/call-mismatches-exclude/**`.

That matters for the debt metric. CLAUDE.md makes row COUNT the measure for
this baseline, and rows converge by deletion — so a deviation that is genuinely
permanent (a JS `Map` has no `initial_capacity`; `queueMicrotask` has no thread
pool to size) sits in the count forever, indistinguishable from unfinished
work. PR #6823 left nine such rows for exactly this reason.

## Converged shape

An `@missingRailsArgs <reason>` (or a reuse of `@missingRailsCall`) JSDoc tag
at the call site, read by the args comparator the same way the call-set gate
reads its tag: a tagged site is suppressed from
`output/call-arg-mismatches.json`, needs no exclude row, and its reason is
reviewed in the diff where the code is rather than in a JSON shard.

## Acceptance criteria

- `pnpm parity:api:calls:args` honours a call-site tag, with the same
  permanence discipline `parity:api:extra` already enforces on
  `@noRailsEquivalent` (PERMANENT / CONVERGEABLE).
- The tag is only honoured for a genuine language- or runtime-level fact, and
  the lint refuses a bare tag with no reason — the escape hatch must not become
  cheaper than converging.
- At least the clearly-permanent rows PR #6823 re-read and left baselined move
  off the baseline onto tags, so the row count reflects convertible debt:
  the two `Concurrent::Map.new(initial_capacity:)` hints
  (`activemodel/lib/active_model/attribute_methods.rb:418`,
  `activerecord/lib/active_record/connection_adapters/abstract/connection_handler.rb:78`)
  and the `Concurrent::ThreadPoolExecutor` sizing (`connection_pool.rb:717-722`).
