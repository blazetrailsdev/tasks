---
title: "exists? builds a throwaway JoinDependency Rails never builds"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`exists?` in `packages/activerecord/src/relation/finder-methods.ts` calls
`this._checkEagerLoadable()` unconditionally, immediately before the
`if (this._eagerLoadingForSql())` branch.

Rails has no such call. `finder_methods.rb:357-382` is:

```ruby
return false if !conditions || limit_value == 0

if eager_loading?
  relation = apply_join_dependency(eager_loading: false)
  return relation.exists?(conditions)
end
```

The `JoinDependency` is constructed inside `apply_join_dependency`
(`finder_methods.rb:458-460`), i.e. only on the `eager_loading?` arm, so
`EagerLoadPolymorphicError` is raised only when that arm is actually taken.
trails constructs a throwaway `JoinDependency` on EVERY `exists?` call
(`relation.ts` `_checkEagerLoadable`, which does
`new JoinDependency(this._model, this.table, specs, Nodes.OuterJoin)` purely
for its raise side effect) and then discards it.

Two problems:

1. **Fidelity.** It is an extra call Rails does not make, at a raise site Rails
   does not have.
2. **Cost.** Every `exists?` on a relation carrying `includes`/`eager_load`
   values builds a full JoinDependency that is then thrown away — twice, once
   here and once inside `applyJoinDependency` on the arm that proceeds.

The call predates PR #6605 (which only moved the method from `relation.ts` into
its Rails home) and was flagged there as out of scope. `_checkEagerLoadable` is
also called from the calculation entry points, so converging `exists?` alone
does not retire the helper — check whether those arms have the same shape
before deleting it.

trails: `packages/activerecord/src/relation/finder-methods.ts` (`exists`),
`packages/activerecord/src/relation.ts` (`_checkEagerLoadable`,
`applyJoinDependency`).
Rails: `vendor/rails/activerecord/lib/active_record/relation/finder_methods.rb:357-382`
and `:457-484`.

## Acceptance criteria

- [ ] `exists?` no longer calls `_checkEagerLoadable()` outside the
      `eager_loading?` arm; the `EagerLoadPolymorphicError` for a polymorphic
      eager spec is raised from where Rails raises it — inside
      `apply_join_dependency`'s `construct_join_dependency`.
- [ ] The calculation entry points that call `_checkEagerLoadable` are checked
      against `calculations.rb`; converge them the same way or state at the call
      site why their shape differs. If nothing needs it, delete the helper.
- [ ] Existing coverage for the polymorphic-eager-load raise on `exists?` still
      passes (`associations/eager-load-unjoinable-raises.trails.test.ts`,
      `associations/eager.test.ts`); a test pins that the raise still fires on
      `Model.includes(:polymorphic).exists?`.
- [ ] `pnpm parity:api:calls` / `:args` green; SQLite, PostgreSQL and
      MySQL/MariaDB lanes green.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
