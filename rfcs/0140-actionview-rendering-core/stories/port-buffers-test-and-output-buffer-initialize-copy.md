---
title: "Port buffers_test.rb (SharedBufferTests, can be duped) and OutputBuffer#initialize_copy"
status: ready
updated: 2026-09-27
rfc: "0140-actionview-rendering-core"
cluster: null
packages: ["actionview"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8191 moved every test out of `packages/actionview/src/buffers.test.ts` into
`buffers.trails.test.ts`, because none carried a Rails name. `parity:test` shows
`buffers_test.rb` at 0 matched. Rails'
`vendor/rails/v8.0.2/actionview/test/buffers_test.rb` has two parts:

- `SharedBufferTests` (`:5-54`), included into `TestOutputBuffer` (`:57`) and
  `TestStreamingBuffer` (`:78`). Its five tests are `#<< maintains HTML safety`
  (`:7`), `#safe_append= bypasses HTML safety` (`:14`),
  `#raw allow to bypass HTML escaping` (`:21`),
  `#capture allow to intercept writes` (`:29`) and `#raw respects #capture` (`:41`).
- `can be duped` (`:63-69`), which relies on
  `OutputBuffer#initialize_copy` (`vendor/rails/v8.0.2/actionview/lib/action_view/buffers.rb:68-70`,
  `@raw_buffer = other.to_str`). `packages/actionview/src/buffers.ts` has no
  `dup` / `initializeCopy` counterpart.

## Acceptance criteria

- Port `OutputBuffer#initialize_copy` through the repo's settled `dup` idiom (check ruby-compat for `rbObjDup` / `initializeCopy` before inventing anything).
- Create `packages/actionview/src/buffers.test.ts` with the shared tests run against both buffers (under `TestOutputBuffer` and `TestStreamingBuffer` describes) plus `can be duped`, all under the verbatim Rails names.
- `buffers_test.rb` reaches 11/11 in `parity:test`.
