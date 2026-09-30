---
title: "activerecord: move the 65 TS-only tests in Rails-named relation test files to .trails siblings"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: extra-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` counts **1007 extra (TS only)** activerecord tests — tests in a Rails-mirroring
convention file that no Rails test consumed. The convention is that a TS-only test lives in the
`.trails.test.ts` sibling, so a Rails-named file holds only Rails' tests and its drift is visible.
This story's files (extras per file):

- `packages/activerecord/src/relation/load-async.test.ts` — 27
- `packages/activerecord/src/relation/predicate-builder.test.ts` — 25
- `packages/activerecord/src/relation/with.test.ts` — 5
- `packages/activerecord/src/relation/merging.test.ts` — 3
- `packages/activerecord/src/relation/mutation.test.ts` — 3
- `packages/activerecord/src/relation/where.test.ts` — 2

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path → matched to Rails' name/path (never renaming a Rails-named test); (b) a duplicate of a ported Rails test → deleted; or (c) genuinely TS-only → moved to the `.trails.test.ts` sibling unchanged.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
