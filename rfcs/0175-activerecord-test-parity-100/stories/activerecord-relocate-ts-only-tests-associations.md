---
title: "activerecord: move the 87 TS-only tests in Rails-named associations test files to .trails siblings"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: extra-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 408
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

- `packages/activerecord/src/associations/callbacks.test.ts` — 17
- `packages/activerecord/src/associations/has-many-through-associations.test.ts` — 13
- `packages/activerecord/src/associations/has-one-through-associations.test.ts` — 12
- `packages/activerecord/src/associations/has-one-associations.test.ts` — 11
- `packages/activerecord/src/associations/eager.test.ts` — 10
- `packages/activerecord/src/associations/has-many-associations.test.ts` — 7
- `packages/activerecord/src/associations/join-model.test.ts` — 5
- `packages/activerecord/src/associations/cascaded-eager-loading.test.ts` — 5
- `packages/activerecord/src/associations/extension.test.ts` — 2
- `packages/activerecord/src/associations/required.test.ts` — 2
- `packages/activerecord/src/associations/belongs-to-associations.test.ts` — 1
- `packages/activerecord/src/associations/inverse-associations.test.ts` — 1
- `packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts` — 1

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path → matched to Rails' name/path (never renaming a Rails-named test); (b) a duplicate of a ported Rails test → deleted; or (c) genuinely TS-only → moved to the `.trails.test.ts` sibling unchanged.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
