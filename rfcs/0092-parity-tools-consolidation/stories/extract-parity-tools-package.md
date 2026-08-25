---
title: "Extract the shared compare core into @blazetrails/parity as the package heart"
status: done
updated: 2026-08-08
rfc: "0092-parity-tools-consolidation"
cluster: null
packages: []
deps:
  - relocate-parity-pipeline
deps-rfc: []
est-loc: 400
priority: null
pr: 6253
claim: "2026-08-08T18:04:21Z"
assignee: "extract-parity-tools-package"
blocked-by: null
closed-reason: null
---

## Context

Cross-consumed compare modules live inside `scripts/api-compare/` by accident
of history:

- `scripts/test-compare/test-compare.ts:68-69` →
  `../api-compare/unported-files.js`, `../api-compare/conventions.js`
- `scripts/rails-find/core.ts:15` → `ApiManifest` from
  `../api-compare/types.js`
- `scripts/schema-compare/compare.ts:42` →
  `../api-compare/write-json-manifest.js`

Move them into `@blazetrails/parity` (`scripts/parity`, cleared out by the
pipeline-relocation story) as the heart of the package: `conventions.ts` (+
`conventions.test.ts`; the `conventions-doc.ts` generator repoints),
`unported-files.ts` (+ `unported-files.test.ts`,
`unported-overmatch.test.ts`), `write-json-manifest.ts` (+ test), and the
externally-consumed slice of `types.ts`. Update all importers across
api-compare, test-compare, schema-compare, rails-find to import from
`@blazetrails/parity`. Update the package description to "Rails-parity
tooling core: conventions, manifests, baselines, caching (plus the SQL
parity pipeline under pipeline/)". Move-only: no symbol renames, no behavior
change. Decide exports layout (root modules vs `src/` + subpath exports)
matching how other scripts packages resolve under tsx.

Registration gotchas (each has bitten before):

- `scripts/parity` gains unit tests it didn't have at the root — check all
  three registrations: vitest config project, ci.yml changed-files filter,
  `UNIT_TESTS_PKGS_RE`. Two workflow regexes enumerate
  `api-compare|test-compare|fixtures-compare|...` dirs and may need `parity`.
- `docs/ruby-ts-conventions.md` is generated from `conventions.ts`; CLAUDE.md
  and CONTRIBUTING reference the path `scripts/api-compare/conventions.ts` —
  update in the same PR.
- The eslint rule `blazetrails/rails-file-structure-method-order` and
  api-compare internals import `conventions.ts` heavily — the intra-package
  importers move to the package specifier too.

## Acceptance criteria

- test-compare, schema-compare, and rails-find no longer import from
  `../api-compare/`; all shared modules resolve via `@blazetrails/parity`.
- `pnpm parity:api` and `pnpm parity:test` deltas exactly zero.
- `pnpm parity:api:calls`, `pnpm parity:api:extra` green with no baseline movement.
- Moved unit tests run in CI (vitest project + workflow filter + Unit Tests
  regex all verified).
- `docs/ruby-ts-conventions.md` still regenerates (`pnpm parity:api:conventions`).
