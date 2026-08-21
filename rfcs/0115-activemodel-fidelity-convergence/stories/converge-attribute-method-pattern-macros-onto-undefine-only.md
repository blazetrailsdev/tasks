---
title: "Converge attribute_method_prefix/suffix/affix onto Rails' undefine-only bodies"
status: ready
updated: 2026-08-21
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`attribute_method_prefix` / `attribute_method_suffix` / `attribute_method_affix`
each end at `undefine_attribute_methods` in Rails — nothing is regenerated:

- `vendor/rails/activemodel/lib/active_model/attribute_methods.rb:120-123` (prefix)
- `vendor/rails/activemodel/lib/active_model/attribute_methods.rb:140-143` (suffix)
- `vendor/rails/activemodel/lib/active_model/attribute_methods.rb:175-178` (affix)

```ruby
def attribute_method_suffix(*suffixes, parameters: nil)
  self.attribute_method_patterns += suffixes.map! { |suffix| AttributeMethodPattern.new(suffix: suffix, parameters: parameters) }
  undefine_attribute_methods
end
```

trails appends a fourth statement to all three bodies —
`this.defineAttributeMethods(...this.attributeNames())` at
`packages/activemodel/src/attribute-methods.ts:267`, `:281`, `:294` — eagerly
re-generating every attribute method for the new pattern. Rails does not, because
an undefined attribute method is re-created on demand by `method_missing`
(`attribute_methods.rb:490-497`); trails' generated readers are accessor
properties (CLAUDE.md, "Generated attribute readers are properties"), which
`method_missing` cannot resurrect, so the regeneration was hoisted to the macro.

Surfaced while converging the AM `_attributeDefinitions` readers (#6804), which
changed the argument of those three calls but left the calls themselves.

## Converged shape

Each of the three bodies ends at `undefineAttributeMethods()`, matching the Ruby.
The regeneration moves to wherever the property has to exist — the lazy path
`method_missing` stands in for, or `defineAttributeMethods` at its Rails call
sites — so the macros stop doing work Rails leaves to first access.

If the eager regeneration genuinely cannot move (a property with no lazy
resurrection point), the residue is ONE call site with a
`@noRailsEquivalent`/`@missingRailsCall` pointing at the ratified CLAUDE.md
section, not three undocumented ones.

## Acceptance criteria

- [ ] `attributeMethodPrefix` / `attributeMethodSuffix` / `attributeMethodAffix`
      mirror `attribute_methods.rb:120-123,140-143,175-178` statement for
      statement.
- [ ] No regression in AM attribute-method generation: `pnpm vitest run
  packages/activemodel` green, plus AR `dirty` / `attribute-methods`.
- [ ] `pnpm parity:api:calls` / `:args` green with no new baseline rows.
