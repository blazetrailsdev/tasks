---
title: "activerecord: move the 32 TS-only tests in connection-handling.test.ts's ConnectionHandlingTest describe to its .trails sibling"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
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

`packages/activerecord/src/connection-handling.test.ts` holds 43 extras against the 10 tests of
`vendor/rails/v8.0.2/activerecord/test/cases/connection_handling_test.rb`. The ten Rails tests are the first ten
`it`s of the `ConnectionHandlingTest` describe (`connection-handling.test.ts:46-207`). This story takes the 32
TS-only tests that follow them in the same describe, `connected_to switches role for block` (`:209`) through
`establishConnection raises AdapterNotSpecified for an adapter-less HashConfig` (`:543-567`), about 360 lines.
`connection-handling.trails.test.ts` already exists and receives them, with the setup the describe shares
(`:21-44`).

Split out of `activerecord-relocate-ts-only-tests-root-part-1`, whose six files moved far more lines than its
650 LOC estimate (a moved test counts once as a deletion and once as an addition). That story shipped
`relation.test.ts`, `attributes.test.ts` and the five TS-only tests of `relations.test.ts`.

`pnpm parity:test` has no flag that lists a file's extras. To list them, print the unconsumed entries of `tsTests`
next to `const extra = tsTests.length - consumedTs.size` in `scripts/test-compare/compare.ts` locally (do not
commit it).

`eslint/no-explicit-any-test-exclude.json` exempts the Rails-named file but not a new `.trails.test.ts`
sibling, and that list is only-shrink: remove each `as any` in a moved test instead of adding a row.

## Acceptance criteria

- [ ] Each of the 32 tests is (a) a Rails test under a drifted name, matched to the Rails name and file (check `connection_handlers_multi_db_test.rb`, `connection_handlers_sharding_db_test.rb` and `connection_swapping_nested_test.rb` under `vendor/rails/v8.0.2/activerecord/test/cases/connection_adapters/`), (b) a duplicate of a ported Rails test, deleted, or (c) TS-only, moved to `connection-handling.trails.test.ts`.
- [ ] The `ConnectionHandlingTest` describe in `connection-handling.test.ts` holds only the ten Rails tests.

## Verification

```bash
pnpm parity:test --package activerecord --sort-extra --min-extra=1
```
