---
title: "lint-guard-floating-promises-burndown"
status: ready
updated: 2026-07-08
rfc: "0063-async-validation-chain"
cluster: null
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

Follow-up to lint-guard-unawaited-isvalid. That story enabled
`@typescript-eslint/no-misused-promises` with only `checksConditionals`
(the `if (isValid())` boolean-position guard) over `packages/activemodel`
and `packages/activerecord`. See eslint.config.mjs (the "no-misused-promises:
boolean-position guard" block).

Two sub-checks were deferred because clearing them requires runtime
`await`/`void` edits, which the guard story forbade:

- `@typescript-eslint/no-floating-promises`: ~177 dropped-Promise sites
  (~170 in `*.test.ts`, ~7 in src) as of 2026-07-08.
- `@typescript-eslint/no-misused-promises` `checksVoidReturn` (12 sites:
  async callbacks / adapter method overrides typed to return void) and
  `checksSpreads` (1 site: collection-proxy.test.ts spreads a Promise).

## Acceptance criteria

- Enable `no-floating-promises` = error over activemodel + activerecord
  (src + tests), fixing each site with a real `await` (or `void` where a
  fire-and-forget is genuinely intended, with a reason).
- Flip `checksVoidReturn` and `checksSpreads` back on in the
  no-misused-promises block and clear the ~13 sites.
- `pnpm lint` passes.
