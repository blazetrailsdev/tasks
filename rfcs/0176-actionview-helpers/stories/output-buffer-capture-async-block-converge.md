---
title: "Converge OutputBuffer#capture's async-block arm to Rails' ensure shape"
status: claimed
updated: 2026-10-19
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: "2026-10-19T18:34:49Z"
assignee: "nokogiri-xpath-evaluator-behind-searchable-css"
blocked-by: null
closed-reason: null
---

## Context

`OutputBuffer#capture` (`vendor/rails/v8.0.2/actionview/lib/action_view/buffers.rb:72-79`) is a single begin/yield/html_safe/ensure block. trails#9055 gave `packages/actionview/src/buffers.ts` `capture` an extra arm: when the block returns a thenable, `capture` returns a Promise and keeps `_raw` swapped until it settles. `CacheHelper#writeFragmentFor` (`cache_helper.rb:292-295`) depends on that arm, because a TSE `cache` block awaits a nested `render`. While the capture is pending, any other write to the same buffer lands inside it.

## Acceptance criteria

- Converge `capture` to Rails' one-arm shape, with each async block capturing into its own buffer so a concurrent render cannot interleave. Or, if the arm is forced by the language, get it ratified and receipt it `@inventedArm then — PERMANENT` against the ratified section.
- "render cached outer partial with cached inner partial" (`log_subscriber_test.rb:216-235`) keeps passing.
