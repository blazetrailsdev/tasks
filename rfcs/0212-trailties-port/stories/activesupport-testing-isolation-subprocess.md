---
title: "Port ActiveSupport::Testing::Isolation with its Subprocess arm"
status: done
updated: 2026-11-01
rfc: "0212-trailties-port"
cluster: tt-harness
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9561
claim: "2026-11-01T02:12:46Z"
assignee: "activesupport-testing-isolation-subprocess"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Testing::Isolation` (`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/isolation.rb`)
runs each test in a fork (`Forking`, `:35-71`) or, where fork is unavailable,
re-execs the test file in a child process filtered to that one test
(`Subprocess`, `:73-115`, keyed by `ISOLATION_TEST` / `ISOLATION_OUTPUT`).
Fork is ruled out by CLAUDE.md § "Runtime facts Node does not expose". trails
has no `testing/isolation.ts`.

## Acceptance criteria

- `packages/activesupport/src/testing/isolation.ts` ports `Isolation`,
  `isForking` and `Subprocess#run_in_isolation` at their Rails names. The
  child is a vitest process filtered to the one test, and the parent reads its
  serialized result back as Rails reads the marshalled one.
- `Forking` is not ported, and its scoped skip cites the CLAUDE.md section.
- A test that includes `Isolation` runs in a child process, and that
  process's state does not leak into the parent. Rails has no dedicated test
  file for this. The railties isolation harness is its first consumer.
