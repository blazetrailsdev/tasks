---
title: "Port render_test.rb's etag, render-class, head and http_cache_forever tests"
status: draft
updated: 2026-09-27
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-render-test-expires-in-and-last-modified", "conditional-get-and-etag-invented-helpers"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The rest of `vendor/rails/v8.0.2/actionpack/test/controller/render_test.rb`:

| Rails class                               | Tests                                                 |
| ----------------------------------------- | ----------------------------------------------------- |
| `EtagRenderTest` (`:667`)                 | 5                                                     |
| `NamespacedEtagRenderTest` (`:745`)       | 1                                                     |
| `InheritedEtagRenderTest` (`:767`)        | 1                                                     |
| `MetalRenderTest` (`:789`)                | 1                                                     |
| `ActionControllerRenderTest` (`:798`)     | 1                                                     |
| `ActionControllerBaseRenderTest` (`:810`) | 1                                                     |
| `ImplicitRenderTest` (`:817`)             | 4 (2 today in `metal/implicit-render.trails.test.ts`) |
| `HeadRenderTest` (`:844`)                 | 15                                                    |
| `LiveHeadRenderTest` (`:985`)             | 1                                                     |
| `HttpCacheForeverTest` (`:1010`)          | 4                                                     |
| `HttpCacheNoStoreTest` (`:1056`)          | 9                                                     |

`LiveTestController#test_action` (`:980`) is a controller action the extractor
counts as a test; RFC 0167's `ruby-extractor-counts-controller-test-actions`
drops it.

## Acceptance criteria

- Every class above is ported in Rails order into `controller/render.test.ts`.
  The two tests reported in `metal/implicit-render.trails.test.ts` move here if
  they are ports of the Rails tests; otherwise they stay and the Rails tests are
  ported.
- `pnpm parity:test --package actioncontroller` reports
  `controller/render_test.rb` complete.
