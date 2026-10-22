---
title: "actionview-tag-helper-test-assertions"
status: claimed
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: "2026-10-22T00:48:07Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

# actionview tag_helper_test assertion convergence

## Context

`pnpm parity:test --package actionview --assertions --missing` (2026-10-21) reports 20 count, 30 kind and 2 value mismatches in `template/tag_helper_test.rb` → `packages/actionview/src/template/tag-helper.test.ts`. Classified as **real misses**:

- `assert_dom_equal` (rails-dom-testing, ported) is ported as `toContain` substring checks or `toBe` (`tag options converts boolean option`, `data attributes`, `aria attributes`, `content tag with data attributes`, `link to data nil equal`, …).
- `assert_match` ported as `toContain` (`tag options`), `assert_respond_to` dropped (`tag builder renders unknown html elements`, `respond to`), `assert x.html_safe?` ported as `toBe(true)`.
- Dropped `assert_equal`s in the conditional/unescaped class tests and `escape once`, `skip invalid escaped attributes`.
- Value mismatches: `tag attributes nil` / `tag attributes empty` assert `""` where Rails asserts `<input type="text" >` (`vendor/rails/v8.0.2/actionview/test/template/tag_helper_test.rb`).

## Acceptance criteria

- Each flagged test asserts what Rails asserts, with `assertDomEqual` where Rails uses `assert_dom_equal`.
- tag_helper_test.rb shows 0 count, kind and value mismatches, or each remaining one carries an assertion-receipts row citing a ratified section.
