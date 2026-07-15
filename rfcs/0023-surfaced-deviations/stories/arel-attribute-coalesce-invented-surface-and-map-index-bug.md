---
title: "Attribute#coalesce is an invented surface and carries the map(buildQuoted) index bug"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `in` / `notIn` in PR #4881
(arel-in-not-in-threads-attribute-through-quoted-array). Left out of that PR to
keep it scoped to the `quoted_array` threading.

`Attribute#coalesce` (`packages/arel/src/attributes/attribute.ts:516`) is:

```ts
return new NamedFunction("COALESCE", [this, ...others.map(buildQuoted)]);
```

Two problems.

**1. Rails has no `Attribute#coalesce`.** Rails' only `coalesce` is
`Arel::FactoryMethods#coalesce` (`factory_methods.rb:45-47`):

```ruby
def coalesce(*exprs)
  Nodes::NamedFunction.new "COALESCE", exprs
end
```

It is a factory-module method, not a predication on Attribute, and it does **no
quoting at all** — callers pass already-built expressions. Trails invented an
Attribute-level surface that both prepends `this` and quotes its arguments.
Decide whether to port `FactoryMethods#coalesce` to its Rails home and retire
the Attribute method, or keep the Attribute surface as a documented deviation.
Check `api:compare` for whether the Attribute method is currently claiming a
Rails mapping it should not (`project_api_compare_method_must_stay_in_rails_layout_file`).

**2. It carries the `map(buildQuoted)` index-as-attribute bug** that #4881 fixed
on `in` / `notIn`. `Array#map` invokes `(value, index, array)`, so this calls
`buildQuoted(v, 0)`, `buildQuoted(v, 1)`, … The attribute slot receives a
number; `isAttribute(0)` is false (`casted.ts:50-53`), so it falls through to
`Quoted`. It reaches the current answer for the wrong reason and would
mis-bind if the second arg were ever honored. Note that simply threading
`this` here is NOT automatically right — Rails does not quote coalesce args at
all, so resolve (1) first; the bare-function-reference bug should go either way.

## Acceptance criteria

- [ ] Resolve whether `coalesce` belongs on Attribute at all, against
      `factory_methods.rb:45-47`; port to the Rails-layout home or record the
      deviation explicitly.
- [ ] No bare function reference passed to `map` (the index-as-attribute bug is
      gone), whatever the resolution.
- [ ] Quoting behavior of the args matches whatever Rails does for the
      corresponding surface — do not thread `this` reflexively.
- [ ] Coverage for the resulting COALESCE SQL.
- [ ] api:compare / test:compare delta non-negative; wide ratchet green
      (remove converged entries by hand, never reseed).
