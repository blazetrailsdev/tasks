---
title: "rails-dom-testing-assert-dom-block-marker"
status: done
updated: 2026-10-27
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9383
claim: "2026-10-27T17:16:19Z"
assignee: "activerecord-test-support-extra-surface-burndown-remainder"
blocked-by: null
closed-reason: null
---

## Context

`assertDom` (`packages/actionview/src/rails-dom-testing/assertions/selector-assertions.ts`) reads its `&block` (`vendor/rails-dom-testing/v2.2.0/lib/rails/dom/testing/assertions/selector_assertions.rb:163-179`) as a trailing function popped off `...args` by `typeof`. `parity:api:blocks` reports it as a dropped block arm; rails-dom-testing was enrolled with `block-param-mark.json` at 1 for `assertions/selector_assertions.rb`.

## Acceptance criteria

- `assertDom` reads its block with `rbBlockGivenP` over a `block()`-marked trailing argument, and every caller (~94 sites: actionview template tests, actionpack debug-exceptions / integration tests) wraps its block in `block()`.
- `pnpm parity:api:blocks` drops to 0 for rails-dom-testing; mark tightened.
