---
title: "activerecord: postgresql/range_test.rb's 46 wrong-describe cases and relations' 1 misplaced case"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: skipped-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` activerecord: **46 wrong describe** — every case in
`adapters/postgresql/range_test.rb` (`vendor/rails/v8.0.2/activerecord/test/cases/adapters/postgresql/range_test.rb`, class `PostgresqlRangeTest`)
is matched by name but sits under a different describe path in `adapters/postgresql/range.test.ts`
(and 40 TS-only extras sit beside them). **1 misplaced** — "find_by! doesn't have implicit ordering" lives
in `relations.trails.test.ts` but its Rails home is `relations_test.rb` → `relations.test.ts`.

## Acceptance criteria

- [ ] `range.test.ts` nests its cases under Rails' class describe path; the 40 extras move to `range.trails.test.ts` or are deleted as duplicates.
- [ ] The misplaced case moves to `relations.test.ts`.
- [ ] `pnpm parity:test` activerecord wrong describe **0**, misplaced **0**.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
