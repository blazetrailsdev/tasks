---
title: "Runner reads test titles from the AST and exits on unknown flags"
status: in-progress
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9593
claim: "2026-11-01T21:46:44Z"
assignee: "app-base-package-manager-version-readers"
blocked-by: null
closed-reason: null
---

## Context

`Runner.testLocations` in `packages/trailties/src/test-unit/runner.ts` reads test
titles with a regexp, so `it.each([1])("x", ...)` has no title and `-n` combined
with a line filter misses it. That title is also the bare `it` name, where `-t`
matches `describe > it`. Rails unions the two in `CompositeFilter#===`
(`vendor/rails/v8.0.2/railties/lib/rails/test_unit/runner.rb:161-163`).
`TestParser.ranges` already walks the AST. Minitest's unknown-flag behaviour
(print and exit 1 in `vendor/minitest/v5.27.0/lib/minitest.rb` `process_args`)
also differs from the `ArgumentError` raised by `rejectUnknownOptions`.

## Acceptance criteria

- Test call titles come from the AST, including `it.each`, under their full name.
- An unknown flag prints usage and exits 1 as Minitest does.
