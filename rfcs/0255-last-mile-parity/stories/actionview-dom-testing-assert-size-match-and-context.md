---
title: "actionview: port assert_size_match! and HTMLSelector.context"
status: ready
updated: 2026-11-21
rfc: "0255-last-mile-parity"
cluster: small-packages
packages: [actionview]
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
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
