---
title: "Flip AR no-explicit-any warn→error with shrinking allowlist (split src/test)"
status: draft
updated: 2026-06-18
rfc: "0037-no-explicit-any-enforcement"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`eslint.config.mjs:445-454` sets `@typescript-eslint/no-explicit-any: "warn"`
for all `packages/activerecord/src/**/*.ts` (src + tests in one block). CI's
`pnpm lint` (`eslint .`) runs with no `--max-warnings`, so the rule cannot
fail CI — it is an unenforceable placeholder. 186 of 369 AR test files are
already clean of `as any`; all-clean files should be enforced and
regression-proof now.

The repo's established ratchet idiom is an exclude-list (see
`eslint/require-canonical-schema-exclude.json`, `eslint/no-raw-sql-exclude.json`).
`no-explicit-any` is a stock rule that can't read JSON, so its allowlist must
live as a `files:` glob array in the flat config.

## Acceptance criteria

- The single AR `no-explicit-any` block is split into two: `src/**/*.ts`
  (non-test) and `**/*.test.ts`, each ratcheting independently.
- Each defaults to `"error"`, with a trailing override block listing the
  currently-dirty files (rule `off`). Generate the dirty-file list
  programmatically (eslint JSON output), don't hand-maintain.
- `pnpm lint` stays green (CI unchanged); a NEW `as any` in any clean file
  fails lint.
- A short script/Make target regenerates the allowlist so burndown PRs can
  drop entries mechanically.
- No code changes to test/src `any` sites in this PR — mechanism only.
