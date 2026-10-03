---
title: "activemodel: define_attribute_method_pattern builds generate_method in one expression"
status: ready
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8443. `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:333` is one expression:

```ruby
generate_method = "define_method_#{pattern.proxy_target}"
```

`packages/activemodel/src/attribute-methods.ts` `defineAttributeMethodPattern` spells it as a two-arm ternary, because the writer hook `define_method_attribute=` (`activemodel/lib/active_model/attributes.rb:92`, `activerecord/lib/active_record/attribute_methods/write.rb`) is ported as a method named `setDefineMethodAttribute`, and neither `rbObjRespondTo` nor `rbFSend` (`packages/ruby-compat/src/object.ts`, `sendInternal` / `basicObjRespondTo`) resolves a sent `name=` to a `setName` METHOD. They only resolve it to a `name=` entry or a `name` accessor's setter:

```ts
const generateMethod = pattern.proxyTarget.endsWith("=")
  ? camelize(`set_define_method_${pattern.proxyTarget.slice(0, -1)}`, false)
  : camelize(`define_method_${pattern.proxyTarget}`, false);
```

The `endsWith("=")` arm is a branch Rails does not have.

## Acceptance criteria

- [ ] `defineAttributeMethodPattern` builds `generateMethod` in one expression from `pattern.proxyTarget`, with no `=` arm, as `attribute_methods.rb:333` does.
- [ ] Either `rbObjRespondTo` / `rbFSend` answer a sent `name=` through the conventions-table writer spelling `setName` (docs/ruby-ts-conventions.md), with a ruby-compat test, or the hook is reachable under the `"…="` key the send already resolves. Pick the one that matches how other dynamically-sent writers are ported.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:arms:report --package=activemodel` do not grow.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm vitest run packages/activemodel/src/attribute-methods.test.ts packages/activerecord/src/attribute-methods.test.ts
```
