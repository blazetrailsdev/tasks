---
title: "activerecord: _enum's undeclared-type raise does not read a cold-schema replay flag"
status: blocked
updated: 2026-10-07
rfc: "0180-activerecord-receipt-parity"
cluster: findings
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-10-07T22:34:15Z"
assignee: "batch-enumerator-enumerable-over-an-async-each"
blocked-by: "Converged shape measured and falsified (2026-10-07). With _defaultAttributes skipping applyPendingAttributeModifications over a cold schema and the decorator on Rails' single condition, enum.test.ts and enum-cold-schema.trails.test.ts are green, but every model that declares attribute() and is constructed before its schema is warm loses the declared attribute: 18 tests red in attribute-methods.trails.test.ts and attributes.test.ts alone (UnknownAttributeError: unknown attribute 'title' for Legacy; _defaultAttributes 'replays user pending queue'), and 162 files under packages/ hold an ad-hoc 'class X extends Base' with a declared attribute, 76 of them in activerecord/src with no fixtures() warm. The replay skip cannot be told apart per modification: apply_pending_attribute_modifications (attribute_registration.rb) has no seam between a PendingType/PendingDefault, which cold callers need, and the enum's PendingDecorator. Unblocks when cold construction of a declared-attribute model has a decided answer (warm first, or raise), or a shape is chosen that withholds only decorators over a cold schema."
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`_enum`'s attribute decoration (`vendor/rails/v8.0.2/activerecord/lib/active_record/enum.rb:240-249`) raises whenever the subtype is still the
default value type:

```ruby
decorate_attributes([name]) do |_name, subtype|
  if subtype == ActiveModel::Type.default_value
    raise "Undeclared attribute type for enum '#{name}' in #{self.name}. Enums must be" \
      " backed by a database column or declared with an explicit type" \
      " via `attribute`."
  end
  …
```

In Rails the decoration runs inside `_default_attributes`, after `load_schema` has reflected the
table, so a column-backed enum never sees the default type.

`packages/activerecord/src/enum.ts` adds a second condition, `&& !isReplayingOverColdSchema()`.
`isReplayingOverColdSchema` (`packages/activerecord/src/attributes.ts`, `@noRailsEquivalent`) reads a
module-level flag `_defaultAttributes` sets around `applyPendingAttributeModifications` when the
schema cache is cold, so a column-backed enum on a not-yet-reflected model does not raise.

CLAUDE.md § "Schema reflection peeks at a warm cache" ratifies the cold peek answering `undefined`
and leaving the model unloaded. It does not name this flag, and a module-level boolean read from
another file is extra surface the section's shape does not need.

## Converged shape

`_defaultAttributes` does not replay pending attribute modifications over a cold schema at all:
with no columns reflected there is nothing to decorate, and the model stays unloaded until the
async warm, which is the section's stated answer. The decorator then keeps Rails' single condition.
The obstacle to measure first is which callers construct an enum-bearing model before its schema
is warm and rely on the replay having run.

## Acceptance criteria

- [ ] `isReplayingOverColdSchema` and its flag are deleted; `_enum`'s decorator raises on `subtype === defaultValue()` alone.
- [ ] `packages/activerecord/src/enum.test.ts` and the trails cold-schema enum tests stay green, or the cold-construction callers are listed with the blocker.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.

## Owner decision (2026-10-08 blocked-story triage)

Constructing a model over a cold schema raises. That is the "decided answer" this story's blocked reason asks for ("warm first, or raise"). Rewrite it around that rule; the 76 ad-hoc `class X extends Base` test models built with no warm step need one.
