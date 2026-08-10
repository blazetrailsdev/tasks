---
title: "Retire the getAllTsFiles pass-through in extract-ts-api"
status: done
updated: 2026-08-02
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5878
claim: "2026-08-02T12:26:49Z"
assignee: "retire-getalltsfiles-passthrough-wrapper"
blocked-by: null
closed-reason: null
---

## Context

PR #5679 unified api-compare's `.ts` tree-walkers into `scripts/api-compare/ts-file-walk.ts`
(`walkTsFilesSync` / `walkPackageTsFiles`, plus the `COMMITTED_TS_FILES` and
`COMPARED_TS_FILES` populations), and #5674 added the missing flat-async
`walkTsFiles`. That left one vestige behind:

`scripts/api-compare/extract-ts-api.ts:2563` — `getAllTsFiles` is now nothing
but a pass-through:

```ts
export function getAllTsFiles(dir: string, excludeDirs: readonly string[] = []): string[] {
  return walkTsFilesSync(dir, COMPARED_TS_FILES, excludeDirs);
}
```

Its remaining callers are `extract-ts-api.ts:258` and `extract-ts-api.ts:409`,
both in the same file, plus two assertions in `extract-ts-api.test.ts:1965-1966`.
`lint-deps.ts` and `lint-calls.ts` already call `walkTsFilesSync` directly —
their private duplicates were deleted by #5679 — so this wrapper is the only
remaining indirection, and the name `getAllTsFiles` no longer signals which of
the two populations it walks (the whole point of the `ts-file-walk.ts` split).

Not urgent and deliberately out of scope for #5674, which was scoped to the
lint's file population.

## Acceptance criteria

- `getAllTsFiles` is removed from `extract-ts-api.ts`; both in-file callers use
  `walkTsFilesSync(dir, COMPARED_TS_FILES, excludeDirs)` directly, so the
  population is named at every call site.
- `extract-ts-api.test.ts`'s two `getAllTsFiles` assertions move onto
  `walkTsFilesSync` (or are dropped if `ts-file-walk.test.ts` already covers the
  same ground — it covers both populations and `excludeDirs` pruning).
- `parity:api:extra` / `parity:api` report identical counts before and after; this is
  a pure rename-through, no behaviour change.
- No new third-party deps.
