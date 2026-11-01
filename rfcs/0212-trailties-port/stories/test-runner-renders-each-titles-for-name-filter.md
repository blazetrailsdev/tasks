---
title: "Runner name filter matches rendered it.each and non-literal describe titles"
status: draft
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`TestParser.calls` (`packages/trailties/src/test-unit/test-parser.ts`) stores an `it.each` title with its `%s` unrendered and leaves a non-literal `describe` title out of the full name. So `Runner.testLocations` misses such tests when `-n` is combined with a line filter, where Rails unions the two in `CompositeFilter#===` (`vendor/rails/v8.0.2/railties/lib/rails/test_unit/runner.rb:161-163`).

## Acceptance criteria

- `-n "saves 1"` with a line filter selects `it.each([1])("saves %s", ...)`.
- A test under a non-literal `describe` title is still matched by `-n`.
