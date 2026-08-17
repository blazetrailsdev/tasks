---
title: "extract-ts-api: resolve chained re-exports to a fixpoint and to the declaring key"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

`extract-ts-api.ts`'s re-export post-pass (extract-ts-api.ts:689-719, as
merged by PR #5337) resolves `export { X } from "./y.js"` in a SINGLE pass
over `pendingReExports`, in file-walk order. For a transitive barrel — e.g.
`index.ts` re-exporting `AbstractAdapter` from `./connection-adapters.js`,
which itself re-exports it from `./connection-adapters/abstract-adapter.js` —
whether `index.ts` gets an entry depends on whether the intermediate barrel's
clone happens to exist yet when the outer re-export is processed. If the outer
one is visited first, `info.classes["connection-adapters.ts:AbstractAdapter"]`
is still absent and no `index.ts` entry is created at all.

This is pre-existing (PR #5337 only added the `reExportedFrom` stamp, which
makes chained clones visible), but it means `compare.ts`'s Rails-path matching
for classes Rails expects at a top-level umbrella path is order-dependent
rather than deterministic.

Fix shape: iterate the post-pass to a fixpoint (repeat until no new clone is
created), and resolve `reExportedFrom` transitively to the real DECLARING key
rather than to the immediate source (which may itself be a clone). Both are
local to the post-pass loop.

## Acceptance criteria

- The re-export post-pass produces the same set of cloned entries regardless
  of source-file visit order (fixpoint, with a cycle guard).
- `reExportedFrom` always names an entry that is NOT itself a clone.
- Fixture test in `extract-ts-api.test.ts` covering a two-hop barrel chain
  (declaring file → mid barrel → outer barrel), asserted with the files
  supplied in both orders.
- Report any `pnpm parity:api` / `pnpm parity:api:extra` delta the extra clones
  cause; extra-surface totals should be unchanged (all chained clones carry
  `reExportedFrom` and are skipped there).

## Re-verified 2026-08-17 (ready sweep)

Citations spot-checked against the current tree and still resolve; no path or
mechanism in this body has been retired. Carried forward unchanged.

General note from the sweep, applies to every `scripts/api-compare/` story: RFC 0092
moved `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
to `scripts/parity/`, and RFC 0084 folded `call-mismatches-wide-exclude/` and
`lint-call-mismatches-wide.ts` into the single `call-mismatches-exclude/` tree.
Re-check any such reference before starting.
