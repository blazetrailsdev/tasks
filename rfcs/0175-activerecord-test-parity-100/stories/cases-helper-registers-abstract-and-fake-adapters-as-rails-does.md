---
title: "cases/helper registers the abstract and fake adapters as helper.rb:45-46 does"
status: draft
updated: 2026-10-07
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' test helper registers two adapters for the whole suite
(`vendor/rails/v8.0.2/activerecord/test/cases/helper.rb:45-46`):

    ActiveRecord::ConnectionAdapters.register("abstract", "ActiveRecord::ConnectionAdapters::AbstractAdapter", "active_record/connection_adapters/abstract_adapter")
    ActiveRecord::ConnectionAdapters.register("fake", "FakeActiveRecordAdapter", File.expand_path("../support/fake_adapter.rb", __dir__))

trails' `packages/activerecord/src/cases/helper.ts` calls
`registerFakeAdapter()`, a wrapper in `support/fake-adapter.ts` Rails does not
have, which registers the path `"./support/fake-adapter.js"`. It does not
register `"abstract"`: `database-configurations/hash-config.test.ts` does that
itself at module scope. So the list of available adapters in an
`AdapterNotFound` message has no `abstract`, where Rails'
`test/cases/database_configurations/resolver_test.rb:19` asserts
`abstract, fake, mysql2, postgresql, sqlite3, trilogy`, and
`resolver.test.ts` matches the list with `.+`.

Since trails#8625 `register` has Rails' three parameters, so both lines port
as written.

## Acceptance criteria

- [ ] `cases/helper.ts` makes the two `register` calls of `helper.rb:45-46`,
      the fake adapter by an expanded path, and `registerFakeAdapter` is
      deleted.
- [ ] `hash-config.test.ts` no longer registers `"abstract"` itself.
- [ ] `resolver.test.ts` "url invalid adapter" asserts the adapter list
      literally.
