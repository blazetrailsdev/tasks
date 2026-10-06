---
title: "vitest related without --project dies with EMFILE crawling every project's test files"
status: draft
updated: 2026-10-06
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8564 fixed the `eslint` resolution that broke `vitest related` from
the root `vitest.config.ts` (the `other` project now aliases bare `eslint`,
exact match, to the package entry) and gave trailties its own `trailties`
project, which the thor-only Trailties Tests step in `.github/workflows/ci.yml`
runs with `pnpm vitest related --run --project trailties`.

The unnarrowed command from the original story still does not finish on a host
with a 4096 open-file hard limit:

```text
pnpm vitest related --run packages/trailties/src/thor/actions.ts
Error: EMFILE: too many open files, open '<repo>/tsconfig.json'
```

Related mode transforms every test file its projects include to crawl their
imports, about 2300 files across `activerecord` and `other`, with no
concurrency bound, and vite reads a tsconfig per file. `--project other` fails
the same way; `--project trailties` (146 files) passes. `--dir` does not narrow
the crawl.

## Acceptance criteria

- [ ] `pnpm vitest related --run <any source file>` completes from the root
      config under `ulimit -n 4096`, with no `--project` flag.
- [ ] Whatever bounds the crawl (smaller per-package projects, a vitest
      upgrade, or a tsconfig cache) leaves the set of files each CI step runs
      unchanged; `scripts/ci-suite-coverage.test.ts` stays green.
