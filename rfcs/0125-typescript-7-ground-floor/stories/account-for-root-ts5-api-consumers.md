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

Found while claiming `flip-build-to-ts7` (2026-09-23). The RFC's consumer list
covers the four **packages** that use the TypeScript API (trails-tsc,
activerecord-cli, activerecord, trailties). It leaves out two consumers at the
repo root. Both resolve the root `package.json`'s `typescript` (`^5.9.3`, line 144),
so the flip's first AC, pinning root `typescript` to a `7.1.0-dev.*` nightly,
breaks both of them.

`typescript@7.1.0-dev.20260920.1`'s `package.json` `exports["."]` is
`./lib/version.cjs`, which exports only the version. The compiler API lives
under `./unstable/{sync,async,ast,...}` and is a different, out-of-process API.
So `import ts from "typescript"` followed by `ts.createProgram(...)` stops
working.

1. **typescript-eslint.** `node_modules/typescript-eslint/package.json` declares
   the peer range `"typescript": ">=4.8.4 <6.0.0"`, and the parser is built on the
   classic in-process API. `eslint.config.mjs:1047-1068` runs a typed-lint block
   (`projectService` + `@typescript-eslint/no-unnecessary-type-assertion`), and
   every `blazetrails/*` rule parses through `@typescript-eslint/parser`. The
   flip's AC requires `pnpm lint`, including the `rails-comparison` rules, to
   behave identically.
2. **`scripts/` parity tooling.** These non-test files all do
   `import ts from "typescript"` and call the classic API:
   `scripts/api-compare/{extract-ts-api,build,build-freshness,lint-calls,lint-deps,lint-detached-jsdoc-tags,report-duck-type-instanceof}.ts`,
   `scripts/test-compare/extract-ts-core.ts`, `scripts/mixin-declaration-drift.ts`,
   `scripts/ruby-compat-leaf.ts` and `scripts/strip-asany.ts`, plus their tests.
   `parity:api`, `parity:api:calls`, `parity:api:calls:args`,
   `parity:api:extra:gate` and `parity:test` all run on them.

Under the flip story's Definition of done, a 5.x resolution for anything other
than `@blazetrails/trails-tsc` does not close the flip. So each of these
consumers has to either move to the TS 7 API or be ratified in the RFC as tooling
that is not shipped DX. The second option is a reviewer decision, not an agent
decision, per RFC open question 1.

## Acceptance criteria

- [ ] The RFC names both consumers and records a decision for each. The options
      are: port to `typescript/unstable/*`, or keep a scoped
      `typescript-5@npm:typescript@5.9.3` alias for dev-only tooling that is
      documented at the declaration.
- [ ] If they are ported: every `scripts/` file listed above imports no 5.x API,
      and `parity:api*` output is byte-identical before and after on `main`.
- [ ] For typescript-eslint, either an upstream release supports TS 7 (cite the
      version), or the RFC ratifies a scoped 5.x resolution for the lint
      toolchain only.
- [ ] `flip-build-to-ts7` lists this story in `deps`.
