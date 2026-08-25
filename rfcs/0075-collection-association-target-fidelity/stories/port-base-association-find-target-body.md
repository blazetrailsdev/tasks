---
title: "Port Rails' Association#find_target body into the base findTarget stub"
status: blocked
updated: 2026-08-05
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-08-05T02:45:04Z"
assignee: "row-count-is-debt-not-seeded-reasons"
blocked-by: "Not a body port: the Rails base find_target machinery does not exist in trails. `skip_statement_cache?` (association.rb:391) has no TS counterpart at all, and the three subclass findTarget overrides do not call a shared base body — each delegates to a standalone functional loader (singular-association.ts:444, has-many-association.ts:514, has-one-through-association.ts:732, plus has-many-through-association.ts) totalling ~3,300 LOC that never builds `scope`/statement-cache at all. `super.findTarget()` at has-many-through-association.ts:51 resolves to HasManyAssociation's override, not the base. Porting association.rb:248-270 into the base and routing subclasses through it means replacing that entire loader architecture across four files — far beyond the ~250 LOC estimate and beyond any single-PR ceiling. Needs to be re-cut as an epic: (1) add skipStatementCache?, (2) converge one loader at a time onto scope/associationScopeCache/getBindValues, (3) collapse into the base. Surfaced while shipping the rest of bundle row-count-is-debt-not-seeded-reasons."
closed-reason: null
---

## Context

Surfaced while retiring `doAsyncFindTarget` in #6110 (RFC 0072 story
`retire-do-async-find-target-hook`). With the hook gone, `Association#findTarget`
(`packages/activerecord/src/associations/association.ts`) is the single seam — but the
base implementation is an empty stub:

```ts
protected async findTarget(): Promise<Base | Base[] | null> {
  return null;
}
```

Rails' base `Association#find_target`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:248-270`) is
NOT abstract — it carries the whole shared load body, and subclasses call it (directly
or via `super`) rather than reimplementing it:

```ruby
def find_target(async: false)
  if violates_strict_loading?
    Base.strict_loading_violation!(owner: owner.class, reflection: reflection)
  end

  scope = self.scope
  if skip_statement_cache?(scope)
    if async
      return scope.load_async.then(&:to_a)
    else
      return scope.to_a
    end
  end

  sc = reflection.association_scope_cache(klass, owner) do |params|
    ...
  end
  ...
end
```

Because the TS base is empty, every subclass reimplements the strict-loading check,
scope construction and statement-cache decision in its own override. That is what the
10 surviving `find_target` rows in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/associations/association.json`
encode (`association_scope_cache`, `skip_statement_cache?`,
`strict_loading_violation!`, `set_inverse_instance`, `set_strict_loading`,
`get_bind_values`, `with_connection`, `merge!`, `create`) — #6110 retired the 9 that
went stale when the delegate was deleted; the rest remain real.

## Converged shape

- Port `association.rb:248-270` into base `Association#findTarget`: the
  `violates_strict_loading?` guard, `scope`, the `skip_statement_cache?(scope)` early
  return, and the `association_scope_cache` / bind-values path.
- Subclass overrides keep only what their Rails counterpart keeps and reach the shared
  body via `super.findTarget()` — as `HasManyThroughAssociation#findTarget` already
  does (`has-many-through-association.ts:49`).
- Retire the corresponding baseline rows in
  `call-mismatches-wide-exclude/activerecord/associations/association.json` (only-shrink)
  and lower the per-file unreviewed mark.

## Acceptance criteria

- [ ] Base `Association#findTarget` has the branches of association.rb:248-270 in the
      same order, with the Rails locals (`scope`, `sc`, `async`).
- [ ] No subclass duplicates the strict-loading / statement-cache logic the base owns.
- [ ] `pnpm parity:api:calls` passes with a strictly smaller `find_target` baseline.
- [ ] has_one, has_one :through, belongs_to, has_many, has_many :through and
      collection-proxy suites pass; no test renames.
