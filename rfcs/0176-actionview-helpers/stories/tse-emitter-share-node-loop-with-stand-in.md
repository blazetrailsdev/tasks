---
title: "TSE stand-in and compileJs share one per-node emit loop"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 11
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trails-tsc/src/plugins/tse.ts` `emitNodes` copies the per-node loop of `emit()` in `packages/tse-compiler/src/emit-js.ts:232-272` line for line: `innerDepths`, `innerCallExprParens`, `braceDepth`, `functionDepths`, `awaits` and `bufRef`. trails#9125 shared every predicate and helper the loop uses (`ARROW_BLOCK_RE`, `BLOCK_CLOSE_RE`, `FUNCTION_BLOCK_RE`, `awaitFlowReads`, `netBraceDepth`, `netUnclosedParens`). The loop itself is still a copy, because `emit()` returns a flat string with line-only mappings, and the stand-in needs `[code, node]` pairs plus column mappings.

## Acceptance criteria

- One loop in tse-compiler yields, per node, the emitted code, `bufRef`, `awaits` and the closer suffix. Both `emit()` and `emitNodes` consume it.
- `emitNodes` keeps no depth bookkeeping of its own.
- The `tse.test.ts` and `emit-js.test.ts` tests pass unchanged.
