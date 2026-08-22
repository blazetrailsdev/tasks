---
title: "AssociationScope#eval_scope omits Rails'  fallback"
status: claimed
updated: 2026-08-22
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-08-22T16:35:04Z"
assignee: "wave-5b-head-sweep"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `eval_scope` in PR #6860
(`build-entry-scope-branches-where-rails-always-calls-build-scope`). That PR
made the FIRST line of `eval_scope` Rails' line; the SECOND line is still
divergent.

**Rails** (`activerecord/lib/active_record/associations/association_scope.rb:169-172`):

```ruby
def eval_scope(reflection, scope, owner)
  relation = reflection.build_scope(reflection.aliased_table)
  relation.instance_exec(owner, &scope) || relation
end
```

**trails** (`packages/activerecord/src/associations/association-scope.ts`,
`evalScope`) ends with a bare
`invokeScopeLambda(scopeFn, relation, owner)` — no `|| relation`. The JSDoc
carries the standing justification:

> Unlike Rails we omit the `|| relation` truthy-fallback — callers push only
> the evaluated WHERE/ORDER predicates, and falling back to the bare relation
> would re-push its STI predicate.

That justification is now stale in part: PR #6860 removed the trails-only STI
predicate that `_buildEntryScope` used to layer onto the aliased arm, so the
`relation` an omitted fallback would return is a bare `build_scope` relation
(`reflection.rb:336-338`) — exactly what Rails returns there. The remaining
question is the CALLER contract, not the STI predicate: Rails' callers
(`add_constraints`, `disable_joins_association_scope.rb:42-46`) consume
`item.where_clause` / `item.order_values` off the returned relation, so a scope
lambda that returns a falsy value yields the bare relation and contributes
nothing — where trails currently propagates `undefined`/`null` into
`_pushScopeIntoRelation`.

Re-derive whether the fallback can now simply be ported, and if a caller still
cannot take it, converge the CALLER rather than keeping the deviation in
`eval_scope` (a documented deviation is debt, not permission — CLAUDE.md).

## Converged shape

```ts
return invokeScopeLambda(scopeFn, relation, owner) ?? relation;
```

Note Ruby `||` is falsy on `nil`/`false` only, so `??` is the closer JS
spelling for a scope lambda that legitimately returns a Relation. Confirm no
lambda in the repo returns `false` deliberately.

`_pushScopeIntoRelation` and the disable-joins constraints loop are the two
consumers to re-check.

## Acceptance criteria

- [ ] `evalScope`'s last line is `association_scope.rb:171`, fallback included.
- [ ] The "Unlike Rails we omit the `|| relation` truthy-fallback" paragraph is
      deleted from the JSDoc, not reworded.
- [ ] Any caller that could not take the fallback is converged, not special-cased.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
- [ ] Association suites green on SQLite, PostgreSQL and MySQL/MariaDB.
