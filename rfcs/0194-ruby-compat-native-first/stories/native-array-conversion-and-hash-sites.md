---
title: "Native Object.fromEntries / Object.keys / spread for toH / zip / keys / transformValues / eachValue / valuesAt / dup on plain receivers"
status: ready
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: native-sweep
packages: ["actionpack", "actionview", "activemodel", "activerecord", "activejob", "activesupport"]
deps:
  [
    "native-analogues-array-calls",
    "native-analogues-hash-and-scalar-calls",
    "ruby-compat-native-required-lint",
  ]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These remaining Array conversion and non-0190 Hash helpers have importing
non-test files outside ruby-compat:

- `toH` (`packages/ruby-compat/src/array.ts:772`): `secure-password.ts`, `mysql/schema-statements.ts`, `predicate-builder/association-query-value.ts`
- `zip` (`:815`): `associations/foreign-association.ts`, `association-query-value.ts`
- `keys` (`hash.ts`): `activemodel/src/attributes.ts`, `activerecord/src/secure-password.ts`, `support/stubs/strong-parameters.ts`, `number-helper/number-to-human-converter.ts`
- `transformValues`: `journey/path/pattern.ts`, `activerecord/src/attributes.ts`, `encryption/message-pack-message-serializer.ts`, `fixture-set/table-rows.ts`
- `eachValue`: `pool-manager.ts`
- `valuesAt`: `activejob/src/serializers/range-serializer.ts`
- `dup`: `action-controller/renderer.ts`, `helpers/tags/label.ts`

## Acceptance criteria

- [ ] Each site on an Array or plain object uses the native form credited by `native-analogues-array-calls` / `native-analogues-hash-and-scalar-calls`. A site on a `Hash` / `Map` keeps the helper and is listed with its receiver type in the PR.
- [ ] `toH` keeps its arm for an object answering `toH` (`array.ts:779`) wherever such a receiver reaches the site.
- [ ] Converted helpers join `eslint/ruby-compat-native-required.json`, an export left with no caller is deleted, and the call gates are green with no new baseline rows.
