---
title: "enum-reserved-undeclared-override-alias"
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

Surfaced converging `enum.test.ts` (PR #4318). Three independent enum-parity
gaps in `packages/activerecord/src/enum.ts`:

- Reserved enum _names_ (`column`, `logger`, `attributes`) are not guarded —
  Rails raises; trails does not (`detectEnumConflictBang` only checks generated
  value method names).
- `enum` on an attribute with an undeclared type silently defaults the subtype
  to `integer` (try/catch in `_enum`); Rails raises on `type_for_attribute`.
- Re-defining an enum bang method (`def published!; super; end`) then declaring
  the enum raises a conflict in trails; Rails allows it (override via `super`).
- `alias_attribute` + `enum` on the alias does not resolve (the aliased enum
  attribute reads nil).

## Acceptance criteria

Implement the four behaviors and port these `enum_test.rb` cases in
`enum.test.ts`:

- reserved enum names
- raises for attributes with undeclared type
- overriding enum method should not raise
- enum with alias_attribute
