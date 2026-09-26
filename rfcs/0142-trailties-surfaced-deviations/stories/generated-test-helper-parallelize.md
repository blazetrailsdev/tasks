---
title: "Generated test helper omits parallelize(workers:): port it or SKIP_GROUPS it"
status: closed
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties", "activesupport"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise resolved by the AC's own second arm, which already holds on origin/main: scripts/parity/conventions.ts:1093-1112 SKIP_GROUPS 'parallelize' / 'parallelize_setup' / 'parallelize_teardown' (test_case.rb) plus the testing/parallelization.rb group, reason 'vitest is the runner in trails: it owns worker parallelism, so none of these has a port to point at'. With parallelize deliberately unported, the generated test/test-helper.ts omitting test_helper.rb.tt:7-11's parallelize line is the recorded consequence, not an open deviation."
---

## Context

`railties/lib/rails/generators/rails/app/templates/test/test_helper.rb.tt:7-11`
emits `parallelize(workers: :number_of_processors)` (or `with: :threads` without
fork). `ActiveSupport::Testing::Parallelization` /
`ActiveSupport::TestCase.parallelize`
(`activesupport/lib/active_support/test_case.rb`,
`activesupport/lib/active_support/testing/parallelization.rb`) has no trails
port, so trails#8098's generated `test/test-helper.ts`
(`packages/trailties/src/generators/app-generator.ts`, `createTestFiles`) omits
the line. vitest already runs test files in parallel workers.

## Acceptance criteria

- Either port `ActiveSupport::TestCase.parallelize` onto vitest's worker model
  (`workers:` → pool size, `after_fork_hook` / `ActiveRecord::TestDatabases`
  per-worker schema) and emit the template line, or record the omission as a
  `SKIP_GROUPS` entry in `scripts/parity/conventions.ts` with its reason.
