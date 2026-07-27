---
title: "Port the missing prepend_*_action / append_*_action macros"
status: ready
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: missing-methods
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails generates twelve `*_action` macros in
`vendor/rails/actionpack/lib/abstract_controller/callbacks.rb:230-253`:

- `define_method "#{callback}_action"` (line 231) — ported
- `define_method "prepend_#{callback}_action"` (line 237) — NOT ported
- `define_method "skip_#{callback}_action"` (line 245) — ported
- `alias_method :"append_#{callback}_action", :"#{callback}_action"` (line 252)
  — NOT ported

`packages/actionpack/src/abstract-controller/callbacks.ts` declares only six
(`beforeAction`, `afterAction`, `aroundAction`, `skipBeforeAction`,
`skipAfterAction`, `skipAroundAction`). The six `prepend_`/`append_` macros are
genuinely missing public surface, not a tooling artifact — they do not show in
`api:compare` today only because the Ruby extractor records literal `def`s and
skips `define_method` (see the extractor story in this RFC).

`prepend_*_action` passes `options.merge(prepend: true)` to `set_callback`;
`append_*_action` is a plain alias of the base macro.

## Acceptance criteria

- `prependBeforeAction` / `prependAfterAction` / `prependAroundAction` and
  `appendBeforeAction` / `appendAfterAction` / `appendAroundAction` declared in
  `callbacks.ts` and installed on `AbstractController` in `base.ts`, matching
  the existing module-mixin pattern.
- `prepend` threads through to the callback chain insert, mirroring
  `set_callback(..., options.merge(prepend: true))`.
- Tests ported from the Rails abstract-controller callbacks tests, names
  verbatim.
