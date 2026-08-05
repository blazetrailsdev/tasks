---
title: "corelib-package-scaffold"
status: draft
updated: 2026-08-05
rfc: "0088-corelib-package"
cluster: null
deps: ["vendor-ruby-date-gem"]
deps-rfc: []
est-loc: 200
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Creates `packages/corelib` as a workspace package so the move stories have a
destination. No ported code lands here — this story is registration only.

`scripts/api-compare/config.ts:101` `apiComparePackageRoots()` derives extraction
roots from the package name (with optional `PACKAGE_DIR_OVERRIDES` /
`PACKAGE_SRC_SUBDIR`), so `corelib` needs a `PACKAGES` entry and nothing bespoke.
`packages/did-you-mean` is the working template for a non-Rails vendored package.

**`corelib` takes sole ownership of `@js-temporal/polyfill`.** Today it is
declared twice — `packages/i18n/package.json:26` and
`packages/activesupport/package.json:98` — and only 3 files import it directly
(`activesupport/src/temporal.ts`, `i18n/src/date.ts`, `i18n/src/time.ts`), the
latter two bypassing the chokepoint the other **70** call sites use
(`@blazetrails/activesupport/temporal`).

This matters beyond tidiness. The codebase identifies Temporal values by
`instanceof` throughout — `activemodel/src/type/date.ts:34`,
`type/date-time.ts:226`,
`activerecord/src/connection-adapters/abstract/quoting.ts:155-158`. `instanceof`
is identity-sensitive across module instances, so two polyfill copies make
`value instanceof Temporal.PlainDate` return `false` for a valid value, and the
quoting guard then falls through to `throw new TypeError("can't quote …")` —
silent and painful to diagnose. Both specs are `^0.5.1` and pnpm currently
dedupes them to one store path, so this works **by version coincidence, not by
design**.

## Acceptance criteria

- [ ] `packages/corelib/` with `package.json` (`@blazetrails/corelib`),
      `tsconfig.json`, `src/index.ts`, matching `packages/did-you-mean`'s shape.
- [ ] `@js-temporal/polyfill` declared **only** in `packages/corelib/package.json`;
      removed from `packages/i18n/package.json:26` and
      `packages/activesupport/package.json:98`.
- [ ] `corelib` re-exports `Temporal`; `activesupport/src/temporal.ts` becomes a
      re-export from `@blazetrails/corelib`, so **all 70
      `@blazetrails/activesupport/temporal` import sites stay untouched**.
- [ ] `instantFrom(date: Date)` **stays** in `activesupport/src/temporal.ts` —
      it is a JS-Date interop helper and `corelib` has no opinion about JS `Date`.
- [ ] `corelib` added to `PACKAGES` in `scripts/api-compare/config.ts`.
- [ ] **Registration checklist — a partial job reds a CI lane `pnpm typecheck`
      cannot see.** A new cross-package subpath needs the vitest alias **and both**
      dx-test tsconfigs; a new `scripts/` test dir needs `vitest.config` +
      `ci.yml` filter + `UNIT_TESTS_PKGS_RE`. Enumerate and verify each.
- [ ] `pnpm typecheck` and `pnpm build` green.
