---
title: "Option#normalize_aliases open-codes Kernel#Array; port rb_Array to ruby-compat"
status: draft
updated: 2026-10-02
rfc: "0171-thor-port"
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

`Thor::Option#normalize_aliases` is
`Array(aliases).map { |short| short.to_s.sub(/^(?!\-)/, "-") }`
(`vendor/thor/v1.3.2/lib/thor/parser/option.rb:174-176`).
`packages/trailties/src/thor/parser/option.ts:213` (merged in trails PR 8388)
open-codes `Kernel#Array` as
`aliases == null ? [] : Array.isArray(aliases) ? aliases : [aliases]`, because
ruby-compat has no port of it. `Kernel#Array` is `rb_Array`
(`vendor/ruby/v3.3.11/object.c`): it tries `to_ary`, then `to_a`, and only then
wraps, so a Hash becomes its pairs and a Set or Range its elements. The inline
form wraps those in a one-element array instead.

Other thor bodies still to be ported call `Array(...)` too
(`vendor/thor/v1.3.2/lib/thor/base.rb`, `actions.rb`,
`actions/file_manipulation.rb`), so the open-coded form would otherwise be
copied.

## Acceptance criteria

- [ ] ruby-compat ports `rb_Array` at its MRI name with a
      `@noRailsEquivalent PERMANENT` receipt and a `vendor/ruby/v3.3.11/object.c`
      line citation: `nil` is `[]`, an Array is itself, a value answering
      `to_ary` / `to_a` is converted, anything else is wrapped.
- [ ] `Option#normalizeAliases` calls it in place of the inline conditional.
- [ ] A ruby-compat test covers nil, an Array, a Hash, a Set, a Range and a
      scalar, checked against `ruby`.
