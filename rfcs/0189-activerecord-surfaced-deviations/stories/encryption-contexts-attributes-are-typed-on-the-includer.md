---
title: "activerecord: Encryption::Contexts' attributes are typed on the includer, not the module"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Encryption::Contexts` declares its two module attributes in an `included do` block
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/contexts.rb`, `mattr_accessor
:default_context` / `thread_mattr_accessor :custom_contexts`), so they exist on the includer,
`ActiveRecord::Encryption`, and `Contexts.default_context` is a `NoMethodError`.

trails' `packages/activerecord/src/encryption/contexts.ts:9-12` runs the block as
`static [included](base)` but still carries `declare static defaultContext` /
`declare static customContexts` and the two instance `declare`s on the `Contexts` class, so
`Contexts.defaultContext` type-checks and reads `undefined`.

trails#8787 converged the sibling `Configurable`: the attributes are declared on `Encryption`'s
type in `packages/activerecord/src/namespaces.ts` and the class methods that read them take
`this: typeof Encryption`.

## Acceptance criteria

- [ ] `contexts.ts` carries no `declare` for `defaultContext` / `customContexts`; they are declared
      on `Encryption`'s type in `namespaces.ts`, and the class methods reading them take
      `this: typeof Encryption`.
- [ ] `Contexts.defaultContext` does not type-check; no source or test reads it.
- [ ] `pnpm parity:api` keeps `encryption/contexts.rb` at 100% and `pnpm parity:api:extra:gate`
      stays green.
