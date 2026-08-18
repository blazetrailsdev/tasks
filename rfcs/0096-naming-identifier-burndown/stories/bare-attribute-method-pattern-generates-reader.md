---
title: "Let the bare attribute_method_pattern generate the reader instead of skipping it"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6717
claim: "2026-08-18T19:47:46Z"
assignee: "port-date-sub-today-now-receiver-class"
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/attribute-methods.ts#defineAttributeMethodPattern`
opens with a guard Rails does not have:

```ts
if (pattern.prefix === "" && pattern.suffix === "") return;
```

Rails (`vendor/rails/activemodel/lib/active_model/attribute_methods.rb:320-347`)
has no such branch: `define_attribute_method_pattern` runs for every entry of
`attribute_method_patterns`, and the default bare pattern
(`AttributeMethodPattern.new` with empty prefix/suffix, attribute_methods.rb:72)
is what generates the plain `attribute` reader through `define_proxy_call` ->
`define_call`. Its `proxy_target` is `"attribute"`, so the generated method is
`def name; self.attribute("name"); end`.

trails skips it because `attribute()` already installs the reader as a real
accessor property on the class, so generating a bare `name` method into the
included module would be shadowed by (or collide with) that accessor. The
seeded pattern is kept only so `attributeMethodPatterns()` matches Rails'
default array.

Two consequences worth converging:

- `defineAttributeMethodPattern` cannot be the single generation path Rails
  makes it, which is part of why the alias path is bespoke (see
  `alias-attribute-definition-through-pattern`).
- `defineMethodAttribute` (`packages/activemodel/src/attributes.ts:233`,
  `packages/activerecord/src/attribute-methods/read.ts:53`) exists as the
  `define_method_#{proxy_target}` hook for exactly this pattern and is
  currently never reached, because the bare pattern returns before the
  dispatch. Both bodies are no-ops that compute a method name and discard it.

Surfaced while threading `CodeGenerator` through `define_attribute_method`
(PR #6538, RFC 0096).

## Converged shape

Let the bare pattern through, and let the `define_method_attribute` hook be
what installs the reader — i.e. move what `attribute()` does today into
`defineMethodAttribute`, so the accessor is generated into
`generatedAttributeMethods` under the generator's namespace like every other
pattern, and a class-body reader still outranks it via the prototype chain
(`activesupport/src/include.ts` splices the module carrier below the class
prototype).

## Acceptance criteria

- [ ] `defineAttributeMethodPattern` has no bare-pattern early return; the
      default pattern generates through the same `define_method_#{proxy_target}`
      / `define_proxy_call` fork as every other pattern
      (attribute_methods.rb:320-347).
- [ ] `defineMethodAttribute` in `activemodel/attributes.ts` and
      `activerecord/attribute-methods/read.ts` actually define the reader
      rather than computing and discarding a name.
- [ ] `packages/activemodel/src/attribute-methods.test.ts` and
      `packages/activerecord/src/attribute-methods/read.test.ts` pass
      unchanged, on all three adapters.
- [ ] No new `shape` row on `pnpm parity:api:calls:args`.
