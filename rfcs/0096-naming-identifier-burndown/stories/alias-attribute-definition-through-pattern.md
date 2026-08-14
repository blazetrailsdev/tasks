---
title: "alias-attribute-definition-through-pattern"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6543
claim: "2026-08-14T20:45:06Z"
assignee: "alias-attribute-definition-through-pattern"
blocked-by: null
closed-reason: null
---

## Context

`define_attribute_method_pattern`'s `override:` kwarg is now threaded end to
end (PR #6538, story `activemodel-define-attribute-method-code-generator`), but
nothing in trails ever passes `true`, so the branch is dead.

In Rails, the sole caller is `alias_attribute_method_definition`:

- `vendor/rails/activerecord/lib/active_record/attribute_methods.rb:94` —
  `define_attribute_method_pattern(pattern, old_name, owner: code_generator,
as: new_name, override: true)`
- `vendor/rails/activemodel/lib/active_model/attribute_methods.rb:226-236` —
  the ActiveModel base version, which `define_proxy_call`s through the same
  generator.

trails instead implements alias-method generation in
`packages/activemodel/src/attribute-methods.ts#aliasAttributeMethodDefinition`
(attribute-methods.ts:320-386) with its own bespoke getter/setter definitions,
never routing through `defineAttributeMethodPattern`. The two paths have
silently diverged: the bespoke one owns the bare-pattern accessor and the
affix-pattern proxy, and it re-derives the mangled name and namespace rather
than letting `defineAttributeMethodPattern` -> `defineProxyCall` do it.

`packages/activerecord/src/attribute-methods.ts#generateAliasAttributeMethods`
is the AR half and carries its own `naming` call-argument row (`host` vs
`code_generator`), currently assigned to
`naming-burndown-3-arel-activemodel`.

Surfaced by review of PR #6538.

## Acceptance criteria

- [ ] `aliasAttributeMethodDefinition` calls
      `defineAttributeMethodPattern(pattern, oldName, { owner, as: newName,
override: true })` per attribute_methods.rb:226-236 / AR's :94, rather
      than defining accessors itself.
- [ ] The `override: true` branch of `defineAttributeMethodPattern` is
      exercised by a test.
- [ ] The alias-attribute tests in
      `packages/activemodel/src/attribute-methods.test.ts` and
      `packages/activerecord/src/aliased-attribute.test.ts` still pass on all
      three adapters.
- [ ] No new `shape` row on `pnpm parity:api:calls:args`.
