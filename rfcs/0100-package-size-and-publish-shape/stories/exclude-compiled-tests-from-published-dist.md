---
title: "Exclude compiled tests from the published dist"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`@blazetrails/activerecord` publishes **748 compiled test files**. Counting
their `.d.ts`, `.js.map` and `.d.ts.map` siblings, `*.test.*` is **15.51 MB of
the package's 28.49 MB unpacked (54%)** across 2,992 of its 6,239 files.
Five of the ten largest emitted `.js` files are tests —
`dist/associations/has-many-associations.test.js` is 259,349 B, second only to
`dist/relation.js`.

Cause: `packages/activerecord/tsconfig.json:8` is `"include": ["src"]` with
`outDir: dist`, and this repo's convention is that tests live beside sources
(CLAUDE.md, "Tests live next to source files as `*.test.ts`"). Everything under
`src` is emitted, and `"files": ["dist", "bin"]`
(`packages/activerecord/package.json:95-98`) publishes all of it.

Rails does not do this: the `activerecord` gem ships `lib/` only; its `test/`
tree exists in the repo and not in the gem.

Measured effect of removing `*.test.*` alone: **28.49 MB → 12.96 MB, 6,239 →
3,244 files**, tarball 5.42 MB → ~3.9 MB. The same defect exists in the other
`@blazetrails` packages and should be fixed by the same mechanism where the
mechanism is shared.

## Acceptance criteria

1. `npm pack --dry-run --json` in `packages/activerecord` reports **no
   `*.test.*` entry**, and `unpackedSize` drops to ≤ 13.5 MB.
2. The mechanism does not remove tests from the vitest run — `pnpm vitest run`
   over a touched file still collects and passes.
3. Consumers of built output still resolve: `activerecord-cli`, `dx-tests`,
   `virtualized-dx-tests`, and the `parity:*` tooling all still run against
   `dist/`. If tests are excluded from emit rather than from the tarball,
   verify nothing under `dist/` imported a `*.test.js` module.
4. Applied to every `packages/*` that emits tests into `dist`, not only
   activerecord.
5. The before/after `unpackedSize`, tarball size and file count are recorded in
   the PR body.
