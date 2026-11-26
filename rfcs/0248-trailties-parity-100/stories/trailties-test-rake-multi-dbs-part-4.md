---
title: "trailties: port the remaining 18 multi_dbs_test.rb tests and their lib gaps"
status: ready
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: null
packages: [trailties]
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10809 ported `schema_cache is loaded on all connection db ...` (`vendor/rails/v8.0.5.2/railties/test/application/rake/multi_dbs_test.rb:892`) and `db:seed uses primary database connection` (`:1043`) from `trailties-test-rake-multi-dbs-part-3` into `packages/trailties/test/application/rake/multi-dbs.test.ts`. The other 18 tests of that story remain, with the failures it records:

1. `db:create and db:drop works on all databases for env`, `db:create:namespace and db:drop:namespace works on specified databases`, `db:setup:namespace works`, and the three `when database_tasks is false ...` tests: `warmSchemaCache` (`packages/trailties/lib/trailties/active-record.ts`) connects at boot and sqlite creates the file; Rails never connects at boot (`activerecord/lib/active_record/railtie.rb:145-185`).
2. The three `... sets the connection back to its original state` tests (`:471`, `:491`, ...): a task appended to `Rakefile.ts` is `Unrecognized command "foo"` through `bin/trails`.
3. Five `db:create and db:drop don't raise errors when loading YAML ...` tests: depend on `database-configuration-reads-config-database-yml` (`railties/lib/rails/application/dummy_config.rb`).
4. `each database can have its own schema_format`, `defaults to ruby schema_format`, `raises an exception for invalid schema formats`: `HashConfig#schema_format` (`activerecord/lib/active_record/database_configurations/hash_config.rb:161-165`) and its callers in `tasks/database_tasks.rb:376-485`, `railties/databases.rake:466-554` are unported.
5. `after schema is loaded test run on the correct connections`: the written `test/models/book.test.ts` is not found by `trails test`.

## Acceptance criteria

- [ ] All 18 tests ported with Rails names into `multi-dbs.test.ts` and passing.
- [ ] Lib fixes for (1), (2), (4) land or are split into their own stories.
- [ ] No `it.skip` without a `PERMANENT-SKIP:` receipt naming a CLAUDE.md section.
