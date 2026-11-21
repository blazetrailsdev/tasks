---
title: "deprecation-method-wrapper-include"
status: draft
updated: 2026-11-21
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Deprecation` includes `MethodWrapper` beside `Behavior`, `Reporting` and `Disallowed` (`vendor/rails/v8.0.2/activesupport/lib/active_support/deprecation.rb:52-55`). trails#10480 converged the other three into `include()`d class modules. `packages/activesupport/lib/deprecation.ts` still attaches `deprecateMethods` as an instance field (`deprecateMethods = deprecateMethods`), not a method mixed in from `MethodWrapper` (`deprecation/method_wrappers.rb:8-66`).

Converging it with `include(Deprecation, MethodWrapper)` is a module-eval read. `pnpm parity:import-cycles` reds it: `deprecation/method-wrappers.ts -> hash-utils.ts (extractOptionsBang) -> xml-mini.ts -> duration.ts -> core-ext/time/calculations.ts -> deprecator.ts -> deprecation.ts`. Rails defines `extract_options!` / `extractable_options?` in `core_ext/array/extract_options.rb`. trails keeps them in `hash-utils.ts` (`conventions.ts` override `"activesupport:core_ext/array/extract_options.rb": "hash-utils.ts"`), and they lean on hash-utils' `isPlainObject`.

## Acceptance criteria

- [ ] `MethodWrapper` is a module in `lib/deprecation/method-wrappers.ts`, seated on `Deprecation` and `include()`d into it. There is no `deprecateMethods` instance field.
- [ ] `method-wrappers.ts` reaches no import cycle. For example, `extractOptionsBang` moves to `lib/core-ext/array/extract-options.ts` at its Rails path, and the conventions override is dropped.
- [ ] `pnpm parity:import-cycles` and `pnpm parity:class-paths --check` are green.
