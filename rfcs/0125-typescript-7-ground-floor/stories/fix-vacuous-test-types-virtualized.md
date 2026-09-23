---
title: "fix-vacuous-test-types-virtualized"
status: draft
updated: 2026-09-23
rfc: "0125-typescript-7-ground-floor"
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

`pnpm test:types:virtualized` (root `package.json:23`, CI job `virtualized-dx-type-tests`, `.github/workflows/ci.yml:723-736`) runs

    tsc -b packages/activerecord-cli && node packages/activerecord-cli/dist/tsc-wrapper/cli.js -p packages/activerecord/virtualized-dx-tests/tsconfig.json

but `packages/activerecord-cli/src/tsc-wrapper/cli.ts` only _exports_ `main()` and never calls it. The entry that calls it is `packages/activerecord-cli/bin/trails-tsc.js`. So the script always exits 0, and the CI job has never type-checked the virtualized DX tests.

Running the real bin on main (b040d60164) and on trails#8003 gives the same two errors, hidden by the vacuous script:

    packages/activerecord/virtualized-dx-tests/virtualized-patterns.test-d.ts(7,3): error TS2724: '"@blazetrails/activerecord"' has no exported member named 'association'. Did you mean 'Associations'?
    packages/activerecord/virtualized-dx-tests/virtualized-patterns.test-d.ts(8,3): error TS2305: Module '"@blazetrails/activerecord"' has no exported member 'defineEnum'.

Found while verifying `port-type-virtualization-to-ts7-api` (trails#8003).

## Acceptance criteria

- [ ] `test:types:virtualized` invokes `packages/activerecord-cli/bin/trails-tsc.js` (or otherwise actually runs `main()`), so a type error in `virtualized-dx-tests` fails the script.
- [ ] The two errors above are fixed in `virtualized-patterns.test-d.ts` (import the names from where they actually live now, or drop the stale imports), so the job goes green for real.
- [ ] A deliberately introduced type error in `virtualized-dx-tests` makes `pnpm test:types:virtualized` exit non-zero (checked locally, noted in the PR).
