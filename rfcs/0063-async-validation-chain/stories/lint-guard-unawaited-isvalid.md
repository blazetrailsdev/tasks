---
title: "Lint guard: unawaited isValid/validate is an error"
status: done
updated: 2026-07-08
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 0
pr: 4796
claim: "2026-07-08T19:11:20Z"
assignee: "lint-guard-unawaited-isvalid"
blocked-by: null
closed-reason: null
---

## Context

Before flipping `isValid()` to return `Promise<boolean>`, lint must catch
unawaited calls: `if (record.isValid())` on a forgotten `await` is always
truthy and fails silently. The flip stories depend on this landing first.

Check the current eslint config for `@typescript-eslint/no-misused-promises`
and `@typescript-eslint/no-floating-promises` coverage over
`packages/activemodel`, `packages/activerecord`, and their test files.
Enable/configure whichever are missing so a Promise used in a boolean
position (condition, `!`, `&&`) or dropped on the floor is a lint error,
including in `*.test.ts`. If enabling repo-wide is too noisy in one PR,
scope to the three affected packages and note the follow-up.

Relevant call-site inventory (as of 2026-07-07): ~154 `isValid()` call
sites in `packages/activerecord/src/**/*.test.ts`, 14 non-test call sites
across activerecord + activemodel sources.

## Acceptance criteria

- A deliberate `if (somePromiseReturningFn())` in AR/AM source or tests
  fails lint.
- `pnpm lint` passes on main with the rules enabled (fix or explicitly
  suppress any pre-existing violations, each with a reason).
- No runtime code changes.
