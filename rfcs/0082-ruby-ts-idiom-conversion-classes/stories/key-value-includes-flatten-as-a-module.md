---
title: "KeyValue includes Flatten as a module, not instance fields"
status: draft
updated: 2026-11-12
rfc: "0082-ruby-ts-idiom-conversion-classes"
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

`I18n::Backend::KeyValue::Implementation` is `include Base, Flatten`
(`vendor/i18n/v1.14.8/lib/i18n/backend/key_value.rb:73`). trails includes
`Base` with `include(KeyValue, Base)` (`packages/i18n/lib/backend/key-value.ts`,
bottom of file, since trails#10027), but carries `Flatten`'s members as
instance fields instead (`flattenKeys = flattenKeys;
flattenTranslations = flattenTranslations;`, `key-value.ts:64-65`), with the
functions imported from `./flatten.js`.

## Acceptance criteria

- `flatten.ts` exposes `Flatten` as a plain-object module (instance methods
  enumerable, singleton methods such as `normalize_flat_keys` / `escape_default_separator`
  non-enumerable), the way `transliterator.ts` exposes `Transliterator`.
- `KeyValue` does `include(KeyValue, Base)` and `include(KeyValue, Flatten)`
  in Rails' order; the instance-field copies at `key-value.ts:64-65` are gone.
- Any other includer of `Flatten` (`Simple`? check `simple.rb`) converges the same way.
- i18n tests pass.
