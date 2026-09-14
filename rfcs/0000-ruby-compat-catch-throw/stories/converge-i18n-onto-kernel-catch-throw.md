---
title: "Converge i18n's throwException / catchException onto Kernel#catch / Kernel#throw"
status: draft
updated: 2026-09-14
rfc: "0000-ruby-compat-catch-throw"
cluster: fidelity
packages: ["i18n"]
deps: ["port-kernel-catch-throw"]
deps-rfc: []
est-loc: 120
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC Design §3. `packages/i18n/src/throw-catch.ts` is a `:exception`-only
copy of `catch`/`throw` whose `ThrownException extends Error`, with two
`@noRailsEquivalent PERMANENT` receipts for methods Ruby defines. Sites:
`i18n.ts:343,370`, `backend/chain.ts:71,84,99,105`,
`backend/base.ts:253,260,364`. Ruby: `vendor/i18n/lib/i18n.rb:394`,
`backend/chain.rb:61,73,84,88`, `backend/base.rb` (the `throw(:exception, …)`
sites the TS lines mirror).

## Acceptance criteria

- [ ] Every site calls `kernelCatch(":exception", …)` /
      `kernelThrow(":exception", v)` in the Rails body's shape.
- [ ] `throw-catch.ts` and both receipts deleted; no new receipt.
- [ ] Any bare `catch (e)` on the path between a `throw(:exception)` and its
      `catch` re-throws a non-`Error` carrier (audit `backend/*.ts`).
- [ ] `TS_CONSTRUCT_SKELETON_NAMES` rows for `throwException` /
      `catchException` deleted.
- [ ] `pnpm parity:api:calls`, `:args`, arm-throw mark non-increasing;
      `parity:api:extra --package i18n` drops by 3 names.

## Verification

`grep -rn "throwException\|catchException" packages` → 0;
`pnpm vitest run packages/i18n`.
