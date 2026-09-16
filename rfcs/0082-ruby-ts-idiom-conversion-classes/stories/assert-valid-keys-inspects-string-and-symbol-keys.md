---
title: "assert-valid-keys-inspects-string-and-symbol-keys"
status: draft
updated: 2026-09-16
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

`assertValidKeys` (`packages/activesupport/src/hash-utils.ts`, port of
`Hash#assert_valid_keys`, `vendor/rails/activesupport/lib/active_support/core_ext/hash/keys.rb:48-55`)
formats every key with an identifier regex as a Symbol (`:name`), where Rails
uses `k.inspect` / `valid_keys.map(&:inspect)`. Rails distinguishes a String
key (`"model_class"`) from a Symbol key (`:if`) in the message.

Most trails callers pass option names that are Symbols in Rails but plain JS
keys in trails (`activemodel/src/callbacks.ts`, `activerecord/src/aggregations.ts`,
schema-statements, association builder), and their tests assert the `:name`
form. At least one caller passes Rails String keys:
`vendor/rails/activerecord/lib/active_record/fixture_set/file.rb:67`
(`assert_valid_keys(%w(model_class ignore))`), ported at
`packages/activerecord/src/fixture-set/file.ts:75`, whose message should read
`Unknown key: "x". Valid keys are: "model_class", "ignore"`.

Surfaced in review of trails#7840.

## Acceptance criteria

- `assertValidKeys` formats keys with `rbInspect`, so a String key prints quoted and a Symbol (`":name"`) prints `:name`.
- Every caller passes Symbol-valued option names as `":name"` (or otherwise distinguishes them) so their messages keep Rails' `:name` form; the fixture-set caller keeps String keys.
- Existing "Unknown key" assertions across activemodel/activerecord/actionview still match Rails' messages.
