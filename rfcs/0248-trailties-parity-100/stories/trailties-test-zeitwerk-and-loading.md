---
title: "trailties: port zeitwerk integration, checker, inflector and loading tests"
status: in-progress
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: test-ports
packages: [trailties]
deps: [trailties-test-move-misplaced-tests]
deps-rfc: []
est-loc: 480
priority: null
pr: trails#10684
claim: "2026-11-24T00:09:48Z"
assignee: "rails-8-0-5-2-trailties"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test -- --package trailties` (2026-11-18, clean build) lists
47 Miss rows for the Rails test files below:

| Rails test file                                                              | Miss |
| ---------------------------------------------------------------------------- | ---: |
| `vendor/rails/v8.0.2/railties/test/application/zeitwerk_integration_test.rb` |   20 |
| `vendor/rails/v8.0.2/railties/test/application/zeitwerk_checker_test.rb`     |    6 |
| `vendor/rails/v8.0.2/railties/test/application/zeitwerk_inflector_test.rb`   |    2 |
| `vendor/rails/v8.0.2/railties/test/application/loading_test.rb`              |   19 |

Cite `## The application loader is Zeitwerk` (root and package CLAUDE.md) for any reload mechanics that differ.

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
