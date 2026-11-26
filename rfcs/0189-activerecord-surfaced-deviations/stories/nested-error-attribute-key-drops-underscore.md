---
title: "nested-error-attribute-key-drops-underscore"
status: draft
updated: 2026-11-26
rfc: "0189-activerecord-surfaced-deviations"
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

`computeAttribute` in `packages/activerecord/lib/associations/nested-error.ts` builds the error attribute from `underscore(reflection.name)`. Rails uses `association.reflection.name` directly (`vendor/rails/v8.0.5.2/activerecord/lib/active_record/associations/nested_error.rb:18-25`). The underscore exists because trails association names are camelCase (`tuningPegs`), while the ported Rails tests assert snake_case keys, `guitar.errors.get("tuning_pegs[1].pitch")` (`packages/activerecord/test/cases/autosave-association.test.ts:1998`, and the `TestIndexErrorsWithNestedAttributesOnlyMode` cases). Under CLAUDE.md § "Casing is translated, never mirrored", the camelCase key is the faithful one.

## Acceptance criteria

- `computeAttribute` uses `reflection.name` as Rails does, with no `underscore`.
- The nested-error attribute assertions in the autosave and nested-attributes tests use the camelCase key (`tuningPegs[1].pitch`). Test names stay unchanged.
- Check other readers of nested error keys (`errors.get`, form helpers, `fullMessages`) for snake_case assumptions.
