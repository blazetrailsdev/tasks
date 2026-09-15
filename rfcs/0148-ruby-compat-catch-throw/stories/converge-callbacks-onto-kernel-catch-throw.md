---
title: "Converge throwAbort / isAbortSignal onto Kernel#catch / Kernel#throw"
status: in-progress
updated: 2026-09-15
rfc: "0148-ruby-compat-catch-throw"
cluster: fidelity
packages: ["activesupport", "activemodel", "activerecord", "actionpack"]
deps: ["port-kernel-catch-throw"]
deps-rfc: []
est-loc: 260
priority: 2
pr: trails#7766
claim: "2026-09-14T23:54:26Z"
assignee: "converge-callbacks-onto-kernel-catch-throw"
blocked-by: null
---

## Context

RFC Design §3. `throwAbort()` / `isAbortSignal()`
(`packages/activesupport/src/callbacks.ts:8-16`) is an `:abort`-only copy of
`throw`/`catch` throwing a bare JS `Symbol`. 22 non-test call sites
(`grep -rn "isAbortSignal\|throwAbort" packages --include=*.ts | grep -v test`),
chiefly `callbacks.ts:356-413`, `activerecord/src/autosave-association.ts:636`,
`associations/{has-one,has-many,collection}-association.ts`,
`associations/builder/association.ts`, `actionpack/src/abstract-controller/callbacks.ts`,
plus the `test-helpers/models/*.ts` that mirror Rails models calling
`throw :abort`. Rails: `activesupport/lib/active_support/callbacks.rb:667`
(`catch(:abort)`), `has_one_association.rb:18,34`,
`has_many_association.rb:23`, `autosave_association.rb:212`,
`collection_association.rb:400,462`.

## Acceptance criteria

- [ ] Each Rails `throw(:abort)` site is `kernelThrow(":abort")`; each
      `catch(:abort) do … end` is `kernelCatch(":abort", …)` — the try/catch +
      `isAbortSignal` shape is gone, including the Promise `.then(_, reject)`
      arm at `callbacks.ts:381`, which §1.6's settle handling replaces.
- [ ] `throwAbort`, `isAbortSignal` and their receipts deleted from
      `callbacks.ts` and `activesupport/index.ts`; the RuntimeError message at
      `callbacks.ts:356` no longer names `throwAbort()`.
- [ ] `TS_CONSTRUCT_SKELETON_NAMES` row for `throwAbort` deleted.
- [ ] Test-helper models and `.test.ts` files updated; no test renamed.
- [ ] `pnpm parity:api:calls`, `:args`, arm-throw mark non-increasing.

## Definition of done

Re-exporting `kernelThrow` under the name `throwAbort` does not close this
story.

## Verification

`grep -rn "throwAbort\|isAbortSignal" packages` → 0; the touched
`callbacks.test.ts` / `autosave-association.test.ts` /
`has-one-associations.test.ts` files green.
