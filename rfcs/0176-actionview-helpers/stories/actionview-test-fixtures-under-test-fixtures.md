---
title: "actionview-test-fixtures-under-test-fixtures"
status: in-progress
updated: 2026-10-23
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9277
claim: "2026-10-23T18:47:27Z"
assignee: "actionview-test-fixtures-under-test-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`test_template_annotations` (`vendor/rails/v8.0.2/actionview/test/actionpack/controller/render_test.rb:1511-1520`) asserts `assert_includes @response.body, "test/fixtures/actionpack/test/greeting.html.erb"`. trails keeps that fixture at `packages/actionview/src/test-helpers/fixtures/actionpack/test/greeting.html.tse`, so the rendered annotation path has no `test/fixtures/` segment. The port can only assert `fixtures/actionpack/test/greeting.html.tse`, which `parity:test --assertions` scores as an assertion-value mismatch. The test passes with that literal (trails#9246) and is parked in `packages/actionview/src/actionpack/controller/render.test.ts` until the literal can match.

## Acceptance criteria

- The actionview fixture tree sits at a path containing `test/fixtures/actionpack/` (mirroring `actionview/test/fixtures/`), or the annotation is rendered relative to a root that yields that path.
- `template annotations` is un-skipped with Rails' literal `test/fixtures/actionpack/test/greeting.html.tse`, and `parity:test --package actionview --assertions` reports no value mismatch for it.
