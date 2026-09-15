---
title: "Port ActiveSupport::Autoload (autoload / autoload_under / autoload_at / eager_autoload / eager_load!)"
status: in-progress
updated: 2026-09-15
rfc: "0151-activesupport-autoload-slot-registry"
cluster: autoload
packages:
  - activesupport
deps: []
deps-rfc: []
est-loc: 180
priority: 1
pr: trails#7815
claim: "2026-09-15T18:24:36Z"
assignee: "port-activesupport-dependencies-autoload"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Autoload` (`vendor/rails/activesupport/lib/active_support/dependencies/autoload.rb`) is the gems' own constant-resolution layer: `autoload(const_name, path = @_at_path)` (:30-43), `autoload_under` (:45-50), `autoload_at` (:52-57), `eager_autoload` (:58-63), `eager_load!` (:65-70). ActiveRecord uses it at `active_record.rb:41-43,95,132-136`. trails has no port (no `autoload` in `packages/activesupport/src`), and `vendor/rails/activesupport/test/autoload_test.rb` (6 tests) is listed unported in `scripts/parity/unported-files/activesupport.ts:267`.

The registry is the foundation every slot migration in this RFC builds on, so it must itself have **no static runtime imports** — the property that lets a slot module sit in any cycle today. Rails' `autoload` calls `Inflector.underscore` (`autoload.rb:33`); ESM cannot make that call synchronously without a static import, so the registry reaches the inflector through a call-time `import()`, which adds no module-eval edge.

## Acceptance criteria

- `packages/activesupport/src/dependencies/autoload.ts` exports the five methods at their Rails names, in source order, as `this`-typed functions a namespace object `extend`s (CLAUDE.md § Module mixins).
- `autoload` binds a name that a defining module later seats and that a reader resolves at call time (a property read of the seated value — JS cannot load a module synchronously inside a getter, so a read does not trigger the load the way Ruby's constant reference does); `eagerAutoload` records names and `eagerLoadBang` imports them. The async signature of `eagerLoadBang` (Ruby's `const_get` is sync) is cited at its declaration.
- The registry module has no static `import` / re-export declarations (checked by a trails test that reads its compiled output); a call-time `import()` is permitted, because it cannot close a module-eval cycle.
- `autoload_test.rb`'s six tests are ported with verbatim names, adapted to trails' registration shape where Ruby's file-path `require` has no counterpart, and the unported-files row is deleted.
- `parity:api` credits `dependencies/autoload.rb`; `parity:test` delta non-negative.
