---
title: "param-name-check-pairs-nested-class-constructor-with-enclosing-initialize"
status: done
updated: 2026-09-02
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: 7389
claim: "2026-09-02T13:34:18Z"
assignee: "param-name-check-pairs-nested-class-constructor-with-enclosing-initialize"
blocked-by: null
closed-reason: null
---

## Context

`param-drift-activerecord-base-and-attribute-methods` (RFC 0128) converged 36 of
38 rows in its slice. One residual row is not drift at all but a matcher
homonym:

```text
core.rb#initialize [core.ts#constructor] @0  ruby `attributes` → ts `value`
```

The TS declaration behind it is `InspectionMask`'s constructor in
`packages/activerecord/src/attribute-inspection.ts`
(`constructor(value: string = "[FILTERED]")`), which the extractor files under
`activerecord/classes/core.ts:InspectionMask`. The comparer pairs its
`constructor` against `ActiveRecord::Core#initialize`
(`vendor/rails/activerecord/lib/active_record/core.rb:471`,
`def initialize(attributes = nil)`) because both are `initialize`/`constructor`
under the `core.rb` host.

They are unrelated methods. Rails' `InspectionMask`
(`core.rb:858`, `class InspectionMask < DelegateClass(::String)`) defines no
`initialize` at all — it inherits `DelegateClass`'s, whose parameter is the
delegated object, not `attributes`. Renaming the TS parameter to `attributes`
would make the port WORSE, so the row cannot be closed by a rename, which is the
only close RFC 0128 admits.

Per RFC 0128's charter ("Tooling defects in the check itself — a false
positive … are RFC 0126 stories"), the fix belongs in the comparer: a nested
class's `constructor` must not be paired with the enclosing Ruby module's
`initialize`.

The other residual row in that slice,
`attribute_methods/dirty.rb#_create_record  attributeNames → superFn`, is a real
dropped parameter and is already owned by
`param-drift-positional-misalignment-is-a-dropped-parameter`.

## Acceptance criteria

- The comparer no longer pairs a nested-class `constructor` with the enclosing
  Ruby file's top-level `initialize` when the nested Ruby class defines no
  `initialize` of its own.
- `output/param-name-mismatches.json` no longer contains the
  `core.rb#initialize → core.ts#constructor` row.
- No parameter renamed in `packages/**` to close it.
- `pnpm parity:api` methods and arity figures unmoved; `pnpm parity:api:params`
  still OK.
