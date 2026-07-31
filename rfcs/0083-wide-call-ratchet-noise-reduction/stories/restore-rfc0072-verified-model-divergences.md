---
title: "restore-rfc0072-verified-model-divergences"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5733
claim: "2026-07-31T18:26:54Z"
assignee: "restore-rfc0072-verified-model-divergences"
blocked-by: null
closed-reason: null
---

## Context

RFC 0083's same-file transitive closure (PR #5728) widened the wide call gate's
TS call-set through same-file helpers. That cleared 408 baseline rows, four of
which were NOT false positives: they carried a hand-written
`Per-entry verified (RFC 0072 ...)` reason recording a real, investigated
divergence. The closure resolves them because a same-file helper happens to make
the same call for an unrelated reason, so the gate no longer tracks them. The
divergences themselves are untouched and are recorded here so they are not lost.

1. `relation.ts` `_execScope` (Rails `_exec_scope`, relation.rb:552-558) — Rails
   resolves the registry via `model.scope_registry`; trails reads the
   process-wide `ScopeRegistry.instance()` and never touches the model. The
   closure now reaches `model` through `_scoping`, but `_scoping`'s `this.model`
   reads look up per-model current-scope INSIDE the still-global registry — the
   per-model registry accessor is what is missing.
2. `relation.ts` `update` (relation.rb:620-627) — Rails dispatches the by-id form
   to `model.update(id, attributes)`; trails does `find(id)` then
   `record.update(...)`. A different code path.
3. `relation.ts` `updateBang` (Rails `update!`, relation.rb:629-636) — same
   divergence as (2) against `model.update!`.
4. `relation/query-methods.ts` `buildJoinBuckets` (Rails `build_join_buckets`,
   query_methods.rb:1847-1850) — Rails pops the stashed eager JoinDependency out
   of `joins_values` only `if joins.last.base_klass == model`. trails keeps no
   JoinDependency in `joinsValues`: the eager stash lives in
   `_eagerLoadAssociations` and cross-klass merged JDs in `_namedInnerJoinDeps`,
   so the discriminator is structural. Converging requires re-merging the three
   stores into one `joins_values`.

## Acceptance criteria

- (1) `_execScope` routes the scope-registry lookup through the model
  (`model.scopeRegistry`), matching relation.rb:552-558, OR the story is closed
  with a written finding that the per-model accessor is out of scope and why.
- (2)+(3) `update` / `updateBang` dispatch the by-id form through the model
  (`model.update` / `model.updateBang`) as relation.rb:620-636 does, rather than
  `find` + `record.update`.
- (4) is scoped as its own follow-up if the three-store re-merge is larger than
  one PR — register it rather than attempting it inside this story.
- Each converged item is verified against its vendored Rails body, with the
  ported tests for the touched methods passing.
