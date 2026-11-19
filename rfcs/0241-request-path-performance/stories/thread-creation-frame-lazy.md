---
title: "Thread.new captures an Error stack on every request"
status: done
updated: 2026-11-19
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [ruby-compat]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10275
claim: "2026-11-17T22:21:39Z"
assignee: "daily-perf-benchmark-workflow"
blocked-by: null
closed-reason: null
---

## Context

The Rack Node handler starts a `Thread` per request, and the `Thread`
constructor (`packages/ruby-compat/lib/thread.ts:219`) captures `new Error()`
with a stack limit of 3 (`_creationFrame`, `:35`). The stack is used only by
`Thread#to_s` (`:482`) to print the creation location. Under the twelve-dollar
load this is **0.6% of busy CPU**, and every request allocates the stack.

## Acceptance criteria

- [ ] `Thread#to_s` still prints the creation file and line, matching
      `thread.c:3473`, but the per-thread cost is lower: for example, capture only
      when a debug or inspect path asks for it, or keep the raw callsite without
      formatting the stack.
- [ ] The `Thread#to_s` / `inspect` tests stay green.
- [ ] `_creationFrame` falls below 0.1% of busy CPU.

## Verification

Run the slim profile harness from the RFC README's "Slim profile harness" section on
trails main before and after the change. Record CPU per request, p95, p99 and
this story's measured share in the PR body.
