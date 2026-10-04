---
title: "activemodel: Conversion is not a Concern, so includers extend its ClassMethods by hand"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8471
claim: "2026-10-04T01:31:00Z"
assignee: "activemodel-unskip-attribute-and-type-mutation-tests"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8465. `ActiveModel::Conversion`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/conversion.rb:24-25`) is
`extend ActiveSupport::Concern`, so `include ActiveModel::Conversion` also extends the
includer with `Conversion::ClassMethods` (`_to_partial_path`, `conversion.rb:108-118`).

`packages/activemodel/src/conversion.ts` ports `Conversion` as a plain class with a
`static [included]` that only declares `paramDelimiter`. `include(klass, Conversion)`
therefore does not bring `_toPartialPath`, and `toPartialPath()` raises
`this.constructor._toPartialPath is not a function` unless the includer adds
`extend(klass, ConversionClassMethods)` by hand. Three sites carry that extra line:
`api.ts:47`, `test-helpers/models/contact.ts:20`, and `lint.test.ts`'s `CompliantModel`,
where Rails' `lint_test.rb:8-10` has `include ActiveModel::Conversion` alone.

## Acceptance criteria

- [ ] `Conversion` is a `Module` extended with `Concern` carrying `ClassMethods`, as
      `Callbacks`, `Deduplicable` and `SerializeCastValue` are, with its instance
      methods typed through `Module<I>`.
- [ ] `include(klass, Conversion)` alone gives the class `_toPartialPath`; the three
      hand-written `extend(…, ConversionClassMethods)` lines are deleted.
- [ ] `pnpm parity:api` keeps `conversion.rb`'s credit and `pnpm parity:api:calls` stays green.

## Verification

```bash
pnpm vitest run packages/activemodel/src/lint.test.ts packages/activemodel/src/conversion.test.ts
```
