---
title: "trailties: port application/configuration_test.rb lines 1460-2032"
status: ready
updated: 2026-11-18
rfc: "0248-trailties-parity-100"
cluster: test-ports
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 480
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test -- --package trailties` (2026-11-18, clean build) lists
44 Miss rows for the Rails test files below:

| Rails test file                                                                 | Miss |
| ------------------------------------------------------------------------------- | ---: |
| `vendor/rails/v8.0.2/railties/test/application/configuration_test.rb:1460-2032` |   44 |

The file has 349 Miss in total, split into eight line ranges of about 44 Miss each (counted from `parity:test --missing` against each `test "…"` line; the 11 `autoload_lib`/`autoload_lib_once` loop tests at `:2252-2310` belong to part 4). This story owns the tests whose `test "…"` line falls in 1460-2032. The 6 misplaced configuration tests (in `application.test.ts`) move in `trailties-test-move-misplaced-tests`.

Port each test into the convention TS file (`packages/trailties/test/<path>.test.ts`)
with its Rails name and body. The isolation harness is
`packages/trailties/test/support/isolation/abstract-unit.ts` and the generator
harness is the `Generators::TestCase` port, both landed in RFC 0212. When a
ported test fails, fix `packages/trailties/lib`; never rename or skip the test
to make it pass. A gap that belongs to a ratified CLAUDE.md section gets a
`PERMANENT-SKIP:` line that names the section.

## Acceptance criteria

- [ ] Every listed file (or, for a `file:a-b` row, every Rails test whose `test` line is in that range) is matched, with no Miss left in `pnpm parity:test -- --package trailties`.
- [ ] No new `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
- [ ] Lib fixes the ported tests need land in the same PR (or are filed with `pnpm tasks new` if over the LOC ceiling).
