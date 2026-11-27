---
title: "ruby-compat-variable-reads-toplevel-at-module-eval"
status: draft
updated: 2026-11-27
rfc: "0248-trailties-parity-100"
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

trails#10846 moved each trailties-project globalSetup file's imports inside
`setup()`, so vitest's concurrent `loadGlobalSetupFiles` (`Promise.all`) no
longer races the ruby-compat import cycle. The cycle itself remains. When two
vite-node chains enter it at different modules concurrently, they either
deadlock (the event loop drains and vitest exits 0 having run nothing) or one
reads a partial module: `TopLevel` is `undefined` at
`packages/ruby-compat/lib/variable.ts:38` (`const tbl = TopLevel`) and at the
`_coreConstants` seating loop after it, reached through
`include.ts` → `variable.ts` while `object.ts` (which declares `TopLevel`,
`object.ts:217`) is still evaluating.

`variable.ts` reads `object.ts`'s exports at module-evaluation time, so it
depends on `object.ts` finishing first. That ordering only holds for some
entry points.

## Acceptance criteria

- [ ] `variable.ts` no longer reads `object.ts` exports at module-evaluation time, using one of the shapes sanctioned in root CLAUDE.md § "Call-time constant resolution". Alternatively, the `object.ts` ↔ `variable.ts` edge is removed from the cycle.
- [ ] A vitest globalSetup probe that concurrently imports `@blazetrails/ruby-compat/dir` and `@blazetrails/ruby-compat/include` completes, where it deadlocks today.
