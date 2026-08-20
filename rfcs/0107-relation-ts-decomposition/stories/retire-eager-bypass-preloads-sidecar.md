---
title: "Retire _eagerBypassPreloads: JOIN the eager loads that degrade to preload, dropping the preload_associations arg-shape row"
status: in-progress
updated: 2026-08-20
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 12
pr: 6764
claim: "2026-08-20T10:22:32Z"
assignee: "destroy-async-test-port-and-model-flip"
blocked-by: null
closed-reason: null
---

## Context

This is the one **call-argument** deviation the parity gate records against
this RFC's file. `pnpm parity:api:calls:args` is OK on `origin/main` (166
baselined shape rows) only because the row is baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`:

```json
{
  "tsFile": "relation.ts",
  "rubyName": "exec_queries",
  "call": "preload_associations",
  "kind": "args",
  "rubyArgs": ["ref:records"]
}
```

Rails' `preload_associations` takes exactly one argument and derives its own
list (`vendor/rails/activerecord/lib/active_record/relation.rb:1321-1328`):

```ruby
def preload_associations(records) # :nodoc:
  preload = preload_values
  preload += includes_values unless eager_loading?
  ...
```

trails passes a second argument (`relation.ts:1113`). The extra parameter
itself is harmless — `preloadAssociations`'s default
(`relation.ts:2267-2272`) reproduces Rails' expression exactly. What forces the
explicit call is a third term the default cannot express:

```ts
const bypassPreloads = this._eagerBypassPreloads ?? [];
this._eagerBypassPreloads = null;
const preloadAssocs = [
  ...this.preloadValues,
  ...(this.isEagerLoading ? [] : this.includesValues),
  ...bypassPreloads.filter((n) => !this.preloadValues.includes(n)),
];
```

`_eagerBypassPreloads` (`relation.ts:561`) is a mutable sidecar written by
`execMainQuery` (`relation.ts:1168`) and consumed-and-nulled by `execQueries`
one frame later. It carries a **capability gap**, stated honestly at the write
site: a composite-PK / CTE / FROM-override eager load cannot emit the aliased
JOIN, so `_eagerLoadBypassesJoinDependency()` degrades it to a preload —
"Rails always JOINs." The degraded specs then have to be smuggled into the
preload list, which is why the call site cannot use Rails' one-argument form.

So the baselined arg-shape row is a _symptom_; the defect is that trails cannot
JOIN these eager loads. It is unowned: `converge-sync-eager-builders-async-to-sql`
enumerates the other F3 machinery (`_applyEagerJoinDependency`,
`_buildEagerIdSubquery`, `_buildEagerOperandManager`, the deferred distinct-PK
cluster) but does not name `_eagerBypassPreloads` or the bypass path.

**Baseline prose drift, for the claimer:** the row's `reason` text says trails
"promotes `includes` to an eager JOIN per association rather than all-or-nothing,
so the caller passes the specs NOT already promoted as a second argument." That
describes a mechanism the code no longer uses — there is no per-association
promotion at this call site on `origin/main`, only the `_eagerBypassPreloads`
degradation. Correct the reason when the row is reseeded; do not reseed it
before the work lands (the RFC's non-goals forbid a speculative reseed).

## Converged shape

Close the capability gap so `_eagerLoadBypassesJoinDependency()` has nothing
left to catch: composite-PK, CTE and FROM-override eager loads emit the aliased
JOIN through `JoinDependency` as Rails does. Then `_eagerBypassPreloads` and its
write/consume/null dance delete, `execQueries` calls
`preloadAssociations(records)` with one argument, and the baselined arg-shape
row drops.

If some arm genuinely cannot JOIN yet, do **not** leave the sidecar unexplained:
narrow it to that arm, tag it, and refile the remainder — but the goal is
deletion, since Rails has no equivalent state.

Coordinate with `converge-sync-eager-builders-async-to-sql`: both touch the
eager path and it is blocked on an async `toSql`. Check whether this arm is
reachable without that seam before claiming; if it is not, block this story on
the same reason rather than stacking.

## Acceptance criteria

- [ ] `execQueries` calls `preloadAssociations(records)` with a single
      argument, matching `relation.rb:1414`.
- [ ] `_eagerBypassPreloads` is gone: the field (`relation.ts:561`), the write
      (`:1168`), and the consume/null (`:1105-1106`).
- [ ] `_eagerLoadBypassesJoinDependency` is gone, or narrowed to a tagged,
      separately-filed residue arm with the remainder JOINing as Rails does.
- [ ] The `exec_queries` → `preload_associations` `kind: "args"` row is removed
      from `call-mismatches-exclude/activerecord/relation.json`, taking the
      file from 9 rows to 8 and the global call-arg total from 166 to 165.
- [ ] `pnpm parity:api:calls` / `:args` ratchets OK with **no** reseed
      (`parity:api:calls:args:reseed` must not be needed).
- [ ] The composite-PK eager-load suites — including
      `associations/through-association-scope-composite-pk.trails.test.ts`,
      which reads the bypass predicate today — pass on the JOIN path.
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
