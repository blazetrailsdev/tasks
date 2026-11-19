---
title: "trailties: port railtie, mounted engine and engine/* test misses"
status: ready
updated: 2026-11-18
rfc: "0248-trailties-parity-100"
cluster: test-ports
packages: [trailties]
deps: [trailties-test-move-misplaced-tests]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test -- --package trailties` (2026-11-18, clean build) lists
29 Miss rows for the Rails test files below:

| Rails test file                                                     | Miss |
| ------------------------------------------------------------------- | ---: |
| `vendor/rails/v8.0.2/railties/test/railties/railtie_test.rb`        |   10 |
| `vendor/rails/v8.0.2/railties/test/railties/mounted_engine_test.rb` |    3 |
| `vendor/rails/v8.0.2/railties/test/engine_test.rb`                  |    2 |
| `vendor/rails/v8.0.2/railties/test/engine/commands_test.rb`         |    6 |
| `vendor/rails/v8.0.2/railties/test/engine/test_test.rb`             |    1 |
| `vendor/rails/v8.0.2/railties/test/engine/lazy_route_set_test.rb`   |    7 |

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
