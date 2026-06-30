---
title: "enum-boolean-nil-string-value-support"
status: ready
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced converging `enum.test.ts` to the canonical `Book` model
(PR #4318). trails' `enum()` only supports integer-keyed mappings, so the
Rails `Book` enums for non-integer values are omitted (see
`packages/activerecord/src/test-helpers/models/book.ts` static block:
`cover { hard:"hard", soft:"soft" }`, `boolean_status { enabled:true,
disabled:false }`, `last_read { …, forgotten: nil }`). EnumType
(`packages/activerecord/src/enum.ts`) casts/serializes only string/number.

## Acceptance criteria

Implement boolean-valued, nil-valued, and string-valued enum support in
`EnumType` + `enum()`, wire the omitted `Book` enums (`cover`,
`boolean_status`, `last_read: forgotten`), then un-skip these
`enum_test.rb` cases in `enum.test.ts`:

- assign false value to a field defined as boolean
- assign nil value to enum which defines nil value to hash
- deserialize nil value to enum which defines nil value to hash
- deserialize enum value to original hash key
- find via where should be type casted
