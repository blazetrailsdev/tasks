---
title: "Widen significantMissingCalls' rubyCalls param to readonly string[]"
status: done
updated: 2026-07-31
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: 5739
claim: "2026-07-31T19:08:55Z"
assignee: "fix-significant-missing-calls-readonly-param"
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/compare.ts` does not typecheck under the scripts tsconfig
program:

```text
scripts/api-compare/compare.ts: error TS2345: Argument of type 'readonly string[]'
  is not assignable to parameter of type 'string[]'.
```

`checkCalls` passes `rubyCalls` (now `readonly string[]`, the return type of
`dropWeakCalls`, added by #5726) into `significantMissingCalls`, whose
`rubyCalls` parameter is still declared `string[]` (compare.ts:262). Present on
`main` before #5728 and unrelated to it — verified by checking out the
pre-#5728 `compare.ts` and re-running `tsc --noEmit -p scripts/tsconfig.json`,
which reports the same error. The repo's own `pnpm typecheck` path does not
cover it, which is why it went unnoticed; #5723 cleared the other file-local
errors in this program.

## Acceptance criteria

- `significantMissingCalls`'s `rubyCalls` parameter is widened to
  `readonly string[]` (it only iterates), or the call site is adapted — no
  behavior change either way.
- `pnpm exec tsc --noEmit -p scripts/tsconfig.json` reports no error in
  `scripts/api-compare/`.
- `scripts/api-compare/compare.test.ts` still passes.
