---
title: "arel: value.nil? is hand-rolled at three sites because ruby-compat has no nil? send"
status: draft
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while shipping `arel-bind-param-nil-answers-false-for-undefined`.

Rails sends `nil?` to a value that may be `nil`, an object answering `Kernel#nil?`, or an object
overriding it (`ActiveRecord::Relation::QueryAttribute#nil?`,
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/query_attribute.rb:39-42`):

- `Arel::Nodes::BindParam#nil?` is `value.nil?` (`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/bind_param.rb:22-24`).
- `Arel::Visitors::ToSql#visit_Arel_Nodes_Equality` / `NotEqual` / `IsNotDistinctFrom` / `IsDistinctFrom`
  read `right.nil?` (`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/to_sql.rb:642-690`).
- `Arel::Predications#open_ended?` is `value.nil? || infinity?(value) || unboundable?(value)`
  (`vendor/rails/v8.0.2/activerecord/lib/arel/predications.rb:256-258`).

JS has no method on `null` / `undefined`, and ruby-compat has no `nil?` send, so each trails site
hand-rolls the dispatch as `value == null || (rbObjRespondTo(value, "isNil") && value.isNil())`:

- `packages/arel/src/nodes/bind-param.ts` `isNil` (reported by
  `pnpm parity:api:arms:report --package=arel` as `+or +and`, short-circuit projection).
- `packages/arel/src/visitors/to-sql.ts` `rightIsNull`, a helper Rails does not have.
- `packages/arel/src/predications.ts` `isOpenEnded`, whose local `isNil` spells it with `typeof … === "function"`.

`NilClass#nil?` is `rb_true` and `Kernel#nil?` is `rb_false` (`vendor/ruby/v3.3.11/object.c`), so the
send is one ruby-compat primitive, the way `toSym` is the `to_sym` send.

## Acceptance criteria

- [ ] ruby-compat exports the `nil?` send (true for `null` / `undefined`, the receiver's own `isNil` where it defines one, false otherwise), with its MRI anchor, a README row naming these call sites, and a `@noRailsEquivalent PERMANENT` receipt.
- [ ] `BindParam#isNil` is that send on `this.value`, with no `||` / `&&` of its own; the arms report's short-circuit row for it is gone.
- [ ] `Predications#isOpenEnded` reads the send in place of its local `isNil`.
- [ ] `ToSql#rightIsNull` is deleted and its four callers read the send on `o.right`, unless `arel-right-is-null-per-class-arms-redundant-after-isnil` has already removed it.

## Verification

```bash
pnpm parity:api:arms:report --package=arel --top=100 | grep isNil
pnpm vitest run packages/arel/src packages/ruby-compat/src
```
