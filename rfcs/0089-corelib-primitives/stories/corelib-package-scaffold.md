---
title: "corelib-package-scaffold"
status: closed
updated: 2026-08-31
rfc: "0089-corelib-primitives"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by 0129-ruby-compat/ruby-compat-package-skeleton (done, PR 7230)"
---

## Context

Creates `packages/corelib` as a workspace package so the move stories have a
destination. No ported code lands here — registration only.

`scripts/api-compare/config.ts:101` `apiComparePackageRoots()` derives extraction
roots from the package name, so `corelib` needs a `PACKAGES` entry and nothing
bespoke.

**`corelib` does NOT own `@js-temporal/polyfill`** — that belongs to
`packages/date` (RFC `0088-date-gem-port`). `corelib` has no temporal surface:
`range-ext.ts`'s comparators are `number`/`Date`-based today and its Temporal
story is RFC 0023's `unify-three-range-value-shapes`, not this package's
scaffold.

**`corelib` never enrolls in `parity:api`.** There is no vendorable source for
`range.c`/`string.c`/`eval.c`. Its only anchor is `ruby/spec` behavior, via
`parity:test`. Do not add it to any `parity:api` population.

## Acceptance criteria

- [ ] `packages/corelib/` with `package.json` (`@blazetrails/corelib`),
      `tsconfig.json`, `src/index.ts`, matching `packages/did-you-mean`'s shape.
- [ ] **No `@js-temporal/polyfill` dependency.**
- [ ] `corelib` **not** added to `parity:api`'s `PACKAGES`; a comment at the
      registration site records that this is permanent, not pending.
- [ ] **Registration checklist — a partial job reds a CI lane `pnpm typecheck`
      cannot see.** A new cross-package subpath needs the vitest alias **and
      both** dx-test tsconfigs; a new `scripts/` test dir needs `vitest.config` + `ci.yml` filter + `UNIT_TESTS_PKGS_RE`. Enumerate and verify each.
- [ ] `pnpm typecheck` and `pnpm build` green.
