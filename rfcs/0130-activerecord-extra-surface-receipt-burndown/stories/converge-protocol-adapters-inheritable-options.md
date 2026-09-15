---
title: "Converge ActiveRecord.protocol_adapters onto ActiveSupport::InheritableOptions"
status: draft
updated: 2026-09-15
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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

`ActiveRecord.protocol_adapters` is `ActiveSupport::InheritableOptions.new({ sqlite: "sqlite3", mysql: "mysql2", postgres: "postgresql" })` in `vendor/rails/activerecord/lib/active_record.rb:490-497`, so callers write `ActiveRecord.protocol_adapters.mysql = "mysql2"` (doc comment `:486`).

trails' seat (`packages/activerecord/src/active-record.ts`, `_protocolAdapters`, moved there in #7788) is a plain `Record<string, string>`, read by `database-configurations/connection-url-resolver.ts` as `protocolAdapters()[scheme]`.

## Acceptance criteria

- `_protocolAdapters` is `new InheritableOptions({...})` from `@blazetrails/activesupport`, and `protocolAdapters()` / `setProtocolAdapters()` are typed to match.
- `ConnectionUrlResolver` reads the scheme through the InheritableOptions reader, as Rails' `connection_url_resolver.rb` does.
- Tests that mutate it (`merge-and-resolve-default-url-config.test.ts`, `connection-url-resolver.trails.test.ts`) keep passing.
