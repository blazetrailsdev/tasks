---
title: "activerecord: PostgreSQLAdapter's string-config constructor parses the URL itself instead of ConnectionUrlResolver"
status: closed
updated: 2026-10-11
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8745
claim: "2026-10-11T18:09:35Z"
assignee: "mysql2-client-takes-the-gem-layout-initialize-flags-statement-result-error"
blocked-by: null
closed-reason: 'Delivered by trails#8745 (54b00554f9): on origin/main @ 11d3346c83 PostgreSQLAdapter''s constructor (connection-adapters/postgresql-adapter.ts:497-520) has no string-config arm, builds conn params from this._config as postgresql_adapter.rb does, and git grep finds neither ''typeof config === "string"'' nor ''new URL('' in the file.'
---

## Context

Surfaced by trails#8751. Rails' `new_client` reads `conn_params[:dbname]`, `[:user]` and `[:host]`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:57-71`), and an adapter is
always built from a config hash: a URL is resolved into one by `DatabaseConfigurations::ConnectionUrlResolver`
(`activerecord/lib/active_record/database_configurations/connection_url_resolver.rb`) before the adapter sees it.

`PostgreSQLAdapter`'s constructor also accepts a bare connection string
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`, the `typeof config === "string"` arm), an overload
Rails does not have. So that `newClient` can read the three keys, the arm parses the string with `new URL` inside a
`try { … } catch {}` and copies `database`, `user` and `host` into `_connectionParameters`; a keyword/value conninfo string
or a malformed escape leaves them unset. That parse is invented surface next to the resolver that already does the job.

## Acceptance criteria

- [ ] The string-config arm is gone, or builds its conn params through `ConnectionUrlResolver`, with no hand-written URL
      parse and no empty `catch` in the constructor.
- [ ] Callers that pass a string (`PostgreSQLAdapter.databaseExists(url)`, the PG test helper's `new PostgreSQLAdapter(PG_TEST_URL)`)
      pass a resolved config hash.
- [ ] `adapters/postgresql/**` stays green on the PostgreSQL lane.
