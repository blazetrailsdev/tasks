---
title: "rails-dom-testing-port-dom-assertions-and-parser-selection-tests"
status: claimed
updated: 2026-11-08
rfc: "0225-package-pages-data-completeness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-08T17:45:28Z"
assignee: "rails-dom-testing-port-dom-assertions-and-parser-selection-tests"
blocked-by: null
closed-reason: null
---

## Context

trails#9870 enrolled rails-dom-testing in `parity:test`. Two Ruby test files have no TS counterpart and sit as rows in `scripts/parity/unported-files/rails-dom-testing.ts`:

- `vendor/rails-dom-testing/v2.2.0/test/dom_assertions_test.rb` (~23 tests: `test_assert_dom_equal`, `test "default html4, html5 specified"`, ...)
- `vendor/rails-dom-testing/v2.2.0/test/parser_selection_test.rb` (3 tests)

`packages/actionview/src/rails-dom-testing/assertions/dom-assertions.trails.test.ts` covers much of the DomAssertions behaviour under non-Rails names.

## Acceptance criteria

- [ ] `packages/actionview/src/rails-dom-testing/assertions/dom-assertions.test.ts` ports `dom_assertions_test.rb` with Rails test names verbatim; HTML4-only arms are parked or receipted per CLAUDE.md "DOM testing is HTML5 only".
- [ ] `parser-selection.test.ts` ports `parser_selection_test.rb` the same way.
- [ ] The two rows in `scripts/parity/unported-files/rails-dom-testing.ts` are deleted; tests overlapping `dom-assertions.trails.test.ts` move out of it.
- [ ] `pnpm parity:test` shows rails-dom-testing 3/3 files; `parity:test:assertions` stays OK.
