---
title: "converge-connection-handler-invalid-adapter-test-onto-rails"
status: done
updated: 2026-07-31
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5717
claim: "2026-07-31T16:06:05Z"
assignee: "converge-connection-handler-invalid-adapter-test-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

`test_validates_db_configuration_and_raises_on_invalid_adapter`
(`vendor/rails/activerecord/test/cases/connection_adapters/connection_handler_test.rb:66-78`)
installs `{ "development" => { "adapter" => "ridiculous" } }` as
`ActiveRecord::Base.configurations`, calls
`ActiveRecord::Base.establish_connection(:development)`, and asserts
`ActiveRecord::AdapterNotFound` is raised — i.e. the config HAS an adapter
key, and the failure is that the named adapter does not resolve.

trails' port
(`packages/activerecord/src/connection-adapters/connection-handler.test.ts`,
`it("validates db configuration and raises on invalid adapter")`) instead
calls `handler.establishConnection({ database: "test/db/primary.sqlite3" })`
with NO adapter key at all and asserts `/does not specify adapter/`. That
exercises the missing-adapter branch, not the unresolvable-adapter branch, so
the test does not cover what its name (and Rails) says it covers:
`AdapterNotFound` could regress undetected.

Surfaced during review of PR #5715 (config-literal convergence for this
file); explicitly out of scope there, which was a pure literal substitution.

## Acceptance criteria

- The test drives the Rails path: a configurations registry holding
  `{ development: { adapter: "ridiculous" } }`, established by name, asserting
  the trails analogue of `ActiveRecord::AdapterNotFound`.
- Verify trails actually raises an `AdapterNotFound`-equivalent for an
  unresolvable adapter name; if it does not, that is the implementation bug to
  fix (the test is the regression cover).
- Test name unchanged. Configurations registry restored in a `finally` so the
  suite leaves `git status` clean and no sibling test sees the stub config.
- `parity:test` for `connection_handler_test.rb` stays at 22/22.
