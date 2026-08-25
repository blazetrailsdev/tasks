---
title: "singular association loads recompile scope SQL each time (no association_scope_cache statement cache)"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: 3943
claim: "2026-06-23T00:43:18Z"
assignee: "singular-association-statement-cache"
blocked-by: null
---

## Context

Rails loads a singular association target via a per-association **statement
cache**: `Association#find_target` (`association.rb:248`) builds
`reflection.association_scope_cache(klass, owner) { ... }` once and reuses the
compiled SQL + binds via `sc.execute(binds, c)` on every subsequent load,
falling back to `scope.to_a` only when `skip_statement_cache?(scope)`.

trails has no equivalent: `loadHasOne` / `loadBelongsTo`
(`packages/activerecord/src/associations.ts` — the `rel.take()` sites) rebuild
the association scope and recompile the SQL on every target load. This is a
**performance** gap, not a behavioral one — the emitted SQL and the
no-ORDER-BY semantics already match Rails (see the `take()` convergence in PR
3720 / story `habtm-collection-proxy-find`). Filing so the missing
statement-cache layer is tracked rather than silently absent.

Related: PR 3720 switched the singular-load sites from `rel.first()` to
`rel.take()` to match Rails' `Association#find_target` → `Array#first`
(unordered LIMIT 1).

## Acceptance criteria

- [ ] Singular association loads (`loadHasOne` / `loadBelongsTo`, non-disable-joins
      reflection paths) reuse a compiled scope/SQL cache keyed per association +
      owner class, mirroring `reflection.association_scope_cache` / `sc.execute`.
- [ ] `skip_statement_cache?` equivalent falls back to recompiling (instance-
      dependent scopes, default-scope-with-limit, etc.).
- [ ] No behavioral/SQL change vs current `take()` path; covered by existing
      has_one/belongs_to query-count assertions.
- [ ] Green on SQLite/PG/MySQL.
