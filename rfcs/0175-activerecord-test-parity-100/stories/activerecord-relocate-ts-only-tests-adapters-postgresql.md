---
title: "activerecord: move the 34 TS-only tests in eight Rails-named adapters-postgresql test files to .trails siblings"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: extra-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 700
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

- `packages/activerecord/src/adapters/postgresql/timestamp.test.ts` — 13
- `packages/activerecord/src/adapters/postgresql/change-schema.test.ts` — 6
- `packages/activerecord/src/adapters/postgresql/quoting.test.ts` — 5
- `packages/activerecord/src/adapters/postgresql/rename-table.test.ts` — 3
- `packages/activerecord/src/adapters/postgresql/integer.test.ts` — 3
- `packages/activerecord/src/adapters/postgresql/utils.test.ts` — 2
- `packages/activerecord/src/adapters/postgresql/virtual-column.test.ts` — 1
- `packages/activerecord/src/adapters/postgresql/full-text.test.ts` — 1

The other nine files the story first listed are split out, because a move costs each line twice and
the full set is about 1,700 LOC: `geometric.test.ts` is
`activerecord-relocate-ts-only-tests-postgresql-geometric`, and `schema`, `connection`, `explain`,
`extension-migration`, `array`, `referential-integrity` and `infinity` are
`activerecord-relocate-ts-only-tests-postgresql-remaining-seven-files`. `xml.test.ts` already
reports 0 extra.

## Acceptance criteria

- [ ] Each extra is (a) a Rails test under a drifted name or describe path → matched to Rails' name/path (never renaming a Rails-named test); (b) a duplicate of a ported Rails test → deleted; or (c) genuinely TS-only → moved to the `.trails.test.ts` sibling unchanged.
- [ ] The files above report 0 extra in `pnpm parity:test`.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
