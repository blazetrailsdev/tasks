---
title: "converge-enum-undeclared-type-check-to-subtype"
status: done
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6793
claim: "2026-08-20T21:29:07Z"
assignee: "converge-enum-undeclared-type-check-to-subtype"
blocked-by: null
closed-reason: null
---

## Context

Rails' enum decorator raises "Undeclared attribute type for enum" from the
subtype it is handed, and nothing else
(`vendor/rails/activerecord/lib/active_record/enum.rb:239-248`):

```ruby
decorate_attributes([name]) do |_name, subtype|
  if subtype == ActiveModel::Type.default_value
    raise "Undeclared attribute type for enum '#{name}' in #{self.name}. ..."
  end
  ...
end
```

trails instead defers a per-name marker (`_enumsPendingTypeCheck`,
`packages/activerecord/src/enum.ts:137-170`) and checks the class's
`_columnsHash` from inside the block (`assertEnumTypeDeclared`, enum.ts:974-1000).
Because that check is class-based rather than subtype-based, the block needs to
know _which_ class is materializing — which is why
`PendingDecorator#applyTo` binds the materializing class as the decorator's
`this` (`packages/activemodel/src/attribute-registration.ts`), where Ruby's proc
carries the class it was defined in. Rails needs no such channel: the subtype it
is handed already comes from the materializing class's attribute set, and
`self.name` is only used for the message text.

The block-`self` divergence was introduced (as a third `host` argument, later
narrowed to the receiver) by #6791 and is the last consumer of a
materializing-class channel; `encrypts` reads only `columns_hash` off `self`,
which Rails also does.

Related: the trails enum tests expect the message to name the _materializing_
subclass (`enum.test.ts` "enum on abstract parent resolves against concrete
subclass columns" / "... raises through subclass materialization"), while Rails'
`self.name` names the declaring class — resolve that against the Rails source as
part of this story.

## Acceptance criteria

- The enum decorator raises from the subtype it is handed
  (`subtype == ActiveModel::Type.default_value`), matching enum.rb:240-245.
- `_enumsPendingTypeCheck` and `assertEnumTypeDeclared`, plus their callers in
  `base.ts` and `type-caster/map.ts`, are retired or reduced to what Rails has.
- `PendingDecorator#applyTo` no longer binds a receiver: the decorator is called
  as Rails calls it, `decorator.call(name, attribute.type)` with the block's own
  `this`.
- Enum test names unchanged; the abstract-parent cases keep passing (or their
  expectations are corrected against the Rails source, cited).
