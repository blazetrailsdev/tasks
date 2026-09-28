---
title: "Port dispatch/routing_test.rb's skipped tests from TestRackAppRouteGeneration to the end"
status: draft
updated: 2026-09-28
rfc: "0163-actiondispatch-routing-parity"
cluster: null
packages: ["actionpack"]
deps: ["port-routing-test-mapper-skips-part-1"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The tail of `vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb`,
lines 4880-5393 — 16 empty skip stubs:

| Class                                   | Skipped |
| --------------------------------------- | ------- |
| `TestRackAppRouteGeneration`            | 1       |
| `TestRedirectRouteGeneration`           | 1       |
| `TestUrlGenerationErrors`               | 2       |
| `TestDefaultUrlOptions`                 | 1       |
| `TestErrorsInController` (`:5023`)      | 3       |
| `TestOptionalScopesWithOrWithoutParams` | 2       |
| `TestPathParameters`                    | 1       |
| `FlashRedirectTest`                     | 1       |
| `TestRecognizePath`                     | 2       |
| `TestRelativeUrlRootGeneration`         | 2       |

## Acceptance criteria

- Each stub is replaced by the Rails body.
- With the four sibling stories, `pnpm parity:test --package actiondispatch`
  reports `dispatch/routing_test.rb` 294/294 with 0 skipped.
