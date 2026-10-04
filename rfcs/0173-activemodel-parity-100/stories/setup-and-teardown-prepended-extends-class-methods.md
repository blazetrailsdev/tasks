---
title: "activesupport: SetupAndTeardown.prepended extends ClassMethods; setup/teardown are not hand-assigned on TestCase"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8463
claim: "2026-10-03T23:36:44Z"
assignee: "setup-and-teardown-prepended-extends-class-methods"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8453. `SetupAndTeardown.prepended`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/setup_and_teardown.rb:21-25`) is

    klass.include ActiveSupport::Callbacks
    klass.define_callbacks :setup, :teardown
    klass.extend ClassMethods

and `setup` / `teardown` live in `SetupAndTeardown::ClassMethods` (`:27-37`).

`packages/activesupport/src/testing/setup-and-teardown.ts` ports the first two
calls and omits `klass.extend ClassMethods`: `setup` and `teardown` are free
exported functions that `packages/activesupport/src/test-case.ts` hand-assigns
(`static setup = setup; static teardown = teardown`), which is why
`pnpm parity:api:extra --package activesupport` lists `setup` and `teardown` as
moved names on `test-case.ts`.

Because `TestCase` cannot declare `static defineCallbacks` / `static setCallback`
without those scoring as moved names on `test-case.ts` too (`test_case.rb` has no
`include Callbacks`), `prepended`, `setup` and `teardown` cast their receiver
(`klass as typeof klass & CallbacksHost`, `this as CallbacksHost`) through two
file-local interfaces, `CallbacksHost` and `CallbacksInstance`.

## Acceptance criteria

- [ ] `setup` / `teardown` are members of a `ClassMethods` module in `testing/setup-and-teardown.ts`, and `prepended` ends with `extend(klass, ClassMethods)` as `setup_and_teardown.rb:24` does.
- [ ] `test-case.ts` no longer hand-assigns `static setup` / `static teardown`; `parity:api:extra --package activesupport` no longer lists them as moved on `test-case.ts`.
- [ ] The receiver casts in `prepended` / `setup` / `teardown` are gone, or the PR states at the call site which TypeScript limit keeps each.
