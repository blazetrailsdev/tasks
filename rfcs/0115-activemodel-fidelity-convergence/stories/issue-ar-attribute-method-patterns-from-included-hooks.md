---
title: "Issue ActiveRecord's attribute_method_* patterns from included hooks, not a hand-built array"
status: done
updated: 2026-08-27
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 7122
claim: "2026-08-27T14:43:53Z"
assignee: "cast-dirty-from-to-options-inside-the-mutation-tracker"
blocked-by: null
closed-reason: null
---

## Context

Found while moving `ActiveModel::Dirty` off `Model` (PR #7113). The
ActiveModel side of this was already converged by
`issue-attribute-method-suffix-from-the-included-hook` (PR #6796) and, for
`ActiveModel::Dirty`, by #7113 — this is the ActiveRecord twin, and the last
place in the repo that still builds an `attribute_method_patterns` array by
hand.

Rails issues these from two `included do` blocks, as macro calls:

- `activerecord/lib/active_record/attribute_methods/before_type_cast.rb:32-33`
  ```ruby
  attribute_method_suffix "_before_type_cast", "_for_database", parameters: false
  attribute_method_suffix "_came_from_user?", parameters: false
  ```
- `activerecord/lib/active_record/attribute_methods/dirty.rb:53-59`
  ```ruby
  attribute_method_affix(prefix: "saved_change_to_", suffix: "?", parameters: "**options")
  attribute_method_prefix("saved_change_to_", parameters: false)
  attribute_method_suffix("_before_last_save", parameters: false)
  attribute_method_affix(prefix: "will_save_change_to_", suffix: "?", parameters: "**options")
  attribute_method_suffix("_change_to_be_saved", "_in_database", parameters: false)
  ```

trails instead reconstructs the resulting array literally, in a `static {}`
block in `packages/activerecord/src/base.ts:1611-1624`:

```ts
this.attributeMethodPatterns = [
  ...this.attributeMethodPatterns,
  new AttributeMethodPattern({ suffix: "BeforeTypeCast", parameters: false }),
  ...
];
```

No `attributeMethodSuffix` / `attributeMethodPrefix` / `attributeMethodAffix`
call exists anywhere in `packages/activerecord/src/` — a grep for all three
returns nothing. So the macros' own bodies
(`activemodel/lib/active_model/attribute_methods.rb:105-160`) are dead code from
ActiveRecord's point of view, and any future change to what a macro does (the
`class_attribute` copy-on-write it performs, the cache reset at
attribute_methods.rb:158) silently does not reach `Base`.

`dirty.rb:44-51`'s other two `included do` statements — the
`raise "You cannot include Dirty after Timestamp"` guard and the
`class_attribute :partial_updates, :partial_inserts` pair — are in the same
block and equally unissued; `base.ts:1572-1573` spells them as
`static partialUpdates = true` / `static partialInserts = true`, which is a
plain static, not the `class_attribute` copy-on-write Rails installs.

## Converged shape

`packages/activerecord/src/attribute-methods/dirty.ts` and
`.../before-type-cast.ts` each grow a `static [included](base)` hook that issues
its own macro calls, exactly as `packages/activemodel/src/dirty.ts` now does
(added by #7113 — copy that shape). `base.ts` drops the `static {}` array push;
the hooks fire from the `include(Base, ...)` calls already in the wiring block.
Keep the `is*`-prefix note currently on the `static {}` block: the camel spelling
drops Ruby's trailing `?`, so `saved_change_to_name?` vs `saved_change_to_name`
is `isSavedChangeTo` vs `savedChangeTo` in the pattern's prefix, and the derived
`${prefix}Attribute${suffix}` proxy target (attribute_methods.rb:481) still lands
on `isSavedChangeToAttribute`.

`partial_updates` / `partial_inserts` become `classAttribute.call(Base, ...)`
with `instanceWriter: false`, issued from the same hook.

## Acceptance criteria

- No `attributeMethodPatterns` array is assembled by hand in
  `packages/activerecord/src`; every pattern ActiveRecord adds comes from an
  `attributeMethodSuffix` / `attributeMethodPrefix` / `attributeMethodAffix`
  call in an `[included]` hook, at the `.ts` matching the `.rb` whose
  `included do` issues it.
- `partialUpdates` / `partialInserts` are `class_attribute`s with
  `instance_writer: false` (dirty.rb:50-51), not plain statics.
- activerecord suite green; `pnpm parity:api:calls` / `:args` clean; parity
  deltas non-negative.
