---
title: "trailties-move-tests-rest"
status: closed
updated: 2026-11-06
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "FALSIFIED: duplicate of trailties-move-tests-remaining, which stays open (PR 9776 moved nothing in the end)"
---

## Context

`trailties-move-tests-remaining` moved `generators/trails/generator/generator-generator.test.ts` to `generators/generator-generator.test.ts` (assertions already matched `generator_generator_test.rb`). `pnpm parity:test --package trailties --misplaced` lists the rest (157):

- `generators/trails/{scaffold,scaffold-controller,controller,resource}/*` to `generators/*-generator.test.ts`
- `code-statistics` to `code-statistics-calculator`; `trailtie` to `trailties/trailtie` (describe `RailtieTest`)
- `engine` / parts of `application` to `trailties/engine` and `application/configuration`
- `commands/db/system/change/change-command` to `commands/db-system-change`; `generators/trails/db/system/change/change-generator` to `generators/db-system-change-generator`
- `rack/logger` to `rack-logger` (`vendor/rails/v8.0.2/railties/test/rack_logger_test.rb`: `assert_difference`, `flush_count`)
- `commands/db` to `application/rake/multi-dbs`; `application/reload-zeitwerk.trails` to `application/loading`; `trailties/active-record.trails` to `application/query-logs`; `application/active-job-trailtie` to `application/active-job-railtie`
- `generators/trails/benchmark/benchmark-generator` to `generators/benchmark-generator`: moving it reds the assertion count; `vendor/rails/v8.0.2/railties/test/generators/benchmark_generator_test.rb` asserts the Gemfile's `gem "benchmark-ips"` line and whole-file output, so the generator itself converges first.

## Acceptance criteria

- Each file moves with its body converged on the Rails test, assertion ratchet green, names unchanged.
- `pnpm parity:test --package trailties` reports 0 misplaced.
