---
title: "port-constantize-retire-model-finder"
status: draft
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
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

`globalid`'s `setModelFinder` / `lookupClass` pair is invented surface standing
in for Ruby's `model_name.constantize`. The faithful fix is to port
`constantize` itself rather than justify the stand-ins, because the two
methods are currently _missing_ Rails surface — this closes both sides of the
api:compare ledger at once (adds 2 real Rails methods, deletes 2 invented
names).

Rails source:

- `vendor/rails/activesupport/lib/active_support/inflector/methods.rb:289-291`
  — `Inflector.constantize(camel_cased_word)` is `Object.const_get(word)`.
- `vendor/rails/activesupport/lib/active_support/inflector/methods.rb:315-320`
  — `safe_constantize` rescues `NameError`, re-raising unless the failing
  constant name is part of the requested path.
- `vendor/rails/activesupport/lib/active_support/core_ext/string/inflections.rb:73-75`
  — `String#constantize` delegates to the Inflector.
- `vendor/globalid/lib/global_id/global_id.rb:58` — `model = model_name.constantize`
  is the only consumer globalid needs.

Current trails state:

- `packages/activesupport/src/inflector.ts` ports 15 inflector methods but
  neither `constantize` nor `safeConstantize`; `deconstantize` is at
  `inflector.ts:160`. api:compare lists `constantize` / `safe_constantize` as
  missingMethods for `inflector/inflections.rb` and
  `core_ext/object/blank.rb`.
- `packages/globalid/src/locator.ts` — `setModelFinder` (registry write) and
  `lookupClass` (read, `@internal`) are the stand-ins. `setModelFinder`
  carries an `@noRailsEquivalent` tag as of #5369; `lookupClass` is
  `@internal` so it never counted.
- 45 call sites across 9 files reference `setModelFinder` / `lookupClass` /
  `_resetModelFinder`, including `packages/activerecord/src/base.ts`,
  `packages/globalid/src/{index,global-id,signed-global-id,locator}.ts` and 5
  globalid test files.

JS has no `Object.const_get`, so a registry underneath is unavoidable. The
win is _where_ the invention lives: behind
`ActiveSupport::Inflector.constantize` — a method Rails has — instead of two
names Rails does not have. Registration is the part with no Rails analogue
and should carry the `@noRailsEquivalent` tag.

Sizing note: this spans activesupport + globalid + activerecord and Rails has
22 constantize test cases in `activesupport/test/inflector_test.rb` /
`core_ext/string_ext_test.rb`. It very likely exceeds the 500-LOC ceiling as
one PR — split as (1) port `constantize`/`safeConstantize` into activesupport
with the Rails tests, then (2) rewire globalid's locator onto it and delete
the stand-ins. Sequential, non-overlapping files, each from `main`.

## Acceptance criteria

- `constantize` and `safeConstantize` exist in
  `packages/activesupport/src/inflector.ts`, matching the Rails semantics
  above, with Rails' constantize test cases ported under their verbatim
  names.
- `constantize` / `safe_constantize` no longer appear in api:compare's
  missingMethods for activesupport.
- `packages/globalid/src/locator.ts` and `global-id.ts` resolve model classes
  through `constantize`, spelled the way `global_id.rb:58` does.
- `setModelFinder` and `lookupClass` are deleted, along with the
  `setModelFinder` `@noRailsEquivalent` tag; globalid's extra-surface Allowed
  total drops accordingly.
- Any residual registration seam carries its own `@noRailsEquivalent` tag.
- `pnpm api:compare && pnpm api:extra` clean, no stale tags.
