---
title: "vitest finds no test files for the other project under Bun"
status: draft
updated: 2026-11-26
rfc: "0252-bun-runtime-support"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Under Bun 1.3.6, `bun --bun node_modules/vitest/vitest.mjs run packages/ruby-compat/test/process-adapter-runtime.trails.test.ts` (and with `--project other process-adapter-runtime`) exits 1 with "No test files found", though the file exists and matches the `other` project's `packages/*/test/**/*.test.ts` include. So Bun-only tests (`packages/date/test/bun-temporal.trails.test.ts`, the `it.skipIf(... bun ...)` arms in `process-adapter-runtime.trails.test.ts`) are never run under Bun. Seen 2026-11-25 while working on trails#10766. The `--project activerecord` filter does find files.

## Acceptance criteria

- [ ] Find why vitest's file filter matches nothing for the `other` project under Bun (glob/path resolution in `vitest.config.ts` under Bun).
- [ ] `packages/date/test/bun-temporal.trails.test.ts` runs and passes under `bun --bun node_modules/vitest/vitest.mjs`.
