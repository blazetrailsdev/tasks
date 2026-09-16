---
title: "Widen rails-file-structure-method-order to the connection-adapter tree"
status: blocked
updated: 2026-09-16
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-08-31T16:43:30Z"
assignee: "async-overrides-of-synchronous-rails-adapter-methods"
blocked-by: "Rescoped 2026-09-16 to ONE waived-ceiling PR (tasks#132, pending merge); the slice requirement that blocked it is being removed from the ACs. Remaining precondition is a quiet window: no open PR touching packages/activerecord/src/connection-adapters/** when it is opened."
closed-reason: null
---

## Context

`blazetrails/rails-file-structure-method-order` enforces Rails source order for
class members and top-level functions, and is autofixable. It is registered for
two packages only (`eslint.config.mjs:449`):

```js
files: ["packages/arel/src/**/*.ts", "packages/activemodel/src/**/*.ts"],
```

The whole `connection_adapters/` tree is therefore outside it, even though the
manifest already covers it — `eslint/rails-file-structure-method-order.json`
holds **84 adapter entries**, so the order data exists and is simply never
consulted.

This is the second half of gating the adapter tree. The first half (extra
surface) landed as #6997, which added `activerecord` to the
`parity:api:extra` ratchet.

### Measured 2026-08-24 against `main` (152b2ebe9)

Temporarily widening the glob to
`packages/activerecord/src/connection-adapters/**/*.ts` and
`packages/activerecord/src/adapters/**/*.ts`:

- **57 violations across 57 files.**
- `eslint --fix` resolves all 57 cleanly.
- The resulting diff is **12,744 insertions / 12,744 deletions** — 25,488 LOC of
  pure member reordering.

Files affected include `abstract-adapter.ts`, `abstract/connection-pool.ts`,
`abstract/schema-statements.ts`, `abstract/schema-definitions.ts`,
`abstract/transaction.ts`, `mysql2-adapter.ts`, `column.ts`, `deduplicable.ts`
and ~17 more.

### Why this lands as one waived-ceiling PR

25,488 LOC is far past the PR ceiling, and the reorder touches nearly every file
that RFC 0119's open stories, RFC 0106 and RFC 0073 are also editing. Two shapes
were weighed:

- **A sequence of one-subdirectory slices.** Keeps each diff reviewable, but five
  PRs each still run 2,000-6,000 LOC — every one needs its own waiver — and each
  rebase re-runs the reorder against a moved tree. Five quiet windows are harder
  to find than one.
- **One PR, ceiling explicitly waived.** Chosen. A pure reorder has no semantic
  diff, so the review question is not "is each hunk correct" but "is this diff a
  permutation" — which is answered once, mechanically, for the whole change.

A pure reorder is cheap to _redo_ and expensive to _hold_, so this lands in a
single quiet window and is regenerated rather than rebased if it goes stale.

## Acceptance criteria

- The lint glob covers `packages/activerecord/src/connection-adapters/**/*.ts`
  and `packages/activerecord/src/adapters/**/*.ts`, and `pnpm lint` is clean.
- Landed as **one PR** from `main`, with the LOC ceiling explicitly waived in the
  PR body and the waiver justified as pure `eslint --fix` output.
- The diff is `eslint --fix` output only — **no hand edits**. Verifiable two ways:
  `git diff --shortstat` shows insertions equal to deletions, and re-running
  `pnpm lint --fix` on the branch produces no further change.
- Taken in a quiet window: no open PR touches
  `packages/activerecord/src/connection-adapters/**` when it is opened. Check
  with `gh pr list --search "connection-adapters"` first. If the window closes
  before merge, regenerate the branch rather than rebasing it.
- No `.trails.test.ts` or snapshot churn: a permutation changes no behaviour, so
  any test diff means a hand edit crept in.
