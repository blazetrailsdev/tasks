---
title: "_assignAttribute returns the send deferred; Rails' _assign_attribute always sends"
status: done
updated: 2026-08-08
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6220
claim: "2026-08-08T02:27:56Z"
assignee: "migration-class-is-async-where-rails-is-a-bare-constant"
blocked-by: null
closed-reason: null
---

## Context

PR #6210 removed the `awaitable` flag from `_assignAttributes` /
`assignNestedParameterAttributes` / `_assignAttribute`, so all three now carry
Rails' parameter lists. The remaining deviation moved into the return values:

- `_assignAttribute` (`packages/activerecord/src/persistence.ts`) resolves the
  association writer and returns it **unsent** as a `DeferredAssignment`
  closure. Rails' `_assign_attribute`
  (`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:67-75`)
  is `setter = :"#{k}="; public_send(setter, v)` — it always sends, and returns
  whatever the setter returned.
- `_assignAttributes` and `assignNestedParameterAttributes` are generators
  yielding `[key, pending]` pairs. Rails' bodies
  (`activerecord/lib/active_record/attribute_assignment.rb:6-23,26-28`, over
  `activemodel/.../attribute_assignment.rb:60-64`) are plain `each_pair` loops
  that yield nothing; the pair exists only so the two drivers
  (`assignAttributes`, `setAttributes`) can share one loop while disagreeing
  about whether the send can be awaited.

Root cause is unchanged and genuine: `replace` (`collection_association.rb:46-48`),
`ids_writer` (`:61-83`) and `has_one`'s displacing writer
(`has_one_association.rb:59-84`) do I/O at assignment, and a JS property setter
cannot await them, which is why RFC 0087 §1 removed those setters. The deferral
is how that leaks into the ported return type.

## Converged shape

`_assignAttribute` sends, like Rails, and `_assignAttributes` yields nothing —
one plain `each_pair`-equivalent loop. That requires the synchronous
`assignAttributes` surface to stop existing as a separate driver, i.e. every
caller of `assign_attributes` on the trails side becomes awaitable. `Model.new`
/ `ActiveModel::API#initialize` (`api.rb:81`, through `core.rb:471-478`) is the
one caller a JS constructor genuinely cannot await; look at whether the
constructor's existing park/drain (`_reapplyNestedAttrSetters`, and the drain in
`create` / `create!`) can absorb the whole synchronous surface so `_assignAttributes`
has exactly one driver again.

Do NOT close this by rewording the justification comments in
`assignAttributes` / `_assignAttribute`.

## Acceptance criteria

- [ ] `_assignAttribute` sends the setter it resolved, as Rails does
      (`attribute_assignment.rb:67-69`) — no `DeferredAssignment` return arm.
- [ ] `_assignAttributes` / `assignNestedParameterAttributes` are plain loops,
      not `[key, pending]` generators.
- [ ] `update` / `update!` still reach the association writers; the guards
      `update awaits the has_one writer on a persisted owner`,
      `update assigns collection ids on a persisted owner` and
      `refuses the association key in place, leaving earlier keys assigned`
      stay green (the last may need restating if the sync surface is gone).
- [ ] All of `packages/activerecord/src/associations/` green, plus the
      nested-attributes and persistence suites. No test renames.
