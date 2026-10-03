---
title: "activesupport: a live Module's instance methods are typed as properties of the module object"
status: draft
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Since trails PR 8455 `ActiveSupport::Callbacks` (`packages/activesupport/src/callbacks.ts`) is a
`Module` extended with `Concern`, mirroring `vendor/rails/v8.0.2/activesupport/lib/active_support/callbacks.rb:65-70`.
Its exported type is `Module & { ClassMethods; runCallbacks; haltedCallbackHook }`, but
`runCallbacks` and `haltedCallbackHook` are installed on the module's carrier through `moduleEval`,
not on the module object. So `Callbacks.runCallbacks` type-checks and is `undefined` at run time.
The members are on the type only so `Included<typeof Callbacks>` (`model.ts:157`, `engine.ts:42`,
`current-attributes.ts:35`, `execution-wrapper.ts:28`) can name them. In Ruby `run_callbacks` is an
instance method of the module (`callbacks.rb:97`), never a singleton method.

`Deduplicable` (`activerecord/src/connection-adapters/deduplicable.ts`) and `SerializeCastValue`
(`activemodel/src/type/serialize-cast-value.ts`) are the other live-`Module` Concerns and type
their instance methods differently from each other.

## Acceptance criteria

- [ ] A live `Module`'s instance methods are typed in one way that `Included<>` reads, without declaring them as properties of the module object; `Callbacks.runCallbacks` no longer type-checks as a callable.
- [ ] `Callbacks`, `Deduplicable` and `SerializeCastValue` use that shape.
- [ ] `pnpm parity:api:calls` stays green (the 8455 rebase showed `Included<>` over a `Module` type leaking `Module`'s own methods onto includers) and `callbacks.rb` does not lose credit in `pnpm parity:api`.
