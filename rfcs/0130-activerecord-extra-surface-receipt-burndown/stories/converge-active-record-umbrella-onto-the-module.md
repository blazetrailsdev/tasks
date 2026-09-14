---
title: "converge-active-record-umbrella-onto-the-module"
status: draft
updated: 2026-09-14
rfc: "0130-activerecord-extra-surface-receipt-burndown"
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
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/active_record.rb` declares its configuration and helpers on the
`ActiveRecord` module itself: 35 `singleton_class.attr_*` seats and the `def self.` methods
`schema_cache_ignored_table?` (`:205`), `default_timezone=` (`:218`), `db_warnings_action=` (`:235`),
`global_thread_pool_async_query_executor` (`:286`), `global_executor_concurrency=` / `global_executor_concurrency`
(`:298-308`), `permanent_connection_checkout=` (`:314`), `marshalling_format_version` / `=` (`:463-467`),
`eager_load!` (`:499`), `disconnect_all!` (`:510`), `after_all_transactions_commit` (`:527`),
`all_open_transactions` (`:547`).

trails flattens the seats onto `ActiveRecord::Base`: `scan_umbrella_file` / `umbrella_base_redirect` in
`scripts/api-compare/extract-ruby-api.rb` record them on `<Module>::Base`, tagged `umbrellaConfig`. They are
ported as `static` accessor pairs in `packages/activerecord/src/base.ts` and read through `_Base!.<seat>`
(56 readers), and CLAUDE.md § "Call-time constant resolution" states that flattening as the rule. The
`def self.` methods are skipped entirely (`process_def` / `process_defs` return early in an umbrella scan). As
a result, `disconnectAllBang` in `packages/activerecord/src/index.ts` carries a `MOVED-BY-SHORT-NAME` receipt, and
`Base.globalExecutorConcurrency` / `globalThreadPoolAsyncQueryExecutor` carry CONVERGEABLE receipts.

This is the wrong owner. A Rails developer calls `ActiveRecord.disconnect_all!`, not `ActiveRecord::Base.disconnect_all!`.
Review of trails#7752 raised this: an intermediate version of that PR redirected the `def self.` methods onto `Base`
too, and the change was withdrawn because it ratified the flattening instead of converging it.

## Acceptance criteria

- A TS module mirrors `active_record.rb` (for example `packages/activerecord/src/active-record.ts`, mapped through
  `scripts/parity/conventions.ts`), exporting the `ActiveRecord` module's seats and `def self.` methods under
  their Rails names.
- The umbrella scan records both the `singleton_class.attr_*` seats and the `def self.` methods on the
  `ActiveRecord` module at `active_record.rb`. `umbrella_base_redirect` and the `umbrellaConfig` credit-anywhere
  branch in `scripts/api-compare/compare.ts` are deleted.
- The `Base` statics move to that module, and every `_Base!.<seat>` reader reads the module instead. The
  module is checked for load-order cycles with a plain-node import of the built `dist` modules.
- `disconnectAllBang` moves there from `index.ts`, and the `MOVED-BY-SHORT-NAME` entry and the two `Base` receipts are deleted.
- `ar-config.ts`'s `ActiveRecord` object folds into the new module. `relocate-ar-config-seats-onto-base` is closed as superseded.
- CLAUDE.md § "Call-time constant resolution" is rewritten to name the module instead of `Base`.
- This supersedes `credit-umbrella-def-self-disconnect-all` and `harvest-active-record-umbrella-singleton-defs`.
