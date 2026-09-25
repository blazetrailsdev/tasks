---
title: "postgresql_adapter_test: port stderr match in ignores-warnings test"
status: claimed
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-09-25T01:44:13Z"
assignee: "nested-through-polymorphic-accessor-fidelity"
blocked-by: null
closed-reason: null
---

## Context

`postgresql-adapter.test.ts` "ignores warnings when behaviour ignore" cannot port Rails' `assert_match(/WARNING:  foo/, err)` (`postgresql_adapter_test.rb`, `test_ignores_warnings_when_behaviour_ignore`), which reads libpq's C-level stderr via `capture_subprocess_io`. node-pg exposes server notices as events, not a stream, so the test keeps one fewer assertion (match 1 vs 0 in `pnpm parity:test --assertions`).

## Acceptance criteria

- Port the `match` assertion against the notice text the pg driver surfaces (e.g. a `notice` listener), or block the story with the specific driver blocker.
- The test reports 0 assertion mismatches.
