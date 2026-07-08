---
title: "enum-before-alias-must-raise"
status: ready
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Real Rails **raises** when `enum` is declared before `alias_attribute` on the
same name; trails currently does **not** — it silently registers a phantom
attribute. This is a deviation to converge.

Verified against vendored Rails (sqlite `:memory:`, `books.status` integer):

```ruby
klass = Class.new(ActiveRecord::Base) do
  self.table_name = "books"
  enum :aliased_status, ["proposed","written","published"]
  alias_attribute :aliased_status, :status
end
klass.create!(status: "written")
# => RuntimeError: Undeclared attribute type for enum 'aliased_status' in ...
#    Enums must be backed by a database column or declared with an explicit
#    type via `attribute`.
```

The reverse order (`alias_attribute` then `enum`) works in both Rails and
trails and must stay green.

Why Rails raises: `enum`'s `decorate_attributes([name])`
(vendor/rails/activerecord/lib/active_record/enum.rb:238-248) resolves the name
through `attribute_aliases` at declaration time
(activemodel attribute_methods.rb:396) and bakes the un-aliased name into a
pending modification. When the decorate block later runs, the attribute's
`subtype == ActiveModel::Type.default_value` (no column, no explicit type) and
the block raises (enum.rb:241-245).

Why trails doesn't raise today, and why the fix is non-trivial:

- `packages/activerecord/src/enum.ts` `installEnumAttribute` decorator ignores
  the subtype and unconditionally returns the EnumType (no raise).
- Porting the raise into the decorator is NOT enough: trails'
  `decorateAttributes` (packages/activemodel/src/attribute-registration.ts:133-158)
  applies the decorator **eagerly** to `_attributeDefinitions` at
  class-definition time — before the schema loads — so `subtype` is the bare
  default for EVERY enum at that moment, and a naive `subtype == default`
  raise false-positives legitimate column-backed enums (confirmed: `Book`'s
  `enum :status` throws at module load).
- The existing deferred check (`assertEnumTypeDeclared`, run from
  `typeForAttribute` after `loadSchema`) is masked in the aliased case because
  `typeForAttribute` resolves the alias to the real `status` column before the
  check, and the phantom `aliased_status` attribute means `typeForAttribute`
  is never invoked for the un-typed name during normal reads/writes.

Superseded story: enum-alias-attribute-order-independence (PR #4715) — that
story was mis-specified (it asked trails to make the anti-Rails order silently
work). Reviewer flagged it; see PR #4715 discussion.

## Acceptance criteria

- `enum :x` declared before `alias_attribute :x, :col` raises the Rails message
  `Undeclared attribute type for enum 'x' in <Model>...` (parity), on first use
  (matching Rails' lazy timing) — not silently register a phantom attribute.
- The supported order (`alias_attribute :x, :col` then `enum :x`) stays green,
  as do all existing enum tests (no false positives for column-backed or
  explicitly-`attribute`-typed enums).
- The raise must fire from the deferred / post-schema-load path, not the eager
  class-definition-time decorator application. Likely requires distinguishing
  eager vs. deferred decorator application (or resolving the check through the
  phantom-attribute path).
- Add a regression test mirroring the vendored-Rails repro above, under the
  Rails test name where one exists.
