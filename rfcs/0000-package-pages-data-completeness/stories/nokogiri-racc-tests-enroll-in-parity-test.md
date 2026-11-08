---
title: "parity:test: enroll nokogiri and racc tests under the nokogiri package"
status: draft
updated: 2026-11-07
rfc: "0000-package-pages-data-completeness"
cluster: test-enrollment
packages: ["nokogiri", "scripts"]
deps: [sources-tests-excluded-reason]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`vendor/sources.ts:641-671` vendors nokogiri v1.18.3 (103 test `.rb` files) and
racc v1.8.0 (10), both with `compareTests: false`. `packages/nokogiri/test/` has
seven test files (`sax/parser`, `xml/document`, `css/{parser,tokenizer,xpath-visitor}`,
`html5/document`, plus one `.trails.test.ts`). trails#9825 enrolled api (190/597
and 10/434); there is no tests tile.

## Acceptance criteria

- [ ] Both gems have a `testPath` and `compareTests: true`, and are registered
      in `scripts/test-compare/`.
- [ ] Unported Ruby test files are `unported-files` rows, grouped by
      directory if the register allows, otherwise one row each. If the row
      count would push the PR past the LOC ceiling, enroll nokogiri here and
      file racc as its own story.
- [ ] `pnpm parity:test` reports `nokogiri` and `racc`. Every other package's
      delta is zero.
