---
title: "trailties: port devcontainer generator and command tests"
status: ready
updated: 2026-11-19
rfc: "0248-trailties-parity-100"
cluster: test-ports
packages: [trailties]
deps:
  - trailties-gemfile-to-package-json-mapping
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test -- --package trailties` (2026-11-18, clean build) lists
25 Miss rows for the Rails test files below:

| Rails test file                                                               | Miss |
| ----------------------------------------------------------------------------- | ---: |
| `vendor/rails/v8.0.2/railties/test/generators/devcontainer_generator_test.rb` |   22 |
| `vendor/rails/v8.0.2/railties/test/commands/devcontainer_test.rb`             |    3 |

Port each test into the convention TS file (`packages/trailties/test/<path>.test.ts`)
with its Rails name and body. The isolation harness is
`packages/trailties/test/support/isolation/abstract-unit.ts` and the generator
harness is the `Generators::TestCase` port, both landed in RFC 0212. When a
ported test fails, fix `packages/trailties/lib`; never rename or skip the test
to make it pass. A gap that belongs to a ratified CLAUDE.md section gets a
`PERMANENT-SKIP:` line that names the section.

The tests assert a Ruby base image, the `ruby_version` arg and the "solid
gems". Port them through `trailties-gemfile-to-package-json-mapping`'s
section (operator ruling 2026-11-19): the image is
`mcr.microsoft.com/devcontainers/javascript-node` with `NODE_VERSION` from
`.node-version`, as `lib/generators/trails/devcontainer/templates/devcontainer/Dockerfile.tt`
already writes, and the solid gems are `@blazetrails/solid-queue`,
`solid-cache` and `solid-cable`.

## Acceptance criteria

- [ ] Every listed file (or, for a `file:a-b` row, every Rails test whose `test` line is in that range) is matched, with no Miss left in `pnpm parity:test -- --package trailties`.
- [ ] Each Ruby-image, Ruby-feature or solid-gem assertion asserts its mapped
      Node value; none is skipped on the grounds that the Rails value is Ruby.
- [ ] No new `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
- [ ] Lib fixes the ported tests need land in the same PR (or are filed with `pnpm tasks new` if over the LOC ceiling).
