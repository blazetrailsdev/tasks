---
title: "Port routing_test 'correct for empty UrlGenerationError' body (corrections == [])"
status: ready
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/dispatch/routing.test.ts`, `describe("TestUrlGenerationErrors")` › "correct for empty UrlGenerationError", is still a placeholder: `routes.pathFor({}, "nonexistent")` toThrow `/No route matches/`. Rails' body (`vendor/rails/v8.0.2/actionpack/test/dispatch/routing_test.rb:4988-4993`) is:

    err = ActionController::UrlGenerationError.new("oh no!")
    assert_equal [], err.corrections

`UrlGenerationError#corrections` is at `actionpack/lib/action_controller/metal/exceptions.rb` (DidYouMean corrections, returning `[]` when routes/route_name are absent). PR trails#9044 left this test as it was.

## Acceptance criteria

- The test body is Rails': `new UrlGenerationError("oh no!")` and `expect(err.corrections).toEqual([])`. `corrections` must be ported at its Rails name if it's missing.
- The routing_test.rb row for this test leaves `pnpm parity:test --assertions --missing --package actiondispatch`.
