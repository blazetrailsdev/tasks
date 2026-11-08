---
title: "parity:test: enroll rails-dom-testing's tests under actionview"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
cluster: test-enrollment
packages: ["actionview", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:624-636` vendors rails-dom-testing v2.2.0 with
`compareTests: false`. It is ported inside actionview
(`packages/actionview/src/rails-dom-testing/assertions/`, which has
`selector-assertions.test.ts` and `dom-assertions.trails.test.ts`), and
`compareKeysOf("actionview")` includes `rails-dom-testing`. The Ruby tests are
`test/{dom_assertions,parser_selection,selector_assertions}_test.rb`. So
actionview's tests tile leaves out this gem entirely.

## Acceptance criteria

- [ ] `testPath: "test"`, `compareTests: true`, registered in
      `scripts/test-compare/`.
- [ ] `pnpm parity:test` reports a `rails-dom-testing` row, and trailmap sums
      it into actionview's tile through compare keys. actionview's own row has
      a zero delta.
