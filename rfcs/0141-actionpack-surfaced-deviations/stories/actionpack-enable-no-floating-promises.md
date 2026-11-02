---
title: "actionpack-enable-no-floating-promises"
status: draft
updated: 2026-11-02
rfc: "0141-actionpack-surfaced-deviations"
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

`@typescript-eslint/no-floating-promises` runs only on activemodel, activerecord and `scripts` (`eslint.config.mjs`, "dropped-Promise guards"). Measured 2026-11-01 with the rule enabled on `packages/actionpack/src`, including the trails#9608 prefilters: 39 finding(s), 8.9s of rule time.

## Acceptance criteria

- Add `packages/actionpack/src/**/*.ts` to the rule's `files` list in `eslint.config.mjs`, for `no-floating-promises` only. Do not enable `no-misused-promises` here.
- Fix every finding by awaiting where the Rails body runs the step in line. Do not add disable comments or a `void` that hides a real drop.
- `pnpm lint:files` passes on the package.
