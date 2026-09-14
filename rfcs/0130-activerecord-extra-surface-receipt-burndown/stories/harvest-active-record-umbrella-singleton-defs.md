---
title: "harvest-active-record-umbrella-singleton-defs"
status: ready
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: ["port-global-executor-concurrency-onto-base"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ruby-api.rb` `scan_umbrella_file` (and its header
comment near `process_file`) harvests only `singleton_class.attr_*` config from
`vendor/rails/activerecord/lib/active_record.rb` and redirects it onto
`ActiveRecord::Base`; every `def self.` in the umbrella is skipped. So the
module methods trails already ports as `Base` statics have no Ruby
counterpart in the manifest and must carry `@noRailsEquivalent` receipts:

- `global_thread_pool_async_query_executor` (`active_record.rb:286`)
- `global_executor_concurrency=` / `global_executor_concurrency` (`:298-308`)
  — ported on `Base` in trails#7739.

Other `def self.` members in the same file: `schema_cache_ignored_table?`
(`:205`), `default_timezone=` (`:218`), `db_warnings_action=` (`:235`),
`permanent_connection_checkout=` (`:314`), `marshalling_format_version` /
`=` (`:463-467`), `eager_load!` (`:499`), `disconnect_all!` (`:510`),
`after_all_transactions_commit` (`:527`), `all_open_transactions` (`:547`).

## Acceptance criteria

- The umbrella scan records `def self.` members of `active_record.rb` onto
  `ActiveRecord::Base`, like the `singleton_class.attr_*` seats.
- The receipts on `Base.globalThreadPoolAsyncQueryExecutor` and
  `Base.globalExecutorConcurrency` (`packages/activerecord/src/base.ts`) are
  deleted, with `pnpm parity:api:extra:gate` green.
- Newly-visible unported members are reported as missing, not receipted.
