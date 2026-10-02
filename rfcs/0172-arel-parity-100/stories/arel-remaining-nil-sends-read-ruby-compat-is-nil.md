---
title: "arel: Casted/Quoted#nil?, ToSql's right.nil? and Predications#open_ended? hand-roll the nil? send"
status: blocked
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: "2026-10-02T14:02:12Z"
assignee: "arel-remaining-nil-sends-read-ruby-compat-is-nil"
blocked-by: "Needs ruby-compat isNil, which only exists in trails#8397 (still OPEN, unmerged). That PR also edits predications.ts and to-sql.ts, so this cannot ship from main without stacking. Unblock when trails#8397 merges."
closed-reason: null
---

## Context

trails PR 8397 added ruby-compat's `isNil(obj)`, the `nil?` send (`NilClass#nil?` is `rb_true`,
`vendor/ruby/v3.3.11/object.c:4425`; `Kernel#nil?` is `rb_false`, `object.c:4371`; a class may
override it, as `ActiveRecord::Relation::QueryAttribute#nil?` does), and converged
`Arel::Nodes::BindParam#nil?` onto it. Four more arel bodies make the same send in Rails and still
hand-roll it:

- `Arel::Nodes::Casted#nil?` / `Quoted#nil?` are `value.nil?`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/casted.rb:15,41`).
  `packages/arel/src/nodes/casted.ts` answers `this.value === null || this.value === undefined`,
  which never reaches a value's own `nil?`.
- `Arel::Visitors::ToSql#visit_Arel_Nodes_Equality` / `NotEqual` / `IsNotDistinctFrom` /
  `IsDistinctFrom` read `right.nil?` / `o.right.nil?`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/to_sql.rb:642-690`).
  `packages/arel/src/visitors/to-sql.ts` routes them through `rightIsNull`, a helper Rails does not have.
- `Arel::Predications#open_ended?` is `value.nil? || infinity?(value) || unboundable?(value)`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/predications.rb:256-258`).
  `packages/arel/src/predications.ts` `isOpenEnded` builds a local `isNil` from
  `typeof … === "function"`.

## Acceptance criteria

- [ ] `Casted#isNil` and `Quoted#isNil` are `isNil(this.value)`.
- [ ] `Predications#isOpenEnded` reads `isNil(value)` in place of its local.
- [ ] `ToSql#rightIsNull` is deleted and its four callers read `isNil` on `o.right`, unless `arel-right-is-null-per-class-arms-redundant-after-isnil` has already removed it.
- [ ] ruby-compat's README row for `isNil` names the new call sites.
- [ ] `pnpm parity:api:arms:report --package=arel --top=100` shows no new row.

## Verification

```bash
pnpm vitest run packages/arel/src packages/ruby-compat/src/object.trails.test.ts
pnpm parity:api:calls && pnpm parity:api:arms:report --package=arel --top=100
```
