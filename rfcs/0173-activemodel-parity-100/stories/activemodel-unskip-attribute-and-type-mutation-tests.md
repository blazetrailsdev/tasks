---
title: "activemodel: un-skip the 8 matched-but-skipped tests"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: tests
packages: ["activemodel"]
deps: ["ruby-mutable-string-carrier", "activemodel-verify-and-pin-protocol-bodies"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package activemodel` counts **8 skipped** tests whose Rails twin is scored:

- `attribute-set.test.ts` — "duping creates a new hash, but does not dup the attributes",
  "deep_duping creates a new hash and dups each attribute" (`vendor/rails/v8.0.2/activemodel/test/cases/attribute_set_test.rb`)
- `attribute.test.ts` — "duping dups the value", "an attribute is changed if it has been mutated",
  "with_type preserves mutations" (`vendor/rails/v8.0.2/activemodel/test/cases/attribute_test.rb`)
- `attributes-dirty.test.ts` — "attribute mutation" (`vendor/rails/v8.0.2/activemodel/test/cases/attributes_dirty_test.rb`)
- `type/string.test.ts` — "cast strings are mutable", "values are duped coming out" (`vendor/rails/v8.0.2/activemodel/test/cases/type/string_test.rb`)

Six hinge on Ruby's mutable `String` (in-place `<<` changing an attribute value), which is
`ruby-mutable-string-carrier` (RFC 0155, blocked); the two dup cases need `AttributeSet#dup` /
`deep_dup` semantics (`initialize_dup`, verified by `activemodel-verify-and-pin-protocol-bodies`).

## Acceptance criteria

- [ ] The two dup cases are un-skipped and pass with Rails' assertions.
- [ ] The six mutation cases are un-skipped once `ruby-mutable-string-carrier` lands, with Rails' bodies.
- [ ] `pnpm parity:test` activemodel skipped **0**.
