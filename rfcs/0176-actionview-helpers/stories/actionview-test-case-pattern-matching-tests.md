---
title: "actionview-test-case-pattern-matching-tests"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 17
pr: trails#9193
claim: "2026-10-21T21:16:17Z"
assignee: "sanitized-allowed-writers-live-in-rails-html-sanitizer-mirror"
blocked-by: null
closed-reason: null
---

## Context

`PatternMatchingTestCases` (`vendor/rails/v8.0.2/actionview/test/template/test_case_test.rb:490-516`, 3 tests) assert with
Minitest `assert_pattern` / `refute_pattern` over Ruby `=>` pattern matching against `Nokogiri::XML::Node#deconstruct_keys`
and `HashWithIndifferentAccess`. They are parked in `packages/actionview/src/template/test-case.test.ts`. trails has no
`assertPattern` (`git grep assertPattern -- packages` is empty) and `@blazetrails/nokogiri` nodes have no `deconstructKeys`.

## Acceptance criteria

- Decide (repo owner) how Ruby pattern-matching assertions port; then port the 3 tests or park them under a ratified `PERMANENT-SKIP:`.
