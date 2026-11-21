---
title: "actionview: port assert_size_match! and HTMLSelector.context"
status: done
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: small-packages
packages: [actionview]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#10512
claim: "2026-11-21T18:29:36Z"
assignee: "retake-the-body-pin-floor-at-the-last-8-0-2-commit"
blocked-by: null
closed-reason: null
---

## Context

`parity:api` lists three rails-dom-testing members on actionview:
`assert_size_match!` ×2 and `HTMLSelector.context`
(`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/selector_assertions.rb`,
`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/selector_assertions/html_selector.rb`).

## Acceptance criteria

- [ ] All three are ported at their Rails names and files.
- [ ] actionview shows 0 API missing.

## Verification

```sh
pnpm parity:api --missing --package actionview  # 0 rows
```
