---
title: "api-compare-scope-includer-graph-resolution"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5344
claim: "2026-07-26T11:42:54Z"
assignee: "api-compare-scope-includer-graph-resolution"
blocked-by: null
closed-reason: null
---

## Context

`compare.ts` has two consumers of `moduleFqnByShort`, and they disagree on how
scoped an `include` resolution should be.

`resolveModuleName` (used by `flattenIncludedMethodInfos`) implements Ruby's
constant lookup: walk the enclosing namespaces of the including entity from
nearest outward, and only fall back to the full candidate list when no prefix
matches. That scoping is deliberate — it stops
`ActiveRecord::ConnectionAdapters::PostgreSQL::Quoting` from inflating
`AbstractAdapter`'s expected surface.

The includer-graph builder (step 1 of the transitive file-resolution pass, in
the `for (const inc of [...includes, ...extends])` loop) does an unscoped
`moduleFqnByShort.get(inc) || [inc]` instead: every module sharing the short
name gets the includer registered against it.

PR #5334 fixed the partially-qualified half of this call site (`PostgreSQL::Quoting`
is not a key in a short-name-keyed map, so the lookup missed entirely and fell
back to the verbatim string). It deliberately did NOT change the unqualified
half, because that is not a free correctness win:

Measured on that branch — routing unqualified names through `resolveModuleName`
too moved `pnpm parity:api` overall matched methods **11678 → 11657 (−21)**,
with the denominator unchanged at 17484 (data layer 7717 → 7714/7810, arity
7426/7530 → 7416/7520). So 21 methods currently get their "implemented in an
includer's TS file" credit through a same-short-name module that Ruby's scoped
lookup would NOT bind to.

Either reading could be right and the evidence does not decide it:

- If those 21 are genuinely implemented in the file the scoped lookup names,
  the graph is papering over a misplacement and the narrowing is correct
  (matched count should drop and the methods should be reported missing until
  moved).
- If the broad graph is intentional — this pass exists to find methods living
  in a _different_ file than Rails' layout implies — then scoping it defeats
  its purpose and the asymmetry should be documented rather than removed.

## Acceptance criteria

- Enumerate the 21 methods that lose their match when the includer graph is
  scoped (diff `output/` between the two variants; the one-line change is
  `moduleFqnByShort.get(inc) || [inc]` → `resolveModuleName(inc, fqn, moduleFqnByShort)`).
- For each, determine from `vendor/rails/` which module Ruby's constant lookup
  actually binds, and whether the TS method lives in the file the scoped lookup
  names or the broad one.
- Decide and implement one of: (a) scope the graph and accept the -21 as newly
  visible real gaps, or (b) keep it broad and replace the inline comment at the
  call site with the reasoned justification.
- Whichever way it lands, the two consumers of `moduleFqnByShort` must no longer
  disagree silently — the divergence is either removed or documented at both
  sites.
- Report the final `pnpm parity:api` totals.
