---
title: "Account for the root-level TS 5.x API consumers: typescript-eslint and scripts/ parity tooling"
status: draft
updated: 2026-09-23
rfc: "0125-typescript-7-ground-floor"
cluster: build-infra
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while claiming `flip-build-to-ts7` (2026-09-23). The RFC's consumer survey
counted the four **packages** that use the TypeScript API: trails-tsc,
activerecord-cli, activerecord and trailties. It missed four more consumers,
and each of them resolves the root `package.json`'s `typescript` (`^5.9.3`).
Pinning that root `typescript` to a `7.1.0-dev.*` nightly is the flip's first AC,
and it breaks all four.

In `typescript@7.1.0-dev.20260920.1`, `exports["."]` is `./lib/version.cjs`,
which exports only the version. The compiler API lives under
`./unstable/{sync,async,ast,...}` and is a different, out-of-process API. So
`import ts from "typescript"` followed by `ts.createProgram(...)` stops working.

1. **typescript-eslint.** The peer range is `"typescript": ">=4.8.4 <6.1.0"` on
   `latest` 8.70.1, and `canary` 8.70.2-alpha.5 has the same range (`npm view`,
   2026-09-23). `eslint.config.mjs:1047-1068` runs a typed-lint block
   (`projectService` + `@typescript-eslint/no-unnecessary-type-assertion`), and
   every `blazetrails/*` rule parses through `@typescript-eslint/parser`.
2. **typedoc** (`packages/website`, `"private": true`). The peer range is
   `5.0.x || … || 5.9.x || 6.0.x` on `latest` 0.28.18. It runs in
   `docs:typedoc`, which `docs:build` calls.
3. **`scripts/` parity tooling.** 11 non-test files, 10,420 lines, all using
   `import ts from "typescript"`:
   `scripts/api-compare/{extract-ts-api,build,build-freshness,lint-calls,lint-deps,lint-detached-jsdoc-tags,report-duck-type-instanceof}.ts`,
   `scripts/test-compare/extract-ts-core.ts`, `scripts/mixin-declaration-drift.ts`,
   `scripts/ruby-compat-leaf.ts` and `scripts/strip-asany.ts`, plus their tests.
   `build-freshness.ts:203` needs `createSolutionBuilder`, which has no TS 7
   equivalent. `parity:api*` and `parity:test` all run on these files.
4. **`packages/activesupport/src/dependencies/autoload.trails.test.ts`.** Uses
   `transpileModule`, `createSourceFile` and two node guards. 7.1 covers all of
   them (`trailties/src/template-builder/testing.ts:10`,
   `activerecord/src/type-virtualization/ts-api.ts`).

`ts-morph` is also a root devDependency, but nothing in the tree imports it.

Under the flip's Definition of done, a 5.x resolution for anything other than
`@blazetrails/trails-tsc` does not close the flip. So each consumer has to
either move to the TS 7 API or be ratified in the RFC as tooling outside the
shipped DX. Ratifying is a reviewer decision, per RFC open question 1, and
merging this story's PR is that decision.

## Acceptance criteria

- [ ] The RFC names all four consumers, with evidence for each, and records a
      decision for each. The options are to port to `typescript/unstable/*`, or
      to keep a scoped `typescript-5@npm:typescript@5.9.3` alias for dev-only
      tooling that is documented at the declaration.
- [ ] A consumer that can be ported (the activesupport test) is assigned to
      `flip-build-to-ts7` as a port, not given the alias.
- [ ] For typescript-eslint and typedoc, the RFC cites the upstream peer range
      that blocks them, and `recheck-ts7-api-surface` re-checks it at 7.1 stable.
- [ ] `flip-build-to-ts7` lists this story in `deps`, and its 5.x AC, Definition
      of done and Verification allow exactly the ratified alias and nothing more.
