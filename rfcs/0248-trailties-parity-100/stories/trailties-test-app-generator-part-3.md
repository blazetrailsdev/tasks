---
title: "trailties: port generators/app_generator_test.rb lines 1121-1678"
status: ready
updated: 2026-11-18
rfc: "0248-trailties-parity-100"
cluster: test-ports
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test -- --package trailties` (2026-11-18, clean build) lists
37 Miss rows for the Rails test files below:

| Rails test file                                                                | Miss |
| ------------------------------------------------------------------------------ | ---: |
| `vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb:1121-1678` |   37 |

The file has 111 Miss in total, split in three line ranges. Its 7 wrong-describe rows belong to `trailties-test-wrong-describe-and-skip-receipts`.

Port each test into the convention TS file (`packages/trailties/test/<path>.test.ts`)
with its Rails name and body. The isolation harness is
`packages/trailties/test/support/isolation/abstract-unit.ts` and the generator
harness is the `Generators::TestCase` port, both landed in RFC 0212. When a
ported test fails, fix `packages/trailties/lib`; never rename or skip the test
to make it pass. A gap that belongs to a ratified CLAUDE.md section gets a
`PERMANENT-SKIP:` line that names the section.

## Acceptance criteria

- [ ] Every listed file shows Miss 0 in `pnpm parity:test -- --package trailties`.
- [ ] No new `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
- [ ] Lib fixes the ported tests need land in the same PR (or are filed with `pnpm tasks new` if over the LOC ceiling).
