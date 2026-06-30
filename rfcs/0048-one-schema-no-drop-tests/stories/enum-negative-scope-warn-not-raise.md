---
title: "enum-negative-scope-warn-not-raise"
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

Surfaced converging `enum.test.ts` (PR #4318). Rails _warns_ when an enum
element's auto-generated negative scope (`not_*`) collides with a
positively-named element; trails' conflict-detection pass in
`packages/activerecord/src/enum.ts` `_enum` _raises_ an ArgumentError instead,
pre-empting `detectNegativeEnumConditionsBang` (which exists but is unwired).

## Acceptance criteria

Convert the negative-scope-clash case from a hard conflict error to the Rails
warning (via `detectNegativeEnumConditionsBang` / `setEnumWarn`), suppressed
under `scopes: false`. Then port these `enum_test.rb` cases in `enum.test.ts`:

- enum logs a warning if auto-generated negative scopes would clash with other enum names
- enum logs a warning if auto-generated negative scopes would clash with other enum names regardless of order
- enum doesn't log a warning if opting out of scopes
