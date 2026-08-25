---
title: "Relocate the 6 misplaced migration test cases to their Rails-matching files"
status: done
updated: 2026-07-29
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5547
claim: "2026-07-28T23:05:45Z"
assignee: "relocate-misplaced-migration-cases"
blocked-by: null
closed-reason: null
---

## Context

Unskipping `vendor/rails/activerecord/test/cases/migration/` in `parity:test`
(PR #5451) made that directory's Rails files visible for the first time. Six
already-ported cases now report as **misplaced** — they live in a TS file whose
Rails counterpart is a different file:

```text
connection-adapters/postgresql/schema-statements.test.ts  ->  migration/columns.test.ts             (1)
adapters/postgresql/change-schema.test.ts                 ->  migration/columns.test.ts             (1)
connection-adapters/postgresql/schema-statements.test.ts  ->  migration/unique-constraint.test.ts   (1)
connection-adapters/postgresql/schema-statements.test.ts  ->  migration/exclusion-constraint.test.ts (1)
adapters/postgresql/change-schema.test.ts                 ->  migration/change-schema.test.ts       (1)
adapters/postgresql/rename-table.test.ts                  ->  migration/rename-table.test.ts        (1)
```

Reproduce with `pnpm parity:test --package activerecord` (the "MISPLACED"
section); the destination file for each is named in the arrow target.

Each case belongs in `packages/activerecord/src/migration/<file>.test.ts`
mirroring its Rails home in `vendor/rails/activerecord/test/cases/migration/`.
Three of the six destinations already exist (`unique-constraint.test.ts`,
`exclusion-constraint.test.ts`); `columns.test.ts`, `change-schema.test.ts`,
`rename-table.test.ts` do not and would be created by their respective port
stories, so this may be cheapest to do after or alongside those.

## Acceptance criteria

- [ ] Each of the six cases is moved to the TS file matching its Rails file,
      under the Rails ancestor describe path (`Migration > <ClassName>`), with
      the test name unchanged.
- [ ] `pnpm parity:test --package activerecord` reports 0 misplaced for
      activerecord (currently 6).
- [ ] The moved tests still pass on the postgres lane; no gate-mismatch
      regression (`--gates --check` stays green).
