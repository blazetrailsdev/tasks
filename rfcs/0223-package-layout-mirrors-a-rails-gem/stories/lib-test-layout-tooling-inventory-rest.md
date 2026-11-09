---
title: "lib-test-layout-tooling-inventory-rest"
status: in-progress
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9918
claim: "2026-11-09T14:35:33Z"
assignee: "lib-test-layout-tooling-inventory-rest"
blocked-by: null
closed-reason: null
---

# Wire the rest of RFC 0223's inventory to scripts/layout/package-roots.ts

## Context

`lib-test-layout-tooling-prep` landed `scripts/layout/package-roots.ts`
(`LIB_TEST_PACKAGES`, `libRoot`, `testRoots`, `sourceRoots`, `ANY_ROOT_GLOB`,
`ANY_ROOT_RE`) and wired `scripts/api-compare/config.ts` (`packageSrcDir`),
`scripts/api-compare/ts-file-walk.ts` (`walkPackageTsFiles`) and
`scripts/test-compare/extract-ts-tests.ts` (`getPackageTestFiles`). Every
other site in the RFC README's "Inventory" section still hard-codes `src`:

- `scripts/test-compare/compare.ts` `PKG_SRC_DIRS` (~line 1716) and
  `extractRelativeTsPath`: a moved test's path is its Rails path, not the
  convention path, so `rubyToConventionTs` needs a `test/` arm.
- `scripts/test-compare/extract-ts-core.ts:89,125-126`, `generate-stubs.ts`
  (must write into `test/`), `assertion-receipts/*.ts` path keys.
- `vitest.config.ts` project `include`s, AR adapter `exclude`s
  (lines ~69-96), alias table (~115-340), `ar-db-forks-default.js` import.
- `.github/workflows/ci.yml` `changes` regexes (`DB_ADAPTER_RE` line ~125,
  `GUIDES_EXCL_RE`, `LINT_ALL_RE`) and the `packages/{actioncable,thor}/src`
  steps.
- `eslint.config.mjs` `src` globs (e.g. lines 544, 997) and the `eslint/*.json`
  scope lists.
- `scripts/parity/*` counters, `import-cycles-mark.json` keys,
  `unported-files/*`, the generators (`thor-build-templates.ts`,
  `mail-parsers/generate.ts`, `generate-tzdata-*.ts`, constants writer,
  `rails-private-methods.generated.ts`), `ci-suite-coverage.test.ts` globs.

`pnpm layout:src-references` lists every remaining literal.

## Acceptance criteria

- [ ] Each site above reads `package-roots.ts` or a glob covering
      `{src,lib,test}`; no output change on main.
- [ ] A throwaway local move of a small package (not committed:
      `git mv src lib` + `pnpm layout:plan-test-moves <pkg> --apply` + add it to
      `LIB_TEST_PACKAGES`) shows `pnpm parity:api`, `parity:test`, every
      ratchet gate, lint and `ci-suite-coverage` unchanged; the PR body
      records the run.
