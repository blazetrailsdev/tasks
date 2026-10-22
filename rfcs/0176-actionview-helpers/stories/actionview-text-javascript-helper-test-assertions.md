---
title: "actionview-text-javascript-helper-test-assertions"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9199
claim: "2026-10-21T22:29:25Z"
assignee: "actionview-api-residue-context-rendering-class-methods"
blocked-by: null
closed-reason: null
---

# actionview text_helper and javascript_helper dropped assertions

## Context

`pnpm parity:test --package actionview --assertions --missing` (2026-10-21): `template/text_helper_test.rb` drops `assert_equal`s in `concat` (2→1), `highlight with html` (6→2), `excerpt with regex` (7→5), `excerpt with omission` (2→1), `excerpt with separator` (6→5); `template/javascript_helper_test.rb` drops one in `escape javascript` (11→10) and ports `assert_dom_equal` as `toBe` in `javascript tag`, `javascript tag with options`, `javascript cdata section`. **Real misses** (`vendor/rails/v8.0.2/actionview/test/template/text_helper_test.rb`, `javascript_helper_test.rb`).

## Acceptance criteria

- Every Rails assertion in these tests is ported with its kind (`assertDomEqual` for `assert_dom_equal`), or carries an assertion-receipts row citing a ratified section.
- Both files show 0 count and kind mismatches.
