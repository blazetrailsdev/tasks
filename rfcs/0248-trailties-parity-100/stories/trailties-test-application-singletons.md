---
title: "trailties: port the one- and two-test application/* files"
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
33 Miss rows for the Rails test files below:

| Rails test file                                                                            | Miss |
| ------------------------------------------------------------------------------------------ | ---: |
| `vendor/rails/v8.0.2/railties/test/backtrace_cleaner_test.rb`                              |    2 |
| `vendor/rails/v8.0.2/railties/test/application/backtrace_cleaner_test.rb`                  |    4 |
| `vendor/rails/v8.0.2/railties/test/application/system_test_case_test.rb`                   |    3 |
| `vendor/rails/v8.0.2/railties/test/application/active_job_adapter_test.rb`                 |    3 |
| `vendor/rails/v8.0.2/railties/test/application/watcher_test.rb`                            |    2 |
| `vendor/rails/v8.0.2/railties/test/application/url_generation_test.rb`                     |    2 |
| `vendor/rails/v8.0.2/railties/test/application/rendering_test.rb`                          |    2 |
| `vendor/rails/v8.0.2/railties/test/application/per_request_digest_cache_test.rb`           |    2 |
| `vendor/rails/v8.0.2/railties/test/application/integration_test_case_test.rb`              |    2 |
| `vendor/rails/v8.0.2/railties/test/application/current_attributes_integration_test.rb`     |    2 |
| `vendor/rails/v8.0.2/railties/test/application/bin_setup_test.rb`                          |    2 |
| `vendor/rails/v8.0.2/railties/test/application/view_reloading_test.rb`                     |    1 |
| `vendor/rails/v8.0.2/railties/test/application/mailer_previews_test.rb`                    |    1 |
| `vendor/rails/v8.0.2/railties/test/application/active_storage/validating_service_test.rb`  |    1 |
| `vendor/rails/v8.0.2/railties/test/application/active_storage/uploads_integration_test.rb` |    1 |
| `vendor/rails/v8.0.2/railties/test/application/action_view_test_integration_case_test.rb`  |    1 |
| `vendor/rails/v8.0.2/railties/test/path_generation_test.rb`                                |    1 |
| `vendor/rails/v8.0.2/railties/test/json_params_parsing_test.rb`                            |    1 |

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
