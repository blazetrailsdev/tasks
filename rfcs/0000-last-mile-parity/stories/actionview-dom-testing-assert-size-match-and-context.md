---
title: "actionview: port assert_size_match! and HTMLSelector.context"
status: draft
updated: 2026-11-20
rfc: "0000-last-mile-parity"
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
(`rails-dom-testing` `lib/rails/dom/testing/assertions/selector_assertions.rb`,
`.../html_selector.rb`).

## Acceptance criteria

- [ ] All three are ported at their Rails names and files.
- [ ] actionview shows 0 API missing.
