---
title: "vitest-collect-on-bun"
status: draft
updated: 2026-11-25
rfc: "0252-bun-runtime-support"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

With Temporal polyfilled under Bun (temporal-on-bun), `bun --bun node_modules/vitest/vitest.mjs run --project activerecord packages/activerecord/test/cases/base.test.ts` no longer throws `ReferenceError: Temporal is not defined`, but the file fails at collection with `Error: \`column\` must be greater than or equal to 0 (columns start at column 0)` and no stack — the source-map library's position check, likely fed a Bun stack frame with column -1 (2026-11-25, Bun 1.3.6).

## Acceptance criteria

- [ ] Find the call that passes a negative column (vitest source-map handling under Bun, or a trails stack reader such as `Location`).
- [ ] base.test.ts collects and runs under `bun --bun node_modules/vitest/vitest.mjs`.
