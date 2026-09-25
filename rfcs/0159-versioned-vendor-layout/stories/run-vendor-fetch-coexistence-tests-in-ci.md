---
title: "Run vendor/fetch.test.ts's coexistence tests in CI"
status: draft
updated: 2026-09-25
rfc: "0159-versioned-vendor-layout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8108 added the RFC 0159 coexistence tests to `vendor/fetch.test.ts`: candidate `--ref` clones beside the active version, `--refresh` scoped to one version, `--prune`, the HEAD-vs-lockfile abort, and `--print-*` answering the active version with a candidate on disk. None of them run in CI. `vendor/fetch.test.ts` is the sole `KNOWN_UNRUN` entry in `scripts/ci-suite-coverage.test.ts:30-35`, and that entry cites story `run-vendor-fetch-tests-in-ci`, which RFC 0028 closed as off-charter. So the entry points at a closed story, and nothing guards the coexistence acceptance criteria.

None of the new tests needs a fetched `vendor/` tree:

- the candidate and lock-abort tests clone a local git upstream in a tmpdir;
- the prune test works over a tmpdir;
- the `--print-*` spawns only print resolved paths.

Whatever made the file "fail outside a freshly fetched vendor/ tree" has to be re-measured before it is assumed.

## Acceptance criteria

- Run `pnpm vitest run vendor/fetch.test.ts` on a checkout with no `vendor/<source>/` clones, and record which tests (if any) need the tree.
- Add `vendor/fetch.test.ts` to the Unit Tests `pnpm vitest run` list in `.github/workflows/ci.yml` (beside `vendor/sources.test.ts`), or add just its tree-free tests if some genuinely need clones.
- Remove the `KNOWN_UNRUN` entry and its stale story citation from `scripts/ci-suite-coverage.test.ts`.
- `vendor/fetch.test.ts` passes in the Unit Tests job.
