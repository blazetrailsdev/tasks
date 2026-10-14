---
title: "activerecord: AdapterHelper#current_adapter? asks the leased connection, not the test lane"
status: ready
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
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

`AdapterHelper#current_adapter?`
(`vendor/rails/v8.0.2/activerecord/test/support/adapter_helper.rb:4-9`) is
`ActiveRecord::ConnectionAdapters.const_defined?(type) &&
ActiveRecord::Base.lease_connection.is_a?(ActiveRecord::ConnectionAdapters.const_get(type))`.

`currentAdapter` in `packages/activerecord/src/support/adapter-helper.ts`
compares the type against the test lane read from `../test-adapter.js`. That
import reaches `support/connection.ts`, `support/setup-second-pool.ts` and the
canonical test models. trails#8875 included `AdapterHelper` into
`ActiveRecord::TestCase` (`cases/test-case.ts`), which `namespaces.ts` and
`test-fixtures.ts` import by type, so the library's type graph now reaches
those test-only modules. It reddened the Virtualized DX Type Tests job once
(`models/college.ts`, fixed there by declaring the association type).

## Acceptance criteria

- [ ] `currentAdapter` asks the leased connection, as Rails does, and
      `adapter-helper.ts` no longer imports `test-adapter.js`.
- [ ] No test model is in the virtualized DX program by way of
      `cases/test-case.ts`.
