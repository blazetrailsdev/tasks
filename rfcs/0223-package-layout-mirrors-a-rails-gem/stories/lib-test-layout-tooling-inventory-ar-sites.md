---
title: "lib-test-layout-tooling-inventory-ar-sites"
status: draft
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
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

`lib-test-layout-tooling-inventory-rest` (trails PR bundling RFC 0223 layout tooling) converged the generic tooling sites: `scripts/test-compare/compare.ts` `PKG_SRC_DIRS` (activerecord, actionmailbox read `testRoots`), `scripts/test-compare/generate-stubs.ts` (its duplicate `PKG_DIRS` table deleted, reads `PKG_SRC_DIRS`), `scripts/parity/eslint-count.ts` `changedFiles` (pathspec covers `src`, `lib`, `test`). Only `activerecord` and `actionmailbox` (plus `website`) are still on `src/`.

What remains hard-codes `packages/activerecord/src` or `packages/actionmailbox/src` literally:

- `vitest.config.ts`: `ar-db-forks-default.js` import (line 4), AR adapter excludes (~69-96), alias table (~241-331, 367-368), `packages/activerecord/src/**` globs (~448, 461, 583, 588).
- `.github/workflows/ci.yml`: `DB_ADAPTER_RE` (~125), `GUIDES_EXCL_RE` (~146), `LINT_ALL_RE` (~164).
- `eslint.config.mjs` and `eslint/*.mjs` scope lists (`pnpm layout:src-references activerecord` lists them).
- `scripts/parity/cast-count.ts:27` `SRC`, `scripts/fixtures-compare/compare.ts`, `scripts/fixtures-inventory/inventory.ts`, `scripts/schema-compare/compare.ts`, `scripts/parity/pipeline/schema/node/dump.ts`.
- Generic resolvers `pnpm layout:src-references` reports in its "generic resolvers" section: `eslint/expected-fixtures.mjs:75,128`, `eslint/rails-callback-invocations.mjs:61`, `eslint/test-fixture-parity.mjs:97`, `packages/ruby-compat/test-setup/class-paths.ts:14`.

## Acceptance criteria

- [ ] Each site above reads `scripts/layout/package-roots.mts` (`libRoot` / `testRoots`) or a pattern covering `{src,lib,test}`; no output change on main.
- [ ] `pnpm layout:src-references activerecord` lists only references the activerecord move PR itself rewrites (test-file paths, docs).
