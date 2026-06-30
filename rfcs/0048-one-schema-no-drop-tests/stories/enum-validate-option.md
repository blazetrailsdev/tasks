---
title: "enum-validate-option"
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

Surfaced converging `enum.test.ts` (PR #4318). trails' `enum()`
(`packages/activerecord/src/enum.ts` `_enum`) accepts a `validate` option key
(listed in `assertValidEnumOptions`) but does not consume it — no validation is
wired, so `enum :status, [...], validate: true` is a no-op.

## Acceptance criteria

Honor the `validate:` option (Rails adds an inclusion validation; `validate:
{ allow_nil: true }` etc. forwards the hash to the validator). Then port these
`enum_test.rb` cases in `enum.test.ts`:

- validation with 'validate: true' option
- validation with 'validate: hash' option
