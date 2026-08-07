---
title: "Extract shared compare core into @blazetrails/parity-tools workspace package"
status: draft
updated: 2026-08-07
rfc: "0000-parity-tools-consolidation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
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

Create a private workspace package `@blazetrails/parity-tools` at
`scripts/parity-tools/` (mirror `scripts/parity/package.json` — private,
`type: module`, description "shared core for the Rails-comparison tooling:
conventions, manifests, baselines, caching"). Move `conventions.ts` (+
`conventions.test.ts`; `conventions-doc.ts` generator repoints),
`unported-files.ts` (+ `unported-files.test.ts`,
`unported-overmatch.test.ts`), `write-json-manifest.ts` (+ test), and the
externally-consumed slice of `types.ts`. Update all importers across
api-compare, test-compare, schema-compare, rails-find. Move-only: no symbol
renames, no behavior change.

Registration gotchas (each has bitten before):

- New scripts test dir = 3 registrations: vitest config project, ci.yml
  changed-files filter, `UNIT_TESTS_PKGS_RE`. Two workflow regexes enumerate
  `api-compare|test-compare|fixtures-compare|...` dirs and must gain
  `parity-tools`.
- `docs/ruby-ts-conventions.md` is generated from `conventions.ts`; CLAUDE.md
  and CONTRIBUTING reference the path `scripts/api-compare/conventions.ts` —
  update in the same PR.
- Register the package wherever `@blazetrails/parity` is registered
  (pnpm-workspace globs).

## Acceptance criteria

- `@blazetrails/parity-tools` exists; test-compare, schema-compare, and
  rails-find no longer import from `../api-compare/`.
- `pnpm api:compare` and `pnpm test:compare` deltas exactly zero.
- `pnpm api:calls`, `pnpm api:extra` green with no baseline movement.
- Moved unit tests run in CI (vitest project + workflow filter + Unit Tests
  regex all updated).
- `docs/ruby-ts-conventions.md` still regenerates (`pnpm api:conventions`).
