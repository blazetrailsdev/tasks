---
title: "activemodel: define_call's property and method shapes share one MethodSet cache entry across classes"
status: claimed
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: "2026-10-03T22:56:10Z"
assignee: "class-methods-validates-with-appends-as-rails-does"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8451. `defineCall` (`packages/activemodel/src/attribute-methods.ts`, Rails `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:410-428`) emits one of three descriptor shapes into the `MethodSet` cache:

- a get/set property, for an alias of a generated reader (the `reader` arm added in 8451);
- a getter-only property, when `parameters === false`;
- a method otherwise.

`MethodSet`'s cache is global per namespace and keyed by the canonical (mangled) name only (`vendor/rails/v8.0.2/activesupport/lib/active_support/code_generator.rb:6-26`, `packages/activesupport/src/code-generator.ts`). In Ruby that is safe: every shape is a method and `obj.foo` calls it either way. In trails the shape is observable, so two classes that define the same canonical name in the same namespace with different shapes share whichever descriptor was cached first.

8451 dodged this for the reader arm only, by reassigning `namespace` to `alias_attribute_reader`, a namespace Rails does not have. The `parameters === false` getter arm has the same collision and no discriminator: a class declaring `attribute_method_suffix "_changed?", parameters: false` and another declaring the same suffix with default parameters share `active_model_proxy_attribute_changed?` / the same mangled name.

## Acceptance criteria

- [ ] A trails test shows two classes defining the same canonical name in one namespace with different `parameters` each get the shape their own pattern asks for (fails today for the `parameters === false` vs method pair).
- [ ] The discriminator lives in one place and covers all three shapes, so `defineCall` passes `namespace` to `defineCachedMethod` unchanged, as `attribute_methods.rb:419` does, and the `alias_attribute_reader` reassignment is deleted.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` stay green; activemodel stays rowless.

## Verification

```bash
pnpm vitest run packages/activemodel/src/attribute-methods.trails.test.ts packages/activesupport/src/code-generator.trails.test.ts
```
